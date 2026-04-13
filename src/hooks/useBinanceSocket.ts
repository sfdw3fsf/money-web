import { useState, useEffect, useRef, useCallback } from 'react';
import type { Candle, ConnectionState } from '../types/trading';
import { BINANCE_WS_URL, BINANCE_REST_URL } from '../config/constants';

interface UseBinanceSocketOptions {
  pair: string;
  interval: string;
  candleCount: number;
  onCandleClose?: (candles: Candle[]) => void;
}

interface UseBinanceSocketReturn {
  candles: Candle[];
  currentPrice: number;
  priceChange24h: number;
  connectionState: ConnectionState;
  reconnect: () => void;
}

async function fetchHistoricalCandles(
  pair: string,
  interval: string,
  limit: number
): Promise<Candle[]> {
  const symbol = pair.toUpperCase();
  const url = `${BINANCE_REST_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Binance REST error: ${res.status}`);

  const data = await res.json();

  return data.map((k: number[]) => ({
    time: k[0],
    open: parseFloat(String(k[1])),
    high: parseFloat(String(k[2])),
    low: parseFloat(String(k[3])),
    close: parseFloat(String(k[4])),
    volume: parseFloat(String(k[5])),
    isClosed: true,
  }));
}

export function useBinanceSocket({
  pair,
  interval,
  candleCount,
  onCandleClose,
}: UseBinanceSocketOptions): UseBinanceSocketReturn {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange24h, setPriceChange24h] = useState(0);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');

  const wsRef = useRef<WebSocket | null>(null);
  const candlesRef = useRef<Candle[]>([]);
  const onCandleCloseRef = useRef(onCandleClose);
  const reconnectTimeoutRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef(0);

  // Keep callback ref fresh
  useEffect(() => {
    onCandleCloseRef.current = onCandleClose;
  }, [onCandleClose]);

  const connect = useCallback(() => {
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionState('connecting');

    const symbol = pair.toLowerCase();
    const wsUrl = `${BINANCE_WS_URL}/${symbol}@kline_${interval}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState('connected');
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const k = msg.k;

        if (!k) return;

        const candle: Candle = {
          time: k.t,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v),
          isClosed: k.x,
        };

        setCurrentPrice(candle.close);

        setCandles((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;

          if (candle.isClosed) {
            // Candle just closed — update last and prepare for new
            if (lastIndex >= 0 && updated[lastIndex].time === candle.time) {
              updated[lastIndex] = candle;
            } else {
              updated.push(candle);
            }

            // Trim to max count
            while (updated.length > candleCount) {
              updated.shift();
            }

            candlesRef.current = updated;

            // Trigger callback
            if (onCandleCloseRef.current) {
              onCandleCloseRef.current(updated);
            }
          } else {
            // Live candle — update in place
            if (lastIndex >= 0 && updated[lastIndex].time === candle.time) {
              updated[lastIndex] = candle;
            } else {
              updated.push(candle);
              while (updated.length > candleCount + 1) {
                updated.shift();
              }
            }
          }

          candlesRef.current = updated;
          return updated;
        });
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    ws.onerror = () => {
      setConnectionState('error');
    };

    ws.onclose = () => {
      setConnectionState('disconnected');

      // Auto-reconnect with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current++;

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [pair, interval, candleCount]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  // Initialize: fetch history then connect WS
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const historical = await fetchHistoricalCandles(pair, interval, candleCount);
        if (cancelled) return;

        candlesRef.current = historical;
        setCandles(historical);

        if (historical.length > 0) {
          setCurrentPrice(historical[historical.length - 1].close);

          // Simple 24h change calc from available data
          const oldPrice = historical[0].open;
          const newPrice = historical[historical.length - 1].close;
          setPriceChange24h(((newPrice - oldPrice) / oldPrice) * 100);
        }

        connect();
      } catch (err) {
        console.error('Failed to fetch historical candles:', err);
        setConnectionState('error');
        // Still try to connect WS
        connect();
      }
    }

    init();

    return () => {
      cancelled = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [pair, interval, candleCount, connect]);

  return {
    candles,
    currentPrice,
    priceChange24h,
    connectionState,
    reconnect,
  };
}
