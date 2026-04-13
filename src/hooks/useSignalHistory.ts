import { useState, useEffect, useCallback, useRef } from 'react';
import type { Signal, PnLStats, TradingConfig } from '../types/trading';
import { STORAGE_KEYS, DEFAULT_PAIR, DEFAULT_INTERVAL, DEFAULT_CANDLE_COUNT } from '../config/constants';
import { dbLoadSignals, dbUpsertSignal, dbUpsertSignals, localLoadSignals, localSaveSignals } from '../services/signalDb';
import { supabase } from '../services/supabaseClient';

const DEFAULT_CONFIG: TradingConfig = {
  pair: DEFAULT_PAIR,
  interval: DEFAULT_INTERVAL,
  candleCount: DEFAULT_CANDLE_COUNT,
  autoTelegram: false,
  telegramChatId: '',
  telegramBotToken: '',
  aiApiKey: '',
};

function loadConfig(): TradingConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(config: TradingConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch { /* ignore */ }
}

function calculatePnL(signals: Signal[]): PnLStats {
  const followedSignals = signals.filter((s) => s.followed);
  const closedFollowed = followedSignals.filter(
    (s) => s.status === 'tp_hit' || s.status === 'sl_hit' || s.status === 'manual_close'
  );
  const activeFollowed = followedSignals.filter((s) => s.status === 'followed').length;

  const wins = closedFollowed.filter((s) => (s.pnl ?? 0) > 0).length;
  const losses = closedFollowed.filter((s) => (s.pnl ?? 0) <= 0).length;
  const pnls = closedFollowed.map((s) => s.pnl ?? 0);
  const totalPnl = pnls.reduce((sum, p) => sum + p, 0);

  const rrValues = closedFollowed
    .map((s) => { const m = s.riskReward.match(/([\d.]+)/); return m ? parseFloat(m[1]) : 0; })
    .filter((v) => v > 0);

  return {
    totalTrades: closedFollowed.length,
    followedTrades: followedSignals.length,
    wins,
    losses,
    winRate: closedFollowed.length > 0 ? (wins / closedFollowed.length) * 100 : 0,
    totalPnlPercent: totalPnl,
    avgRiskReward: rrValues.length > 0 ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length : 0,
    bestTrade: pnls.length > 0 ? Math.max(...pnls) : 0,
    worstTrade: pnls.length > 0 ? Math.min(...pnls) : 0,
    activeFollowed,
  };
}

