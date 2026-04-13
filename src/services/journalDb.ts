import { supabase } from './supabaseClient';
import type { JournalEntry } from '../utils/signalJournal';

function toRow(e: JournalEntry) {
  return {
    id: e.id,
    timestamp: e.timestamp,
    pair: e.pair,
    direction: e.direction,
    entry: e.entry,
    take_profit: e.takeProfit,
    stop_loss: e.stopLoss,
    confidence: e.confidence,
    reasoning: e.reasoning ?? null,
    trend15m: e.trend15m ?? null,
    trend5m: e.trend5m ?? null,
    ema20: e.ema20 ?? null,
    ema50: e.ema50 ?? null,
    rsi: e.rsi ?? null,
    volume_trend: e.volumeTrend ?? null,
    is_sideways: e.isSideways ?? null,
    timeframe_aligned: e.timeframeAligned ?? null,
    filtered_out: e.filteredOut,
    filter_reason: e.filterReason ?? null,
    outcome: e.outcome ?? 'PENDING',
    actual_exit_price: e.actualExitPrice ?? null,
    pnl_percent: e.pnlPercent ?? null,
    closed_at: e.closedAt ?? null,
  };
}

export function dbInsertJournalEntry(entry: JournalEntry): void {
  if (!supabase) return;
  supabase
    .from('journal_entries')
    .upsert(toRow(entry))
    .then(({ error }) => {
      if (error) console.warn('[journalDb] insert failed:', error.message);
    });
}

export function dbUpdateJournalOutcome(
  id: string,
  outcome: JournalEntry['outcome'],
  exitPrice: number,
  pnlPercent: number,
  closedAt: number,
): void {
  if (!supabase) return;
  supabase
    .from('journal_entries')
    .update({
      outcome,
      actual_exit_price: exitPrice,
      pnl_percent: pnlPercent,
      closed_at: closedAt,
    })
    .eq('id', id)
    .then(({ error }) => {
      if (error) console.warn('[journalDb] update outcome failed:', error.message);
    });
}
