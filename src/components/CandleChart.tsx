import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, ColorType, CrosshairMode, type IChartApi, type ISeriesApi, type CandlestickData, type Time } from 'lightweight-charts';
import type { Candle, Signal } from '../types/trading';
import { fmtPrice } from '../utils/formatPrice';

interface CandleChartProps {
  candles: Candle[];
  activeSignal: Signal | null;
  currentPrice: number;
}

function candleToChartData(candle: Candle): CandlestickData<Time> {
  return {
    time: (candle.time / 1000) as Time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };
}

export default function CandleChart({ candles, activeSignal, currentPrice }: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#a0947e',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(196, 149, 106, 0.04)' },
        horzLines: { color: 'rgba(196, 149, 106, 0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(196, 149, 106, 0.3)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#8b7355',
        },
        horzLine: {
          color: 'rgba(196, 149, 106, 0.3)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#8b7355',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(196, 149, 106, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(196, 149, 106, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#7d9b6f',
      downColor: '#b5594e',
      borderDownColor: '#b5594e',
      borderUpColor: '#7d9b6f',
      wickDownColor: '#b5594e',
      wickUpColor: '#7d9b6f',
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    // Responsive resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Update candle data
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;

    const chartData = candles.map(candleToChartData);
    seriesRef.current.setData(chartData);

    // Only auto-scroll on first load, then let user pan freely
    if (isFirstLoadRef.current && chartRef.current) {
      chartRef.current.timeScale().fitContent();
      isFirstLoadRef.current = false;
    }
  }, [candles]);

  // Update signal lines (TP, SL, Entry)
  useEffect(() => {
    if (!seriesRef.current) return;

    const series = seriesRef.current;

    // Remove all existing price lines first
    const existingLines = series.priceLines();
    existingLines.forEach((line) => series.removePriceLine(line));

    if (activeSignal && activeSignal.direction !== 'WAIT') {
      series.createPriceLine({
        price: activeSignal.entry,
        color: '#c4956a',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `Entry ${fmtPrice(activeSignal.entry)}`,
      });

      series.createPriceLine({
        price: activeSignal.takeProfit,
        color: '#7d9b6f',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `TP ${fmtPrice(activeSignal.takeProfit)}`,
      });

      series.createPriceLine({
        price: activeSignal.stopLoss,
        color: '#b5594e',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `SL ${fmtPrice(activeSignal.stopLoss)}`,
      });

      // Support lines
      activeSignal.support?.forEach((level, i) => {
        series.createPriceLine({
          price: level,
          color: 'rgba(125, 155, 111, 0.3)',
          lineWidth: 1,
          lineStyle: 1,
          axisLabelVisible: false,
          title: `S${i + 1}`,
        });
      });

      // Resistance lines
      activeSignal.resistance?.forEach((level, i) => {
        series.createPriceLine({
          price: level,
          color: 'rgba(181, 89, 78, 0.3)',
          lineWidth: 1,
          lineStyle: 1,
          axisLabelVisible: false,
          title: `R${i + 1}`,
        });
      });
    }
  }, [activeSignal]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-[#231f18]/40 border border-[#c4956a]/10">
      {/* Price header overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <span className="text-2xl font-bold text-[#e8dcc8] tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ${fmtPrice(currentPrice)}
        </span>
      </div>

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
