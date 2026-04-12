"""
Technical Indicators Calculator.
EMA, RSI, Volume analysis for trading signals.
"""

import pandas as pd
import numpy as np
from typing import Tuple


def calculate_ema(df: pd.DataFrame, period: int, column: str = "close") -> pd.Series:
    """
    Tính Exponential Moving Average.
    
    Args:
        df: DataFrame với cột giá
        period: Chu kỳ EMA
        column: Tên cột giá (mặc định 'close')
    
    Returns:
        Series EMA values
    """
    return df[column].ewm(span=period, adjust=False).mean()


def calculate_rsi(df: pd.DataFrame, period: int = 14, column: str = "close") -> pd.Series:
    """
    Tính Relative Strength Index.
    
    Args:
        df: DataFrame với cột giá
        period: Chu kỳ RSI (mặc định 14)
        column: Tên cột giá
    
    Returns:
        Series RSI values (0-100)
    """
    delta = df[column].diff()
    
    gain = delta.where(delta > 0, 0.0)
    loss = (-delta).where(delta < 0, 0.0)
    
    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    return rsi


def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """
    Tính Average True Range.
    
    Args:
        df: DataFrame với cột high, low, close
        period: Chu kỳ ATR
    
    Returns:
        Series ATR values
    """
    high = df["high"]
    low = df["low"]
    close = df["close"].shift(1)
    
    tr1 = high - low
    tr2 = (high - close).abs()
    tr3 = (low - close).abs()
    
    true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = true_range.ewm(span=period, adjust=False).mean()
    
    return atr


def calculate_volume_ma(df: pd.DataFrame, period: int = 20) -> pd.Series:
    """
    Tính Volume Moving Average.
    
    Args:
        df: DataFrame với cột volume
        period: Chu kỳ MA
    
    Returns:
        Series Volume MA values
    """
    return df["volume"].rolling(window=period).mean()


def is_volume_above_average(df: pd.DataFrame, period: int = 20, threshold: float = 1.0) -> pd.Series:
    """
    Kiểm tra Volume có trên trung bình không.
    
    Args:
        df: DataFrame với cột volume
        period: Chu kỳ MA
        threshold: Ngưỡng (1.0 = bằng MA, 1.5 = 150% MA)
    
    Returns:
        Series boolean
    """
    vol_ma = calculate_volume_ma(df, period)
    return df["volume"] > (vol_ma * threshold)


def add_all_indicators(
    df: pd.DataFrame,
    ema_short: int = 20,
    ema_long: int = 50,
    rsi_period: int = 14,
    atr_period: int = 14,
    volume_ma_period: int = 20
) -> pd.DataFrame:
    """
    Thêm tất cả indicators vào DataFrame.
    
    Args:
        df: DataFrame OHLCV
        ema_short: Chu kỳ EMA ngắn
        ema_long: Chu kỳ EMA dài
        rsi_period: Chu kỳ RSI
        atr_period: Chu kỳ ATR
        volume_ma_period: Chu kỳ Volume MA
    
    Returns:
        DataFrame với các cột indicator mới
    """
    result = df.copy()
    
    # EMA
    result[f"ema_{ema_short}"] = calculate_ema(result, ema_short)
    result[f"ema_{ema_long}"] = calculate_ema(result, ema_long)
    
    # RSI
    result["rsi"] = calculate_rsi(result, rsi_period)
    
    # ATR
    result["atr"] = calculate_atr(result, atr_period)
    
    # Volume MA
    result["volume_ma"] = calculate_volume_ma(result, volume_ma_period)
    result["volume_above_avg"] = is_volume_above_average(result, volume_ma_period)
    
    # Candle components
    result["body"] = (result["close"] - result["open"]).abs()
    result["range"] = result["high"] - result["low"]
    result["upper_wick"] = result["high"] - result[["open", "close"]].max(axis=1)
    result["lower_wick"] = result[["open", "close"]].min(axis=1) - result["low"]
    result["is_bullish"] = result["close"] > result["open"]
    result["is_bearish"] = result["close"] < result["open"]
    
    # Body ratio
    result["body_ratio"] = np.where(
        result["range"] > 0,
        result["body"] / result["range"],
        0
    )
    
    return result


def get_support_resistance_levels(
    df: pd.DataFrame,
    lookback: int = 50,
    num_levels: int = 5
) -> Tuple[list, list]:
    """
    Tìm các vùng hỗ trợ và kháng cự.
    
    Sử dụng swing highs/lows để xác định các mức S/R quan trọng.
    
    Args:
        df: DataFrame OHLCV
        lookback: Số nến quay lại
        num_levels: Số mức S/R tối đa mỗi loại
    
    Returns:
        Tuple (support_levels, resistance_levels)
    """
    recent = df.tail(lookback)
    current_price = recent["close"].iloc[-1]
    
    supports = []
    resistances = []
    
    # Tìm swing lows (support)
    for i in range(2, len(recent) - 2):
        if (recent["low"].iloc[i] < recent["low"].iloc[i - 1] and
            recent["low"].iloc[i] < recent["low"].iloc[i - 2] and
            recent["low"].iloc[i] < recent["low"].iloc[i + 1] and
            recent["low"].iloc[i] < recent["low"].iloc[i + 2]):
            
            level = recent["low"].iloc[i]
            if level < current_price:
                supports.append(level)
            else:
                resistances.append(level)
    
    # Tìm swing highs (resistance)
    for i in range(2, len(recent) - 2):
        if (recent["high"].iloc[i] > recent["high"].iloc[i - 1] and
            recent["high"].iloc[i] > recent["high"].iloc[i - 2] and
            recent["high"].iloc[i] > recent["high"].iloc[i + 1] and
            recent["high"].iloc[i] > recent["high"].iloc[i + 2]):
            
            level = recent["high"].iloc[i]
            if level > current_price:
                resistances.append(level)
            else:
                supports.append(level)
    
    # Sắp xếp: support gần nhất trước, resistance gần nhất trước
    supports = sorted(supports, reverse=True)[:num_levels]
    resistances = sorted(resistances)[:num_levels]
    
    return supports, resistances
