export const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';
export const BINANCE_REST_URL = 'https://api.binance.com/api/v3';

// Gemini model cascade — each model has separate free-tier quota
export const GEMINI_MODELS = [
  { name: 'gemini-2.5-flash', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent' },
  { name: 'gemini-2.5-flash-lite', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent' },
  { name: 'gemini-2.0-flash', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent' },
];

// OpenAI model cascade — cheapest first
export const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
export const OPENAI_MODELS = ['gpt-4o-mini', 'gpt-3.5-turbo'];

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
  { label: 'NEAR/USDT', value: 'nearusdt' },
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

// === Analysis config (Upgrade 2) ===
export const TREND_INTERVAL = '15m';
export const TREND_CANDLE_COUNT = 50;
export const ENTRY_INTERVAL = '5m';
export const ENTRY_CANDLE_COUNT = 100;

// === Filter thresholds (Upgrade 3 + 4 + 6) ===
export const SIDEWAYS_THRESHOLD_PCT = 0.8; // below this = sideways
export const MIN_CONFIDENCE = 70; // below = WAIT
export const MIN_RISK_REWARD = 1.5; // below = reject
export const RSI_OVERBOUGHT = 75;
export const RSI_OVERSOLD = 25;
export const MAX_CONSECUTIVE_LOSSES = 3; // pause after this many

// === Journal (Upgrade 1) ===
export const MAX_JOURNAL_ENTRIES = 500;
