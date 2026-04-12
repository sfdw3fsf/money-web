---
name: binance-auto-trader
description: >
  Tự động giao dịch Binance Futures dựa trên chiến lược EMA + Price Action.
  Xác định xu hướng trên M15/M30, tìm setup BUY/SELL dựa trên EMA20/50,
  mẫu nến (engulfing, pin bar), quản lý rủi ro 1-2% mỗi lệnh với RR >= 1:2.
  Skill này kích hoạt khi người dùng yêu cầu giao dịch tự động trên Binance.
---

# 🤖 Binance Auto Trader - OpenClaw Skill

## Tổng Quan

Skill này cho phép OpenClaw tự động giao dịch trên Binance Futures bằng chiến lược
kết hợp **Trend Following + Price Action + EMA**. Mọi quyết định giao dịch đều
tuân thủ checklist nghiêm ngặt trước khi vào lệnh.

## ⚙️ Yêu Cầu

### API Keys (Binance)
- Cần Binance API Key và Secret Key
- **CHỈ** cấp quyền **Trade** — **KHÔNG** cấp quyền Withdraw
- Lưu trong biến môi trường:
  - `BINANCE_API_KEY`
  - `BINANCE_API_SECRET`
  - `BINANCE_TESTNET` (set "true" để dùng testnet trước)

### Dependencies
Chạy lệnh sau để cài đặt:
```bash
pip install python-binance pandas numpy ta-lib requests websocket-client
```

Nếu `ta-lib` gặp lỗi, có thể dùng thay thế:
```bash
pip install pandas-ta
```

## 🚀 Cách Sử Dụng

### 1. Khởi chạy Bot
```bash
python scripts/main.py --symbol BTCUSDT --timeframe 5m --trend-timeframe 15m --risk-percent 1.5
```

### 2. Tham số
| Tham số | Mô tả | Mặc định |
|---------|--------|----------|
| `--symbol` | Cặp giao dịch | BTCUSDT |
| `--timeframe` | Khung thời gian entry | 5m |
| `--trend-timeframe` | Khung xác định trend | 15m |
| `--risk-percent` | % rủi ro mỗi lệnh | 1.0 |
| `--rr-ratio` | Tỷ lệ Risk:Reward tối thiểu | 2.0 |
| `--leverage` | Đòn bẩy | 10 |
| `--testnet` | Dùng testnet | false |
| `--max-daily-loss` | Lỗ tối đa/ngày (%) | 5.0 |

### 3. Mode
- **Live**: Giao dịch thật (cần xác nhận)
- **Paper**: Giao dịch ảo để test
- **Backtest**: Chạy trên dữ liệu lịch sử

## 📋 Quy Trình Giao Dịch

### Bước 1: Xác Định Xu Hướng (BẮT BUỘC)
- Mở khung M15 hoặc M30
- **Uptrend**: Đỉnh cao hơn (HH) + Đáy cao hơn (HL) → CHỈ BUY
- **Downtrend**: Đáy thấp hơn (LL) + Đỉnh thấp hơn (LH) → CHỈ SELL
- **❌ KHÔNG trade ngược trend**

### Bước 2: Xác Định Vùng Vào Lệnh
**Setup BUY:**
1. Giá đang uptrend trên M15
2. Chờ giá hồi về EMA20 hoặc EMA50, hoặc vùng hỗ trợ gần nhất
3. Xuất hiện: Pin bar tăng / Engulfing tăng / Phá đỉnh nhỏ (BOS mini)
4. → Vào BUY khi nến xác nhận đóng

**Setup SELL:**
1. Giá đang downtrend trên M15
2. Giá hồi lên EMA20/50 hoặc kháng cự
3. Xuất hiện: Engulfing giảm / Break cấu trúc xuống
4. → Vào SELL khi nến đóng

### Bước 3: Stop Loss
- **BUY** → SL dưới đáy gần nhất
- **SELL** → SL trên đỉnh gần nhất
- Rủi ro mỗi lệnh: **1–2% tài khoản**

### Bước 4: Take Profit
- TP = RR 1:2 hoặc 1:3
- Hoặc chốt tại vùng kháng cự/hỗ trợ tiếp theo
- Partial TP: Chốt 50% ở RR 1:1, giữ 50% chạy trend

### Bước 5: Checklist (TẤT CẢ phải PASS)
- [ ] Trend M15 rõ ràng?
- [ ] Giá hồi về vùng đẹp (EMA/Support/Resistance)?
- [ ] Có nến xác nhận?
- [ ] SL đã xác định?
- [ ] RR ≥ 1:2?
- **→ Thiếu 1 cái = KHÔNG TRADE**

## 🚫 Luật Cấm
- ❌ Không trade khi có tin mạnh (CPI, FOMC, NFP)
- ❌ Không trade khi sideway chặt (nến nhỏ liên tục)
- ❌ Không vào lệnh nếu không rõ trend hoặc SL quá xa
- ❌ Không gồng lỗ — cut loss ngay khi chạm SL
- ❌ Không revenge trade — tối đa 3 lệnh thua/ngày thì dừng
- ❌ Tối đa daily loss 5% → dừng giao dịch trong ngày

## 📊 Chỉ Báo Sử Dụng
- **EMA 20** (short-term trend)
- **EMA 50** (medium-term trend)
- **Volume** (xác nhận sức mạnh)
- **RSI** (optional - tránh quá mua/quá bán)

## 🔧 Scripts

| Script | Mô tả |
|--------|--------|
| `scripts/main.py` | Entry point chính |
| `scripts/config.py` | Cấu hình và constants |
| `scripts/trend_analyzer.py` | Xác định xu hướng HH/HL/LH/LL |
| `scripts/signal_detector.py` | Phát hiện tín hiệu entry |
| `scripts/risk_manager.py` | Quản lý rủi ro và position sizing |
| `scripts/order_executor.py` | Thực thi lệnh trên Binance |
| `scripts/candle_patterns.py` | Nhận dạng mẫu nến |
| `scripts/indicators.py` | Tính toán EMA, RSI, Volume |
| `scripts/news_filter.py` | Lọc tin tức quan trọng |
| `scripts/logger.py` | Ghi log giao dịch |

## ⚠️ CẢNH BÁO QUAN TRỌNG

> **Giao dịch tiền điện tử có rủi ro cao. Skill này là công cụ hỗ trợ,
> KHÔNG đảm bảo lợi nhuận. Luôn bắt đầu với Testnet và Paper Trading
> trước khi dùng tiền thật. KHÔNG BAO GIỜ đầu tư số tiền bạn không thể
> mất được.** Tác giả không chịu trách nhiệm cho bất kỳ tổn thất tài chính nào.
