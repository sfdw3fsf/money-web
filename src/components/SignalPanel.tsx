import type { Signal } from '../types/trading';

interface SignalPanelProps {
  signal: Signal | null;
  isAnalyzing: boolean;
  lastError: string | null;
  onManualAnalyze: () => void;
  onSendTelegram: () => void;
}

export default function SignalPanel({
  signal,
  isAnalyzing,
  lastError,
  onManualAnalyze,
  onSendTelegram,
}: SignalPanelProps) {
  if (isAnalyzing) {
    return (
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Analyzing...</h3>
            <p className="text-xs text-[#5a5a6e]">Claude is reading the chart</p>
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 rounded bg-white/[0.04] animate-pulse" style={{ width: `${90 - i * 15}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No Active Signal</h3>
          <p className="text-xs text-[#5a5a6e] mb-5">
            Signals are generated when candles close.
            <br />
            Or click below to analyze now.
          </p>
          <button
            onClick={onManualAnalyze}
            className="btn-primary !py-2.5 !px-6 !text-sm !rounded-xl w-full"
          >
            ⚡ Analyze Now
          </button>
          {lastError && (
            <p className="text-xs text-red-400 mt-3 bg-red-500/10 rounded-lg px-3 py-2">{lastError}</p>
          )}
        </div>
      </div>
    );
  }

  const isBuy = signal.direction === 'BUY';
  const isSell = signal.direction === 'SELL';
  const isWait = signal.direction === 'WAIT';

  const dirColor = isBuy ? 'emerald' : isSell ? 'red' : 'amber';
  const dirIcon = isBuy ? '🟢' : isSell ? '🔴' : '⏸️';
  const tpPct = (((signal.takeProfit - signal.entry) / signal.entry) * 100).toFixed(2);
  const slPct = (((signal.stopLoss - signal.entry) / signal.entry) * 100).toFixed(2);

  // Confidence ring
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (signal.confidence / 100) * circumference;
  const confColor =
    signal.confidence >= 70 ? '#22c55e' : signal.confidence >= 50 ? '#eab308' : '#ef4444';

  return (
    <div className={`rounded-2xl border p-6 transition-all duration-500 ${
      isBuy
        ? 'bg-emerald-500/[0.04] border-emerald-500/20'
        : isSell
        ? 'bg-red-500/[0.04] border-red-500/20'
        : 'bg-amber-500/[0.04] border-amber-500/20'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{dirIcon}</span>
          <div>
            <h3 className={`text-lg font-bold text-${dirColor}-400`}>{signal.direction}</h3>
            <p className="text-xs text-[#5a5a6e]">{signal.pair} · {signal.interval}</p>
          </div>
        </div>

        {/* Confidence Ring */}
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
            <circle
              cx="20" cy="20" r="18"
              fill="none"
              stroke={confColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            {signal.confidence}%
          </span>
        </div>
      </div>

      {/* Price Levels */}
      {!isWait && (
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03]">
            <span className="text-xs text-[#8b8b9e] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              Entry
            </span>
            <span className="text-sm font-semibold text-white tabular-nums">${signal.entry.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03]">
            <span className="text-xs text-[#8b8b9e] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Take Profit
            </span>
            <span className="text-sm font-semibold text-emerald-400 tabular-nums">
              ${signal.takeProfit.toFixed(2)}
              <span className="ml-1 text-xs opacity-70">({Number(tpPct) > 0 ? '+' : ''}{tpPct}%)</span>
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03]">
            <span className="text-xs text-[#8b8b9e] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Stop Loss
            </span>
            <span className="text-sm font-semibold text-red-400 tabular-nums">
              ${signal.stopLoss.toFixed(2)}
              <span className="ml-1 text-xs opacity-70">({slPct}%)</span>
            </span>
          </div>
        </div>
      )}

      {/* Meta row */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 px-3 py-2 rounded-xl bg-white/[0.03] text-center">
          <div className="text-[10px] text-[#5a5a6e] uppercase tracking-wider mb-0.5">R:R</div>
          <div className="text-sm font-bold text-white">{signal.riskReward}</div>
        </div>
        <div className="flex-1 px-3 py-2 rounded-xl bg-white/[0.03] text-center">
          <div className="text-[10px] text-[#5a5a6e] uppercase tracking-wider mb-0.5">Trend</div>
          <div className="text-sm font-bold text-white capitalize">{signal.trend}</div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-5">
        <p className="text-xs text-[#8b8b9e] leading-relaxed italic">💡 {signal.reasoning}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onManualAnalyze}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/[0.05] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-all"
        >
          ⚡ Re-analyze
        </button>
        <button
          onClick={onSendTelegram}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all"
        >
          📱 Telegram
        </button>
      </div>

      {/* Timestamp */}
      <p className="text-[10px] text-[#5a5a6e] text-center mt-3">
        {new Date(signal.timestamp).toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'Asia/Ho_Chi_Minh',
        })}{' '}
        UTC+7
      </p>
    </div>
  );
}
