"""
Order Executor - Thực thi lệnh trên Binance Futures.
Hỗ trợ: Market Order, SL/TP, Partial TP, Trailing Stop.
"""

import time
import hmac
import hashlib
import requests
from urllib.parse import urlencode
from typing import Optional, Dict, Any
from datetime import datetime

from config import TradingConfig, Signal, BINANCE_FUTURES_BASE, BINANCE_TESTNET_BASE


class BinanceExecutor:
    """
    Thực thi lệnh Binance Futures.
    
    Quan trọng:
    - Chỉ dùng API key với quyền TRADE (KHÔNG withdraw)
    - Luôn đặt SL/TP ngay khi vào lệnh
    - Support Testnet để test trước
    """
    
    def __init__(self, config: TradingConfig):
        self.config = config
        self.base_url = BINANCE_TESTNET_BASE if config.testnet else BINANCE_FUTURES_BASE
        self.api_key = config.api_key
        self.api_secret = config.api_secret
        
        if not self.api_key or not self.api_secret:
            raise ValueError(
                "❌ Thiếu API Key/Secret. "
                "Set BINANCE_API_KEY và BINANCE_API_SECRET trong environment."
            )
    
    def _sign(self, params: dict) -> dict:
        """Ký request với HMAC SHA256."""
        params["timestamp"] = int(time.time() * 1000)
        query_string = urlencode(params)
        signature = hmac.new(
            self.api_secret.encode("utf-8"),
            query_string.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        params["signature"] = signature
        return params
    
    def _headers(self) -> dict:
        """HTTP headers cho Binance API."""
        return {
            "X-MBX-APIKEY": self.api_key,
            "Content-Type": "application/x-www-form-urlencoded"
        }
    
    def _request(
        self,
        method: str,
        endpoint: str,
        params: dict = None,
        signed: bool = True
    ) -> Dict[str, Any]:
        """Gửi request tới Binance API."""
        url = f"{self.base_url}{endpoint}"
        params = params or {}
        
        if signed:
            params = self._sign(params)
        
        try:
            if method == "GET":
                response = requests.get(url, params=params, headers=self._headers(), timeout=10)
            elif method == "POST":
                response = requests.post(url, data=params, headers=self._headers(), timeout=10)
            elif method == "DELETE":
                response = requests.delete(url, params=params, headers=self._headers(), timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"❌ API Error: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"  Response: {e.response.text}")
            raise
    
    # === Account Info ===
    
    def get_account_balance(self) -> float:
        """Lấy số dư tài khoản."""
        result = self._request("GET", "/fapi/v2/balance")
        for asset in result:
            if asset["asset"] == "USDT":
                return float(asset["balance"])
        return 0.0
    
    def get_position(self, symbol: str = None) -> Optional[dict]:
        """Lấy vị thế hiện tại."""
        symbol = symbol or self.config.symbol
        result = self._request("GET", "/fapi/v2/positionRisk", {"symbol": symbol})
        
        for pos in result:
            if pos["symbol"] == symbol and float(pos["positionAmt"]) != 0:
                return pos
        return None
    
    # === Setup ===
    
    def set_leverage(self, leverage: int = None, symbol: str = None):
        """Đặt đòn bẩy."""
        self._request("POST", "/fapi/v1/leverage", {
            "symbol": symbol or self.config.symbol,
            "leverage": leverage or self.config.leverage
        })
        print(f"✅ Leverage: {leverage or self.config.leverage}x")
    
    def set_margin_type(self, margin_type: str = None, symbol: str = None):
        """Đặt loại margin (ISOLATED/CROSSED)."""
        try:
            self._request("POST", "/fapi/v1/marginType", {
                "symbol": symbol or self.config.symbol,
                "marginType": margin_type or self.config.margin_type
            })
            print(f"✅ Margin: {margin_type or self.config.margin_type}")
        except Exception:
            pass  # Already set to this type
    
    # === Order Execution ===
    
    def open_position(
        self,
        signal: str,
        quantity: float,
        stop_loss: float,
        take_profit: float,
        symbol: str = None,
        partial_tp_price: Optional[float] = None,
        partial_tp_qty: Optional[float] = None
    ) -> dict:
        """
        Mở vị thế với SL/TP.
        
        Args:
            signal: Signal.BUY hoặc Signal.SELL
            quantity: Số lượng (đã tính position size)
            stop_loss: Giá stop loss
            take_profit: Giá take profit
            symbol: Cặp giao dịch
            partial_tp_price: Giá partial TP (RR 1:1)
            partial_tp_qty: Số lượng partial TP
        
        Returns:
            Dict chứa order details
        """
        symbol = symbol or self.config.symbol
        side = "BUY" if signal == Signal.BUY else "SELL"
        close_side = "SELL" if signal == Signal.BUY else "BUY"
        
        results = {}
        
        # 1. Market order để vào lệnh
        print(f"📊 Opening {side} position: {quantity} {symbol}")
        
        entry_order = self._request("POST", "/fapi/v1/order", {
            "symbol": symbol,
            "side": side,
            "type": "MARKET",
            "quantity": self._format_quantity(quantity, symbol),
        })
        results["entry"] = entry_order
        print(f"✅ Entry order placed: {entry_order.get('orderId')}")
        
        # 2. Stop Loss order
        print(f"🛑 Setting SL at {stop_loss}")
        sl_order = self._request("POST", "/fapi/v1/order", {
            "symbol": symbol,
            "side": close_side,
            "type": "STOP_MARKET",
            "stopPrice": self._format_price(stop_loss, symbol),
            "closePosition": "true",
            "workingType": "MARK_PRICE",
        })
        results["stop_loss"] = sl_order
        print(f"✅ SL order placed: {sl_order.get('orderId')}")
        
        # 3. Take Profit order
        print(f"💰 Setting TP at {take_profit}")
        tp_order = self._request("POST", "/fapi/v1/order", {
            "symbol": symbol,
            "side": close_side,
            "type": "TAKE_PROFIT_MARKET",
            "stopPrice": self._format_price(take_profit, symbol),
            "closePosition": "true",
            "workingType": "MARK_PRICE",
        })
        results["take_profit"] = tp_order
        print(f"✅ TP order placed: {tp_order.get('orderId')}")
        
        # 4. Partial TP (optional)
        if partial_tp_price and partial_tp_qty:
            print(f"💰 Setting Partial TP at {partial_tp_price} ({partial_tp_qty})")
            partial_order = self._request("POST", "/fapi/v1/order", {
                "symbol": symbol,
                "side": close_side,
                "type": "TAKE_PROFIT_MARKET",
                "stopPrice": self._format_price(partial_tp_price, symbol),
                "quantity": self._format_quantity(partial_tp_qty, symbol),
                "workingType": "MARK_PRICE",
            })
            results["partial_tp"] = partial_order
            print(f"✅ Partial TP placed: {partial_order.get('orderId')}")
        
        return results
    
    def close_position(self, symbol: str = None) -> Optional[dict]:
        """Đóng vị thế hiện tại."""
        symbol = symbol or self.config.symbol
        position = self.get_position(symbol)
        
        if not position:
            print("ℹ️ Không có vị thế mở")
            return None
        
        amount = float(position["positionAmt"])
        side = "SELL" if amount > 0 else "BUY"
        
        result = self._request("POST", "/fapi/v1/order", {
            "symbol": symbol,
            "side": side,
            "type": "MARKET",
            "quantity": self._format_quantity(abs(amount), symbol),
            "reduceOnly": "true",
        })
        
        print(f"✅ Position closed: {result.get('orderId')}")
        return result
    
    def cancel_all_orders(self, symbol: str = None) -> dict:
        """Huỷ tất cả lệnh pending."""
        symbol = symbol or self.config.symbol
        result = self._request("DELETE", "/fapi/v1/allOpenOrders", {
            "symbol": symbol
        })
        print(f"✅ All orders cancelled for {symbol}")
        return result
    
    # === Market Data ===
    
    def get_klines(
        self,
        symbol: str = None,
        interval: str = None,
        limit: int = 200
    ) -> list:
        """
        Lấy dữ liệu nến (klines).
        
        Returns:
            List of [timestamp, open, high, low, close, volume, ...]
        """
        result = self._request("GET", "/fapi/v1/klines", {
            "symbol": symbol or self.config.symbol,
            "interval": interval or self.config.entry_timeframe,
            "limit": limit
        }, signed=False)
        
        return result
    
    def get_current_price(self, symbol: str = None) -> float:
        """Lấy giá hiện tại."""
        result = self._request("GET", "/fapi/v1/ticker/price", {
            "symbol": symbol or self.config.symbol
        }, signed=False)
        return float(result["price"])
    
    # === Helpers ===
    
    def _format_quantity(self, quantity: float, symbol: str) -> str:
        """Format quantity theo precision của symbol."""
        # Binance yêu cầu precision cụ thể cho từng symbol
        # Default: 3 decimal places cho BTC
        exchange_info = self._get_exchange_info(symbol)
        step_size = exchange_info.get("step_size", 0.001)
        
        precision = len(str(step_size).rstrip('0').split('.')[-1]) if '.' in str(step_size) else 0
        return f"{quantity:.{precision}f}"
    
    def _format_price(self, price: float, symbol: str) -> str:
        """Format price theo precision của symbol."""
        exchange_info = self._get_exchange_info(symbol)
        tick_size = exchange_info.get("tick_size", 0.01)
        
        precision = len(str(tick_size).rstrip('0').split('.')[-1]) if '.' in str(tick_size) else 0
        return f"{price:.{precision}f}"
    
    _exchange_info_cache: dict = {}
    
    def _get_exchange_info(self, symbol: str) -> dict:
        """Lấy thông tin exchange cho symbol (cached)."""
        if symbol in self._exchange_info_cache:
            return self._exchange_info_cache[symbol]
        
        try:
            result = self._request("GET", "/fapi/v1/exchangeInfo", signed=False)
            for sym_info in result.get("symbols", []):
                if sym_info["symbol"] == symbol:
                    info = {}
                    for f in sym_info.get("filters", []):
                        if f["filterType"] == "LOT_SIZE":
                            info["step_size"] = float(f["stepSize"])
                            info["min_qty"] = float(f["minQty"])
                        elif f["filterType"] == "PRICE_FILTER":
                            info["tick_size"] = float(f["tickSize"])
                    
                    self._exchange_info_cache[symbol] = info
                    return info
        except Exception:
            pass
        
        return {"step_size": 0.001, "tick_size": 0.01, "min_qty": 0.001}
