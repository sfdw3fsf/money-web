import type { IndicatorResult } from './indicators';
import { getConsecutiveLosses } from './signalJournal';
import {
  RSI_OVERBOUGHT,
  RSI_OVERSOLD,
  MAX_CONSECUTIVE_LOSSES,
} from '../config/constants';

export interface FilterResult {
  shouldAnalyze: boolean;
  reason?: string;
  indicators: IndicatorResult | null;
}

export function preFilter(indicators: IndicatorResult | null): FilterResult {
  if (!indicators) {
    return {
      shouldAnalyze: false,
      reason: 'insufficient_data',
      indicators: null,
    };
  }

  // FILTER 1: Sideways market — don't trade ranges
  if (indicators.isSideways) {
    return {
      shouldAnalyze: false,
      reason: `sideways (range: ${indicators.sidewaysRange.toFixed(2)}%)`,
      indicators,
    };
  }

  // FILTER 2: Timeframe misalignment — 5m must agree with 15m
  if (!indicators.timeframeAligned) {
    return {
      shouldAnalyze: false,
      reason: `timeframe conflict (15m: ${indicators.trend15m}, 5m: ${indicators.trend5m})`,
      indicators,
    };
  }

  // FILTER 3: RSI extreme — don't buy overbought, don't sell oversold
  if (indicators.trend15m === 'bullish' && indicators.rsi14 > RSI_OVERBOUGHT) {
    return {
      shouldAnalyze: false,
      reason: `RSI overbought (${indicators.rsi14.toFixed(1)}) — no BUY`,
      indicators,
    };
  }
  if (indicators.trend15m === 'bearish' && indicators.rsi14 < RSI_OVERSOLD) {
    return {
      shouldAnalyze: false,
      reason: `RSI oversold (${indicators.rsi14.toFixed(1)}) — no SELL`,
      indicators,
    };
  }

  // FILTER 4: Consecutive loss pause
  const consecutiveLosses = getConsecutiveLosses();
  if (consecutiveLosses >= MAX_CONSECUTIVE_LOSSES) {
    return {
      shouldAnalyze: false,
      reason: `paused: ${consecutiveLosses} consecutive losses`,
      indicators,
    };
  }

  // ALL FILTERS PASSED — proceed to Gemini
  return { shouldAnalyze: true, indicators };
}
