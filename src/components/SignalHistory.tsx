import { useState, useCallback, useEffect, useRef } from 'react';
import type { Signal } from '../types/trading';

interface SignalHistoryProps {
  signals: Signal[];
  currentPrice: number;
  onFollow: (id: string) => void;
  onUnfollow: (id: string) => void;
  onSkip: (id: string) => void;
  onClose: (id: string, status: Signal['status'], closePrice?: number) => void;
}

export default function SignalHistory({ signals, currentPrice, onFollow, onUnfollow, onSkip, onClose }: SignalHistoryProps) {
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closePrice, setClosePrice] = useState('');

  // ── Draggable ──────────────────────────────────────────────
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('signal_ledger_pos');
      if (saved) return JSON.parse(saved) as { x: number; y: number };
    } catch { /* ignore */ }
    return { x: Math.max(0, window.innerWidth - 360), y: 80 };
  });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);

  const onHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input')) return;
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y };
    e.preventDefault();
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const x = Math.max(0, Math.min(window.innerWidth - 340, e.clientX - dragOffset.current.x));
      const y = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y));
      setPos({ x, y });
    };
    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        localStorage.setItem('signal_ledger_pos', JSON.stringify(posRef.current));
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);
  // ──────────────────────────────────────────────────────────

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
    <div
      className="fixed z-50 rounded-xl bg-[#1e1a13]/95 border border-[#c4956a]/15 overflow-hidden backdrop-blur-md shadow-2xl shadow-black/50"
      style={{ left: pos.x, top: pos.y, width: 340 }}
    >
      {/* Header — drag handle */}
      <div
        className="px-5 py-3 border-b border-[#c4956a]/10 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onHeaderMouseDown}
      >
        <h3 className="text-sm font-semibold text-[#e8dcc8] flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          <span className="text-[#6d6354] text-[10px]">⠿</span>
          📒 Signal Ledger
        </h3>
        <div className="flex items-center gap-2">
          {followedSignals.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7d9b6f]/10 text-[#7d9b6f] font-medium animate-pulse">
              {followedSignals.length} Active
            </span>
          )}
          <span className="text-[10px] text-[#6d6354]">{signals.length} total</span>
        </div>
      </div>

      <div className="max-h-[440px] overflow-y-auto">
        {signals.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-xs text-[#6d6354] italic" style={{ fontFamily: "'Lora', serif" }}>The ledger is empty. Signals will be recorded here.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#c4956a]/5">
            {/* PENDING */}
            {pendingSignals.length > 0 && (
              <>
                <div className="px-5 py-2 bg-[#c4956a]/[0.03]">
                  <span className="text-[10px] uppercase tracking-wider text-[#c4956a]/60 font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                    🛎️ New dispatch — Follow or Skip?
                  </span>
                </div>
                {pendingSignals.map((signal) => {
                  const livePnl = getLivePnl(signal);
                  const { tpProgress, slProgress } = getProgressToTarget(signal);

                  return (
                  <div key={signal.id} className="px-5 py-3 bg-[#c4956a]/[0.02] hover:bg-[#c4956a]/[0.04] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${
                          signal.direction === 'BUY' ? 'text-[#7d9b6f]' : signal.direction === 'SELL' ? 'text-[#b5594e]' : 'text-[#c4956a]'
                        }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {signal.direction === 'BUY' ? '🌿' : signal.direction === 'SELL' ? '🍂' : '⏳'} {signal.direction}
                        </span>
                        <span className="text-[10px] text-[#6d6354]">{signal.pair} · {signal.interval}</span>
                        <span className="text-[10px] text-[#c4956a]/60">{signal.confidence}%</span>
                      </div>
                      {signal.direction !== 'WAIT' && (
                        <span className={`text-sm font-bold tabular-nums ${livePnl >= 0 ? 'text-[#7d9b6f]' : 'text-[#b5594e]'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {livePnl >= 0 ? '+' : ''}{livePnl.toFixed(2)}%
                        </span>
                      )}
                    </div>

                    {/* TP/SL progress bars */}
                    {signal.direction !== 'WAIT' && (
                      <div className="mb-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-[#7d9b6f]/60 w-5">TP</span>
                          <div className="flex-1 h-1 rounded-full bg-[#c4956a]/[0.08] overflow-hidden">
                            <div className="h-full bg-[#7d9b6f] rounded-full transition-all duration-500" style={{ width: `${tpProgress}%` }} />
                          </div>
                          <span className="text-[9px] text-[#6d6354] tabular-nums w-8 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{tpProgress.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-[#b5594e]/60 w-5">SL</span>
                          <div className="flex-1 h-1 rounded-full bg-[#c4956a]/[0.08] overflow-hidden">
                            <div className="h-full bg-[#b5594e] rounded-full transition-all duration-500" style={{ width: `${slProgress}%` }} />
                          </div>
                          <span className="text-[9px] text-[#6d6354] tabular-nums w-8 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{slProgress.toFixed(0)}%</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-[#6d6354] mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      <span>Entry: ${signal.entry.toFixed(2)}</span>
                      <span>Now: ${currentPrice.toFixed(2)}</span>
                      <span className="text-[#7d9b6f]/60">TP: ${signal.takeProfit.toFixed(2)}</span>
                      <span className="text-[#b5594e]/60">SL: ${signal.stopLoss.toFixed(2)}</span>
                    </div>

                    {signal.direction !== 'WAIT' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onFollow(signal.id)}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold bg-[#7d9b6f]/10 border border-[#7d9b6f]/20 text-[#7d9b6f] hover:bg-[#7d9b6f]/20 transition-all"
                          style={{ fontFamily: "'Lora', serif" }}
                        >
                          ✅ I Followed This
                        </button>
                        <button
                          onClick={() => onSkip(signal.id)}
                          className="flex-1 py-2 rounded-lg text-xs font-medium bg-[#c4956a]/[0.04] border border-[#c4956a]/8 text-[#6d6354] hover:text-[#e8dcc8] hover:border-[#c4956a]/15 transition-all"
                          style={{ fontFamily: "'Lora', serif" }}
                        >
                          Skip
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onSkip(signal.id)}
                        className="w-full py-2 rounded-lg text-xs font-medium bg-[#c4956a]/[0.04] border border-[#c4956a]/8 text-[#6d6354] hover:text-[#e8dcc8] transition-all"
                        style={{ fontFamily: "'Lora', serif" }}
                      >
                        Dismiss
                      </button>
                    )}

                    <div className="text-[10px] text-[#6d6354] mt-2 italic" style={{ fontFamily: "'Lora', serif" }}>{formatTime(signal.timestamp)}</div>
                  </div>
                  );
                })}
              </>
            )}

            {/* FOLLOWED */}
            {followedSignals.length > 0 && (
              <>
                <div className="px-5 py-2 bg-[#7d9b6f]/[0.03]">
                  <span className="text-[10px] uppercase tracking-wider text-[#7d9b6f]/60 font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                    📊 Fields Under Watch
                  </span>
                </div>
                {followedSignals.map((signal) => {
                  const livePnl = getLivePnl(signal);
                  const { tpProgress, slProgress } = getProgressToTarget(signal);

                  return (
                    <div key={signal.id} className="px-5 py-3 hover:bg-[#c4956a]/[0.02] transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${
                            signal.direction === 'BUY' ? 'text-[#7d9b6f]' : 'text-[#b5594e]'
                          }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {signal.direction === 'BUY' ? '🌿' : '🍂'} {signal.direction}
                          </span>
                          <span className="text-[10px] text-[#6d6354]">{signal.pair}</span>
                        </div>
                        <span className={`text-sm font-bold tabular-nums ${livePnl >= 0 ? 'text-[#7d9b6f]' : 'text-[#b5594e]'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {livePnl >= 0 ? '+' : ''}{livePnl.toFixed(2)}%
                        </span>
                      </div>

                      <div className="mb-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-[#7d9b6f]/60 w-5">TP</span>
                          <div className="flex-1 h-1 rounded-full bg-[#c4956a]/[0.08] overflow-hidden">
                            <div className="h-full bg-[#7d9b6f] rounded-full transition-all duration-500" style={{ width: `${tpProgress}%` }} />
                          </div>
                          <span className="text-[9px] text-[#6d6354] tabular-nums w-8 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{tpProgress.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-[#b5594e]/60 w-5">SL</span>
                          <div className="flex-1 h-1 rounded-full bg-[#c4956a]/[0.08] overflow-hidden">
                            <div className="h-full bg-[#b5594e] rounded-full transition-all duration-500" style={{ width: `${slProgress}%` }} />
                          </div>
                          <span className="text-[9px] text-[#6d6354] tabular-nums w-8 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{slProgress.toFixed(0)}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-[#6d6354] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        <span>Entry: ${signal.entry.toFixed(2)}</span>
                        <span>Now: ${currentPrice.toFixed(2)}</span>
                        <span className="text-[#7d9b6f]/60">TP: ${signal.takeProfit.toFixed(2)}</span>
                        <span className="text-[#b5594e]/60">SL: ${signal.stopLoss.toFixed(2)}</span>
                      </div>

                      {closingId === signal.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={closePrice}
                            onChange={(e) => setClosePrice(e.target.value)}
                            placeholder={`${currentPrice.toFixed(2)}`}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[#c4956a]/[0.06] border border-[#c4956a]/12 text-[#e8dcc8] text-xs outline-none focus:border-[#c4956a]/30"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          />
                          <button
                            onClick={() => handleClose(signal.id, 'tp_hit')}
                            className="px-2.5 py-1.5 rounded-lg bg-[#7d9b6f]/10 text-[#7d9b6f] text-[10px] font-medium hover:bg-[#7d9b6f]/20 transition-colors"
                          >
                            TP Hit
                          </button>
                          <button
                            onClick={() => handleClose(signal.id, 'sl_hit')}
                            className="px-2.5 py-1.5 rounded-lg bg-[#b5594e]/10 text-[#b5594e] text-[10px] font-medium hover:bg-[#b5594e]/20 transition-colors"
                          >
                            SL Hit
                          </button>
                          <button
                            onClick={() => handleClose(signal.id, 'manual_close')}
                            className="px-2.5 py-1.5 rounded-lg bg-[#c4956a]/[0.08] text-[#a0947e] text-[10px] font-medium hover:bg-[#c4956a]/[0.12] transition-colors"
                          >
                            Manual
                          </button>
                          <button
                            onClick={() => { setClosingId(null); setClosePrice(''); }}
                            className="px-2 py-1.5 text-[#6d6354] text-[10px] hover:text-[#e8dcc8] transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setClosingId(signal.id)}
                            className="text-[10px] text-[#c4956a]/60 hover:text-[#c4956a] transition-colors"
                            style={{ fontFamily: "'Lora', serif" }}
                          >
                            Close position manually →
                          </button>
                          <span className="text-[#c4956a]/15">|</span>
                          <button
                            onClick={() => onUnfollow(signal.id)}
                            className="text-[10px] text-[#b5594e]/50 hover:text-[#b5594e] transition-colors"
                            style={{ fontFamily: "'Lora', serif" }}
                          >
                            ↩ Undo Follow
                          </button>
                        </div>
                      )}

                      <div className="text-[10px] text-[#6d6354] mt-1 italic" style={{ fontFamily: "'Lora', serif" }}>
                        Followed {formatTime(signal.followedAt || signal.timestamp)}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* CLOSED */}
            {closedSignals.length > 0 && (
              <>
                <div className="px-5 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#6d6354]/60 font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                    📜 Old Entries
                  </span>
                </div>
                {closedSignals.map((signal) => (
                  <div key={signal.id} className="px-5 py-3 opacity-60 hover:opacity-80 transition-opacity">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${
                          signal.direction === 'BUY' ? 'text-[#7d9b6f]' : signal.direction === 'SELL' ? 'text-[#b5594e]' : 'text-[#c4956a]'
                        }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {signal.direction}
                        </span>
                        <span className="text-[10px] text-[#6d6354]">{signal.pair}</span>
                        {signal.followed && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#c4956a]/10 text-[#c4956a]">Followed</span>
                        )}
                        {signal.status === 'skipped' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#c4956a]/[0.04] text-[#6d6354]">Skipped</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {signal.pnl !== undefined && signal.followed && (
                          <span className={`text-xs font-bold tabular-nums ${signal.pnl > 0 ? 'text-[#7d9b6f]' : 'text-[#b5594e]'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {signal.pnl > 0 ? '+' : ''}{signal.pnl.toFixed(2)}%
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          signal.status === 'tp_hit'
                            ? 'bg-[#7d9b6f]/10 text-[#7d9b6f]'
                            : signal.status === 'sl_hit'
                            ? 'bg-[#b5594e]/10 text-[#b5594e]'
                            : 'bg-[#c4956a]/[0.08] text-[#6d6354]'
                        }`}>
                          {signal.status === 'tp_hit' ? '🌾 HARVEST' :
                           signal.status === 'sl_hit' ? '🥀 FROST' :
                           signal.status === 'manual_close' ? 'UPROOTED' :
                           signal.status === 'skipped' ? 'PASSED' :
                           signal.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[#6d6354]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
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
