"""
Trend Analyzer - Xác định xu hướng trên M15/M30.
Sử dụng Higher Highs / Higher Lows / Lower Highs / Lower Lows.

Rule:
- Uptrend: HH + HL → chỉ BUY
- Downtrend: LL + LH → chỉ SELL
- Sideways / Unknown → KHÔNG TRADE
"""

import pandas as pd
import numpy as np
from typing import List, Tuple, Optional
from dataclasses import dataclass
from config import Trend, TradingConfig


@dataclass
class SwingPoint:
    """Đại diện cho một điểm swing (đỉnh/đáy)."""
    index: int
    price: float
    is_high: bool  # True = swing high, False = swing low
    timestamp: pd.Timestamp = None


def find_swing_points(
    df: pd.DataFrame,
    lookback: int = 5,
    min_distance: int = 3
) -> List[SwingPoint]:
    """
    Tìm các điểm Swing High và Swing Low.
    
    Swing High: Nến có high cao hơn `lookback` nến trước và sau
    Swing Low: Nến có low thấp hơn `lookback` nến trước và sau
    
    Args:
        df: DataFrame OHLCV
        lookback: Số nến mỗi bên để so sánh
        min_distance: Khoảng cách tối thiểu giữa 2 swing liên tiếp
    
    Returns:
        Danh sách SwingPoint
    """
    swings = []
    high = df["high"].values
    low = df["low"].values
    
    for i in range(lookback, len(df) - lookback):
        # Check Swing High
        is_swing_high = True
        for j in range(1, lookback + 1):
            if high[i] <= high[i - j] or high[i] <= high[i + j]:
                is_swing_high = False
                break
        
        if is_swing_high:
            # Kiểm tra khoảng cách tới swing trước
            if not swings or (i - swings[-1].index) >= min_distance:
                swings.append(SwingPoint(
                    index=i,
                    price=high[i],
                    is_high=True,
                    timestamp=df.index[i] if isinstance(df.index, pd.DatetimeIndex) else None
                ))
        
        # Check Swing Low
        is_swing_low = True
        for j in range(1, lookback + 1):
            if low[i] >= low[i - j] or low[i] >= low[i + j]:
                is_swing_low = False
                break
        
        if is_swing_low:
            if not swings or (i - swings[-1].index) >= min_distance:
                swings.append(SwingPoint(
                    index=i,
                    price=low[i],
                    is_high=False,
                    timestamp=df.index[i] if isinstance(df.index, pd.DatetimeIndex) else None
                ))
    
    return swings


def determine_trend(
    swings: List[SwingPoint],
    min_confirmation: int = 2
) -> Tuple[str, float]:
    """
    Xác định xu hướng dựa trên swing points.
    
    Uptrend: Ít nhất `min_confirmation` cặp HH + HL liên tiếp
    Downtrend: Ít nhất `min_confirmation` cặp LL + LH liên tiếp
    
    Args:
        swings: Danh sách SwingPoint đã sắp xếp theo thời gian
        min_confirmation: Số cặp swing tối thiểu để xác nhận trend
    
    Returns:
        Tuple (trend_type, confidence)
        - trend_type: Trend.UP, Trend.DOWN, Trend.SIDEWAYS, Trend.UNKNOWN
        - confidence: 0.0 - 1.0
    """
    if len(swings) < 4:
        return Trend.UNKNOWN, 0.0
    
    # Tách swing highs và swing lows
    swing_highs = [s for s in swings if s.is_high]
    swing_lows = [s for s in swings if not s.is_high]
    
    if len(swing_highs) < 2 or len(swing_lows) < 2:
        return Trend.UNKNOWN, 0.0
    
    # Đếm Higher Highs (HH) và Higher Lows (HL)
    hh_count = 0
    for i in range(1, len(swing_highs)):
        if swing_highs[i].price > swing_highs[i - 1].price:
            hh_count += 1
    
    hl_count = 0
    for i in range(1, len(swing_lows)):
        if swing_lows[i].price > swing_lows[i - 1].price:
            hl_count += 1
    
    # Đếm Lower Lows (LL) và Lower Highs (LH)
    ll_count = 0
    for i in range(1, len(swing_lows)):
        if swing_lows[i].price < swing_lows[i - 1].price:
            ll_count += 1
    
    lh_count = 0
    for i in range(1, len(swing_highs)):
        if swing_highs[i].price < swing_highs[i - 1].price:
            lh_count += 1
    
    total_high_pairs = len(swing_highs) - 1
    total_low_pairs = len(swing_lows) - 1
    
    # Tính confidence
    up_confidence = 0.0
    if total_high_pairs > 0 and total_low_pairs > 0:
        up_confidence = (hh_count / total_high_pairs + hl_count / total_low_pairs) / 2
    
    down_confidence = 0.0
    if total_high_pairs > 0 and total_low_pairs > 0:
        down_confidence = (ll_count / total_low_pairs + lh_count / total_high_pairs) / 2
    
    # Xác định trend
    if hh_count >= min_confirmation and hl_count >= min_confirmation:
        return Trend.UP, up_confidence
    elif ll_count >= min_confirmation and lh_count >= min_confirmation:
        return Trend.DOWN, down_confidence
    elif abs(up_confidence - down_confidence) < 0.2:
        return Trend.SIDEWAYS, 1.0 - max(up_confidence, down_confidence)
    else:
        return Trend.UNKNOWN, 0.0


def get_recent_swing_high(swings: List[SwingPoint], count: int = 1) -> List[SwingPoint]:
    """Lấy swing high gần nhất."""
    highs = [s for s in swings if s.is_high]
    return highs[-count:] if len(highs) >= count else highs


