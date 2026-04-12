"""
Configuration module for Binance Auto Trader.
All constants, default settings, and environment variable loading.
"""

import os
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class TradingConfig:
    """Main trading configuration."""
    
    # === Binance API ===
    api_key: str = ""
    api_secret: str = ""
    testnet: bool = True  # Default to testnet for safety
    
    # === Trading Parameters ===
    symbol: str = "BTCUSDT"
    entry_timeframe: str = "5m"        # Khung entry
    trend_timeframe: str = "15m"       # Khung xác định trend
    leverage: int = 10
    margin_type: str = "ISOLATED"       # ISOLATED or CROSSED
    
    # === Risk Management ===
    risk_percent: float = 1.0           # % rủi ro mỗi lệnh (1-2%)
    max_risk_percent: float = 2.0       # Giới hạn tối đa
    rr_ratio: float = 2.0              # Risk:Reward tối thiểu (1:2)
    max_daily_loss_percent: float = 5.0 # Lỗ tối đa/ngày
    max_daily_trades: int = 10          # Số lệnh tối đa/ngày
    max_consecutive_losses: int = 3     # Thua liên tiếp → dừng
    partial_tp_ratio: float = 0.5       # Chốt 50% ở RR 1:1
    
    # === Indicators ===
    ema_short: int = 20                 # EMA ngắn hạn
    ema_long: int = 50                  # EMA dài hạn
    rsi_period: int = 14
    rsi_overbought: float = 70.0
    rsi_oversold: float = 30.0
    volume_ma_period: int = 20          # MA của Volume
    
    # === Trend Detection ===
    swing_lookback: int = 5             # Số nến quay lại để tìm swing
    min_swing_distance: int = 3         # Khoảng cách tối thiểu giữa 2 swing
    trend_confirmation_swings: int = 2  # Số swing tối thiểu xác nhận trend
    
    # === Candle Pattern Detection ===
    pinbar_body_ratio: float = 0.3      # Body < 30% range = pin bar
    pinbar_wick_ratio: float = 2.0      # Wick >= 2x body = pin bar
    engulfing_min_body_ratio: float = 0.6  # Body >= 60% range cho engulfing
    
    # === Entry Conditions ===
    ema_touch_threshold: float = 0.002  # Khoảng cách tối đa tới EMA (0.2%)
    support_resistance_lookback: int = 50  # Số nến quay lại tìm S/R
    bos_confirmation_pips: float = 0.001   # Break of Structure threshold
    
    # === Sideway Detection ===
    sideway_atr_threshold: float = 0.5  # ATR < 50% avg → sideway
    sideway_candle_count: int = 8       # Số nến nhỏ liên tiếp → sideway
    
    # === News Filter ===
    news_blackout_minutes: int = 30     # Tránh trade 30 phút trước/sau tin
    high_impact_events: List[str] = field(default_factory=lambda: [
        "CPI", "FOMC", "NFP", "GDP", "Interest Rate", 
        "Unemployment", "PPI", "Retail Sales",
        "Fed Chair", "ECB", "BOJ"
    ])
    
    # === Logging ===
    log_file: str = "trading_log.json"
    log_level: str = "INFO"
    
    # === Mode ===
    mode: str = "paper"  # live, paper, backtest
    
    def __post_init__(self):
        """Load từ environment variables nếu không được truyền trực tiếp."""
        if not self.api_key:
            self.api_key = os.getenv("BINANCE_API_KEY", "")
        if not self.api_secret:
            self.api_secret = os.getenv("BINANCE_API_SECRET", "")
        
        testnet_env = os.getenv("BINANCE_TESTNET", "true")
        if testnet_env.lower() in ("true", "1", "yes"):
            self.testnet = True
        
        # Validate
        if self.risk_percent > self.max_risk_percent:
            raise ValueError(
                f"risk_percent ({self.risk_percent}%) vượt quá "
                f"max_risk_percent ({self.max_risk_percent}%)"
            )
        if self.rr_ratio < 1.0:
            raise ValueError(
                f"rr_ratio ({self.rr_ratio}) phải >= 1.0"
            )


# === Timeframe mapping ===
TIMEFRAME_MINUTES = {
    "1m": 1, "3m": 3, "5m": 5, "15m": 15, "30m": 30,
    "1h": 60, "2h": 120, "4h": 240, "6h": 360,
    "8h": 480, "12h": 720, "1d": 1440,
}

# === Binance Futures Endpoints ===
BINANCE_FUTURES_BASE = "https://fapi.binance.com"
BINANCE_TESTNET_BASE = "https://testnet.binancefuture.com"

# === Signal Types ===
class Signal:
    BUY = "BUY"
    SELL = "SELL"
    NONE = "NONE"

class Trend:
    UP = "UPTREND"
    DOWN = "DOWNTREND"
    SIDEWAYS = "SIDEWAYS"
    UNKNOWN = "UNKNOWN"

class CandlePattern:
    BULLISH_ENGULFING = "BULLISH_ENGULFING"
    BEARISH_ENGULFING = "BEARISH_ENGULFING"
    BULLISH_PINBAR = "BULLISH_PINBAR"
    BEARISH_PINBAR = "BEARISH_PINBAR"
    BOS_BULLISH = "BOS_BULLISH"  # Break of Structure
    BOS_BEARISH = "BOS_BEARISH"
    NONE = "NONE"
