"""
Signal Detector - Tổng hợp tín hiệu BUY/SELL.
Kết hợp: Trend + EMA + Candle Pattern + Volume + RSI → Tín hiệu entry.
"""

import pandas as pd
import numpy as np
from typing import Optional, List
from dataclasses import dataclass, field
from datetime import datetime

from config import Signal, Trend, CandlePattern, TradingConfig
from trend_analyzer import TrendAnalyzer, is_price_at_ema
from candle_patterns import detect_all_patterns, PatternResult
from indicators import add_all_indicators, get_support_resistance_levels


@dataclass
class TradeSignal:
    """Tín hiệu giao dịch."""
    signal: str                     # Signal.BUY / Signal.SELL / Signal.NONE
    symbol: str
    entry_price: float
    stop_loss: float
    take_profit_1: float            # TP chính (RR ratio)
    take_profit_2: Optional[float] = None  # TP tại S/R
    trend: str = Trend.UNKNOWN
    trend_confidence: float = 0.0
    patterns: List[PatternResult] = field(default_factory=list)
    rr_ratio: float = 0.0
    risk_amount: float = 0.0
    position_size: float = 0.0
    reasons: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    timestamp: str = ""
    checklist: dict = field(default_factory=dict)
    
    def is_valid(self) -> bool:
        """Kiểm tra tín hiệu có hợp lệ không."""
        return (
            self.signal != Signal.NONE and
            self.rr_ratio >= 1.0 and
            all(self.checklist.values())
        )


