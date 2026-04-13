import type { Candle, Signal } from '../types/trading';
import type { IndicatorResult } from '../utils/indicators';
import { GEMINI_MODELS, OPENAI_API_URL, OPENAI_MODELS } from '../config/constants';

// ========== Shared Prompt ==========

const SYSTEM_PROMPT =
  'You are a professional crypto scalp trading analyst. The code has already filtered the market — you only need to confirm entry timing and set precise levels. Respond ONLY with valid JSON. No markdown, no explanation outside the JSON. No code fences.';

function buildAnalysisPrompt(
  pair: string,
  interval: string,
  candles5m: Candle[],
  candles15m: Candle[],
  indicators: IndicatorResult,
): string {
  // Only send last 10 candles (5m) and 5 candles (15m) — ~500 tokens instead of ~3000
  const recent5m = candles5m.slice(-10).map((c) => ({
    t: new Date(c.time).toISOString().slice(11, 16),
    o: c.open,
    h: c.high,
    l: c.low,
    c: c.close,
    v: Math.round(c.volume),
  }));

  const recent15m = candles15m.slice(-5).map((c) => ({
    t: new Date(c.time).toISOString().slice(11, 16),
    o: c.open,
    h: c.high,
    l: c.low,
    c: c.close,
    v: Math.round(c.volume),
  }));

  return `You are a crypto scalp trader assistant. Your ONLY job is to confirm or reject 
a trade setup and provide precise entry/TP/SL levels.

The code has ALREADY confirmed:
- 15m trend: ${indicators.trend15m}
- 5m trend: ${indicators.trend5m} (aligned with 15m)
- Market is NOT sideways (range: ${indicators.sidewaysRange.toFixed(2)}%)
- RSI is not extreme

== PRE-CALCULATED INDICATORS ==
Pair: ${pair.toUpperCase()} | Entry TF: ${interval}
EMA20 (5m): ${indicators.ema20_5m.toFixed(4)}
EMA50 (5m): ${indicators.ema50_5m.toFixed(4)}
EMA20 (15m): ${indicators.ema20_15m.toFixed(4)}
EMA50 (15m): ${indicators.ema50_15m.toFixed(4)}
RSI (14): ${indicators.rsi14.toFixed(1)}
ATR (14, 5m): ${indicators.atr14.toFixed(4)} ← candle volatility unit
Volume: ${indicators.volumeTrend}
Support: ${indicators.support.map((s) => s.toFixed(4)).join(', ')}
Resistance: ${indicators.resistance.map((r) => r.toFixed(4)).join(', ')}

== LAST 5 CANDLES (15m) ==
${JSON.stringify(recent15m)}

== LAST 10 CANDLES (5m) ==
${JSON.stringify(recent5m)}

== YOUR TASK ==
Given the ${indicators.trend15m} bias, find the best entry on 5m.

RULES:
1. Direction MUST match 15m trend (${indicators.trend15m})
2. If no clear entry exists right now, return WAIT
3. SL must be at least 1.5x ATR (${(indicators.atr14 * 1.5).toFixed(4)}) away from entry — never tighter. Place it beyond the nearest support/resistance level.
4. TP must be at least 1.5x the SL distance (risk-reward >= 1.5:1)
5. Use support/resistance levels for TP and SL placement
6. Confidence below 60 = always WAIT

Return ONLY valid JSON, no other text:
{
  "signal": "BUY" | "SELL" | "WAIT",
  "entry": number,
  "takeProfit": number,
  "stopLoss": number,
  "confidence": 0-100,
  "riskReward": "e.g. 1.8:1",
  "reasoning": "one sentence max"
}`;
}

interface AIResponse {
  signal: 'BUY' | 'SELL' | 'WAIT';
  entry: number;
  takeProfit: number;
  stopLoss: number;
  confidence: number;
  riskReward: string;
  reasoning: string;
}

// Repair a truncated / malformed JSON object: close open strings, strip trailing
// commas, and balance braces/brackets. Returns null if still unparseable.
function repairJson(raw: string): AIResponse | null {
  let s = raw.replace(/,\s*$/, '').replace(/,\s*([}\]])/g, '$1');

  let inString = false;
  let escape = false;
  const stack: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') stack.push(ch);
    else if (ch === '}' && stack[stack.length - 1] === '{') stack.pop();
    else if (ch === ']' && stack[stack.length - 1] === '[') stack.pop();
  }
  if (inString) s += '"';
  s = s.replace(/,\s*$/, '');
  while (stack.length) {
    const open = stack.pop();
    s += open === '{' ? '}' : ']';
  }

  try {
    return JSON.parse(s) as AIResponse;
  } catch {
    return null;
  }
}

// ========== Provider Detection ==========

function isOpenAIKey(key: string): boolean {
  return key.startsWith('sk-');
}

// ========== OpenAI GPT Path ==========

