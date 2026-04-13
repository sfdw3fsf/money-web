import { MAX_JOURNAL_ENTRIES } from '../config/constants';
import { dbInsertJournalEntry, dbUpdateJournalOutcome } from '../services/journalDb';

export interface JournalEntry {
  id: string;
  timestamp: number;
  pair: string;

  // What the AI said
  direction: 'BUY' | 'SELL' | 'WAIT';
  entry: number;
  takeProfit: number;
  stopLoss: number;
  confidence: number;
  reasoning: string;

  // Market context at signal time
  trend15m: string;
  trend5m: string;
  ema20: number;
  ema50: number;
  rsi: number;
  volumeTrend: string;
  isSideways: boolean;
  timeframeAligned: boolean;

  // Filters applied
  filteredOut: boolean;
  filterReason?: string; // "sideways" | "misaligned" | "low_confidence" | "bad_rr" | "loss_pause"

  // Outcome tracking (filled later)
  outcome?: 'TP_HIT' | 'SL_HIT' | 'MANUAL_CLOSE' | 'PENDING';
  actualExitPrice?: number;
  pnlPercent?: number;
  closedAt?: number;
}

const STORAGE_KEY = 'signal_journal';

export function addJournalEntry(entry: JournalEntry): void {
  const journal = getJournal();
  journal.unshift(entry); // newest first
  if (journal.length > MAX_JOURNAL_ENTRIES) journal.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
  dbInsertJournalEntry(entry);
}

export function getJournal(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function updateOutcome(
  id: string,
  outcome: JournalEntry['outcome'],
  exitPrice: number,
): void {
  const journal = getJournal();
  const entry = journal.find((e) => e.id === id);
  if (entry) {
    entry.outcome = outcome;
    entry.actualExitPrice = exitPrice;
    entry.closedAt = Date.now();

    if (entry.direction === 'BUY') {
      entry.pnlPercent = ((exitPrice - entry.entry) / entry.entry) * 100;
    } else if (entry.direction === 'SELL') {
      entry.pnlPercent = ((entry.entry - exitPrice) / entry.entry) * 100;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
    dbUpdateJournalOutcome(id, outcome, exitPrice, entry.pnlPercent ?? 0, entry.closedAt!);
  }
}

export function getStats(): {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  filteredCount: number;
} {
  const journal = getJournal();
  const closed = journal.filter((e) => e.outcome && e.outcome !== 'PENDING');
  const wins = closed.filter((e) => (e.pnlPercent ?? 0) > 0);
  const losses = closed.filter((e) => (e.pnlPercent ?? 0) <= 0);
  const filtered = journal.filter((e) => e.filteredOut);

  const avgWin =
    wins.length > 0
      ? wins.reduce((sum, e) => sum + (e.pnlPercent ?? 0), 0) / wins.length
      : 0;
  const avgLoss =
    losses.length > 0
      ? Math.abs(losses.reduce((sum, e) => sum + (e.pnlPercent ?? 0), 0) / losses.length)
      : 0;

  return {
    total: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
    avgWin,
    avgLoss,
    profitFactor: avgLoss > 0 ? avgWin / avgLoss : 0,
    filteredCount: filtered.length,
  };
}

// Get recent consecutive losses (for pause logic)
export function getConsecutiveLosses(): number {
  const journal = getJournal();
  const traded = journal.filter(
    (e) => !e.filteredOut && e.outcome && e.outcome !== 'PENDING',
  );

  let count = 0;
  for (const entry of traded) {
    if ((entry.pnlPercent ?? 0) <= 0) {
      count++;
    } else {
      break; // stop at first win
    }
  }
  return count;
}