export function useSignalHistory() {
  // Start with localStorage for instant render, then hydrate from Supabase
  const [signals, setSignals] = useState<Signal[]>(() => localLoadSignals());
  const [config, setConfig] = useState<TradingConfig>(() => loadConfig());
  const remoteLoadedRef = useRef(false);
  const currentPriceRef = useRef(0);

  // ── Load from Supabase on mount ──────────────────────────
  useEffect(() => {
    if (remoteLoadedRef.current) return;
    remoteLoadedRef.current = true;

    dbLoadSignals().then((remote) => {
      setSignals(remote);
      localSaveSignals(remote); // keep localStorage in sync
    });
  }, []);

  // ── Subscribe to real-time signal updates ────────────────
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('signals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signals' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newSig = payload.new as Record<string, unknown>;
          setSignals((prev) => {
            // Avoid duplicates (we already added it optimistically)
            if (prev.find((s) => s.id === newSig.id)) return prev;
            return [newSig as unknown as Signal, ...prev];
          });
        }
        if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Record<string, unknown>;
          setSignals((prev) =>
            prev.map((s) => (s.id === updated.id ? { ...s, ...(updated as unknown as Signal) } : s))
          );
        }
      })
      .subscribe();

    return () => { supabase!.removeChannel(channel); };
  }, []);

  // ── Persist to localStorage whenever signals change ──────
  useEffect(() => {
    localSaveSignals(signals);
  }, [signals]);

  // ── Persist config to localStorage ──────────────────────
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  // ── Mutations ────────────────────────────────────────────

  const addSignal = useCallback((signal: Signal) => {
    const s = { ...signal, followed: signal.followed ?? false };
    setSignals((prev) => [s, ...prev]);
    dbUpsertSignal(s);
  }, []);

  const updateSignal = useCallback((id: string, updates: Partial<Signal>) => {
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, ...updates };
        dbUpsertSignal(updated);
        return updated;
      })
    );
  }, []);

  const followSignal = useCallback((id: string) => {
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, followed: true, status: 'followed' as const, followedAt: Date.now() };
        dbUpsertSignal(updated);
        return updated;
      })
    );
  }, []);

  const unfollowSignal = useCallback((id: string) => {
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, followed: false, status: 'active' as const, followedAt: undefined };
        dbUpsertSignal(updated);
        return updated;
      })
    );
  }, []);

  const skipSignal = useCallback((id: string) => {
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, followed: false, status: 'skipped' as const };
        dbUpsertSignal(updated);
        return updated;
      })
    );
  }, []);

  const closeSignal = useCallback((id: string, status: Signal['status'], closePrice?: number) => {
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const price = closePrice ?? s.entry;
        let pnl = 0;
        if (s.direction === 'BUY') pnl = ((price - s.entry) / s.entry) * 100;
        else if (s.direction === 'SELL') pnl = ((s.entry - price) / s.entry) * 100;
        const updated = { ...s, status, pnl: parseFloat(pnl.toFixed(2)), closedAt: Date.now(), closePrice: price };
        dbUpsertSignal(updated);
        return updated;
      })
    );
  }, []);

  const checkPriceTargets = useCallback((currentPrice: number) => {
    currentPriceRef.current = currentPrice;
    if (currentPrice <= 0) return;

    setSignals((prev) => {
      const toUpdate: Signal[] = [];
      const updated = prev.map((s) => {
        if (s.status !== 'followed' || !s.followed || s.direction === 'WAIT') return s;
        if (s.entry === 0 || s.takeProfit === 0 || s.stopLoss === 0) return s;

        if (s.direction === 'BUY') {
          if (currentPrice >= s.takeProfit) {
            const u = { ...s, status: 'tp_hit' as const, pnl: parseFloat((((s.takeProfit - s.entry) / s.entry) * 100).toFixed(2)), closedAt: Date.now(), closePrice: s.takeProfit };
            toUpdate.push(u); return u;
          }
          if (currentPrice <= s.stopLoss) {
            const u = { ...s, status: 'sl_hit' as const, pnl: parseFloat((((s.stopLoss - s.entry) / s.entry) * 100).toFixed(2)), closedAt: Date.now(), closePrice: s.stopLoss };
            toUpdate.push(u); return u;
          }
        }
        if (s.direction === 'SELL') {
          if (currentPrice <= s.takeProfit) {
            const u = { ...s, status: 'tp_hit' as const, pnl: parseFloat((((s.entry - s.takeProfit) / s.entry) * 100).toFixed(2)), closedAt: Date.now(), closePrice: s.takeProfit };
            toUpdate.push(u); return u;
          }
          if (currentPrice >= s.stopLoss) {
            const u = { ...s, status: 'sl_hit' as const, pnl: parseFloat((((s.entry - s.stopLoss) / s.entry) * 100).toFixed(2)), closedAt: Date.now(), closePrice: s.stopLoss };
            toUpdate.push(u); return u;
          }
        }
        return s;
      });

      if (toUpdate.length > 0) dbUpsertSignals(toUpdate);
      return toUpdate.length > 0 ? updated : prev;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setSignals([]);
    // Note: does not delete from Supabase — intentional (keep DB history)
  }, []);

  const updateConfig = useCallback((updates: Partial<TradingConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    signals,
    config,
    pnlStats: calculatePnL(signals),
    addSignal,
    updateSignal,
    followSignal,
    unfollowSignal,
    skipSignal,
    closeSignal,
    checkPriceTargets,
    clearHistory,
    updateConfig,
  };
}
