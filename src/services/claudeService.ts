import type { Candle, Signal } from '../types/trading';
import { GEMINI_API_URL } from '../config/constants';

function compressCandles(candles: Candle[]): string {
  return JSON.stringify(
    candles.map((c) => [c.time, c.open, c.high, c.low, c.close, c.volume])
  );
}

function buildPrompt(pair: string, interval: string, candles: Candle[]): string {
  return `Analyze the last ${candles.length} candles of ${pair.toUpperCase()} on the ${interval} timeframe.

Candle data format: [timestamp_ms, open, high, low, close, volume]
${compressCandles(candles)}

Analyze:
1. Trend direction (bullish / bearish / sideways)
2. Key support levels (up to 3)
3. Key resistance levels (up to 3)
4. Signal: BUY or SELL or WAIT
5. If BUY or SELL: Entry price, Take Profit, Stop Loss
6. Confidence percentage (0-100)
7. Risk:Reward ratio
8. Brief reasoning (2-3 sentences)

Respond ONLY with valid JSON matching this exact schema:
{
  "trend": "bullish|bearish|sideways",
  "support": [number, number, number],
  "resistance": [number, number, number],
  "signal": "BUY|SELL|WAIT",
  "entry": number,
  "takeProfit": number,
  "stopLoss": number,
  "confidence": number,
  "riskReward": "string like 1.5:1",
  "reasoning": "string"
}`;
}

interface GeminiResponse {
  trend: string;
  support: number[];
  resistance: number[];
  signal: 'BUY' | 'SELL' | 'WAIT';
  entry: number;
  takeProfit: number;
  stopLoss: number;
  confidence: number;
  riskReward: string;
  reasoning: string;
}

export async function analyzeCandles(
  apiKey: string,
  pair: string,
  interval: string,
  candles: Candle[]
): Promise<Signal> {
  const prompt = buildPrompt(pair, interval, candles);
  const url = `${GEMINI_API_URL}?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: 'You are a professional crypto trading analyst. You analyze candlestick charts and provide structured trading signals. Respond ONLY with valid JSON. No markdown, no explanation outside the JSON. No code fences.',
          },
        ],
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingBudget: 2048,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // Gemini 2.5 Flash returns multiple parts: [thinking_part, text_part]
  // The JSON content is in the last text part (not the thinking part)
  const parts = data.candidates?.[0]?.content?.parts || [];
  let content = '';

  // Find the text part that contains JSON (skip thinking parts)
  for (const part of parts) {
    if (part.text && !part.thought) {
      content = part.text;
    }
  }

  // Fallback: try the first part if no non-thought part found
  if (!content && parts.length > 0) {
    content = parts[parts.length - 1]?.text || '';
  }

  console.log('[Gemini] Raw response parts:', parts.length, 'Content:', content.slice(0, 200));

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse Gemini response as JSON. Raw: ${content.slice(0, 300)}`);
  }

  const parsed: GeminiResponse = JSON.parse(jsonMatch[0]);

  const signal: Signal = {
    id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    pair: pair.toUpperCase(),
    interval,
    direction: parsed.signal,
    entry: parsed.entry,
    takeProfit: parsed.takeProfit,
    stopLoss: parsed.stopLoss,
    confidence: parsed.confidence,
    riskReward: parsed.riskReward,
    reasoning: parsed.reasoning,
    trend: parsed.trend,
    support: parsed.support,
    resistance: parsed.resistance,
    status: 'active',
    followed: false,
  };

  return signal;
}
