import { useState } from 'react';
import type { Signal } from '../types/trading';

interface SignalHistoryProps {
  signals: Signal[];
  currentPrice: number;
  onFollow: (id: string) => void;
  onSkip: (id: string) => void;
  onClose: (id: string, status: Signal['status'], closePrice?: number) => void;
}

export default function SignalHistory({ signals, currentPrice, onFollow, onSkip, onClose }: SignalHistoryProps) {
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closePrice, setClosePrice] = useState('');

  const pendingSignals = signals.filter((s) => s.status === 'active');
  const followedSignals = signals.filter((s) => s.status === 'followed');
  const closedSignals = signals.filter((s) =>
    ['tp_hit', 'sl_hit', 'manual_close', 'expired', 'skipped'].includes(s.status)
  );

  const handleClose = (id: string, status: Signal['status']) => {
    const price = closePrice ? parseFloat(closePrice) : currentPrice;
    onClose(id, status, price);
    setClosingId(null);
    setClosePrice('');
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Ho_Chi_Minh',
    });
  };

  const getLivePnl = (signal: Signal) => {
    if (signal.direction === 'BUY') {
      return ((currentPrice - signal.entry) / signal.entry) * 100;
    } else if (signal.direction === 'SELL') {
      return ((signal.entry - currentPrice) / signal.entry) * 100;
    }
    return 0;
  };

  const getProgressToTarget = (signal: Signal) => {
    if (signal.direction === 'WAIT') return { tpProgress: 0, slProgress: 0 };
    const totalRange = Math.abs(signal.takeProfit - signal.stopLoss);
    if (totalRange === 0) return { tpProgress: 0, slProgress: 0 };

    if (signal.direction === 'BUY') {
      const priceFromEntry = currentPrice - signal.entry;
      const tpDistance = signal.takeProfit - signal.entry;
      const slDistance = signal.entry - signal.stopLoss;
      return {
        tpProgress: tpDistance > 0 ? Math.max(0, Math.min(100, (priceFromEntry / tpDistance) * 100)) : 0,
        slProgress: slDistance > 0 ? Math.max(0, Math.min(100, (-priceFromEntry / slDistance) * 100)) : 0,
      };
    } else {
      const priceFromEntry = signal.entry - currentPrice;
      const tpDistance = signal.entry - signal.takeProfit;
      const slDistance = signal.stopLoss - signal.entry;
      return {
        tpProgress: tpDistance > 0 ? Math.max(0, Math.min(100, (priceFromEntry / tpDistance) * 100)) : 0,
        slProgress: slDistance > 0 ? Math.max(0, Math.min(100, (-priceFromEntry / slDistance) * 100)) : 0,
      };
    }
  };

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Order Tracking</h3>
        <div className="flex items-center gap-2">
          {followedSignals.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium animate-pulse">
              {followedSignals.length} Active
            </span>
          )}
          <span className="text-[10px] text-[#5a5a6e]">{signals.length} total</span>
        </div>
      </div>

      <div className="max-h-[440px] overflow-y-auto">
        {signals.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-xs text-[#5a5a6e]">No signals yet. Analysis will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {/* PENDING: New signals waiting for user decision */}
            {pendingSignals.length > 0 && (
              <>
                <div className="px-5 py-2 bg-amber-500/[0.03]">
                  <span className="text-[10px] uppercase tracking-wider text-amber-400/60 font-semibold">
                    💡 New — Follow or Skip?
                  </span>
                </div>
                {pendingSignals.map((signal) => (
                  <div key={signal.id} className="px-5 py-3 bg-amber-500/[0.02] hover:bg-amber-500/[0.04] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${
                          signal.direction === 'BUY' ? 'text-emerald-400' : signal.direction === 'SELL' ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {signal.direction === 'BUY' ? '🟢' : signal.direction === 'SELL' ? '🔴' : '⏸️'} {signal.direction}
                        </span>
                        <span className="text-[10px] text-[#5a5a6e]">{signal.pair} · {signal.interval}</span>
                        <span className="text-[10px] text-amber-400/60">{signal.confidence}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#8b8b9e] mb-3">
                      <span>Entry: ${signal.entry.toFixed(2)}</span>
                      <span className="text-emerald-400/70">TP: ${signal.takeProfit.toFixed(2)}</span>
                      <span className="text-red-400/70">SL: ${signal.stopLoss.toFixed(2)}</span>
                    </div>

                    {signal.direction !== 'WAIT' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onFollow(signal.id)}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                        >
                          ✅ I Followed This
                        </button>
                        <button
                          onClick={() => onSkip(signal.id)}
                          className="flex-1 py-2 rounded-xl text-xs font-medium bg-white/[0.03] border border-white/[0.06] text-[#5a5a6e] hover:text-white hover:border-white/[0.12] transition-all"
                        >
                          Skip
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onSkip(signal.id)}
                        className="w-full py-2 rounded-xl text-xs font-medium bg-white/[0.03] border border-white/[0.06] text-[#5a5a6e] hover:text-white transition-all"
                      >
                        Dismiss
                      </button>
                    )}

                    <div className="text-[10px] text-[#5a5a6e] mt-2">{formatTime(signal.timestamp)}</div>
                  </div>
                ))}
              </>
            )}

            {/* FOLLOWED: Live tracking */}
            {followedSignals.length > 0 && (
              <>
                <div className="px-5 py-2 bg-indigo-500/[0.03]">
                  <span className="text-[10px] uppercase tracking-wider text-indigo-400/60 font-semibold">
                    📊 Live Tracking
                  </span>
                </div>
                {followedSignals.map((signal) => {
                  const livePnl = getLivePnl(signal);
                  const { tpProgress, slProgress } = getProgressToTarget(signal);

                  return (
                    <div key={signal.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${
                            signal.direction === 'BUY' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {signal.direction === 'BUY' ? '🟢' : '🔴'} {signal.direction}
                          </span>
                          <span className="text-[10px] text-[#5a5a6e]">{signal.pair}</span>
                        </div>
                        <span className={`text-sm font-bold tabular-nums ${livePnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {livePnl >= 0 ? '+' : ''}{livePnl.toFixed(2)}%
                        </span>
                      </div>

                      {/* Progress bars */}
                      <div className="mb-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-emerald-400/60 w-5">TP</span>
                          <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${tpProgress}%` }} />
                          </div>
                          <span className="text-[9px] text-[#5a5a6e] tabular-nums w-8 text-right">{tpProgress.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-red-400/60 w-5">SL</span>
                          <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${slProgress}%` }} />
                          </div>
                          <span className="text-[9px] text-[#5a5a6e] tabular-nums w-8 text-right">{slProgress.toFixed(0)}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-[#5a5a6e] mb-2">
                        <span>Entry: ${signal.entry.toFixed(2)}</span>
                        <span>Now: ${currentPrice.toFixed(2)}</span>
                        <span className="text-emerald-400/60">TP: ${signal.takeProfit.toFixed(2)}</span>
                        <span className="text-red-400/60">SL: ${signal.stopLoss.toFixed(2)}</span>
                      </div>

                      {/* Close buttons */}
                      {closingId === signal.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={closePrice}
                            onChange={(e) => setClosePrice(e.target.value)}
                            placeholder={`${currentPrice.toFixed(2)}`}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white text-xs outline-none focus:border-indigo-500/40"
                          />
                          <button
                            onClick={() => handleClose(signal.id, 'tp_hit')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/20 transition-colors"
                          >
                            TP Hit
                          </button>
                          <button
                            onClick={() => handleClose(signal.id, 'sl_hit')}
                            className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-medium hover:bg-red-500/20 transition-colors"
                          >
                            SL Hit
                          </button>
                          <button
                            onClick={() => handleClose(signal.id, 'manual_close')}
                            className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] text-white/60 text-[10px] font-medium hover:bg-white/[0.08] transition-colors"
                          >
                            Manual
                          </button>
                          <button
                            onClick={() => { setClosingId(null); setClosePrice(''); }}
                            className="px-2 py-1.5 text-[#5a5a6e] text-[10px] hover:text-white transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setClosingId(signal.id)}
                          className="text-[10px] text-indigo-400/60 hover:text-indigo-400 transition-colors"
                        >
                          Close position manually →
                        </button>
                      )}

                      <div className="text-[10px] text-[#5a5a6e] mt-1">
                        Followed {formatTime(signal.followedAt || signal.timestamp)}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* CLOSED: History with results */}
            {closedSignals.length > 0 && (
              <>
                <div className="px-5 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#5a5a6e]/60 font-semibold">
                    📋 History
                  </span>
                </div>
                {closedSignals.map((signal) => (
                  <div key={signal.id} className="px-5 py-3 opacity-60 hover:opacity-80 transition-opacity">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${
                          signal.direction === 'BUY' ? 'text-emerald-400' : signal.direction === 'SELL' ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {signal.direction}
                        </span>
                        <span className="text-[10px] text-[#5a5a6e]">{signal.pair}</span>
                        {signal.followed && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">Followed</span>
                        )}
                        {signal.status === 'skipped' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.03] text-[#5a5a6e]">Skipped</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {signal.pnl !== undefined && signal.followed && (
                          <span className={`text-xs font-bold tabular-nums ${signal.pnl > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {signal.pnl > 0 ? '+' : ''}{signal.pnl.toFixed(2)}%
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          signal.status === 'tp_hit'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : signal.status === 'sl_hit'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-white/[0.05] text-[#5a5a6e]'
                        }`}>
                          {signal.status === 'tp_hit' ? '🎯 TP HIT' :
                           signal.status === 'sl_hit' ? '⛔ SL HIT' :
                           signal.status === 'manual_close' ? 'MANUAL' :
                           signal.status === 'skipped' ? 'SKIPPED' :
                           signal.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[#5a5a6e]">
                      <span>{formatTime(signal.timestamp)}</span>
                      {signal.closePrice && <span>Exit: ${signal.closePrice.toFixed(2)}</span>}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
