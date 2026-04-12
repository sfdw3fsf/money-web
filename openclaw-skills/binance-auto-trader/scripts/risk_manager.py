"""
Risk Manager - Quản lý rủi ro và bảo vệ tài khoản.

Chức năng:
- Position sizing (1-2% risk per trade)
- Daily loss limit
- Consecutive loss tracking
- Max daily trades
- SL validation
"""

import json
import os
from datetime import datetime, date
from dataclasses import dataclass, field, asdict
from typing import List, Optional

from config import TradingConfig, Signal


@dataclass
class TradeRecord:
    """Bản ghi một giao dịch."""
    trade_id: str
    symbol: str
    signal: str
    entry_price: float
    stop_loss: float
    take_profit: float
    position_size: float
    risk_amount: float
    entry_time: str
    exit_time: Optional[str] = None
    exit_price: Optional[float] = None
    pnl: Optional[float] = None
    pnl_percent: Optional[float] = None
    status: str = "OPEN"  # OPEN, CLOSED_TP, CLOSED_SL, CLOSED_MANUAL


@dataclass
class DailyStats:
    """Thống kê giao dịch trong ngày."""
    date: str
    total_trades: int = 0
    wins: int = 0
    losses: int = 0
    total_pnl: float = 0.0
    total_pnl_percent: float = 0.0
    consecutive_losses: int = 0
    max_consecutive_losses: int = 0
    is_locked: bool = False  # Khoá khi vi phạm giới hạn
    lock_reason: str = ""


