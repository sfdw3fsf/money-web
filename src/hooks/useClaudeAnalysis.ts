import { useState, useCallback, useRef } from 'react';
import type { Candle, Signal } from '../types/trading';
import { analyzeCandles } from '../services/claudeService';
import { sendTelegramSignal } from '../services/telegramService';

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
  analyze: (candles: Candle[]) => Promise<void>;
  clearSignal: () => void;
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

  const cooldownRef = useRef(false);
  const onNewSignalRef = useRef(onNewSignal);
  onNewSignalRef.current = onNewSignal;

  const analyze = useCallback(
    async (candles: Candle[]) => {
      // Rate limit: skip if already analyzing or in cooldown
      if (cooldownRef.current || isAnalyzing) {
        return;
      }

      if (!aiApiKey) {
        setLastError('Gemini API key not configured');
        return;
      }

      if (candles.length < 20) {
        setLastError('Not enough candle data (need at least 20)');
        return;
      }

      cooldownRef.current = true;
      setIsAnalyzing(true);
      setLastError(null);

      try {
        const signal = await analyzeCandles(aiApiKey, pair, interval, candles);
        setActiveSignal(signal);

        // Notify parent
        if (onNewSignalRef.current) {
          onNewSignalRef.current(signal);
        }

        // Auto-send to Telegram if enabled and signal is BUY or SELL
        if (
          autoTelegram &&
          signal.direction !== 'WAIT' &&
          telegramBotToken &&
          telegramChatId
        ) {
          await sendTelegramSignal(telegramBotToken, telegramChatId, signal);
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
    [pair, interval, aiApiKey, autoTelegram, telegramBotToken, telegramChatId, isAnalyzing]
  );

  const clearSignal = useCallback(() => {
    setActiveSignal(null);
  }, []);

  return {
    activeSignal,
    isAnalyzing,
    lastError,
    analyze,
    clearSignal,
  };
}
