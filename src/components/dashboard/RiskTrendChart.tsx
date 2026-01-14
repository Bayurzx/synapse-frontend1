'use client';

import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataPoint {
  date: string;
  value: number;
}

interface RiskTrendChartProps {
  data: DataPoint[];
  height?: number;
  showAxis?: boolean;
  threshold?: number;
  title?: string;
}

export default function RiskTrendChart({
  data,
  height = 160,
  showAxis = true,
  threshold,
  title,
}: RiskTrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const values = data.map((d) => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    // Add padding to min/max for better visualization
    const padding = (maxValue - minValue) * 0.1 || 5;
    const chartMin = Math.max(0, minValue - padding);
    const chartMax = maxValue + padding;
    const range = chartMax - chartMin || 1;

    // Calculate trend
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const trend = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'stable';
    const changePercent = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    // Chart dimensions
    const chartPadding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = 400;
    const chartHeight = height;
    const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
    const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;

    // Generate points
    const points = data.map((d, i) => {
      const x = chartPadding.left + (i / (data.length - 1)) * plotWidth;
      const y = chartPadding.top + plotHeight - ((d.value - chartMin) / range) * plotHeight;
      return { x, y, ...d };
    });

    // Generate smooth curve using cardinal spline
    const smoothPath = generateSmoothPath(points);
    
    // Area path for gradient fill
    const areaPath = `${smoothPath} L ${points[points.length - 1].x} ${chartPadding.top + plotHeight} L ${points[0].x} ${chartPadding.top + plotHeight} Z`;

    // Generate Y-axis ticks
    const yTicks = generateTicks(chartMin, chartMax, 4);
    
    // Generate X-axis labels (show every 3rd month)
    const xLabels = data.filter((_, i) => i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2));

    return {
      points,
      smoothPath,
      areaPath,
      chartMin,
      chartMax,
      range,
      trend,
      changePercent,
      lastValue,
      yTicks,
      xLabels,
      chartPadding,
      chartWidth,
      chartHeight,
      plotWidth,
      plotHeight,
    };
  }, [data, height]);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 bg-gray-50 rounded-lg">
        No data available
      </div>
    );
  }

  const TrendIcon = chartData.trend === 'up' ? TrendingUp : chartData.trend === 'down' ? TrendingDown : Minus;
  // For risk scores: up is bad (red), down is good (green)
  const trendColor = chartData.trend === 'up' ? 'text-red-500' : chartData.trend === 'down' ? 'text-green-500' : 'text-gray-400';
  const trendBg = chartData.trend === 'up' ? 'bg-red-50' : chartData.trend === 'down' ? 'bg-green-50' : 'bg-gray-50';

  return (
    <div className="space-y-3">
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${trendBg}`}>
            <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
            <span className={`text-xs font-semibold ${trendColor}`}>
              {chartData.changePercent > 0 ? '+' : ''}
              {chartData.changePercent.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="relative bg-gradient-to-b from-gray-50/50 to-white rounded-lg p-2">
        <svg
          viewBox={`0 0 ${chartData.chartWidth} ${chartData.chartHeight}`}
          className="w-full"
          style={{ height }}
        >
          <defs>
            {/* Gradient for area fill */}
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.02" />
            </linearGradient>
            {/* Gradient for line */}
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(96, 165, 250)" />
              <stop offset="50%" stopColor="rgb(59, 130, 246)" />
              <stop offset="100%" stopColor="rgb(37, 99, 235)" />
            </linearGradient>
            {/* Glow filter for line */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {showAxis && chartData.yTicks.map((tick, i) => {
            const y = chartData.chartPadding.top + chartData.plotHeight - 
              ((tick - chartData.chartMin) / chartData.range) * chartData.plotHeight;
            return (
              <g key={i}>
                <line
                  x1={chartData.chartPadding.left}
                  y1={y}
                  x2={chartData.chartPadding.left + chartData.plotWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray={i === 0 ? "0" : "4 4"}
                />
                <text
                  x={chartData.chartPadding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-gray-400"
                >
                  {tick.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Threshold line */}
          {threshold !== undefined && threshold >= chartData.chartMin && threshold <= chartData.chartMax && (
            <g>
              <line
                x1={chartData.chartPadding.left}
                y1={chartData.chartPadding.top + chartData.plotHeight - 
                  ((threshold - chartData.chartMin) / chartData.range) * chartData.plotHeight}
                x2={chartData.chartPadding.left + chartData.plotWidth}
                y2={chartData.chartPadding.top + chartData.plotHeight - 
                  ((threshold - chartData.chartMin) / chartData.range) * chartData.plotHeight}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                opacity="0.6"
              />
              <text
                x={chartData.chartPadding.left + chartData.plotWidth + 4}
                y={chartData.chartPadding.top + chartData.plotHeight - 
                  ((threshold - chartData.chartMin) / chartData.range) * chartData.plotHeight + 4}
                className="text-[9px] fill-red-500 font-medium"
              >
                Risk Threshold
              </text>
            </g>
          )}

          {/* Area fill */}
          <path 
            d={chartData.areaPath} 
            fill="url(#areaGradient)"
            className="transition-opacity duration-300"
          />

          {/* Main line with glow */}
          <path
            d={chartData.smoothPath}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Data points */}
          {chartData.points.map((point, i) => (
            <g key={i}>
              {/* Hover area (larger invisible circle) */}
              <circle
                cx={point.x}
                cy={point.y}
                r="12"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {/* Visible point */}
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint === i ? 5 : 3.5}
                fill="white"
                stroke="rgb(59, 130, 246)"
                strokeWidth="2"
                className="transition-all duration-150"
              />
              {/* Hover ring */}
              {hoveredPoint === i && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="10"
                  fill="none"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="1"
                  opacity="0.3"
                />
              )}
            </g>
          ))}

          {/* X-axis labels */}
          {showAxis && data.length > 0 && (
            <>
              <text
                x={chartData.chartPadding.left}
                y={chartData.chartHeight - 8}
                textAnchor="start"
                className="text-[10px] fill-gray-400"
              >
                {formatDate(data[0].date)}
              </text>
              <text
                x={chartData.chartPadding.left + chartData.plotWidth / 2}
                y={chartData.chartHeight - 8}
                textAnchor="middle"
                className="text-[10px] fill-gray-400"
              >
                {formatDate(data[Math.floor(data.length / 2)].date)}
              </text>
              <text
                x={chartData.chartPadding.left + chartData.plotWidth}
                y={chartData.chartHeight - 8}
                textAnchor="end"
                className="text-[10px] fill-gray-400"
              >
                {formatDate(data[data.length - 1].date)}
              </text>
            </>
          )}
        </svg>

        {/* Tooltip */}
        {hoveredPoint !== null && chartData.points[hoveredPoint] && (
          <div 
            className="absolute bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none z-10 transform -translate-x-1/2"
            style={{
              left: `${(chartData.points[hoveredPoint].x / chartData.chartWidth) * 100}%`,
              top: `${(chartData.points[hoveredPoint].y / chartData.chartHeight) * 100 - 15}%`,
            }}
          >
            <div className="font-semibold">{chartData.points[hoveredPoint].value.toFixed(1)}</div>
            <div className="text-gray-400 text-[10px]">
              {formatDateLong(chartData.points[hoveredPoint].date)}
            </div>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-gray-400">Current</span>
            <p className="text-lg font-bold text-gray-900">{chartData.lastValue.toFixed(1)}</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div>
            <span className="text-xs text-gray-400">Range</span>
            <p className="text-sm font-medium text-gray-600">
              {chartData.chartMin.toFixed(0)} - {chartData.chartMax.toFixed(0)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400">12-month change</span>
          <p className={`text-sm font-semibold ${trendColor}`}>
            {chartData.changePercent > 0 ? '↑' : chartData.changePercent < 0 ? '↓' : '→'} 
            {Math.abs(chartData.changePercent).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

// Generate smooth curve using Catmull-Rom spline
function generateSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  const tension = 0.3;
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

// Generate nice tick values
function generateTicks(min: number, max: number, count: number): number[] {
  const range = max - min;
  const step = range / (count - 1);
  const ticks: number[] = [];
  
  for (let i = 0; i < count; i++) {
    ticks.push(min + step * i);
  }
  
  return ticks;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Mini sparkline version
export function RiskSparkline({
  data,
  width = 80,
  height = 24,
}: {
  data: number[];
  width?: number;
  height?: number;
}) {
  const pathD = useMemo(() => {
    if (!data || data.length < 2) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;

    const points = data.map((value, i) => ({
      x: padding + (i / (data.length - 1)) * (width - padding * 2),
      y: padding + (height - padding * 2) - ((value - min) / range) * (height - padding * 2),
    }));

    return generateSmoothPath(points);
  }, [data, width, height]);

  if (!pathD) return null;

  const trend = data[data.length - 1] > data[0] ? 'up' : data[data.length - 1] < data[0] ? 'down' : 'stable';
  const strokeColor = trend === 'up' ? '#ef4444' : trend === 'down' ? '#22c55e' : '#9ca3af';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkline-${trend}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${pathD} L ${width - 2} ${height - 2} L 2 ${height - 2} Z`}
        fill={`url(#sparkline-${trend})`}
      />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