class RiskManager:
    """
    Quản lý rủi ro toàn diện.
    
    Rules:
    1. Mỗi lệnh chỉ rủi ro 1-2% tài khoản
    2. Tối đa daily loss 5%
    3. Thua liên tiếp 3 lần → dừng
    4. Không gồng lỗ
    5. Không revenge trade
    """
    
    def __init__(self, config: TradingConfig, initial_balance: float):
        self.config = config
        self.initial_balance = initial_balance
        self.current_balance = initial_balance
        self.trades: List[TradeRecord] = []
        self.daily_stats: dict[str, DailyStats] = {}
        self._load_history()
    
    def _get_today_key(self) -> str:
        """Lấy key ngày hôm nay."""
        return date.today().isoformat()
    
    def _get_today_stats(self) -> DailyStats:
        """Lấy hoặc tạo stats ngày hôm nay."""
        today = self._get_today_key()
        if today not in self.daily_stats:
            self.daily_stats[today] = DailyStats(date=today)
        return self.daily_stats[today]
    
    def can_trade(self) -> tuple[bool, str]:
        """
        Kiểm tra có được phép giao dịch không.
        
        Returns:
            Tuple (allowed, reason)
        """
        stats = self._get_today_stats()
        
        # Đã khoá trong ngày
        if stats.is_locked:
            return False, f"🔒 Đã khoá giao dịch: {stats.lock_reason}"
        
        # Max daily trades
        if stats.total_trades >= self.config.max_daily_trades:
            stats.is_locked = True
            stats.lock_reason = f"Đạt giới hạn {self.config.max_daily_trades} lệnh/ngày"
            return False, f"🔒 {stats.lock_reason}"
        
        # Max consecutive losses
        if stats.consecutive_losses >= self.config.max_consecutive_losses:
            stats.is_locked = True
            stats.lock_reason = f"Thua liên tiếp {stats.consecutive_losses} lần → DỪNG"
            return False, f"🔒 {stats.lock_reason}"
        
        # Daily loss limit
        daily_loss_percent = abs(stats.total_pnl / self.initial_balance * 100) if stats.total_pnl < 0 else 0
        if daily_loss_percent >= self.config.max_daily_loss_percent:
            stats.is_locked = True
            stats.lock_reason = f"Daily loss {daily_loss_percent:.1f}% >= {self.config.max_daily_loss_percent}%"
            return False, f"🔒 {stats.lock_reason}"
        
        return True, "✅ Được phép giao dịch"
    
    def calculate_position_size(
        self,
        entry_price: float,
        stop_loss: float
    ) -> tuple[float, float]:
        """
        Tính position size dựa trên rủi ro.
        
        Position Size = Risk Amount / SL Distance
        Risk Amount = Balance * Risk%
        
        Args:
            entry_price: Giá vào lệnh
            stop_loss: Giá stop loss
        
        Returns:
            Tuple (position_size, risk_amount)
        """
        sl_distance = abs(entry_price - stop_loss)
        
        if sl_distance == 0:
            return 0.0, 0.0
        
        risk_amount = self.current_balance * (self.config.risk_percent / 100)
        position_size = risk_amount / sl_distance
        
        return position_size, risk_amount
    
    def validate_sl_distance(
        self,
        entry_price: float,
        stop_loss: float,
        signal_type: str
    ) -> tuple[bool, str]:
        """
        Validate SL có hợp lệ không.
        
        Args:
            entry_price: Giá entry
            stop_loss: Giá SL
            signal_type: BUY hoặc SELL
        
        Returns:
            Tuple (valid, reason)
        """
        sl_distance = abs(entry_price - stop_loss)
        sl_percent = (sl_distance / entry_price) * 100
        
        # SL quá xa (> 5%)
        if sl_percent > 5.0:
            return False, f"❌ SL quá xa ({sl_percent:.1f}%) > 5%"
        
        # SL quá gần (< 0.05%)
        if sl_percent < 0.05:
            return False, f"❌ SL quá gần ({sl_percent:.3f}%) < 0.05%"
        
        # SL sai hướng
        if signal_type == Signal.BUY and stop_loss >= entry_price:
            return False, "❌ SL BUY phải DƯỚI giá entry"
        
        if signal_type == Signal.SELL and stop_loss <= entry_price:
            return False, "❌ SL SELL phải TRÊN giá entry"
        
        # Kiểm tra RR ratio
        risk_amount = self.current_balance * (self.config.risk_percent / 100)
        if risk_amount > self.current_balance * (self.config.max_risk_percent / 100):
            return False, f"❌ Rủi ro vượt quá {self.config.max_risk_percent}%"
        
        return True, f"✅ SL hợp lệ ({sl_percent:.2f}% distance)"
    
    def record_trade_open(
        self,
        symbol: str,
        signal: str,
        entry_price: float,
        stop_loss: float,
        take_profit: float,
        position_size: float,
        risk_amount: float
    ) -> TradeRecord:
        """Ghi nhận lệnh mở."""
        trade = TradeRecord(
            trade_id=f"{symbol}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            symbol=symbol,
            signal=signal,
            entry_price=entry_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            position_size=position_size,
            risk_amount=risk_amount,
            entry_time=datetime.utcnow().isoformat()
        )
        self.trades.append(trade)
        
        stats = self._get_today_stats()
        stats.total_trades += 1
        
        self._save_history()
        return trade
    
    def record_trade_close(
        self,
        trade_id: str,
        exit_price: float,
        status: str = "CLOSED_MANUAL"
    ) -> Optional[TradeRecord]:
        """Ghi nhận lệnh đóng."""
        trade = next((t for t in self.trades if t.trade_id == trade_id), None)
        if not trade:
            return None
        
        trade.exit_time = datetime.utcnow().isoformat()
        trade.exit_price = exit_price
        trade.status = status
        
        # Tính PnL
        if trade.signal == Signal.BUY:
            trade.pnl = (exit_price - trade.entry_price) * trade.position_size
        else:
            trade.pnl = (trade.entry_price - exit_price) * trade.position_size
        
        trade.pnl_percent = (trade.pnl / self.current_balance) * 100
        
        # Cập nhật balance
        self.current_balance += trade.pnl
        
        # Cập nhật daily stats
        stats = self._get_today_stats()
        stats.total_pnl += trade.pnl
        stats.total_pnl_percent = (stats.total_pnl / self.initial_balance) * 100
        
        if trade.pnl >= 0:
            stats.wins += 1
            stats.consecutive_losses = 0
        else:
            stats.losses += 1
            stats.consecutive_losses += 1
            stats.max_consecutive_losses = max(
                stats.max_consecutive_losses,
                stats.consecutive_losses
            )
        
        self._save_history()
        return trade
    
    def get_open_trades(self) -> List[TradeRecord]:
        """Lấy danh sách lệnh đang mở."""
        return [t for t in self.trades if t.status == "OPEN"]
    
    def get_daily_summary(self) -> str:
        """Tạo báo cáo tổng kết ngày."""
        stats = self._get_today_stats()
        
        win_rate = (stats.wins / stats.total_trades * 100) if stats.total_trades > 0 else 0
        
        return (
            f"📊 DAILY SUMMARY - {stats.date}\n"
            f"{'=' * 40}\n"
            f"Total Trades: {stats.total_trades}\n"
            f"Wins: {stats.wins} | Losses: {stats.losses}\n"
            f"Win Rate: {win_rate:.1f}%\n"
            f"PnL: ${stats.total_pnl:.2f} ({stats.total_pnl_percent:.2f}%)\n"
            f"Consecutive Losses: {stats.consecutive_losses}\n"
            f"Balance: ${self.current_balance:.2f}\n"
            f"Status: {'🔒 LOCKED' if stats.is_locked else '✅ ACTIVE'}\n"
            f"{'Lock Reason: ' + stats.lock_reason if stats.is_locked else ''}\n"
        )
    
    def _save_history(self):
        """Lưu lịch sử giao dịch ra file."""
        data = {
            "balance": self.current_balance,
            "initial_balance": self.initial_balance,
            "trades": [asdict(t) for t in self.trades[-100:]],  # Keep last 100
            "daily_stats": {k: asdict(v) for k, v in self.daily_stats.items()},
        }
        
        history_file = os.path.join(
            os.path.dirname(__file__),
            "..",
            "data",
            "trade_history.json"
        )
        os.makedirs(os.path.dirname(history_file), exist_ok=True)
        
        with open(history_file, "w") as f:
            json.dump(data, f, indent=2, default=str)
    
    def _load_history(self):
        """Tải lịch sử giao dịch."""
        history_file = os.path.join(
            os.path.dirname(__file__),
            "..",
            "data",
            "trade_history.json"
        )
        
        if os.path.exists(history_file):
            try:
                with open(history_file, "r") as f:
                    data = json.load(f)
                
                self.current_balance = data.get("balance", self.initial_balance)
                
                for t_data in data.get("trades", []):
                    self.trades.append(TradeRecord(**t_data))
                
                for key, s_data in data.get("daily_stats", {}).items():
                    self.daily_stats[key] = DailyStats(**s_data)
            except (json.JSONDecodeError, KeyError, TypeError):
                pass  # Start fresh if file is corrupted
