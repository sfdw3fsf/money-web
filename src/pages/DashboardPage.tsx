import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBinanceSocket } from '../hooks/useBinanceSocket';
import { useAIAnalysis } from '../hooks/useClaudeAnalysis';
import { useSignalHistory } from '../hooks/useSignalHistory';
import { sendTelegramSignal } from '../services/telegramService';
import CandleChart from '../components/CandleChart';
import SignalPanel from '../components/SignalPanel';
import PnLTracker from '../components/PnLTracker';
import SignalHistory from '../components/SignalHistory';
import AlertSettings from '../components/AlertSettings';
import ConnectionStatus from '../components/ConnectionStatus';
import { AVAILABLE_PAIRS } from '../config/constants';

export default function DashboardPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { signals, config, pnlStats, addSignal, followSignal, skipSignal, closeSignal, checkPriceTargets, clearHistory, updateConfig } =
    useSignalHistory();

  const handleNewSignal = useCallback(
    (signal: import('../types/trading').Signal) => {
      addSignal(signal);
    },
    [addSignal]
  );

  const { activeSignal, isAnalyzing, lastError, analyze } = useAIAnalysis({
    pair: config.pair,
    interval: config.interval,
    aiApiKey: config.aiApiKey,
    autoTelegram: config.autoTelegram,
    telegramBotToken: config.telegramBotToken,
    telegramChatId: config.telegramChatId,
    onNewSignal: handleNewSignal,
  });

  const handleCandleClose = useCallback(
    (candles: import('../types/trading').Candle[]) => {
      if (config.aiApiKey) {
        analyze(candles);
      }
    },
    [config.aiApiKey, analyze]
  );

  const { candles, currentPrice, priceChange24h, connectionState, reconnect } = useBinanceSocket({
    pair: config.pair,
    interval: config.interval,
    candleCount: config.candleCount,
    onCandleClose: handleCandleClose,
  });

  const handleManualAnalyze = () => {
    if (candles.length > 0) {
      analyze(candles);
    }
  };

  const handleSendTelegram = async () => {
    if (activeSignal && config.telegramBotToken && config.telegramChatId) {
      await sendTelegramSignal(config.telegramBotToken, config.telegramChatId, activeSignal);
    }
  };

  // Auto-track: check if followed signals hit TP or SL
  useEffect(() => {
    if (currentPrice > 0) {
      checkPriceTargets(currentPrice);
    }
  }, [currentPrice, checkPriceTargets]);


  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: Logo + Pair info */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-white hidden sm:inline">
                Money<span className="gradient-text">Web</span>
              </span>
            </Link>

            <div className="h-6 w-px bg-white/[0.08] hidden sm:block" />

            <ConnectionStatus state={connectionState} pair={config.pair} onReconnect={reconnect} />

            {/* Price info */}
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-lg font-bold text-white tabular-nums">
                ${currentPrice.toFixed(currentPrice > 100 ? 2 : 4)}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md tabular-nums ${
                  priceChange24h >= 0
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Right: Quick selectors + Settings */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Pair quick selector */}
            <select
              value={config.pair}
              onChange={(e) => updateConfig({ pair: e.target.value })}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-xs font-medium outline-none focus:border-indigo-500/30 transition-colors appearance-none cursor-pointer"
            >
              {AVAILABLE_PAIRS.map((p) => (
                <option key={p.value} value={p.value} className="bg-[#12121a]">
                  {p.label}
                </option>
              ))}
            </select>

            {/* Interval quick selector */}
            <div className="hidden md:flex items-center gap-1 px-1 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              {['1m', '5m', '15m', '1h', '4h'].map((interval) => (
                <button
                  key={interval}
                  onClick={() => updateConfig({ interval })}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    config.interval === interval
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'text-[#5a5a6e] hover:text-white'
                  }`}
                >
                  {interval}
                </button>
              ))}
            </div>

            {/* Settings button */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] border border-white/[0.06] text-[#8b8b9e] hover:text-white hover:border-white/[0.12] transition-all"
              title="Settings"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87a6.714 6.714 0 011.6.923c.294.222.663.291 1.018.2l1.238-.343c.523-.145 1.076.109 1.351.58l1.296 2.247a1.125 1.125 0 01-.286 1.44l-1.025.938a1.183 1.183 0 00-.364.955c.01.353.01.706 0 1.059a1.18 1.18 0 00.364.955l1.025.938a1.125 1.125 0 01.286 1.44l-1.296 2.247a1.125 1.125 0 01-1.35.58l-1.239-.344a1.21 1.21 0 00-1.018.2 6.71 6.71 0 01-1.6.924 1.18 1.18 0 00-.645.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281a1.18 1.18 0 00-.645-.87 6.71 6.71 0 01-1.6-.923 1.21 1.21 0 00-1.018-.2l-1.238.343a1.125 1.125 0 01-1.351-.58L3.196 16.14a1.125 1.125 0 01.286-1.44l1.025-.938a1.18 1.18 0 00.364-.955 8.26 8.26 0 010-1.059 1.18 1.18 0 00-.364-.955L3.48 9.855a1.125 1.125 0 01-.286-1.44l1.296-2.247a1.125 1.125 0 011.35-.58l1.239.344c.355.09.724.022 1.018-.2a6.71 6.71 0 011.6-.924 1.18 1.18 0 00.645-.869l.213-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* P&L Bar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-4">
        <PnLTracker stats={pnlStats} />
      </div>

      {/* Main grid */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
          {/* Left column — Chart */}
          <div className="h-[500px] lg:h-[600px]">
            <CandleChart candles={candles} activeSignal={activeSignal} currentPrice={currentPrice} />
          </div>

          {/* Right column — Panels */}
          <div className="flex flex-col gap-4">
            <SignalPanel
              signal={activeSignal}
              isAnalyzing={isAnalyzing}
              lastError={lastError}
              onManualAnalyze={handleManualAnalyze}
              onSendTelegram={handleSendTelegram}
            />

            <SignalHistory
              signals={signals}
              currentPrice={currentPrice}
              onFollow={followSignal}
              onSkip={skipSignal}
              onClose={closeSignal}
            />
          </div>
        </div>
      </main>

      {/* API key warning banner */}
      {!config.aiApiKey && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl shadow-lg">
            <span className="text-amber-400 text-sm">⚠️</span>
            <span className="text-sm text-amber-300">
              Add your Gemini API key in{' '}
              <button onClick={() => setSettingsOpen(true)} className="underline font-semibold hover:text-amber-200 transition-colors">
                Settings
              </button>{' '}
              to enable AI analysis
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
