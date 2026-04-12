import { useState } from 'react';
import type { TradingConfig } from '../types/trading';
import { AVAILABLE_PAIRS, AVAILABLE_INTERVALS } from '../config/constants';
import { testTelegramConnection } from '../services/telegramService';

interface AlertSettingsProps {
  config: TradingConfig;
  onUpdate: (updates: Partial<TradingConfig>) => void;
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
}

export default function AlertSettings({
  config,
  onUpdate,
  isOpen,
  onClose,
  onClearHistory,
}: AlertSettingsProps) {
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramResult, setTelegramResult] = useState<'success' | 'error' | null>(null);

  if (!isOpen) return null;

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setTelegramResult(null);
    const ok = await testTelegramConnection(config.telegramBotToken, config.telegramChatId);
    setTelegramResult(ok ? 'success' : 'error');
    setTestingTelegram(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg">
        <div className="rounded-2xl bg-[#12121a] border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-lg font-bold text-white">⚙️ Settings</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a6e] hover:text-white hover:bg-white/[0.05] transition-all"
            >
              ✕
            </button>
          </div>

          <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Trading Pair */}
            <div>
              <label className="block text-xs font-semibold text-[#8b8b9e] uppercase tracking-wider mb-2">
                Trading Pair
              </label>
              <select
                value={config.pair}
                onChange={(e) => onUpdate({ pair: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm outline-none focus:border-indigo-500/40 transition-colors appearance-none cursor-pointer"
              >
                {AVAILABLE_PAIRS.map((p) => (
                  <option key={p.value} value={p.value} className="bg-[#12121a]">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Interval */}
            <div>
              <label className="block text-xs font-semibold text-[#8b8b9e] uppercase tracking-wider mb-2">
                Timeframe
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_INTERVALS.map((i) => (
                  <button
                    key={i.value}
                    onClick={() => onUpdate({ interval: i.value })}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                      config.interval === i.value
                        ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-400'
                        : 'bg-white/[0.04] border border-white/[0.06] text-[#8b8b9e] hover:text-white hover:border-white/[0.12]'
                    }`}
                  >
                    {i.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gemini API Key */}
            <div>
              <label className="block text-xs font-semibold text-[#8b8b9e] uppercase tracking-wider mb-2">
                Gemini API Key
              </label>
              <input
                type="password"
                value={config.aiApiKey}
                onChange={(e) => onUpdate({ aiApiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm outline-none focus:border-indigo-500/40 transition-colors placeholder:text-[#5a5a6e]"
              />
              <p className="text-[10px] text-[#5a5a6e] mt-1">Free tier — get yours at aistudio.google.com/apikey</p>
            </div>

            {/* Telegram section */}
            <div className="pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-[#8b8b9e] uppercase tracking-wider">
                  Telegram Notifications
                </label>
                <button
                  onClick={() => onUpdate({ autoTelegram: !config.autoTelegram })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    config.autoTelegram ? 'bg-indigo-500' : 'bg-white/[0.1]'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      config.autoTelegram ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="password"
                  value={config.telegramBotToken}
                  onChange={(e) => onUpdate({ telegramBotToken: e.target.value })}
                  placeholder="Bot Token (from @BotFather)"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm outline-none focus:border-indigo-500/40 transition-colors placeholder:text-[#5a5a6e]"
                />
                <input
                  type="text"
                  value={config.telegramChatId}
                  onChange={(e) => onUpdate({ telegramChatId: e.target.value })}
                  placeholder="Chat ID"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm outline-none focus:border-indigo-500/40 transition-colors placeholder:text-[#5a5a6e]"
                />

                <button
                  onClick={handleTestTelegram}
                  disabled={testingTelegram || !config.telegramBotToken || !config.telegramChatId}
                  className="w-full py-2.5 rounded-xl text-sm font-medium bg-white/[0.05] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {testingTelegram ? 'Testing...' : '📱 Test Connection'}
                </button>

                {telegramResult === 'success' && (
                  <p className="text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">
                    ✅ Connected! Check your Telegram.
                  </p>
                )}
                {telegramResult === 'error' && (
                  <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                    ❌ Failed. Check token and chat ID.
                  </p>
                )}
              </div>
            </div>

            {/* Danger zone */}
            <div className="pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => {
                  if (confirm('Clear all signal history? This cannot be undone.')) {
                    onClearHistory();
                  }
                }}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
              >
                🗑️ Clear All Signal History
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
