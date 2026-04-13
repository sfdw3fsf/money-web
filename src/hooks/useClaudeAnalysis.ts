import { useState, useCallback, useRef } from 'react';
import type { Candle, Signal } from '../types/trading';
import type { IndicatorResult } from '../utils/indicators';
import { calculateIndicators } from '../utils/indicators';
import { preFilter, type FilterResult } from '../utils/preFilter';
import { analyzeCandles } from '../services/claudeService';
import { sendTelegramSignal, type TelegramSignalData } from '../services/telegramService';
import { addJournalEntry, type JournalEntry } from '../utils/signalJournal';
import { MIN_CONFIDENCE, MIN_RISK_REWARD } from '../config/constants';

interface UseAIAnalysisOptions {
  pair: string;
  interval: string;
  aiApiKey: string;
  autoTelegram: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  onNewSignal?: (signal: Signal) => void;
}

interface UseAIAnalysisReturn {
  activeSignal: Signal | null;
  isAnalyzing: boolean;
  lastError: string | null;
  lastFilterReason: string | null;
  indicators: IndicatorResult | null;
  analyze: (candles5m: Candle[], candles15m: Candle[]) => Promise<void>;
  clearSignal: () => void;
}

// UPGRADE 4: Risk-Reward Gate
function checkRiskReward(signal: {
  direction: string;
  entry: number;
  takeProfit: number;
  stopLoss: number;
}): { valid: boolean; ratio: number } {
  if (signal.direction === 'WAIT') return { valid: true, ratio: 0 };

  const reward = Math.abs(signal.takeProfit - signal.entry);
  const risk = Math.abs(signal.entry - signal.stopLoss);

  if (risk === 0) return { valid: false, ratio: 0 };

  const ratio = reward / risk;
  return { valid: ratio >= MIN_RISK_REWARD, ratio };
}

function buildJournalEntry(
  signal: Signal,
  indicators: IndicatorResult,
): Omit<JournalEntry, 'filteredOut' | 'filterReason'> {
  return {
    id: signal.id,
    timestamp: signal.timestamp,
    pair: signal.pair,
    direction: signal.direction,
    entry: signal.entry,
    takeProfit: signal.takeProfit,
    stopLoss: signal.stopLoss,
    confidence: signal.confidence,
    reasoning: signal.reasoning,
    trend15m: indicators.trend15m,
    trend5m: indicators.trend5m,
    ema20: indicators.ema20_5m,
    ema50: indicators.ema50_5m,
    rsi: indicators.rsi14,
    volumeTrend: indicators.volumeTrend,
    isSideways: indicators.isSideways,
    timeframeAligned: indicators.timeframeAligned,
    outcome: 'PENDING',
  };
}

