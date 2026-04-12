"""
Candle Pattern Detector.
Nhận dạng Pin Bar, Engulfing, và Break of Structure (BOS).
"""

import pandas as pd
import numpy as np
from typing import List, Optional
from dataclasses import dataclass
from config import CandlePattern, TradingConfig


@dataclass
class PatternResult:
    """Kết quả phát hiện mẫu nến."""
    pattern: str
    index: int
    strength: float  # 0.0 - 1.0
    description: str


def detect_bullish_pinbar(
    df: pd.DataFrame,
    idx: int,
    body_ratio: float = 0.3,
    wick_ratio: float = 2.0
) -> Optional[PatternResult]:
    """
    Phát hiện Pin Bar tăng (Hammer).
    
    Đặc điểm:
    - Body nhỏ (< body_ratio của range)
    - Lower wick dài (>= wick_ratio lần body)
    - Wick dưới chiếm phần lớn range
    
    Args:
        df: DataFrame với các cột indicator
        idx: Index nến cần check
        body_ratio: Tỷ lệ body/range tối đa
        wick_ratio: Tỷ lệ lower wick/body tối thiểu
    
    Returns:
        PatternResult nếu phát hiện, None nếu không
    """
    if idx < 0 or idx >= len(df):
        return None
    
    row = df.iloc[idx]
    body = abs(row["close"] - row["open"])
    candle_range = row["high"] - row["low"]
    
    if candle_range == 0:
        return None
    
    lower_wick = min(row["open"], row["close"]) - row["low"]
    upper_wick = row["high"] - max(row["open"], row["close"])
    
    # Body nhỏ
    if body / candle_range > body_ratio:
        return None
    
    # Lower wick dài
    if body > 0 and lower_wick / body < wick_ratio:
        return None
    
    # Lower wick > upper wick
    if lower_wick <= upper_wick:
        return None
    
    # Lower wick chiếm > 60% range
    if lower_wick / candle_range < 0.6:
        return None
    
    strength = min(lower_wick / candle_range, 1.0)
    
    return PatternResult(
        pattern=CandlePattern.BULLISH_PINBAR,
        index=idx,
        strength=strength,
        description=f"Bullish Pin Bar: body={body:.2f}, lower_wick={lower_wick:.2f}, ratio={lower_wick/candle_range:.2%}"
    )


def detect_bearish_pinbar(
    df: pd.DataFrame,
    idx: int,
    body_ratio: float = 0.3,
    wick_ratio: float = 2.0
) -> Optional[PatternResult]:
    """
    Phát hiện Pin Bar giảm (Shooting Star).
    
    Đặc điểm:
    - Body nhỏ
    - Upper wick dài
    - Nến ở đỉnh trend
    """
    if idx < 0 or idx >= len(df):
        return None
    
    row = df.iloc[idx]
    body = abs(row["close"] - row["open"])
    candle_range = row["high"] - row["low"]
    
    if candle_range == 0:
        return None
    
    lower_wick = min(row["open"], row["close"]) - row["low"]
    upper_wick = row["high"] - max(row["open"], row["close"])
    
    if body / candle_range > body_ratio:
        return None
    
    if body > 0 and upper_wick / body < wick_ratio:
        return None
    
    if upper_wick <= lower_wick:
        return None
    
    if upper_wick / candle_range < 0.6:
        return None
    
    strength = min(upper_wick / candle_range, 1.0)
    
    return PatternResult(
        pattern=CandlePattern.BEARISH_PINBAR,
        index=idx,
        strength=strength,
        description=f"Bearish Pin Bar: body={body:.2f}, upper_wick={upper_wick:.2f}, ratio={upper_wick/candle_range:.2%}"
    )


def detect_bullish_engulfing(
    df: pd.DataFrame,
    idx: int,
    min_body_ratio: float = 0.6
) -> Optional[PatternResult]:
    """
    Phát hiện Engulfing tăng.
    
    Đặc điểm:
    - Nến trước: bearish (đỏ)
    - Nến hiện tại: bullish (xanh)
    - Body nến hiện tại bao trùm body nến trước
    - Body chiếm >= min_body_ratio của range
    
    Args:
        df: DataFrame OHLCV
        idx: Index nến hiện tại
        min_body_ratio: Body tối thiểu / range
    
    Returns:
        PatternResult nếu phát hiện
    """
    if idx < 1 or idx >= len(df):
        return None
    
    prev = df.iloc[idx - 1]
    curr = df.iloc[idx]
    
    # Nến trước phải bearish
    if prev["close"] >= prev["open"]:
        return None
    
    # Nến hiện tại phải bullish
    if curr["close"] <= curr["open"]:
        return None
    
    curr_body = curr["close"] - curr["open"]
    prev_body = prev["open"] - prev["close"]
    curr_range = curr["high"] - curr["low"]
    
    if curr_range == 0:
        return None
    
    # Body hiện tại bao trùm body trước
    if not (curr["open"] <= prev["close"] and curr["close"] >= prev["open"]):
        return None
    
    # Body ratio
    if curr_body / curr_range < min_body_ratio:
        return None
    
    # Tính strength dựa trên engulfing ratio
    strength = min(curr_body / prev_body, 2.0) / 2.0 if prev_body > 0 else 0.5
    
    return PatternResult(
        pattern=CandlePattern.BULLISH_ENGULFING,
        index=idx,
        strength=strength,
        description=f"Bullish Engulfing: curr_body={curr_body:.2f} engulfs prev_body={prev_body:.2f}"
    )


