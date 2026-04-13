import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useBinanceSocket } from '../hooks/useBinanceSocket';
import { useAIAnalysis } from '../hooks/useClaudeAnalysis';
import { useSignalHistory } from '../hooks/useSignalHistory';
import { useIsMobile } from '../hooks/useMediaQuery';
import { sendTelegramSignal, type TelegramSignalData } from '../services/telegramService';
import { updateOutcome } from '../utils/signalJournal';
import CandleChart from '../components/CandleChart';
import SignalPanel from '../components/SignalPanel';
import PnLTracker from '../components/PnLTracker';
import SignalHistory from '../components/SignalHistory';
import AlertSettings from '../components/AlertSettings';
import ConnectionStatus from '../components/ConnectionStatus';
import { AVAILABLE_PAIRS, TREND_INTERVAL, TREND_CANDLE_COUNT } from '../config/constants';

type MobileTab = 'chart' | 'signal' | 'history';

export default function DashboardPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('chart');
  const isMobile = useIsMobile();
  const journalUpdatedIdsRef = useRef<Set<string>>(new Set());

  const { signals, config, pnlStats, addSignal, followSignal, unfollowSignal, skipSignal, closeSignal, checkPriceTargets, clearHistory, updateConfig } =
    useSignalHistory();

  const handleNewSignal = useCallback(
    (signal: import('../types/trading').Signal) => {
      addSignal(signal);
    },
    [addSignal],
  );

  const { activeSignal, isAnalyzing, lastError, lastFilterReason, indicators, analyze } = useAIAnalysis({
    pair: config.pair,
    interval: config.interval,
    aiApiKey: config.aiApiKey,
    autoTelegram: config.autoTelegram,
    telegramBotToken: config.telegramBotToken,
    telegramChatId: config.telegramChatId,
    onNewSignal: handleNewSignal,
  });

  // UPGRADE 2: 15m socket for higher timeframe trend
  const candles15mRef = useRef<import('../types/trading').Candle[]>([]);

  const { candles: candles15m } = useBinanceSocket({
    pair: config.pair,
    interval: TREND_INTERVAL,
    candleCount: TREND_CANDLE_COUNT,
  });

  // Keep 15m candles ref updated
  useEffect(() => {
    candles15mRef.current = candles15m;
  }, [candles15m]);

  // Original 5m candle close handler — now passes BOTH timeframes
  const handleCandleClose = useCallback(
    (candles5m: import('../types/trading').Candle[]) => {
      if (config.aiApiKey) {
        analyze(candles5m, candles15mRef.current);
      }
    },
    [config.aiApiKey, analyze],
  );

  const { candles, currentPrice, priceChange24h, connectionState, reconnect } = useBinanceSocket({
    pair: config.pair,
    interval: config.interval,
    candleCount: config.candleCount,
    onCandleClose: handleCandleClose,
  });

  const handleManualAnalyze = () => {
    if (candles.length > 0) {
      analyze(candles, candles15mRef.current, true);
    }
  };

  const handleSendTelegram = async () => {
    if (activeSignal && config.telegramBotToken && config.telegramChatId && indicators) {
      const reward = Math.abs(activeSignal.takeProfit - activeSignal.entry);
      const risk = Math.abs(activeSignal.entry - activeSignal.stopLoss);
      const rrRatio = risk > 0 ? reward / risk : 0;

      const telegramData: TelegramSignalData = {
        signal: activeSignal,
        indicators,
        rrRatio,
      };
      await sendTelegramSignal(config.telegramBotToken, config.telegramChatId, telegramData);
    }
  };

  // UPGRADE 6: Auto-track TP/SL hits and update journal
  useEffect(() => {
    if (currentPrice > 0) {
      checkPriceTargets(currentPrice);

      // Check signals for journal outcome updates
      for (const sig of signals) {
        if (sig.status === 'tp_hit' && sig.closedAt && !journalUpdatedIdsRef.current.has(sig.id)) {
          updateOutcome(sig.id, 'TP_HIT', sig.closePrice ?? sig.takeProfit);
          journalUpdatedIdsRef.current.add(sig.id);
        }
        if (sig.status === 'sl_hit' && sig.closedAt && !journalUpdatedIdsRef.current.has(sig.id)) {
          updateOutcome(sig.id, 'SL_HIT', sig.closePrice ?? sig.stopLoss);
          journalUpdatedIdsRef.current.add(sig.id);
        }
      }
    }
  }, [currentPrice, checkPriceTargets, signals]);

  const followedCount = signals.filter((s) => s.status === 'followed').length;
  const pendingCount = signals.filter((s) => s.status === 'active').length;
  const activeBadgeCount = followedCount + pendingCount;

  return (
    <div className="min-h-[100dvh] bg-[#1a1510]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#1a1510]/90 backdrop-blur-xl border-b border-[#c4956a]/10 pt-safe">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          {/* Left: Logo + Pair info */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0 flex-1">
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c4956a] to-[#8b7355] flex items-center justify-center shadow-lg shadow-[#c4956a]/15 border border-[#c4956a]/30">
                <span className="text-sm">🌾</span>
              </div>
              <span className="text-sm font-bold text-[#e8dcc8] hidden lg:inline" style={{ fontFamily: "'Playfair Display', serif" }}>
                The Old <span className="gradient-text">Post</span>
              </span>
            </Link>

            <div className="h-6 w-px bg-[#c4956a]/10 hidden lg:block" />

            <div className="min-w-0 flex-1">
              <ConnectionStatus state={connectionState} pair={config.pair} onReconnect={reconnect} />
            </div>

            {/* Price info — visible on all sizes, compact on phone */}
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <span className="text-sm sm:text-lg font-bold text-[#e8dcc8] tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${currentPrice.toFixed(currentPrice > 100 ? 2 : 4)}
              </span>
              <span
                className={`text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-md tabular-nums ${
                  priceChange24h >= 0
                    ? 'bg-[#7d9b6f]/10 text-[#7d9b6f]'
                    : 'bg-[#b5594e]/10 text-[#b5594e]'
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Right: Quick selectors + Settings */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Pair quick selector */}
            <select
              value={config.pair}
              onChange={(e) => updateConfig({ pair: e.target.value })}
              className="px-2 sm:px-3 py-1.5 rounded-lg bg-[#c4956a]/[0.06] border border-[#c4956a]/10 text-[#e8dcc8] text-[11px] sm:text-xs font-medium outline-none focus:border-[#c4956a]/20 transition-colors appearance-none cursor-pointer max-w-[110px] sm:max-w-none"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {AVAILABLE_PAIRS.map((p) => (
                <option key={p.value} value={p.value} className="bg-[#231f18]">
                  {p.label}
                </option>
              ))}
            </select>

            {/* Interval quick selector */}
            <div className="hidden md:flex items-center gap-1 px-1 py-1 rounded-lg bg-[#c4956a]/[0.04] border border-[#c4956a]/8">
              {['1m', '5m', '15m', '1h', '4h'].map((interval) => (
                <button
                  key={interval}
                  onClick={() => updateConfig({ interval })}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    config.interval === interval
                      ? 'bg-[#c4956a]/20 text-[#c4956a]'
                      : 'text-[#6d6354] hover:text-[#e8dcc8]'
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {interval}
                </button>
              ))}
            </div>

            {/* Settings button */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#c4956a]/[0.06] border border-[#c4956a]/10 text-[#a0947e] hover:text-[#e8dcc8] hover:border-[#c4956a]/20 active:bg-[#c4956a]/[0.1] transition-all"
              aria-label="Post Office Settings"
            >
              ⚙
            </button>
          </div>
        </div>

        {/* Mobile-only interval selector — horizontally scrollable row */}
        <div className="md:hidden border-t border-[#c4956a]/8 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {['1m', '5m', '15m', '1h', '4h'].map((interval) => (
            <button
              key={interval}
              onClick={() => updateConfig({ interval })}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all flex-shrink-0 ${
                config.interval === interval
                  ? 'bg-[#c4956a]/20 text-[#c4956a] border border-[#c4956a]/30'
                  : 'text-[#6d6354] border border-transparent'
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {interval}
            </button>
          ))}
        </div>
      </header>

      {/* Filter Status Bar — horizontal scroll on phone */}
      {(lastFilterReason || indicators) && (
        <div className="max-w-[1600px] mx-auto pt-3">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar text-xs px-3 sm:px-6 pb-1">
            {/* Filter status */}
            {lastFilterReason && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#c4956a]/10 border border-[#c4956a]/15 flex-shrink-0">
                <span className="text-[#c4956a]">🛡️</span>
                <span className="text-[#dab896] whitespace-nowrap" style={{ fontFamily: "'Lora', serif" }}>{lastFilterReason}</span>
              </div>
            )}

            {/* Indicator pills */}
            {indicators && (
              <>
                <div className={`px-2.5 py-1 rounded-lg border whitespace-nowrap flex-shrink-0 ${
                  indicators.trend15m === 'bullish'
                    ? 'bg-[#7d9b6f]/10 border-[#7d9b6f]/20 text-[#7d9b6f]'
                    : indicators.trend15m === 'bearish'
                      ? 'bg-[#b5594e]/10 border-[#b5594e]/20 text-[#b5594e]'
                      : 'bg-[#c4956a]/[0.05] border-[#c4956a]/10 text-[#a0947e]'
                }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  15m: {indicators.trend15m}
                </div>
                <div className={`px-2.5 py-1 rounded-lg border whitespace-nowrap flex-shrink-0 ${
                  indicators.trend5m === 'bullish'
                    ? 'bg-[#7d9b6f]/10 border-[#7d9b6f]/20 text-[#7d9b6f]'
                    : indicators.trend5m === 'bearish'
                      ? 'bg-[#b5594e]/10 border-[#b5594e]/20 text-[#b5594e]'
                      : 'bg-[#c4956a]/[0.05] border-[#c4956a]/10 text-[#a0947e]'
                }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  5m: {indicators.trend5m}
                </div>
                <div className={`px-2.5 py-1 rounded-lg border whitespace-nowrap flex-shrink-0 ${
                  indicators.timeframeAligned
                    ? 'bg-[#7d9b6f]/10 border-[#7d9b6f]/20 text-[#7d9b6f]'
                    : 'bg-[#b5594e]/10 border-[#b5594e]/20 text-[#b5594e]'
                }`} style={{ fontFamily: "'Lora', serif" }}>
                  {indicators.timeframeAligned ? '✓ Aligned' : '✗ Misaligned'}
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-[#c4956a]/[0.05] border border-[#c4956a]/10 text-[#a0947e] whitespace-nowrap flex-shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  RSI: {indicators.rsi14.toFixed(0)}
                </div>
                <div className={`px-2.5 py-1 rounded-lg border whitespace-nowrap flex-shrink-0 ${
                  indicators.isSideways
                    ? 'bg-[#c4956a]/10 border-[#c4956a]/20 text-[#c4956a]'
                    : 'bg-[#c4956a]/[0.05] border-[#c4956a]/10 text-[#a0947e]'
                }`} style={{ fontFamily: "'Lora', serif" }}>
                  {indicators.isSideways ? '⚠ Flat' : `Range: ${indicators.sidewaysRange.toFixed(2)}%`}
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-[#c4956a]/[0.05] border border-[#c4956a]/10 text-[#a0947e] whitespace-nowrap flex-shrink-0" style={{ fontFamily: "'Lora', serif" }}>
                  Vol: {indicators.volumeTrend === 'above_average' ? '📈' : '📉'} {indicators.volumeTrend.replace('_', ' ')}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* P&L Bar */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 pt-3 sm:pt-4">
        <PnLTracker stats={pnlStats} />
      </div>

      {/* Main content */}
      <main className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 sm:py-4 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-4">
        {/* Desktop: side-by-side grid */}
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
          <div className="h-[500px] lg:h-[600px]">
            <CandleChart candles={candles} activeSignal={activeSignal} currentPrice={currentPrice} />
          </div>
          <div className="flex flex-col gap-4">
            <SignalPanel
              signal={activeSignal}
              isAnalyzing={isAnalyzing}
              lastError={lastError}
              lastFilterReason={lastFilterReason}
              onManualAnalyze={handleManualAnalyze}
              onSendTelegram={handleSendTelegram}
            />
          </div>
        </div>

        {/* Mobile: tab-switched panels */}
        <div className="lg:hidden">
          {mobileTab === 'chart' && (
            <div className="h-[min(62vh,560px)] min-h-[360px]">
              <CandleChart candles={candles} activeSignal={activeSignal} currentPrice={currentPrice} />
            </div>
          )}
          {mobileTab === 'signal' && (
            <SignalPanel
              signal={activeSignal}
              isAnalyzing={isAnalyzing}
              lastError={lastError}
              lastFilterReason={lastFilterReason}
              onManualAnalyze={handleManualAnalyze}
              onSendTelegram={handleSendTelegram}
            />
          )}
          {mobileTab === 'history' && (
            <SignalHistory
              inline
              signals={signals}
              currentPrice={currentPrice}
              onFollow={followSignal}
              onUnfollow={unfollowSignal}
              onSkip={skipSignal}
              onClose={closeSignal}
            />
          )}
        </div>
      </main>

      {/* Desktop-only floating Signal Ledger */}
      {!isMobile && (
        <SignalHistory
          signals={signals}
          currentPrice={currentPrice}
          onFollow={followSignal}
          onUnfollow={unfollowSignal}
          onSkip={skipSignal}
          onClose={closeSignal}
        />
      )}

      {/* Mobile bottom tab bar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#1a1510]/95 backdrop-blur-xl border-t border-[#c4956a]/15 pb-safe"
        aria-label="Primary"
      >
        <div className="grid grid-cols-3 max-w-[1600px] mx-auto">
          {(
            [
              { key: 'chart' as const, label: 'Chart', icon: '📈' },
              { key: 'signal' as const, label: 'Signal', icon: '🌻', badge: isAnalyzing ? '•' : undefined },
              { key: 'history' as const, label: 'Ledger', icon: '📒', badge: activeBadgeCount > 0 ? String(activeBadgeCount) : undefined },
            ]
          ).map((tab) => {
            const active = mobileTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setMobileTab(tab.key)}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? 'text-[#c4956a]' : 'text-[#6d6354] active:text-[#a0947e]'
                }`}
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                <span className="text-lg leading-none">{tab.icon}</span>
                <span className="tracking-wide">{tab.label}</span>
                {tab.badge && (
                  <span className="absolute top-1.5 right-[calc(50%-22px)] min-w-4 h-4 px-1 rounded-full bg-[#c4956a] text-[#1a1510] text-[9px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-[#c4956a]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* API key warning banner */}
      {!config.aiApiKey && (
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] sm:w-auto max-w-md">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#c4956a]/10 border border-[#c4956a]/15 backdrop-blur-xl shadow-lg">
            <span className="text-[#c4956a] text-sm flex-shrink-0">⚠️</span>
            <span className="text-xs sm:text-sm text-[#dab896]" style={{ fontFamily: "'Lora', serif" }}>
              Configure your Gemini key in{' '}
              <button onClick={() => setSettingsOpen(true)} className="underline font-semibold hover:text-[#e8dcc8] transition-colors">
                Settings
              </button>{' '}
              to enable the sage
            </span>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <AlertSettings
        config={config}
        onUpdate={updateConfig}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onClearHistory={clearHistory}
      />
    </div>
  );
}

