export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
}

export interface Signal {
  id: string;
  timestamp: number;
  pair: string;
  interval: string;
  direction: 'BUY' | 'SELL' | 'WAIT';
  entry: number;
  takeProfit: number;
  stopLoss: number;
  confidence: number;
  riskReward: string;
  reasoning: string;
  trend: string;
  support: number[];
  resistance: number[];
  status: 'active' | 'followed' | 'tp_hit' | 'sl_hit' | 'expired' | 'manual_close' | 'skipped';
  followed: boolean;
  followedAt?: number;
  pnl?: number;
  closedAt?: number;
  closePrice?: number;
}

export interface TradingConfig {
  pair: string;
  interval: string;
  candleCount: number;
  autoTelegram: boolean;
  telegramChatId: string;
  telegramBotToken: string;
  aiApiKey: string;
}

export interface PnLStats {
  totalTrades: number;
  followedTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnlPercent: number;
  avgRiskReward: number;
  bestTrade: number;
  worstTrade: number;
  activeFollowed: number;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';