async function callOpenAI(
  apiKey: string,
  prompt: string,
): Promise<string> {
  let lastError = '';

  for (const model of OPENAI_MODELS) {
    console.log(`[Analysis] Trying OpenAI ${model}...`);

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      console.log(`[Analysis] ✓ OpenAI ${model} responded OK`);
      return content;
    }

    // 429 = rate limit — try next model
    if (response.status === 429) {
      console.log(`[${model}] 429 rate limited — trying next model`);
      lastError = `${model}: rate limited`;
      continue;
    }

    // Other errors
    const errorText = await response.text();
    console.log(`[${model}] Error ${response.status}: ${errorText.slice(0, 200)}`);
    lastError = `OpenAI ${model} error (${response.status}): ${errorText}`;

    // For auth errors (401), don't try other models
    if (response.status === 401) {
      throw new Error(`OpenAI API key invalid (401): ${errorText}`);
    }
  }

  throw new Error(`All OpenAI models failed. Last error: ${lastError}`);
}

// ========== Gemini Path ==========

function parseRetryDelay(errorBody: string, defaultMs: number): number {
  try {
    const parsed = JSON.parse(errorBody);
    const retryInfo = parsed?.error?.details?.find(
      (d: { '@type'?: string }) => d['@type']?.includes('RetryInfo'),
    );
    if (retryInfo?.retryDelay) {
      const seconds = parseInt(retryInfo.retryDelay, 10);
      if (!isNaN(seconds) && seconds > 0) {
        return Math.min(seconds * 1000, 60_000);
      }
    }
  } catch {
    // Ignore parse errors
  }
  return defaultMs;
}

async function tryGeminiModel(
  modelName: string,
  url: string,
  body: string,
): Promise<{ response: Response } | { error: string }> {
  const MAX_RETRIES = 1;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (response.ok) {
      return { response };
    }

    if (response.status === 429) {
      const errorBody = await response.text();
      const retryMs = parseRetryDelay(errorBody, 45_000);
      console.log(
        `[${modelName}] 429 quota exhausted — skipping to next model (retry in ${Math.round(retryMs / 1000)}s)`,
      );
      return { error: `${modelName}: quota exhausted` };
    }

    if (response.status === 503 && attempt < MAX_RETRIES) {
      const delay = (attempt + 1) * 3000;
      console.log(`[${modelName}] 503 overloaded — retrying in ${delay / 1000}s`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    const errorText = await response.text();
    console.log(`[${modelName}] Error ${response.status}`);
    return { error: `${modelName} error (${response.status}): ${errorText}` };
  }

  return { error: `${modelName}: max retries exceeded` };
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  let lastError = '';

  for (const model of GEMINI_MODELS) {
    const url = `${model.url}?key=${apiKey}`;
    console.log(`[Analysis] Trying ${model.name}...`);

    const result = await tryGeminiModel(model.name, url, body);

    if ('response' in result) {
      const data = await result.response.json();
      // Gemini 2.5 Flash returns [thinking_part, text_part]
      const parts = data.candidates?.[0]?.content?.parts || [];
      let content = '';
      for (const part of parts) {
        if (part.text && !part.thought) {
          content = part.text;
        }
      }
      if (!content && parts.length > 0) {
        content = parts[parts.length - 1]?.text || '';
      }
      console.log(`[Analysis] ✓ ${model.name} responded OK`);
      return content;
    }

    lastError = result.error;
  }

  throw new Error(`All Gemini models exhausted. Last error: ${lastError}`);
}

// ========== Main Entry Point ==========

export async function analyzeCandles(
  apiKey: string,
  pair: string,
  interval: string,
  candles5m: Candle[],
  candles15m: Candle[],
  indicators: IndicatorResult,
): Promise<Signal> {
  const prompt = buildAnalysisPrompt(pair, interval, candles5m, candles15m, indicators);

  const provider = isOpenAIKey(apiKey) ? 'openai' : 'gemini';
  console.log(`[Analysis] Using provider: ${provider}`);

  const content = provider === 'openai'
    ? await callOpenAI(apiKey, prompt)
    : await callGemini(apiKey, prompt);

  // Parse JSON from response — find start brace, then try full or repaired parse
  const startIdx = content.indexOf('{');
  if (startIdx === -1) {
    throw new Error(`Failed to parse AI response as JSON. Raw: ${content.slice(0, 300)}`);
  }
  const rawJson = content.slice(startIdx);

  let parsed: AIResponse;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    console.warn(`[Analysis] JSON parse failed, attempting repair. Raw: ${content.slice(0, 200)}...`);
    parsed = repairJson(rawJson) ?? {
      signal: 'WAIT',
      entry: 0,
      takeProfit: 0,
      stopLoss: 0,
      confidence: 0,
      riskReward: '0',
      reasoning: 'AI returned invalid data format',
    };
  }

  // Ensure all required fields exist
  const signal: Signal = {
    id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    pair: pair.toUpperCase(),
    interval,
    direction: parsed.signal || 'WAIT',
    entry: parsed.entry || 0,
    takeProfit: parsed.takeProfit || 0,
    stopLoss: parsed.stopLoss || 0,
    confidence: parsed.confidence || 0,
    riskReward: parsed.riskReward || '0',
    reasoning: parsed.reasoning || 'No reasoning provided',
    trend: indicators.trend15m,
    support: indicators.support,
    resistance: indicators.resistance,
    status: 'active',
    followed: false,
  };

  return signal;
}