def get_recent_swing_low(swings: List[SwingPoint], count: int = 1) -> List[SwingPoint]:
    """Lấy swing low gần nhất."""
    lows = [s for s in swings if not s.is_high]
    return lows[-count:] if len(lows) >= count else lows


def is_price_at_ema(
    current_price: float,
    ema_value: float,
    threshold: float = 0.002
) -> bool:
    """
    Kiểm tra giá có chạm/gần EMA không.
    
    Args:
        current_price: Giá hiện tại
        ema_value: Giá trị EMA
        threshold: Ngưỡng khoảng cách (mặc định 0.2%)
    
    Returns:
        True nếu giá đang gần EMA
    """
    distance = abs(current_price - ema_value) / ema_value
    return distance <= threshold


def is_sideway(
    df: pd.DataFrame,
    atr_threshold: float = 0.5,
    candle_count: int = 8
) -> bool:
    """
    Kiểm tra thị trường có đang sideway chặt không.
    
    Sideway = nến nhỏ liên tiếp, ATR thấp bất thường.
    
    Args:
        df: DataFrame OHLCV với ATR
        atr_threshold: Ngưỡng ATR (50% trung bình)
        candle_count: Số nến gần nhất để check
    
    Returns:
        True nếu đang sideway chặt
    """
    if "atr" not in df.columns or len(df) < candle_count * 2:
        return False
    
    recent_atr = df["atr"].iloc[-candle_count:].mean()
    avg_atr = df["atr"].iloc[-candle_count * 4:-candle_count].mean()
    
    if avg_atr == 0:
        return False
    
    # ATR gần đây thấp hơn nhiều so với trung bình
    if recent_atr / avg_atr < atr_threshold:
        return True
    
    # Kiểm tra nến nhỏ liên tiếp
    recent_ranges = df["range"].iloc[-candle_count:] if "range" in df.columns else (
        df["high"].iloc[-candle_count:] - df["low"].iloc[-candle_count:]
    )
    avg_range = (df["high"] - df["low"]).iloc[-candle_count * 4:-candle_count].mean()
    
    small_candles = (recent_ranges < avg_range * 0.4).sum()
    if small_candles >= candle_count * 0.75:  # 75% nến nhỏ
        return True
    
    return False


class TrendAnalyzer:
    """
    Main class xác định xu hướng thị trường.
    
    Usage:
        analyzer = TrendAnalyzer(config)
        trend, confidence = analyzer.analyze(df_m15)
    """
    
    def __init__(self, config: TradingConfig):
        self.config = config
    
    def analyze(self, df: pd.DataFrame) -> Tuple[str, float, dict]:
        """
        Phân tích xu hướng toàn diện.
        
        Args:
            df: DataFrame OHLCV trên timeframe trend (M15/M30)
        
        Returns:
            Tuple (trend, confidence, details)
            - trend: Trend type string
            - confidence: 0.0 - 1.0
            - details: Dict chứa thông tin chi tiết
        """
        # Tìm swing points
        swings = find_swing_points(
            df,
            lookback=self.config.swing_lookback,
            min_distance=self.config.min_swing_distance
        )
        
        # Xác định trend
        trend, confidence = determine_trend(
            swings,
            min_confirmation=self.config.trend_confirmation_swings
        )
        
        # Check sideway
        sideway = is_sideway(
            df,
            atr_threshold=self.config.sideway_atr_threshold,
            candle_count=self.config.sideway_candle_count
        )
        
        if sideway:
            trend = Trend.SIDEWAYS
            confidence = 0.0
        
        # EMA confirmation
        current_price = df["close"].iloc[-1]
        ema_short_key = f"ema_{self.config.ema_short}"
        ema_long_key = f"ema_{self.config.ema_long}"
        
        ema_confirms_up = False
        ema_confirms_down = False
        
        if ema_short_key in df.columns and ema_long_key in df.columns:
            ema_short_val = df[ema_short_key].iloc[-1]
            ema_long_val = df[ema_long_key].iloc[-1]
            
            ema_confirms_up = (
                current_price > ema_short_val > ema_long_val
            )
            ema_confirms_down = (
                current_price < ema_short_val < ema_long_val
            )
            
            # Boost confidence nếu EMA xác nhận
            if trend == Trend.UP and ema_confirms_up:
                confidence = min(confidence + 0.15, 1.0)
            elif trend == Trend.DOWN and ema_confirms_down:
                confidence = min(confidence + 0.15, 1.0)
            # Reduce confidence nếu EMA mâu thuẫn
            elif trend == Trend.UP and ema_confirms_down:
                confidence = max(confidence - 0.3, 0.0)
            elif trend == Trend.DOWN and ema_confirms_up:
                confidence = max(confidence - 0.3, 0.0)
        
        # Recent swings info
        recent_highs = get_recent_swing_high(swings, 3)
        recent_lows = get_recent_swing_low(swings, 3)
        
        details = {
            "trend": trend,
            "confidence": round(confidence, 3),
            "swing_count": len(swings),
            "swing_highs": [(s.index, s.price) for s in recent_highs],
            "swing_lows": [(s.index, s.price) for s in recent_lows],
            "is_sideway": sideway,
            "ema_confirms_up": ema_confirms_up,
            "ema_confirms_down": ema_confirms_down,
            "nearest_swing_low": recent_lows[-1].price if recent_lows else None,
            "nearest_swing_high": recent_highs[-1].price if recent_highs else None,
        }
        
        return trend, confidence, details