class SignalDetector:
    """
    Main Signal Detection Engine.
    
    Workflow:
    1. Phân tích trend trên timeframe cao (M15/M30)
    2. Tìm setup entry trên timeframe thấp (M5)
    3. Kiểm tra candle patterns
    4. Xác nhận với volume + RSI
    5. Chạy checklist → quyết định entry
    """
    
    def __init__(self, config: TradingConfig):
        self.config = config
        self.trend_analyzer = TrendAnalyzer(config)
    
    def analyze(
        self,
        df_entry: pd.DataFrame,
        df_trend: pd.DataFrame,
        account_balance: float
    ) -> TradeSignal:
        """
        Phân tích toàn diện và tạo tín hiệu giao dịch.
        
        Args:
            df_entry: DataFrame OHLCV trên timeframe entry (M5)
            df_trend: DataFrame OHLCV trên timeframe trend (M15)
            account_balance: Số dư tài khoản hiện tại
        
        Returns:
            TradeSignal
        """
        signal = TradeSignal(
            signal=Signal.NONE,
            symbol=self.config.symbol,
            entry_price=0.0,
            stop_loss=0.0,
            take_profit_1=0.0,
            timestamp=datetime.utcnow().isoformat()
        )
        
        # === BƯỚC 1: Thêm indicators ===
        df_entry = add_all_indicators(
            df_entry,
            ema_short=self.config.ema_short,
            ema_long=self.config.ema_long
        )
        df_trend = add_all_indicators(
            df_trend,
            ema_short=self.config.ema_short,
            ema_long=self.config.ema_long
        )
        
        # === BƯỚC 2: Xác định TREND (BẮT BUỘC) ===
        trend, trend_confidence, trend_details = self.trend_analyzer.analyze(df_trend)
        signal.trend = trend
        signal.trend_confidence = trend_confidence
        
        # ❌ Không trade nếu không rõ trend
        if trend in (Trend.SIDEWAYS, Trend.UNKNOWN):
            signal.reasons.append(f"❌ Trend không rõ ràng: {trend}")
            signal.checklist["trend_clear"] = False
            return signal
        
        signal.checklist["trend_clear"] = True
        signal.reasons.append(f"✅ Trend: {trend} (confidence: {trend_confidence:.1%})")
        
        # ❌ Kiểm tra sideway
        if trend_details.get("is_sideway", False):
            signal.reasons.append("❌ Thị trường đang sideway chặt")
            signal.checklist["not_sideway"] = False
            return signal
        
        signal.checklist["not_sideway"] = True
        
        # === BƯỚC 3: Kiểm tra vùng entry ===
        current_price = df_entry["close"].iloc[-1]
        signal.entry_price = current_price
        
        ema_short_key = f"ema_{self.config.ema_short}"
        ema_long_key = f"ema_{self.config.ema_long}"
        
        ema_short_val = df_entry[ema_short_key].iloc[-1]
        ema_long_val = df_entry[ema_long_key].iloc[-1]
        
        # Tìm S/R levels
        supports, resistances = get_support_resistance_levels(
            df_entry,
            lookback=self.config.support_resistance_lookback
        )
        
        at_good_zone = False
        zone_reason = ""
        
        if trend == Trend.UP:
            # Giá hồi về EMA20?
            if is_price_at_ema(current_price, ema_short_val, self.config.ema_touch_threshold):
                at_good_zone = True
                zone_reason = f"Giá chạm EMA{self.config.ema_short}: {ema_short_val:.2f}"
            # Giá hồi về EMA50?
            elif is_price_at_ema(current_price, ema_long_val, self.config.ema_touch_threshold):
                at_good_zone = True
                zone_reason = f"Giá chạm EMA{self.config.ema_long}: {ema_long_val:.2f}"
            # Giá tại vùng hỗ trợ?
            elif supports:
                nearest_support = supports[0]
                if abs(current_price - nearest_support) / nearest_support <= self.config.ema_touch_threshold * 2:
                    at_good_zone = True
                    zone_reason = f"Giá tại vùng hỗ trợ: {nearest_support:.2f}"
        
        elif trend == Trend.DOWN:
            # Giá hồi lên EMA20?
            if is_price_at_ema(current_price, ema_short_val, self.config.ema_touch_threshold):
                at_good_zone = True
                zone_reason = f"Giá chạm EMA{self.config.ema_short}: {ema_short_val:.2f}"
            # Giá hồi lên EMA50?
            elif is_price_at_ema(current_price, ema_long_val, self.config.ema_touch_threshold):
                at_good_zone = True
                zone_reason = f"Giá chạm EMA{self.config.ema_long}: {ema_long_val:.2f}"
            # Giá tại vùng kháng cự?
            elif resistances:
                nearest_resistance = resistances[0]
                if abs(current_price - nearest_resistance) / nearest_resistance <= self.config.ema_touch_threshold * 2:
                    at_good_zone = True
                    zone_reason = f"Giá tại vùng kháng cự: {nearest_resistance:.2f}"
        
        signal.checklist["at_good_zone"] = at_good_zone
        if at_good_zone:
            signal.reasons.append(f"✅ {zone_reason}")
        else:
            signal.reasons.append("❌ Giá chưa hồi về vùng đẹp (EMA/S/R)")
            return signal
        
        # === BƯỚC 4: Kiểm tra candle patterns ===
        last_idx = len(df_entry) - 1
        patterns = detect_all_patterns(df_entry, last_idx, self.config)
        signal.patterns = patterns
        
        has_confirmation = False
        
        if trend == Trend.UP:
            bullish_patterns = [
                p for p in patterns
                if p.pattern in (
                    CandlePattern.BULLISH_ENGULFING,
                    CandlePattern.BULLISH_PINBAR,
                    CandlePattern.BOS_BULLISH
                )
            ]
            if bullish_patterns:
                has_confirmation = True
                for p in bullish_patterns:
                    signal.reasons.append(f"✅ Pattern: {p.description}")
        
        elif trend == Trend.DOWN:
            bearish_patterns = [
                p for p in patterns
                if p.pattern in (
                    CandlePattern.BEARISH_ENGULFING,
                    CandlePattern.BEARISH_PINBAR,
                    CandlePattern.BOS_BEARISH
                )
            ]
            if bearish_patterns:
                has_confirmation = True
                for p in bearish_patterns:
                    signal.reasons.append(f"✅ Pattern: {p.description}")
        
        signal.checklist["candle_confirmation"] = has_confirmation
        if not has_confirmation:
            signal.reasons.append("❌ Chưa có nến xác nhận (engulfing/pinbar/BOS)")
            return signal
        
        # === BƯỚC 5: Xác định SL ===
        if trend == Trend.UP:
            # SL dưới đáy gần nhất
            if trend_details.get("nearest_swing_low"):
                sl_price = trend_details["nearest_swing_low"]
            elif supports:
                sl_price = supports[0] * 0.998  # Chừa buffer
            else:
                # Fallback: dùng ATR
                atr = df_entry["atr"].iloc[-1] if "atr" in df_entry.columns else 0
                sl_price = current_price - (atr * 2)
            
            signal.stop_loss = sl_price
            signal.signal = Signal.BUY
        
        elif trend == Trend.DOWN:
            # SL trên đỉnh gần nhất
            if trend_details.get("nearest_swing_high"):
                sl_price = trend_details["nearest_swing_high"]
            elif resistances:
                sl_price = resistances[0] * 1.002
            else:
                atr = df_entry["atr"].iloc[-1] if "atr" in df_entry.columns else 0
                sl_price = current_price + (atr * 2)
            
            signal.stop_loss = sl_price
            signal.signal = Signal.SELL
        
        sl_distance = abs(current_price - signal.stop_loss)
        signal.checklist["sl_defined"] = signal.stop_loss > 0 and sl_distance > 0
        
        if not signal.checklist["sl_defined"]:
            signal.reasons.append("❌ Không xác định được SL hợp lệ")
            signal.signal = Signal.NONE
            return signal
        
        signal.reasons.append(f"✅ SL: {signal.stop_loss:.2f} (distance: {sl_distance:.2f})")
        
        # === BƯỚC 6: Tính TP và RR ===
        if signal.signal == Signal.BUY:
            signal.take_profit_1 = current_price + (sl_distance * self.config.rr_ratio)
            if resistances:
                signal.take_profit_2 = resistances[0]
        elif signal.signal == Signal.SELL:
            signal.take_profit_1 = current_price - (sl_distance * self.config.rr_ratio)
            if supports:
                signal.take_profit_2 = supports[0]
        
        signal.rr_ratio = self.config.rr_ratio
        signal.checklist["rr_acceptable"] = signal.rr_ratio >= self.config.rr_ratio
        
        if signal.checklist["rr_acceptable"]:
            signal.reasons.append(f"✅ RR: 1:{signal.rr_ratio:.1f}")
        else:
            signal.reasons.append(f"❌ RR 1:{signal.rr_ratio:.1f} < minimum 1:{self.config.rr_ratio}")
            signal.signal = Signal.NONE
            return signal
        
        # === BƯỚC 7: RSI check (optional warning) ===
        if "rsi" in df_entry.columns:
            rsi_val = df_entry["rsi"].iloc[-1]
            if signal.signal == Signal.BUY and rsi_val > self.config.rsi_overbought:
                signal.warnings.append(f"⚠️ RSI quá mua ({rsi_val:.1f})")
            elif signal.signal == Signal.SELL and rsi_val < self.config.rsi_oversold:
                signal.warnings.append(f"⚠️ RSI quá bán ({rsi_val:.1f})")
        
        # === BƯỚC 8: Volume check ===
        if "volume_above_avg" in df_entry.columns:
            vol_ok = df_entry["volume_above_avg"].iloc[-1]
            if not vol_ok:
                signal.warnings.append("⚠️ Volume dưới trung bình")
        
        # === BƯỚC 9: Position Sizing ===
        risk_amount = account_balance * (self.config.risk_percent / 100)
        if sl_distance > 0:
            signal.position_size = risk_amount / sl_distance
        signal.risk_amount = risk_amount
        
        signal.reasons.append(
            f"💰 Risk: ${risk_amount:.2f} ({self.config.risk_percent}%) | "
            f"Size: {signal.position_size:.4f} | "
            f"TP1: {signal.take_profit_1:.2f}"
        )
        
        return signal
    
    def generate_report(self, signal: TradeSignal) -> str:
        """
        Tạo báo cáo chi tiết cho tín hiệu.
        
        Args:
            signal: TradeSignal
        
        Returns:
            String báo cáo
        """
        lines = [
            "=" * 60,
            f"📊 TRADING SIGNAL REPORT - {signal.symbol}",
            f"⏰ {signal.timestamp}",
            "=" * 60,
            "",
            f"📈 Signal: {signal.signal}",
            f"🔄 Trend: {signal.trend} ({signal.trend_confidence:.1%})",
            "",
            "--- ENTRY ---",
            f"  Entry Price: {signal.entry_price:.2f}",
            f"  Stop Loss:   {signal.stop_loss:.2f}",
            f"  Take Profit: {signal.take_profit_1:.2f}",
        ]
        
        if signal.take_profit_2:
            lines.append(f"  TP2 (S/R):   {signal.take_profit_2:.2f}")
        
        lines.extend([
            f"  RR Ratio:    1:{signal.rr_ratio:.1f}",
            f"  Position:    {signal.position_size:.4f}",
            f"  Risk Amount: ${signal.risk_amount:.2f}",
            "",
            "--- CHECKLIST ---",
        ])
        
        for key, value in signal.checklist.items():
            status = "✅" if value else "❌"
            lines.append(f"  {status} {key}")
        
        lines.extend(["", "--- REASONS ---"])
        for reason in signal.reasons:
            lines.append(f"  {reason}")
        
        if signal.warnings:
            lines.extend(["", "--- WARNINGS ---"])
            for warning in signal.warnings:
                lines.append(f"  {warning}")
        
        if signal.patterns:
            lines.extend(["", "--- PATTERNS ---"])
            for pattern in signal.patterns:
                lines.append(f"  🔍 {pattern.description} (strength: {pattern.strength:.2f})")
        
        lines.extend([
            "",
            "--- VERDICT ---",
            f"  {'✅ VALID - Sẵn sàng vào lệnh!' if signal.is_valid() else '❌ INVALID - KHÔNG vào lệnh!'}",
            "=" * 60,
        ])
        
        return "\n".join(lines)
