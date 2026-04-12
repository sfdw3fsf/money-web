# 📖 Tài Liệu Tham Khảo - Chiến Lược Giao Dịch

## 🎯 Tổng Quan Chiến Lược

### Philosophy
- **Trend Following + Price Action + EMA confirmation**
- Win rate mục tiêu: 50-60%
- Với RR 1:2 → vẫn có lời nếu kỷ luật

### Core Rules
1. **KHÔNG BAO GIỜ** trade ngược trend
2. **LUÔN** đặt SL trước khi vào lệnh
3. **LUÔN** chạy checklist trước mỗi lệnh
4. **1-2%** rủi ro mỗi lệnh, không hơn

---

## 📊 Indicators

### EMA 20 (Short-term)
- Phản ánh xu hướng ngắn hạn
- Giá hồi về EMA20 = vùng entry BUY trong uptrend
- Giá hồi lên EMA20 = vùng entry SELL trong downtrend

### EMA 50 (Medium-term)
- Phản ánh xu hướng trung hạn
- Mạnh hơn EMA20 làm support/resistance
- EMA20 > EMA50 = Bullish structure
- EMA20 < EMA50 = Bearish structure

### RSI (14)
- Trên 70 = Quá mua → cẩn thận BUY
- Dưới 30 = Quá bán → cẩn thận SELL
- Dùng để cảnh báo, KHÔNG phải signal chính

### Volume
- Volume cao xác nhận setup mạnh
- Volume thấp = setup yếu, cẩn thận
- Volume tăng tại breakout = xác nhận

---

## 🕯️ Candle Patterns

### Bullish Pin Bar (Hammer)
```
    │
    │
  ┌─┐  ← Body nhỏ ở trên
  └─┘
    │
    │   ← Lower wick dài (>2x body)
    │
```
- Body < 30% range
- Lower wick > 2x body
- Xuất hiện tại support/EMA trong uptrend → BUY

### Bearish Pin Bar (Shooting Star)
```
    │
    │   ← Upper wick dài (>2x body)
    │
  ┌─┐  ← Body nhỏ ở dưới
  └─┘
    │
```
- Ngược lại với bullish pin bar
- Xuất hiện tại resistance/EMA trong downtrend → SELL

### Bullish Engulfing
```
  Nến 1     Nến 2
  ┌───┐
  │ ▼ │   ┌─────┐
  │   │   │     │
  └───┘   │  ▲  │
          │     │
          └─────┘
```
- Nến 1: bearish (đỏ)
- Nến 2: bullish (xanh), body bao trùm nến 1
- Xuất hiện tại support → BUY

### Bearish Engulfing
- Ngược lại bullish engulfing
- Xuất hiện tại resistance → SELL

### Break of Structure (BOS)
- Giá phá đỉnh/đáy gần nhất
- BOS tăng: close > recent high → continuation BUY
- BOS giảm: close < recent low → continuation SELL

---

## 📋 Checklist Trước Lệnh

```
┌──────────────────────────────────────────┐
│           PRE-TRADE CHECKLIST            │
├──────────────────────────────────────────┤
│ □ 1. Trend M15 rõ ràng?                 │
│ □ 2. Giá hồi về vùng đẹp?              │
│    - EMA20/50                            │
│    - Support/Resistance                  │
│ □ 3. Có nến xác nhận?                   │
│    - Pin bar / Engulfing / BOS           │
│ □ 4. SL đã xác định?                    │
│    - BUY: dưới đáy gần nhất             │
│    - SELL: trên đỉnh gần nhất           │
│ □ 5. RR ≥ 1:2?                          │
│                                          │
│ → Thiếu 1 cái = KHÔNG TRADE ❌          │
│ → Đủ tất cả = VÀO LỆNH ✅             │
└──────────────────────────────────────────┘
```

---

## 🚫 Luật Cấm

| Luật | Lý do |
|------|-------|
| ❌ Không trade ngược trend | Xác suất thua rất cao |
| ❌ Không trade khi sideway | Không có momentum, dễ bị whipsaw |
| ❌ Không trade khi tin mạnh | Biến động quá hỗn loạn |
| ❌ Không gồng lỗ | Cắt nhỏ, bảo toàn vốn |
| ❌ Không revenge trade | Emotion → bad decisions |
| ❌ Max 3 thua liên tiếp/ngày | Bảo vệ tâm lý & vốn |
| ❌ Max 5% loss/ngày | Bảo vệ tài khoản |

---

## 🔥 Nâng Cao (Level Up)

Sau khi thành thạo chiến lược cơ bản:

### Order Blocks
- Vùng nến cuối cùng trước khi giá breakout mạnh
- Giá thường quay lại test order block trước khi tiếp tục

### Imbalance (Fair Value Gap)
- Khoảng trống giữa 3 nến liên tiếp
- Giá có xu hướng quay lại fill imbalance

### Liquidity Sweep
- Giá quét đáy/đỉnh cũ để lấy liquidity
- Sau đó đảo chiều → entry tuyệt vời

### BOS + Liquidity Sweep Combo
- Chờ giá sweep liquidity
- Sau đó break structure → entry cùng hướng BOS
- Combo mạnh nhất cho high-probability trades
