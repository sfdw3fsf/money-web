import { useState, useEffect, useCallback, useRef } from 'react';
import type { Signal, PnLStats, TradingConfig } from '../types/trading';
import { STORAGE_KEYS, DEFAULT_PAIR, DEFAULT_INTERVAL, DEFAULT_CANDLE_COUNT } from '../config/constants';

const DEFAULT_CONFIG: TradingConfig = {
  pair: DEFAULT_PAIR,
  interval: DEFAULT_INTERVAL,
  candleCount: DEFAULT_CANDLE_COUNT,
  autoTelegram: false,
  telegramChatId: '',
  telegramBotToken: '',
  aiApiKey: '',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('localStorage save error:', err);
  }
}

function calculatePnL(signals: Signal[]): PnLStats {
  const followedSignals = signals.filter((s) => s.followed);
  const closedFollowed = followedSignals.filter(
    (s) => s.status === 'tp_hit' || s.status === 'sl_hit' || s.status === 'manual_close'
  );
  const activeFollowed = followedSignals.filter(
    (s) => s.status === 'followed'
  ).length;

  const wins = closedFollowed.filter((s) => (s.pnl ?? 0) > 0).length;
  const losses = closedFollowed.filter((s) => (s.pnl ?? 0) <= 0).length;
  const pnls = closedFollowed.map((s) => s.pnl ?? 0);
  const totalPnl = pnls.reduce((sum, p) => sum + p, 0);

  // Parse risk:reward ratios
  const rrValues = closedFollowed
    .map((s) => {
      const match = s.riskReward.match(/([\d.]+)/);
      return match ? parseFloat(match[1]) : 0;
    })
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
  const [signals, setSignals] = useState<Signal[]>(() =>
    loadFromStorage<Signal[]>(STORAGE_KEYS.SIGNALS, [])
  );

  const [config, setConfig] = useState<TradingConfig>(() =>
    loadFromStorage<TradingConfig>(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG)
  );

  const currentPriceRef = useRef(0);

  // Persist signals on change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SIGNALS, signals);
  }, [signals]);

  // Persist config on change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CONFIG, config);
  }, [config]);

  const addSignal = useCallback((signal: Signal) => {
    // Add followed: false by default
    setSignals((prev) => [{ ...signal, followed: signal.followed ?? false }, ...prev]);
  }, []);

  const updateSignal = useCallback((id: string, updates: Partial<Signal>) => {
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const followSignal = useCallback((id: string) => {
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          followed: true,
          status: 'followed' as const,
          followedAt: Date.now(),
        };
      })
    );
  }, []);

  const skipSignal = useCallback((id: string) => {
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          followed: false,
          status: 'skipped' as const,
        };
      })
    );
  }, []);

  const closeSignal = useCallback(
    (id: string, status: Signal['status'], closePrice?: number) => {
      setSignals((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;

          const price = closePrice ?? s.entry;
          let pnl = 0;

          if (s.direction === 'BUY') {
            pnl = ((price - s.entry) / s.entry) * 100;
          } else if (s.direction === 'SELL') {
            pnl = ((s.entry - price) / s.entry) * 100;
          }

          return {
            ...s,
            status,
            pnl: parseFloat(pnl.toFixed(2)),
            closedAt: Date.now(),
            closePrice: price,
          };
        })
      );
    },
    []
  );

  // Auto-track: check followed signals against current price
  const checkPriceTargets = useCallback((currentPrice: number) => {
    currentPriceRef.current = currentPrice;
    if (currentPrice <= 0) return;

    setSignals((prev) => {
      let changed = false;
      const updated = prev.map((s) => {
        // Only check followed, active signals with real entry/TP/SL
        if (s.status !== 'followed' || !s.followed) return s;
        if (s.direction === 'WAIT') return s;
        if (s.entry === 0 || s.takeProfit === 0 || s.stopLoss === 0) return s;

        // Check BUY signals
        if (s.direction === 'BUY') {
          if (currentPrice >= s.takeProfit) {
            changed = true;
            const pnl = ((s.takeProfit - s.entry) / s.entry) * 100;
            return { ...s, status: 'tp_hit' as const, pnl: parseFloat(pnl.toFixed(2)), closedAt: Date.now(), closePrice: s.takeProfit };
          }
          if (currentPrice <= s.stopLoss) {
            changed = true;
            const pnl = ((s.stopLoss - s.entry) / s.entry) * 100;
            return { ...s, status: 'sl_hit' as const, pnl: parseFloat(pnl.toFixed(2)), closedAt: Date.now(), closePrice: s.stopLoss };
          }
        }

        // Check SELL signals
        if (s.direction === 'SELL') {
          if (currentPrice <= s.takeProfit) {
            changed = true;
            const pnl = ((s.entry - s.takeProfit) / s.entry) * 100;
            return { ...s, status: 'tp_hit' as const, pnl: parseFloat(pnl.toFixed(2)), closedAt: Date.now(), closePrice: s.takeProfit };
          }
          if (currentPrice >= s.stopLoss) {
            changed = true;
            const pnl = ((s.entry - s.stopLoss) / s.entry) * 100;
            return { ...s, status: 'sl_hit' as const, pnl: parseFloat(pnl.toFixed(2)), closedAt: Date.now(), closePrice: s.stopLoss };
          }
        }

        return s;
      });

      return changed ? updated : prev;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setSignals([]);
  }, []);

  const updateConfig = useCallback((updates: Partial<TradingConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const pnlStats = calculatePnL(signals);

  return {
    signals,
    config,
    pnlStats,
    addSignal,
    updateSignal,
    followSignal,
    skipSignal,
    closeSignal,
    checkPriceTargets,
    clearHistory,
    updateConfig,
  };
}