export function useAIAnalysis({
  pair,
  interval,
  aiApiKey,
  autoTelegram,
  telegramBotToken,
  telegramChatId,
  onNewSignal,
}: UseAIAnalysisOptions): UseAIAnalysisReturn {
  const [activeSignal, setActiveSignal] = useState<Signal | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastFilterReason, setLastFilterReason] = useState<string | null>(null);
  const [indicators, setIndicators] = useState<IndicatorResult | null>(null);

  const cooldownRef = useRef(false);
  const onNewSignalRef = useRef(onNewSignal);
  onNewSignalRef.current = onNewSignal;

  const analyze = useCallback(
    async (candles5m: Candle[], candles15m: Candle[]) => {
      // Rate limit: skip if already analyzing or in cooldown
      if (cooldownRef.current || isAnalyzing) {
        return;
      }

      if (!aiApiKey) {
        setLastError('Gemini API key not configured');
        return;
      }

      if (candles5m.length < 50) {
        setLastError('Not enough 5m candle data (need at least 50)');
        return;
      }

      if (candles15m.length < 20) {
        setLastError('Not enough 15m candle data (need at least 20)');
        return;
      }

      // ===== STEP 1: Calculate indicators =====
      const indResult = calculateIndicators(candles5m, candles15m);
      setIndicators(indResult);

      // ===== STEP 2: Pre-filter =====
      const filterResult: FilterResult = preFilter(indResult);

      if (!filterResult.shouldAnalyze) {
        setLastFilterReason(filterResult.reason ?? 'unknown');
        console.log(`[Pre-filter] Blocked: ${filterResult.reason}`);

        // Log filtered signal to journal
        if (indResult) {
          addJournalEntry({
            id: `flt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            timestamp: Date.now(),
            pair: pair.toUpperCase(),
            direction: 'WAIT',
            entry: 0,
            takeProfit: 0,
            stopLoss: 0,
            confidence: 0,
            reasoning: `Pre-filter rejected: ${filterResult.reason}`,
            trend15m: indResult.trend15m,
            trend5m: indResult.trend5m,
            ema20: indResult.ema20_5m,
            ema50: indResult.ema50_5m,
            rsi: indResult.rsi14,
            volumeTrend: indResult.volumeTrend,
            isSideways: indResult.isSideways,
            timeframeAligned: indResult.timeframeAligned,
            filteredOut: true,
            filterReason: filterResult.reason,
          });
        }
        return; // DO NOT call Gemini
      }

      setLastFilterReason(null);
      cooldownRef.current = true;
      setIsAnalyzing(true);
      setLastError(null);

      try {
        // ===== STEP 3: Call Gemini (with pre-calculated indicators) =====
        const signal = await analyzeCandles(
          aiApiKey,
          pair,
          interval,
          candles5m,
          candles15m,
          indResult!,
        );

        // ===== STEP 4: Post-Gemini filters =====

        // Confidence gate
        if (signal.direction !== 'WAIT' && signal.confidence < MIN_CONFIDENCE) {
          console.log(`[Post-filter] Confidence ${signal.confidence}% < ${MIN_CONFIDENCE}% — rejected`);
          addJournalEntry({
            ...buildJournalEntry(signal, indResult!),
            filteredOut: true,
            filterReason: `low_confidence (${signal.confidence}%, need ${MIN_CONFIDENCE}%)`,
          });
          setActiveSignal(signal); // Still show it, but don't send to Telegram
          return;
        }

        // Risk-Reward gate (UPGRADE 4)
        const rrCheck = checkRiskReward(signal);
        if (signal.direction !== 'WAIT' && !rrCheck.valid) {
          console.log(`[Post-filter] R:R ${rrCheck.ratio.toFixed(2)}:1 — rejected (need ${MIN_RISK_REWARD}:1)`);
          addJournalEntry({
            ...buildJournalEntry(signal, indResult!),
            filteredOut: true,
            filterReason: `bad_rr (${rrCheck.ratio.toFixed(2)}:1, need ${MIN_RISK_REWARD}:1)`,
          });
          setActiveSignal(signal); // Still show it, but don't send to Telegram
          setLastError(`Risk-Reward ${rrCheck.ratio.toFixed(2)}:1 — rejected (need ${MIN_RISK_REWARD}:1)`);
          return;
        }

        // ===== STEP 5: All gates passed — active signal =====
        addJournalEntry({
          ...buildJournalEntry(signal, indResult!),
          filteredOut: false,
        });

        setActiveSignal(signal);

        // Notify parent
        if (onNewSignalRef.current) {
          onNewSignalRef.current(signal);
        }

        // Auto-send to Telegram if enabled and signal is BUY or SELL (UPGRADE 7)
        if (
          autoTelegram &&
          signal.direction !== 'WAIT' &&
          telegramBotToken &&
          telegramChatId
        ) {
          const telegramData: TelegramSignalData = {
            signal,
            indicators: indResult!,
            rrRatio: rrCheck.ratio,
          };
          await sendTelegramSignal(telegramBotToken, telegramChatId, telegramData);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Analysis failed';
        setLastError(message);
        console.error('AI analysis error:', err);
      } finally {
        setIsAnalyzing(false);

        // Cooldown: prevent rapid consecutive calls (30 seconds)
        setTimeout(() => {
          cooldownRef.current = false;
        }, 30000);
      }
    },
    [pair, interval, aiApiKey, autoTelegram, telegramBotToken, telegramChatId, isAnalyzing],
  );

  const clearSignal = useCallback(() => {
    setActiveSignal(null);
  }, []);

  return {
    activeSignal,
    isAnalyzing,
    lastError,
    lastFilterReason,
    indicators,
    analyze,
    clearSignal,
  };
}
