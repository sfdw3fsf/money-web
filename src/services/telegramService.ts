import type { Signal } from '../types/trading';
import { TELEGRAM_API_URL } from '../config/constants';

function formatSignalMessage(signal: Signal): string {
  const icon = signal.direction === 'BUY' ? '🟢' : signal.direction === 'SELL' ? '🔴' : '⏸️';
  const arrow = signal.direction === 'BUY' ? '📈' : signal.direction === 'SELL' ? '📉' : '➡️';

  const entryStr = signal.entry.toFixed(2);
  const tpStr = signal.takeProfit.toFixed(2);
  const slStr = signal.stopLoss.toFixed(2);

  const tpPercent = (((signal.takeProfit - signal.entry) / signal.entry) * 100).toFixed(2);
  const slPercent = (((signal.stopLoss - signal.entry) / signal.entry) * 100).toFixed(2);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  return `${icon} *${signal.direction} SIGNAL — ${signal.pair} ${signal.interval}*
━━━━━━━━━━━━━━━
📍 Entry: \`$${entryStr}\`
🎯 TP: \`$${tpStr}\` (${Number(tpPercent) > 0 ? '+' : ''}${tpPercent}%)
🛑 SL: \`$${slStr}\` (${slPercent}%)
📊 Confidence: \`${signal.confidence}%\`
⚖️ R:R = \`${signal.riskReward}\`
${arrow} Trend: \`${signal.trend}\`
━━━━━━━━━━━━━━━
💡 _${signal.reasoning}_
━━━━━━━━━━━━━━━
⏰ ${timeStr} UTC+7`;
}

export async function sendTelegramSignal(
  botToken: string,
  chatId: string,
  signal: Signal
): Promise<boolean> {
  if (!botToken || !chatId) {
    console.warn('Telegram not configured — skipping notification');
    return false;
  }

  const message = formatSignalMessage(signal);

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
      }
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
  chatId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${TELEGRAM_API_URL}/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ *MoneyWeb Trading Bot Connected!*\n\nYou will receive trading signals here.',
          parse_mode: 'Markdown',
        }),
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}
