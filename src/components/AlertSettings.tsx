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

      {/* Modal — bottom sheet on mobile, centered dialog on sm+ */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-lg">
        <div className="rounded-t-2xl sm:rounded-xl bg-[#231f18] border border-[#c4956a]/15 border-b-0 sm:border-b shadow-2xl shadow-black/50 overflow-hidden pb-safe sm:pb-0">
          {/* Mobile grabber */}
          <div className="sm:hidden flex justify-center pt-2">
            <span className="w-10 h-1 rounded-full bg-[#c4956a]/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-3 sm:py-4 border-b border-[#c4956a]/10">
            <h2 className="text-base sm:text-lg font-bold text-[#e8dcc8]" style={{ fontFamily: "'Playfair Display', serif" }}>⚙️ Post Office Settings</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#6d6354] hover:text-[#e8dcc8] hover:bg-[#c4956a]/10 transition-all"
              aria-label="Close settings"
            >
              ✕
            </button>
          </div>

          <div className="px-5 sm:px-6 py-5 space-y-5 sm:space-y-6 max-h-[calc(85dvh-4rem)] sm:max-h-[70vh] overflow-y-auto">
            {/* Trading Pair */}
            <div>
              <label className="block text-xs font-semibold text-[#a0947e] uppercase tracking-wider mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Market to Watch
              </label>
              <select
                value={config.pair}
                onChange={(e) => onUpdate({ pair: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-[#c4956a]/[0.06] border border-[#c4956a]/12 text-[#e8dcc8] text-sm outline-none focus:border-[#c4956a]/30 transition-colors appearance-none cursor-pointer"
                style={{ fontFamily: "'Lora', serif" }}
              >
                {AVAILABLE_PAIRS.map((p) => (
                  <option key={p.value} value={p.value} className="bg-[#231f18]">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Interval */}
            <div>
              <label className="block text-xs font-semibold text-[#a0947e] uppercase tracking-wider mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Timeframe
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_INTERVALS.map((i) => (
                  <button
                    key={i.value}
                    onClick={() => onUpdate({ interval: i.value })}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                      config.interval === i.value
                        ? 'bg-[#c4956a]/20 border border-[#c4956a]/40 text-[#c4956a]'
                        : 'bg-[#c4956a]/[0.04] border border-[#c4956a]/8 text-[#a0947e] hover:text-[#e8dcc8] hover:border-[#c4956a]/15'
                    }`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {i.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI API Key (Gemini or OpenAI) */}
            <div>
              <label className="block text-xs font-semibold text-[#a0947e] uppercase tracking-wider mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                AI API Key
              </label>
              <input
                type="password"
                value={config.aiApiKey}
                onChange={(e) => onUpdate({ aiApiKey: e.target.value })}
                placeholder="AIzaSy... or sk-proj-..."
                className="w-full px-4 py-3 rounded-lg bg-[#c4956a]/[0.06] border border-[#c4956a]/12 text-[#e8dcc8] text-sm outline-none focus:border-[#c4956a]/30 transition-colors placeholder:text-[#6d6354]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
              {config.aiApiKey ? (
                <p className="text-[10px] mt-1.5 font-medium" style={{ fontFamily: "'Lora', serif" }}>
                  <span className={config.aiApiKey.startsWith('sk-') ? 'text-[#7d9b6f]' : 'text-[#c4956a]'}>
                    {config.aiApiKey.startsWith('sk-') ? '🤖 OpenAI (GPT-4o-mini)' : '✨ Google Gemini'} — detected
                  </span>
                </p>
              ) : (
                <p className="text-[10px] text-[#6d6354] mt-1 italic" style={{ fontFamily: "'Lora', serif" }}>
                  Gemini: aistudio.google.com/apikey · OpenAI: platform.openai.com/api-keys
                </p>
              )}
            </div>

            {/* Telegram section */}
            <div className="pt-2 border-t border-[#c4956a]/10">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-[#a0947e] uppercase tracking-wider" style={{ fontFamily: "'Playfair Display', serif" }}>
                  📮 Telegram Dispatches
                </label>
                <button
                  onClick={() => onUpdate({ autoTelegram: !config.autoTelegram })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    config.autoTelegram ? 'bg-[#7d9b6f]' : 'bg-[#c4956a]/15'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-[#e8dcc8] transition-transform ${
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
                  className="w-full px-4 py-3 rounded-lg bg-[#c4956a]/[0.06] border border-[#c4956a]/12 text-[#e8dcc8] text-sm outline-none focus:border-[#c4956a]/30 transition-colors placeholder:text-[#6d6354]"
                  style={{ fontFamily: "'Lora', serif" }}
                />
                <input
                  type="text"
                  value={config.telegramChatId}
                  onChange={(e) => onUpdate({ telegramChatId: e.target.value })}
                  placeholder="Chat ID"
                  className="w-full px-4 py-3 rounded-lg bg-[#c4956a]/[0.06] border border-[#c4956a]/12 text-[#e8dcc8] text-sm outline-none focus:border-[#c4956a]/30 transition-colors placeholder:text-[#6d6354]"
                  style={{ fontFamily: "'Lora', serif" }}
                />

                <button
                  onClick={handleTestTelegram}
                  disabled={testingTelegram || !config.telegramBotToken || !config.telegramChatId}
                  className="w-full py-2.5 rounded-lg text-sm font-medium bg-[#c4956a]/[0.08] border border-[#c4956a]/15 text-[#e8dcc8] hover:bg-[#c4956a]/[0.12] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {testingTelegram ? 'Sending pigeon...' : '📮 Test Connection'}
                </button>

                {telegramResult === 'success' && (
                  <p className="text-xs text-[#7d9b6f] bg-[#7d9b6f]/10 rounded-lg px-3 py-2" style={{ fontFamily: "'Lora', serif" }}>
                    ✅ Message delivered! Check your Telegram.
                  </p>
                )}
                {telegramResult === 'error' && (
                  <p className="text-xs text-[#b5594e] bg-[#b5594e]/10 rounded-lg px-3 py-2" style={{ fontFamily: "'Lora', serif" }}>
                    ❌ Pigeon lost. Check token and chat ID.
                  </p>
                )}
              </div>
            </div>

            {/* Danger zone */}
            <div className="pt-2 border-t border-[#c4956a]/10">
              <button
                onClick={() => {
                  if (confirm('Burn the old ledger? This cannot be undone.')) {
                    onClearHistory();
                  }
                }}
                className="w-full py-2.5 rounded-lg text-sm font-medium bg-[#b5594e]/10 border border-[#b5594e]/20 text-[#b5594e] hover:bg-[#b5594e]/20 transition-all"
                style={{ fontFamily: "'Lora', serif" }}
              >
                🔥 Clear All Signal History
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
