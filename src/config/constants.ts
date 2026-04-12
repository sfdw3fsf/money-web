export const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';
export const BINANCE_REST_URL = 'https://api.binance.com/api/v3';

export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export const TELEGRAM_API_URL = 'https://api.telegram.org';

export const DEFAULT_PAIR = 'solusdt';
export const DEFAULT_INTERVAL = '5m';
export const DEFAULT_CANDLE_COUNT = 100;

export const AVAILABLE_PAIRS = [
  { label: 'SOL/USDT', value: 'solusdt' },
  { label: 'BTC/USDT', value: 'btcusdt' },
  { label: 'ETH/USDT', value: 'ethusdt' },
  { label: 'BNB/USDT', value: 'bnbusdt' },
  { label: 'XRP/USDT', value: 'xrpusdt' },
  { label: 'DOGE/USDT', value: 'dogeusdt' },
  { label: 'ADA/USDT', value: 'adausdt' },
  { label: 'AVAX/USDT', value: 'avaxusdt' },
  { label: 'DOT/USDT', value: 'dotusdt' },
  { label: 'LINK/USDT', value: 'linkusdt' },
];

export const AVAILABLE_INTERVALS = [
  { label: '1m', value: '1m' },
  { label: '3m', value: '3m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
];

export const STORAGE_KEYS = {
  SIGNALS: 'trading_signals',
  CONFIG: 'trading_config',
} as const;
