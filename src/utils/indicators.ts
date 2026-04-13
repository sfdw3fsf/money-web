import { EMA, RSI, SMA, ATR } from 'technicalindicators';
import type { Candle } from '../types/trading';
import { SIDEWAYS_THRESHOLD_PCT } from '../config/constants';

export interface IndicatorResult {
  // 5m indicators
  ema20_5m: number;
  ema50_5m: number;
  rsi14: number;
  trend5m: 'bullish' | 'bearish' | 'neutral';

  // 15m indicators
  ema20_15m: number;
  ema50_15m: number;
  trend15m: 'bullish' | 'bearish' | 'neutral';

  // Derived
  timeframeAligned: boolean;
  isSideways: boolean;
  sidewaysRange: number; // percentage
  volumeTrend: 'above_average' | 'below_average';

  // Volatility
  atr14: number; // Average True Range (14 periods, 5m)

  // Key levels (last 50 candles)
  recentHigh: number;
  recentLow: number;
  support: number[];
  resistance: number[];
}

export function calculateIndicators(
  candles5m: Candle[],
  candles15m: Candle[],
): IndicatorResult | null {
  // Need minimum data
  if (candles5m.length < 50 || candles15m.length < 20) return null;

  const closes5m = candles5m.map((c) => c.close);
  const closes15m = candles15m.map((c) => c.close);
  const volumes5m = candles5m.map((c) => c.volume);

  // === EMAs ===
  const ema20_5m_arr = EMA.calculate({ period: 20, values: closes5m });
  const ema50_5m_arr = EMA.calculate({ period: 50, values: closes5m });
  const ema20_15m_arr = EMA.calculate({ period: 20, values: closes15m });
  const ema50_15m_arr = EMA.calculate({ period: 50, values: closes15m });

  if (
    !ema20_5m_arr.length ||
    !ema50_5m_arr.length ||
    !ema20_15m_arr.length ||
    !ema50_15m_arr.length
  )
    return null;

  const ema20_5m = ema20_5m_arr[ema20_5m_arr.length - 1];
  const ema50_5m = ema50_5m_arr[ema50_5m_arr.length - 1];
  const ema20_15m = ema20_15m_arr[ema20_15m_arr.length - 1];
  const ema50_15m = ema50_15m_arr[ema50_15m_arr.length - 1];

  // === RSI ===
  const rsi_arr = RSI.calculate({ period: 14, values: closes5m });
  const rsi14 = rsi_arr.length > 0 ? rsi_arr[rsi_arr.length - 1] : 50;

  // === Volume trend ===
  const volSma = SMA.calculate({ period: 20, values: volumes5m });
  const lastVol = volumes5m[volumes5m.length - 1];
  const avgVol = volSma.length > 0 ? volSma[volSma.length - 1] : lastVol;
  const volumeTrend: 'above_average' | 'below_average' =
    lastVol > avgVol ? 'above_average' : 'below_average';

  // === Trend detection ===
  const lastPrice5m = closes5m[closes5m.length - 1];
  const lastPrice15m = closes15m[closes15m.length - 1];

  const trend5m: 'bullish' | 'bearish' | 'neutral' =
    ema20_5m > ema50_5m && lastPrice5m > ema20_5m
      ? 'bullish'
      : ema20_5m < ema50_5m && lastPrice5m < ema20_5m
        ? 'bearish'
        : 'neutral';

  const trend15m: 'bullish' | 'bearish' | 'neutral' =
    ema20_15m > ema50_15m && lastPrice15m > ema20_15m
      ? 'bullish'
      : ema20_15m < ema50_15m && lastPrice15m < ema20_15m
        ? 'bearish'
        : 'neutral';

  // === Sideways detection ===
  const recent20 = closes5m.slice(-20);
  const high20 = Math.max(...recent20);
  const low20 = Math.min(...recent20);
  const sidewaysRange = ((high20 - low20) / low20) * 100;
  const isSideways = sidewaysRange < SIDEWAYS_THRESHOLD_PCT;

  // === Timeframe alignment ===
  const timeframeAligned =
    trend15m !== 'neutral' && trend5m !== 'neutral' && trend15m === trend5m;

  // === ATR (14) ===
  const atr_arr = ATR.calculate({
    period: 14,
    high: candles5m.map((c) => c.high),
    low: candles5m.map((c) => c.low),
    close: closes5m,
  });
  const atr14 = atr_arr.length > 0 ? atr_arr[atr_arr.length - 1] : 0;

  // === Key levels ===
  const recent50 = closes5m.slice(-50);
  const recentHigh = Math.max(...recent50);
  const recentLow = Math.min(...recent50);

  const support = [recentLow, low20];
  const resistance = [recentHigh, high20];

  return {
    ema20_5m,
    ema50_5m,
    rsi14,
    trend5m,
    ema20_15m,
    ema50_15m,
    trend15m,
    timeframeAligned,
    isSideways,
    sidewaysRange,
    volumeTrend,
    recentHigh,
    recentLow,
    atr14,
    support: [...new Set(support)].sort((a, b) => a - b),
    resistance: [...new Set(resistance)].sort((a, b) => a - b),
  };
}