def detect_bearish_engulfing(
    df: pd.DataFrame,
    idx: int,
    min_body_ratio: float = 0.6
) -> Optional[PatternResult]:
    """
    Phát hiện Engulfing giảm.
    
    Đặc điểm:
    - Nến trước: bullish (xanh)
    - Nến hiện tại: bearish (đỏ)
    - Body nến hiện tại bao trùm body nến trước
    """
    if idx < 1 or idx >= len(df):
        return None
    
    prev = df.iloc[idx - 1]
    curr = df.iloc[idx]
    
    # Nến trước phải bullish
    if prev["close"] <= prev["open"]:
        return None
    
    # Nến hiện tại phải bearish
    if curr["close"] >= curr["open"]:
        return None
    
    curr_body = curr["open"] - curr["close"]
    prev_body = prev["close"] - prev["open"]
    curr_range = curr["high"] - curr["low"]
    
    if curr_range == 0:
        return None
    
    # Body hiện tại bao trùm body trước
    if not (curr["open"] >= prev["close"] and curr["close"] <= prev["open"]):
        return None
    
    # Body ratio
    if curr_body / curr_range < min_body_ratio:
        return None
    
    strength = min(curr_body / prev_body, 2.0) / 2.0 if prev_body > 0 else 0.5
    
    return PatternResult(
        pattern=CandlePattern.BEARISH_ENGULFING,
        index=idx,
        strength=strength,
        description=f"Bearish Engulfing: curr_body={curr_body:.2f} engulfs prev_body={prev_body:.2f}"
    )


def detect_bos_bullish(
    df: pd.DataFrame,
    idx: int,
    lookback: int = 10,
    threshold: float = 0.001
) -> Optional[PatternResult]:
    """
    Phát hiện Break of Structure tăng (BOS mini).
    
    Giá phá qua đỉnh nhỏ gần nhất = tín hiệu BUY.
    
    Args:
        df: DataFrame OHLCV
        idx: Index nến hiện tại
        lookback: Số nến quay lại tìm đỉnh
        threshold: Ngưỡng phá (0.1%)
    """
    if idx < lookback or idx >= len(df):
        return None
    
    curr_close = df["close"].iloc[idx]
    
    # Tìm đỉnh cao nhất trong lookback nến gần đây (trừ nến hiện tại)
    recent_highs = df["high"].iloc[idx - lookback:idx]
    recent_high = recent_highs.max()
    
    # Giá đóng cửa phá qua đỉnh
    if curr_close > recent_high * (1 + threshold):
        strength = (curr_close - recent_high) / recent_high
        return PatternResult(
            pattern=CandlePattern.BOS_BULLISH,
            index=idx,
            strength=min(strength * 100, 1.0),
            description=f"BOS Bullish: close={curr_close:.2f} > recent_high={recent_high:.2f}"
        )
    
    return None


def detect_bos_bearish(
    df: pd.DataFrame,
    idx: int,
    lookback: int = 10,
    threshold: float = 0.001
) -> Optional[PatternResult]:
    """
    Phát hiện Break of Structure giảm.
    
    Giá phá qua đáy nhỏ gần nhất = tín hiệu SELL.
    """
    if idx < lookback or idx >= len(df):
        return None
    
    curr_close = df["close"].iloc[idx]
    
    recent_lows = df["low"].iloc[idx - lookback:idx]
    recent_low = recent_lows.min()
    
    if curr_close < recent_low * (1 - threshold):
        strength = (recent_low - curr_close) / recent_low
        return PatternResult(
            pattern=CandlePattern.BOS_BEARISH,
            index=idx,
            strength=min(strength * 100, 1.0),
            description=f"BOS Bearish: close={curr_close:.2f} < recent_low={recent_low:.2f}"
        )
    
    return None


def detect_all_patterns(
    df: pd.DataFrame,
    idx: int,
    config: TradingConfig
) -> List[PatternResult]:
    """
    Phát hiện tất cả mẫu nến tại index cho trước.
    
    Args:
        df: DataFrame OHLCV
        idx: Index nến cần check
        config: Trading configuration
    
    Returns:
        Danh sách PatternResult
    """
    patterns = []
    
    # Pin Bars
    result = detect_bullish_pinbar(df, idx, config.pinbar_body_ratio, config.pinbar_wick_ratio)
    if result:
        patterns.append(result)
    
    result = detect_bearish_pinbar(df, idx, config.pinbar_body_ratio, config.pinbar_wick_ratio)
    if result:
        patterns.append(result)
    
    # Engulfing
    result = detect_bullish_engulfing(df, idx, config.engulfing_min_body_ratio)
    if result:
        patterns.append(result)
    
    result = detect_bearish_engulfing(df, idx, config.engulfing_min_body_ratio)
    if result:
        patterns.append(result)
    
    # BOS
    result = detect_bos_bullish(df, idx, threshold=config.bos_confirmation_pips)
    if result:
        patterns.append(result)
    
    result = detect_bos_bearish(df, idx, threshold=config.bos_confirmation_pips)
    if result:
        patterns.append(result)
    
    return patterns
