"""
News Filter - Lọc tin tức quan trọng để tránh giao dịch.
Kiểm tra lịch kinh tế để tránh CPI, FOMC, NFP, v.v.
"""

import requests
from datetime import datetime, timedelta
from typing import List, Tuple
from dataclasses import dataclass

from config import TradingConfig


@dataclass
class NewsEvent:
    """Sự kiện tin tức kinh tế."""
    title: str
    impact: str  # high, medium, low
    currency: str
    timestamp: datetime
    actual: str = ""
    forecast: str = ""
    previous: str = ""


class NewsFilter:
    """
    Lọc tin tức kinh tế quan trọng.
    
    Rules:
    - ❌ KHÔNG trade 30 phút trước/sau tin mạnh (CPI, FOMC, NFP, GDP)
    - ⚠️ Cẩn thận với tin medium impact
    """
    
    def __init__(self, config: TradingConfig):
        self.config = config
        self._cached_events: List[NewsEvent] = []
        self._cache_time: datetime = datetime.min
        self._cache_duration = timedelta(hours=1)
    
    def fetch_economic_calendar(self) -> List[NewsEvent]:
        """
        Lấy lịch kinh tế.
        
        Note: Sử dụng API miễn phí hoặc fallback sang manual check.
        Bạn có thể thay thế bằng API riêng.
        """
        # Cache check
        if (datetime.utcnow() - self._cache_time) < self._cache_duration:
            return self._cached_events
        
        events = []
        
        try:
            # Sử dụng ForexFactory hoặc Investing.com API (placeholder)
            # Trong thực tế, bạn cần integration cụ thể
            
            # Fallback: Kiểm tra các sự kiện đã biết trước
            # Bạn có thể thêm manual events ở đây
            pass
            
        except Exception as e:
            print(f"⚠️ Không thể fetch calendar: {e}")
        
        self._cached_events = events
        self._cache_time = datetime.utcnow()
        
        return events
    
    def is_safe_to_trade(self) -> Tuple[bool, str]:
        """
        Kiểm tra có an toàn để trade không.
        
        Returns:
            Tuple (safe, reason)
        """
        events = self.fetch_economic_calendar()
        now = datetime.utcnow()
        blackout = timedelta(minutes=self.config.news_blackout_minutes)
        
        for event in events:
            if event.impact != "high":
                continue
            
            # Kiểm tra keyword
            is_dangerous = any(
                keyword.lower() in event.title.lower()
                for keyword in self.config.high_impact_events
            )
            
            if not is_dangerous:
                continue
            
            # Kiểm tra thời gian
            time_until = event.timestamp - now
            time_since = now - event.timestamp
            
            if -blackout <= timedelta(seconds=time_until.total_seconds()) <= blackout:
                return False, (
                    f"🚫 Tin tức mạnh: {event.title} "
                    f"({event.currency}) trong {abs(time_until.total_seconds() / 60):.0f} phút"
                )
        
        return True, "✅ Không có tin tức quan trọng"
    
    def get_upcoming_events(self, hours: int = 24) -> List[NewsEvent]:
        """Lấy danh sách tin tức sắp tới."""
        events = self.fetch_economic_calendar()
        now = datetime.utcnow()
        cutoff = now + timedelta(hours=hours)
        
        return [
            e for e in events
            if now <= e.timestamp <= cutoff
        ]
    
    def manual_check_reminder(self) -> str:
        """
        Nhắc nhở check tin tức thủ công.
        Fallback khi API không khả dụng.
        """
        return (
            "📰 NHẮC NHỚ CHECK TIN TỨC:\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "Trước khi trade, kiểm tra:\n"
            "1. ForexFactory: https://www.forexfactory.com/calendar\n"
            "2. Investing.com: https://www.investing.com/economic-calendar/\n"
            "\n"
            "❌ KHÔNG trade nếu có (trong ±30 phút):\n"
            "  - CPI (Consumer Price Index)\n"
            "  - FOMC (Federal Reserve Meeting)\n"
            "  - NFP (Non-Farm Payrolls)\n"
            "  - GDP\n"
            "  - Interest Rate Decision\n"
            "  - Unemployment Claims\n"
            "  - Fed Chair Speech\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        )
