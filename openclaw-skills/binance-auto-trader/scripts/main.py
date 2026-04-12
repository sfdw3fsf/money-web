"""
🤖 Binance Auto Trader - Main Entry Point
==========================================

Hệ thống giao dịch tự động trên Binance Futures.
Chiến lược: EMA + Price Action + Trend Following.

Usage:
    python main.py --symbol BTCUSDT --timeframe 5m --risk-percent 1.5
    python main.py --testnet --mode paper
    python main.py --help

⚠️ CẢNH BÁO: Giao dịch có rủi ro cao. Luôn dùng Testnet trước!
"""

import argparse
import signal as os_signal
import sys
import time
import pandas as pd
from datetime import datetime
from dataclasses import asdict

from config import TradingConfig, Signal, Trend, TIMEFRAME_MINUTES
from indicators import add_all_indicators
from trend_analyzer import TrendAnalyzer
from signal_detector import SignalDetector, TradeSignal
from risk_manager import RiskManager
from order_executor import BinanceExecutor
from news_filter import NewsFilter
from logger import TradingLogger


class BinanceAutoTrader:
    """
    Main Trading Bot.
    
    Workflow mỗi chu kỳ:
    1. Lấy data nến (entry + trend timeframe)
    2. Xác định trend trên M15/M30
    3. Check tin tức → safe?
    4. Check risk → cho phép trade?
    5. Phân tích tín hiệu entry
    6. Chạy checklist
    7. Thực thi lệnh (nếu PASS tất cả)
    8. Monitor vị thế
    9. Lặp lại
    """
    
    def __init__(self, config: TradingConfig):
        self.config = config
        self.logger = TradingLogger(level=config.log_level)
        self.running = False
        
        # Initialize components
        if config.mode == "live":
            self.executor = BinanceExecutor(config)
        else:
            self.executor = None  # Paper/backtest mode
        
        self.signal_detector = SignalDetector(config)
        self.risk_manager = None  # Initialized after getting balance
        self.news_filter = NewsFilter(config)
    
    def start(self):
        """Khởi chạy bot."""
        self.running = True
        
        # Setup graceful shutdown
        os_signal.signal(os_signal.SIGINT, self._handle_shutdown)
        os_signal.signal(os_signal.SIGTERM, self._handle_shutdown)
        
        # Log startup
        self.logger.log_startup(asdict(self.config))
        
        # Get account balance
        balance = self._get_balance()
        self.risk_manager = RiskManager(self.config, balance)
        
        self.logger.logger.info(f"💰 Account Balance: ${balance:.2f}")
        
        # Setup leverage & margin
        if self.executor:
            try:
                self.executor.set_leverage()
                self.executor.set_margin_type()
            except Exception as e:
                self.logger.log_error(f"Setup failed: {e}")
        
        # Main loop
        self.logger.logger.info("🚀 Bot started! Waiting for signals...")
        self._main_loop()
    
    def _main_loop(self):
        """Loop chính của bot."""
        # Tính interval giữa các lần check
        entry_minutes = TIMEFRAME_MINUTES.get(self.config.entry_timeframe, 5)
        check_interval = entry_minutes * 60  # seconds
        
        while self.running:
            try:
                self._execute_cycle()
                
                # Chờ đến nến tiếp theo
                self.logger.logger.info(
                    f"💤 Waiting {entry_minutes} minutes for next candle..."
                )
                
                # Sleep nhưng vẫn responsive
                for _ in range(check_interval):
                    if not self.running:
                        break
                    time.sleep(1)
                
            except Exception as e:
                self.logger.log_error(f"Cycle error: {e}", {"type": type(e).__name__})
                time.sleep(30)  # Chờ 30s rồi thử lại
    
    def _execute_cycle(self):
        """Thực hiện một chu kỳ phân tích + giao dịch."""
        self.logger.logger.info(f"\n{'━' * 50}")
        self.logger.logger.info(f"🔄 Analysis cycle - {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        
        # === BƯỚC 1: Kiểm tra Risk ===
        can_trade, risk_reason = self.risk_manager.can_trade()
        self.logger.log_risk_check(can_trade, risk_reason)
        if not can_trade:
            return
        
        # === BƯỚC 2: Kiểm tra Tin tức ===
        news_safe, news_reason = self.news_filter.is_safe_to_trade()
        self.logger.log_news_check(news_safe, news_reason)
        if not news_safe:
            return
        
        # === BƯỚC 3: Kiểm tra vị thế đang mở ===
        open_trades = self.risk_manager.get_open_trades()
        if open_trades:
            self.logger.logger.info(f"📌 {len(open_trades)} vị thế đang mở, skip analysis")
            self._monitor_positions()
            return
        
        # === BƯỚC 4: Lấy data nến ===
        df_entry = self._get_candle_data(self.config.entry_timeframe)
        df_trend = self._get_candle_data(self.config.trend_timeframe)
        
        if df_entry is None or df_trend is None:
            self.logger.log_error("Không thể lấy data nến")
            return
        
        # === BƯỚC 5: Phân tích tín hiệu ===
        balance = self.risk_manager.current_balance
        signal = self.signal_detector.analyze(df_entry, df_trend, balance)
        
        # Log report
        report = self.signal_detector.generate_report(signal)
        self.logger.logger.info(f"\n{report}")
        self.logger.log_signal(asdict(signal))
        
        # === BƯỚC 6: Thực thi lệnh ===
        if signal.is_valid():
            self._execute_trade(signal)
        else:
            self.logger.logger.info("⏳ Không có tín hiệu hợp lệ, tiếp tục chờ...")
    
    def _execute_trade(self, signal: TradeSignal):
        """Thực thi giao dịch."""
        self.logger.logger.info(f"🎯 EXECUTING {signal.signal} on {signal.symbol}")
        
        # Double-check RR
        if signal.rr_ratio < self.config.rr_ratio:
            self.logger.log_warning(f"RR {signal.rr_ratio} < minimum {self.config.rr_ratio}")
            return
        
        # Validate SL
        sl_valid, sl_reason = self.risk_manager.validate_sl_distance(
            signal.entry_price, signal.stop_loss, signal.signal
        )
        if not sl_valid:
            self.logger.log_warning(sl_reason)
            return
        
        # Tính partial TP
        sl_distance = abs(signal.entry_price - signal.stop_loss)
        partial_tp_price = None
        partial_tp_qty = None
        
        if self.config.partial_tp_ratio > 0:
            if signal.signal == Signal.BUY:
                partial_tp_price = signal.entry_price + sl_distance  # RR 1:1
            else:
                partial_tp_price = signal.entry_price - sl_distance
            partial_tp_qty = signal.position_size * self.config.partial_tp_ratio
        
        if self.config.mode == "live" and self.executor:
            try:
                result = self.executor.open_position(
                    signal=signal.signal,
                    quantity=signal.position_size,
                    stop_loss=signal.stop_loss,
                    take_profit=signal.take_profit_1,
                    partial_tp_price=partial_tp_price,
                    partial_tp_qty=partial_tp_qty
                )
                
                self.logger.log_order_placed("ENTRY", result.get("entry", {}))
                self.logger.log_order_placed("SL", result.get("stop_loss", {}))
                self.logger.log_order_placed("TP", result.get("take_profit", {}))
                
            except Exception as e:
                self.logger.log_error(f"Order execution failed: {e}")
                return
        else:
            self.logger.logger.info("📝 [PAPER] Trade logged but not executed")
        
        # Record trade
        self.risk_manager.record_trade_open(
            symbol=signal.symbol,
            signal=signal.signal,
            entry_price=signal.entry_price,
            stop_loss=signal.stop_loss,
            take_profit=signal.take_profit_1,
            position_size=signal.position_size,
            risk_amount=signal.risk_amount
        )
        
        self.logger.logger.info("✅ Trade opened successfully!")
    
    def _monitor_positions(self):
        """Monitor vị thế đang mở."""
        if not self.executor:
            return
        
        open_trades = self.risk_manager.get_open_trades()
        for trade in open_trades:
            position = self.executor.get_position(trade.symbol)
            if position:
                unrealized_pnl = float(position.get("unRealizedProfit", 0))
                self.logger.logger.info(
                    f"  📊 {trade.symbol}: PnL=${unrealized_pnl:.2f}"
                )
            else:
                # Position closed (SL/TP hit)
                current_price = self.executor.get_current_price(trade.symbol)
                self.risk_manager.record_trade_close(
                    trade.trade_id, current_price, "CLOSED_AUTO"
                )
                self.logger.log_trade_closed(
                    trade.trade_id,
                    trade.pnl or 0,
                    trade.pnl_percent or 0,
                    "Auto-closed (SL/TP hit)"
                )
    
    def _get_candle_data(self, timeframe: str) -> pd.DataFrame:
        """Lấy data nến từ Binance."""
        try:
            if self.executor:
                raw = self.executor.get_klines(
                    interval=timeframe,
                    limit=200
                )
            else:
                # Paper mode: dùng public API
                import requests
                url = f"https://fapi.binance.com/fapi/v1/klines"
                params = {
                    "symbol": self.config.symbol,
                    "interval": timeframe,
                    "limit": 200
                }
                response = requests.get(url, params=params, timeout=10)
                raw = response.json()
            
            # Convert to DataFrame
            df = pd.DataFrame(raw, columns=[
                "timestamp", "open", "high", "low", "close", "volume",
                "close_time", "quote_volume", "trades",
                "taker_buy_base", "taker_buy_quote", "ignore"
            ])
            
            df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
            df.set_index("timestamp", inplace=True)
            
            for col in ["open", "high", "low", "close", "volume"]:
                df[col] = df[col].astype(float)
            
            return df
            
        except Exception as e:
            self.logger.log_error(f"Failed to get klines ({timeframe}): {e}")
            return None
    
    def _get_balance(self) -> float:
        """Lấy số dư tài khoản."""
        if self.executor:
            try:
                return self.executor.get_account_balance()
            except Exception:
                pass
        return 1000.0  # Default for paper trading
    
    def _handle_shutdown(self, signum, frame):
        """Graceful shutdown."""
        self.logger.logger.info("\n🛑 Shutting down...")
        self.running = False
        
        # Log daily summary
        if self.risk_manager:
            summary = self.risk_manager.get_daily_summary()
            self.logger.log_daily_summary(summary)
        
        self.logger.logger.info("👋 Bot stopped. Goodbye!")
        sys.exit(0)


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="🤖 Binance Auto Trader - EMA + Price Action Strategy",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --symbol BTCUSDT --testnet                  # Test trên testnet
  %(prog)s --symbol ETHUSDT --risk-percent 1.5          # ETH với 1.5% risk
  %(prog)s --mode paper --symbol BTCUSDT                # Paper trading
  
⚠️  CẢNH BÁO: Luôn bắt đầu với --testnet hoặc --mode paper!
        """
    )
    
    parser.add_argument("--symbol", default="BTCUSDT", help="Trading pair (default: BTCUSDT)")
    parser.add_argument("--timeframe", default="5m", help="Entry timeframe (default: 5m)")
    parser.add_argument("--trend-timeframe", default="15m", help="Trend timeframe (default: 15m)")
    parser.add_argument("--risk-percent", type=float, default=1.0, help="Risk per trade %% (default: 1.0)")
    parser.add_argument("--rr-ratio", type=float, default=2.0, help="Min Risk:Reward ratio (default: 2.0)")
    parser.add_argument("--leverage", type=int, default=10, help="Leverage (default: 10)")
    parser.add_argument("--testnet", action="store_true", help="Use Binance Testnet")
    parser.add_argument("--mode", choices=["live", "paper", "backtest"], default="paper", help="Trading mode")
    parser.add_argument("--max-daily-loss", type=float, default=5.0, help="Max daily loss %% (default: 5.0)")
    parser.add_argument("--log-level", default="INFO", choices=["DEBUG", "INFO", "WARNING"], help="Log level")
    
    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_args()
    
    # Create config
    config = TradingConfig(
        symbol=args.symbol,
        entry_timeframe=args.timeframe,
        trend_timeframe=args.trend_timeframe,
        risk_percent=args.risk_percent,
        rr_ratio=args.rr_ratio,
        leverage=args.leverage,
        testnet=args.testnet or (args.mode != "live"),
        mode=args.mode,
        max_daily_loss_percent=args.max_daily_loss,
        log_level=args.log_level,
    )
    
    # Safety check
    if config.mode == "live" and not config.testnet:
        print("=" * 60)
        print("⚠️  CẢNH BÁO: Bạn đang chạy ở chế độ LIVE trên MAINNET!")
        print("  💸 Tiền THẬT sẽ được sử dụng.")
        print("  ❌ Tổn thất có thể xảy ra.")
        print("=" * 60)
        confirm = input("Nhập 'CONFIRM' để tiếp tục: ")
        if confirm != "CONFIRM":
            print("❌ Đã hủy.")
            sys.exit(0)
    
    # Start bot
    bot = BinanceAutoTrader(config)
    bot.start()


if __name__ == "__main__":
    main()
