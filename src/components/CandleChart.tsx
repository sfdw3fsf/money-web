import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, ColorType, CrosshairMode, type IChartApi, type ISeriesApi, type CandlestickData, type Time } from 'lightweight-charts';
import type { Candle, Signal } from '../types/trading';

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
        textColor: '#8b8b9e',
        fontSize: 11,
        fontFamily: "'Inter', system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(99, 102, 241, 0.3)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#6366f1',
        },
        horzLine: {
          color: 'rgba(99, 102, 241, 0.3)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#6366f1',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.06)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.06)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
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
  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;

    const chartData = candles.map(candleToChartData);
    seriesRef.current.setData(chartData);

    // Auto-scroll to latest
    if (chartRef.current) {
      chartRef.current.timeScale().scrollToRealTime();
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
        color: '#6366f1',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `Entry ${activeSignal.entry.toFixed(2)}`,
      });

      series.createPriceLine({
        price: activeSignal.takeProfit,
        color: '#22c55e',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `TP ${activeSignal.takeProfit.toFixed(2)}`,
      });

      series.createPriceLine({
        price: activeSignal.stopLoss,
        color: '#ef4444',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `SL ${activeSignal.stopLoss.toFixed(2)}`,
      });

      // Support lines
      activeSignal.support?.forEach((level, i) => {
        series.createPriceLine({
          price: level,
          color: 'rgba(34, 197, 94, 0.3)',
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
          color: 'rgba(239, 68, 68, 0.3)',
          lineWidth: 1,
          lineStyle: 1,
          axisLabelVisible: false,
          title: `R${i + 1}`,
        });
      });
    }
  }, [activeSignal]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.06]">
      {/* Price header overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <span className="text-2xl font-bold text-white tabular-nums">
          ${currentPrice.toFixed(2)}
        </span>
      </div>

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
