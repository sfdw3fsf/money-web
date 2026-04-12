"""
Trading Logger - Ghi log chi tiết mọi hoạt động giao dịch.
"""

import json
import os
import logging
from datetime import datetime
from typing import Any, Dict


class TradingLogger:
    """
    Logger cho hệ thống giao dịch.
    
    Ghi ra:
    - Console (realtime)
    - File JSON (structured)
    - File text (human readable)
    """
    
    def __init__(self, log_dir: str = None, level: str = "INFO"):
        self.log_dir = log_dir or os.path.join(
            os.path.dirname(__file__), "..", "data", "logs"
        )
        os.makedirs(self.log_dir, exist_ok=True)
        
        # Setup Python logger
        self.logger = logging.getLogger("BinanceTrader")
        self.logger.setLevel(getattr(logging, level))
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_format = logging.Formatter(
            "%(asctime)s | %(levelname)s | %(message)s",
            datefmt="%H:%M:%S"
        )
        console_handler.setFormatter(console_format)
        self.logger.addHandler(console_handler)
        
        # File handler (text)
        today = datetime.utcnow().strftime("%Y-%m-%d")
        file_handler = logging.FileHandler(
            os.path.join(self.log_dir, f"trading_{today}.log"),
            encoding="utf-8"
        )
        file_handler.setLevel(logging.DEBUG)
        file_format = logging.Formatter(
            "%(asctime)s | %(levelname)s | %(message)s"
        )
        file_handler.setFormatter(file_format)
        self.logger.addHandler(file_handler)
        
        # JSON log file
        self.json_log_file = os.path.join(
            self.log_dir, f"trading_{today}.json"
        )
        self._json_entries = []
    
    def _log_json(self, event_type: str, data: Dict[str, Any]):
        """Ghi log JSON."""
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "event": event_type,
            **data
        }
        self._json_entries.append(entry)
        
        # Append to file
        with open(self.json_log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, default=str) + "\n")
    
    # === Event Loggers ===
    
    def log_startup(self, config: dict):
        """Log khởi động bot."""
        self.logger.info("=" * 60)
        self.logger.info("🤖 BINANCE AUTO TRADER STARTED")
        self.logger.info(f"  Symbol: {config.get('symbol')}")
        self.logger.info(f"  Entry TF: {config.get('entry_timeframe')}")
        self.logger.info(f"  Trend TF: {config.get('trend_timeframe')}")
        self.logger.info(f"  Risk: {config.get('risk_percent')}%")
        self.logger.info(f"  RR Ratio: 1:{config.get('rr_ratio')}")
        self.logger.info(f"  Mode: {config.get('mode')}")
        self.logger.info(f"  Testnet: {config.get('testnet')}")
        self.logger.info("=" * 60)
        
        self._log_json("STARTUP", config)
    
    def log_trend_analysis(self, trend: str, confidence: float, details: dict):
        """Log phân tích trend."""
        self.logger.info(f"📈 Trend: {trend} ({confidence:.1%}) | Sideway: {details.get('is_sideway')}")
        self._log_json("TREND_ANALYSIS", {
            "trend": trend, "confidence": confidence, **details
        })
    
    def log_signal(self, signal_data: dict):
        """Log tín hiệu giao dịch."""
        sig = signal_data.get("signal", "NONE")
        self.logger.info(f"🔔 Signal: {sig}")
        
        if sig != "NONE":
            self.logger.info(f"  Entry: {signal_data.get('entry_price')}")
            self.logger.info(f"  SL: {signal_data.get('stop_loss')}")
            self.logger.info(f"  TP: {signal_data.get('take_profit_1')}")
            self.logger.info(f"  RR: 1:{signal_data.get('rr_ratio')}")
        
        checklist = signal_data.get("checklist", {})
        for key, value in checklist.items():
            status = "✅" if value else "❌"
            self.logger.debug(f"  {status} {key}")
        
        self._log_json("SIGNAL", signal_data)
    
    def log_order_placed(self, order_type: str, details: dict):
        """Log lệnh đã đặt."""
        self.logger.info(f"📋 Order {order_type}: {details.get('orderId', 'N/A')}")
        self._log_json("ORDER_PLACED", {"type": order_type, **details})
    
    def log_order_filled(self, order_id: str, price: float, quantity: float):
        """Log lệnh đã khớp."""
        self.logger.info(f"✅ Order filled: {order_id} @ {price} qty={quantity}")
        self._log_json("ORDER_FILLED", {
            "order_id": order_id, "price": price, "quantity": quantity
        })
    
    def log_trade_closed(self, trade_id: str, pnl: float, pnl_percent: float, reason: str):
        """Log lệnh đã đóng."""
        emoji = "💚" if pnl >= 0 else "🔴"
        self.logger.info(
            f"{emoji} Trade closed: {trade_id} | "
            f"PnL: ${pnl:.2f} ({pnl_percent:.2f}%) | {reason}"
        )
        self._log_json("TRADE_CLOSED", {
            "trade_id": trade_id, "pnl": pnl,
            "pnl_percent": pnl_percent, "reason": reason
        })
    
    def log_risk_check(self, allowed: bool, reason: str):
        """Log kiểm tra rủi ro."""
        self.logger.info(f"🛡️ Risk check: {reason}")
        self._log_json("RISK_CHECK", {"allowed": allowed, "reason": reason})
    
    def log_news_check(self, safe: bool, reason: str):
        """Log kiểm tra tin tức."""
        self.logger.info(f"📰 News: {reason}")
        self._log_json("NEWS_CHECK", {"safe": safe, "reason": reason})
    
    def log_error(self, error: str, details: dict = None):
        """Log lỗi."""
        self.logger.error(f"❌ Error: {error}")
        self._log_json("ERROR", {"error": error, **(details or {})})
    
    def log_warning(self, warning: str):
        """Log cảnh báo."""
        self.logger.warning(f"⚠️ {warning}")
        self._log_json("WARNING", {"warning": warning})
    
    def log_daily_summary(self, summary: str):
        """Log tổng kết ngày."""
        self.logger.info(summary)
        self._log_json("DAILY_SUMMARY", {"summary": summary})
