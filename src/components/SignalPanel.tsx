import type { Signal } from "../types/trading";

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
      <div className="rounded-xl bg-[#231f18]/60 border border-[#c4956a]/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#c4956a]/10 border border-[#c4956a]/20 flex items-center justify-center">
            <span className="text-lg animate-spin">⚙</span>
          </div>
          <div>
            <h3
              className="text-sm font-semibold text-[#e8dcc8]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Reading the Fields...
            </h3>
            <p
              className="text-xs text-[#6d6354] italic"
              style={{ fontFamily: "'Lora', serif" }}
            >
              The old farmer studies the almanac
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-4 rounded bg-[#c4956a]/5 animate-pulse"
              style={{ width: `${90 - i * 15}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="rounded-xl bg-[#231f18]/60 border border-[#c4956a]/10 p-6">
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-xl bg-[#c4956a]/10 border border-[#c4956a]/15 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🌻</span>
          </div>
          <h3
            className="text-sm font-semibold text-[#e8dcc8] mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            All Quiet on the Farm
          </h3>
          <p
            className="text-xs text-[#6d6354] mb-5"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Signals arrive when the candles close.
            <br />
            Or ring the bell below to check now.
          </p>
          <button
            onClick={onManualAnalyze}
            className="btn-primary !py-2.5 !px-6 !text-sm !rounded-lg w-full"
          >
            🔔 Ring the Bell
          </button>
          {lastError && (
            <p
              className="text-xs text-[#b5594e] mt-3 bg-[#b5594e]/10 rounded-lg px-3 py-2"
              style={{ fontFamily: "'Lora', serif" }}
            >
              {lastError}
            </p>
          )}
        </div>
      </div>
    );
  }

  const isBuy = signal.direction === "BUY";
  const isSell = signal.direction === "SELL";
  const isWait = signal.direction === "WAIT";

  const dirIcon = isBuy ? "🌿" : isSell ? "🍂" : "⏳";
  const dirLabel = isBuy ? "LONG" : isSell ? "SHORT" : "WAIT";
  const tpPct = (
    ((signal.takeProfit - signal.entry) / signal.entry) *
    100
  ).toFixed(2);
  const slPct = (
    ((signal.stopLoss - signal.entry) / signal.entry) *
    100
  ).toFixed(2);
  const reward = Math.abs(signal.takeProfit - signal.entry);
  const risk = Math.abs(signal.entry - signal.stopLoss);
  const rrDisplay =
    risk > 0 ? `${(reward / risk).toFixed(2)}:1` : signal.riskReward;

  // Confidence gauge
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset =
    circumference - (signal.confidence / 100) * circumference;
  const confColor =
    signal.confidence >= 70
      ? "#7d9b6f"
      : signal.confidence >= 50
        ? "#c4956a"
        : "#b5594e";

  return (
    <div
      className={`rounded-xl border p-6 transition-all duration-500 ${
        isBuy
          ? "bg-[#7d9b6f]/[0.06] border-[#7d9b6f]/20"
          : isSell
            ? "bg-[#b5594e]/[0.06] border-[#b5594e]/20"
            : "bg-[#c4956a]/[0.06] border-[#c4956a]/20"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{dirIcon}</span>
          <div>
            <h3
              className={`text-lg font-bold ${
                isBuy
                  ? "text-[#7d9b6f]"
                  : isSell
                    ? "text-[#b5594e]"
                    : "text-[#c4956a]"
              }`}
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {dirLabel}
            </h3>
            <p
              className="text-xs text-[#6d6354]"
              style={{ fontFamily: "'Lora', serif" }}
            >
              {signal.pair} · {signal.interval}
            </p>
          </div>
        </div>

        {/* Confidence Ring */}
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="rgba(196, 149, 106, 0.08)"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke={confColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#e8dcc8]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {signal.confidence}%
          </span>
        </div>
      </div>

      {/* Price Levels */}
      {!isWait && (
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#c4956a]/[0.05] border border-[#c4956a]/10">
            <span
              className="text-xs text-[#a0947e] flex items-center gap-2"
              style={{ fontFamily: "'Lora', serif" }}
            >
              <span className="w-2 h-2 rounded-full bg-[#c4956a]" />
              Entry
            </span>
            <span
              className="text-sm font-semibold text-[#e8dcc8] tabular-nums"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ${signal.entry.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#7d9b6f]/[0.05] border border-[#7d9b6f]/10">
            <span
              className="text-xs text-[#a0947e] flex items-center gap-2"
              style={{ fontFamily: "'Lora', serif" }}
            >
              <span className="w-2 h-2 rounded-full bg-[#7d9b6f]" />
              Take Profit
            </span>
            <span
              className="text-sm font-semibold text-[#7d9b6f] tabular-nums"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ${signal.takeProfit.toFixed(2)}
              <span className="ml-1 text-xs opacity-70">
                ({Number(tpPct) > 0 ? "+" : ""}
                {tpPct}%)
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#b5594e]/[0.05] border border-[#b5594e]/10">
            <span
              className="text-xs text-[#a0947e] flex items-center gap-2"
              style={{ fontFamily: "'Lora', serif" }}
            >
              <span className="w-2 h-2 rounded-full bg-[#b5594e]" />
              Stop Loss
            </span>
            <span
              className="text-sm font-semibold text-[#b5594e] tabular-nums"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ${signal.stopLoss.toFixed(2)}
              <span className="ml-1 text-xs opacity-70">({slPct}%)</span>
            </span>
          </div>
        </div>
      )}

      {/* Meta row */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 px-3 py-2 rounded-lg bg-[#c4956a]/[0.05] border border-[#c4956a]/10 text-center">
          <div
            className="text-[10px] text-[#6d6354] uppercase tracking-wider mb-0.5"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            R:R
          </div>
          <div
            className="text-sm font-bold text-[#e8dcc8]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {rrDisplay}
          </div>
        </div>
        <div className="flex-1 px-3 py-2 rounded-lg bg-[#c4956a]/[0.05] border border-[#c4956a]/10 text-center">
          <div
            className="text-[10px] text-[#6d6354] uppercase tracking-wider mb-0.5"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Trend
          </div>
          <div
            className="text-sm font-bold text-[#e8dcc8] capitalize"
            style={{ fontFamily: "'Lora', serif" }}
          >
            {signal.trend}
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="px-3 py-3 rounded-lg bg-[#c4956a]/[0.03] border border-[#c4956a]/8 mb-5">
        <p
          className="text-xs text-[#a0947e] leading-relaxed italic"
          style={{ fontFamily: "'Lora', serif" }}
        >
          📜 {signal.reasoning}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onManualAnalyze}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[#c4956a]/[0.08] border border-[#c4956a]/15 text-[#e8dcc8] hover:bg-[#c4956a]/[0.12] transition-all"
          style={{ fontFamily: "'Lora', serif" }}
        >
          🔔 Re-read
        </button>
        <button
          onClick={onSendTelegram}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[#c4956a]/10 border border-[#c4956a]/20 text-[#c4956a] hover:bg-[#c4956a]/20 transition-all"
          style={{ fontFamily: "'Lora', serif" }}
        >
          📮 Telegram
        </button>
      </div>

      {/* Timestamp */}
      <p
        className="text-[10px] text-[#6d6354] text-center mt-3 italic"
        style={{ fontFamily: "'Lora', serif" }}
      >
        {new Date(signal.timestamp).toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Ho_Chi_Minh",
        })}{" "}
        UTC+7
      </p>
    </div>
  );
}
