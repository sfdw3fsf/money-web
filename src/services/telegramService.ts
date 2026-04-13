import type { Signal } from '../types/trading';
import type { IndicatorResult } from '../utils/indicators';
import { TELEGRAM_API_URL } from '../config/constants';

export interface TelegramSignalData {
  signal: Signal;
  indicators: IndicatorResult;
  rrRatio: number;
}

function formatSignalMessage(data: TelegramSignalData): string {
  const { signal, indicators, rrRatio } = data;
  const direction = signal.direction === 'BUY' ? '🟢 LONG' : '🔴 SHORT';
  const tpPercent = Math.abs(((signal.takeProfit - signal.entry) / signal.entry) * 100);
  const slPercent = Math.abs(((signal.stopLoss - signal.entry) / signal.entry) * 100);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  return `${direction} *${signal.pair}*
━━━━━━━━━━━━━━━
📍 Entry: \`$${signal.entry.toFixed(2)}\`
🎯 TP: \`$${signal.takeProfit.toFixed(2)}\` (+${tpPercent.toFixed(2)}%)
🛑 SL: \`$${signal.stopLoss.toFixed(2)}\` (-${slPercent.toFixed(2)}%)
⚖️ R:R: \`${rrRatio.toFixed(1)}:1\`
━━━━━━━━━━━━━━━
📊 Confidence: \`${signal.confidence}%\`
📈 15m: \`${indicators.trend15m}\` | 5m: \`${indicators.trend5m}\`
📉 RSI: \`${indicators.rsi14.toFixed(0)}\` | Vol: \`${indicators.volumeTrend}\`
━━━━━━━━━━━━━━━
💡 _${signal.reasoning}_
━━━━━━━━━━━━━━━
⏰ ${timeStr} UTC+7`;
}

export async function sendTelegramSignal(
  botToken: string,
  chatId: string,
  data: TelegramSignalData,
): Promise<boolean> {
  if (!botToken || !chatId) {
    console.warn('Telegram not configured — skipping notification');
    return false;
  }

  const message = formatSignalMessage(data);

  try {
    const response = await fetch(
      `${TELEGRAM_API_URL}/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Telegram send failed:', err);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Telegram error:', error);
    return false;
  }
}

export async function testTelegramConnection(
  botToken: string,
  chatId: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `${TELEGRAM_API_URL}/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ *MoneyWeb Trading Bot Connected!*\n\nYou will receive trading signals here.\n\n_Upgraded: Now includes 15m trend, RSI, volume, and R:R ratio._',
          parse_mode: 'Markdown',
        }),
      },
    );

    return response.ok;
  } catch {
    return false;
  }
}
