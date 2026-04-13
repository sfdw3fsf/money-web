import { supabase } from './supabaseClient';
import type { Signal } from '../types/trading';

// ── camelCase <-> snake_case mapping ─────────────────────────

function toRow(s: Signal) {
  return {
    id: s.id,
    timestamp: s.timestamp,
    pair: s.pair,
    timeframe: s.interval,
    direction: s.direction,
    entry: s.entry,
    take_profit: s.takeProfit,
    stop_loss: s.stopLoss,
    confidence: s.confidence,
    risk_reward: s.riskReward,
    reasoning: s.reasoning ?? null,
    trend: s.trend ?? null,
    support: s.support ?? [],
    resistance: s.resistance ?? [],
    status: s.status,
    followed: s.followed,
    followed_at: s.followedAt ?? null,
    pnl: s.pnl ?? null,
    closed_at: s.closedAt ?? null,
    close_price: s.closePrice ?? null,
  };
}

function fromRow(row: Record<string, unknown>): Signal {
  return {
    id: row.id as string,
    timestamp: row.timestamp as number,
    pair: row.pair as string,
    interval: row.timeframe as string,
    direction: row.direction as Signal['direction'],
    entry: row.entry as number,
    takeProfit: row.take_profit as number,
    stopLoss: row.stop_loss as number,
    confidence: row.confidence as number,
    riskReward: row.risk_reward as string,
    reasoning: row.reasoning as string,
    trend: row.trend as string,
    support: (row.support as number[]) ?? [],
    resistance: (row.resistance as number[]) ?? [],
    status: row.status as Signal['status'],
    followed: row.followed as boolean,
    followedAt: row.followed_at as number | undefined,
    pnl: row.pnl as number | undefined,
    closedAt: row.closed_at as number | undefined,
    closePrice: row.close_price as number | undefined,
  };
}

// ── localStorage fallback ────────────────────────────────────

const LS_KEY = 'trading_signals';

export function localLoadSignals(): Signal[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Signal[]) : [];
  } catch {
    return [];
  }
}

export function localSaveSignals(signals: Signal[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(signals));
  } catch { /* ignore quota errors */ }
}

// ── Supabase CRUD ────────────────────────────────────────────

export async function dbLoadSignals(): Promise<Signal[]> {
  if (!supabase) return localLoadSignals();
  const { data, error } = await supabase
    .from('signals')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(300);
  if (error || !data) {
    console.warn('[signalDb] load failed, using localStorage:', error?.message);
    return localLoadSignals();
  }
  return data.map((r) => fromRow(r as Record<string, unknown>));
}

export function dbUpsertSignal(signal: Signal): void {
  if (!supabase) return;
  supabase
    .from('signals')
    .upsert(toRow(signal))
    .then(({ error }) => {
      if (error) console.warn('[signalDb] upsert failed:', error.message);
    });
}

export function dbUpsertSignals(signals: Signal[]): void {
  if (!supabase || signals.length === 0) return;
  supabase
    .from('signals')
    .upsert(signals.map(toRow))
    .then(({ error }) => {
      if (error) console.warn('[signalDb] bulk upsert failed:', error.message);
    });
}
