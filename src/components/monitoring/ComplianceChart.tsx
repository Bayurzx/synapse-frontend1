'use client';

import { useMemo } from 'react';

interface DataPoint {
  date: string;
  value: number;
  status?: string;
}

interface ComplianceChartProps {
  data: DataPoint[];
  threshold?: number;
  title?: string;
  height?: number;
  showThreshold?: boolean;
  covenantType?: string;
}

export default function ComplianceChart({
  data,
  threshold,
  title,
  height = 250,
  showThreshold = true,
  covenantType,
}: ComplianceChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Generate sample data for demo
      const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
      return months.map((month, i) => ({
        date: month,
        value: 0.35 + Math.random() * 0.2,
        status: i > 4 ? 'breach' : 'compliant',
      }));
    }
    return data;
  }, [data]);

  // Use a wider viewBox for better text rendering
  const viewBoxWidth = 400;
  const viewBoxHeight = height;
  
  // Margins for labels
  const marginLeft = 55;
  const marginRight = 25;
  const marginTop = 20;
  const marginBottom = 35;
  
  const chartWidth = viewBoxWidth - marginLeft - marginRight;
  const chartHeight = viewBoxHeight - marginTop - marginBottom;

  const { minValue, maxValue, points, thresholdY } = useMemo(() => {
    const values = chartData.map(d => d.value);
    const min = Math.min(...values, threshold || Infinity) * 0.9;
    const max = Math.max(...values, threshold || 0) * 1.1;
    const range = max - min || 1; // Prevent division by zero

    const pts = chartData.map((d, i) => {
      const x = marginLeft + (i / Math.max(chartData.length - 1, 1)) * chartWidth;
      const y = marginTop + chartHeight - ((d.value - min) / range) * chartHeight;
      return { x, y, ...d };
    });

    const threshY = threshold
      ? marginTop + chartHeight - ((threshold - min) / range) * chartHeight
      : null;

    return { minValue: min, maxValue: max, points: pts, thresholdY: threshY };
  }, [chartData, threshold, chartWidth, chartHeight, marginLeft, marginTop]);

  // Create SVG path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Create area path for gradient fill
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${marginTop + chartHeight} L ${points[0].x} ${marginTop + chartHeight} Z`;

  // Determine if currently in breach
  const currentStatus = chartData[chartData.length - 1]?.status || 'compliant';
  const lineColor = currentStatus === 'breach' || currentStatus === 'critical'
    ? '#ef4444'
    : currentStatus === 'warning'
    ? '#f59e0b'
    : '#3b82f6';

  return (
    <div className="card p-4">
      {title && (
        <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
      )}
      
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={`gradient-${covenantType || 'default'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Y-axis labels */}
        <text x={marginLeft - 8} y={marginTop + 4} fontSize="11" fill="#374151" textAnchor="end">
          {maxValue.toFixed(2)}
        </text>
        <text x={marginLeft - 8} y={marginTop + chartHeight / 2 + 4} fontSize="11" fill="#374151" textAnchor="end">
          {((maxValue + minValue) / 2).toFixed(2)}
        </text>
        <text x={marginLeft - 8} y={marginTop + chartHeight + 4} fontSize="11" fill="#374151" textAnchor="end">
          {minValue.toFixed(2)}
        </text>

        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            x1={marginLeft}
            y1={marginTop + chartHeight * ratio}
            x2={viewBoxWidth - marginRight}
            y2={marginTop + chartHeight * ratio}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Y-axis line */}
        <line
          x1={marginLeft}
          y1={marginTop}
          x2={marginLeft}
          y2={marginTop + chartHeight}
          stroke="#d1d5db"
          strokeWidth="1"
        />

        {/* Threshold line */}
        {showThreshold && thresholdY !== null && (
          <>
            <line
              x1={marginLeft}
              y1={thresholdY}
              x2={viewBoxWidth - marginRight}
              y2={thresholdY}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="8,4"
            />
            <text
              x={viewBoxWidth - marginRight + 5}
              y={thresholdY + 4}
              fontSize="10"
              fill="#ef4444"
            >
              Threshold: {threshold?.toFixed(2)}
            </text>
          </>
        )}

        {/* Area fill */}
        <path
          d={areaPath}
          fill={`url(#gradient-${covenantType || 'default'})`}
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="white"
              stroke={lineColor}
              strokeWidth="2"
              className="cursor-pointer"
            >
              <title>{`${point.date}: ${point.value.toFixed(4)} (${point.status || 'compliant'})`}</title>
            </circle>
            {/* X-axis labels - show every nth label to avoid crowding */}
            {(i % Math.ceil(points.length / 7) === 0 || i === points.length - 1) && (
              <text
                x={point.x}
                y={viewBoxHeight - 10}
                fontSize="11"
                fill="#374151"
                textAnchor="middle"
              >
                {point.date}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Current value indicator */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <span className="text-sm text-gray-500">Current Value</span>
        <span
          className={`text-sm font-semibold ${
            currentStatus === 'breach' || currentStatus === 'critical'
              ? 'text-red-600'
              : currentStatus === 'warning'
              ? 'text-amber-600'
              : 'text-green-600'
          }`}
        >
          {chartData[chartData.length - 1]?.value.toFixed(4) || '—'}
        </span>
      </div>
    </div>
  );
}


// Portfolio-level compliance trend chart
interface PortfolioComplianceChartProps {
  data?: { date: string; compliant: number; warning: number; breach: number }[];
  height?: number;
}

export function PortfolioComplianceChart({ data, height = 200 }: PortfolioComplianceChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Generate sample data - ensure totals don't exceed 100%
      const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
      return months.map((month) => {
        const breach = 2 + Math.random() * 5;
        const warning = 5 + Math.random() * 8;
        const compliant = 100 - breach - warning; // Ensure total = 100%
        return { date: month, compliant, warning, breach };
      });
    }
    return data;
  }, [data]);

  // Use a wider viewBox for better text rendering
  const viewBoxWidth = 400;
  const viewBoxHeight = height;
  
  // Margins for labels
  const marginLeft = 50;
  const marginRight = 20;
  const marginTop = 20;
  const marginBottom = 35;
  
  const chartWidth = viewBoxWidth - marginLeft - marginRight;
  const chartHeight = viewBoxHeight - marginTop - marginBottom;
  const barWidth = chartWidth / chartData.length;
  const barPadding = barWidth * 0.2;

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Portfolio Compliance Trend</h3>
      
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y-axis labels */}
        <text x={marginLeft - 8} y={marginTop + 4} fontSize="12" fill="#374151" textAnchor="end">100%</text>
        <text x={marginLeft - 8} y={marginTop + chartHeight / 2 + 4} fontSize="12" fill="#374151" textAnchor="end">50%</text>
        <text x={marginLeft - 8} y={marginTop + chartHeight + 4} fontSize="12" fill="#374151" textAnchor="end">0%</text>

        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            x1={marginLeft}
            y1={marginTop + chartHeight * ratio}
            x2={viewBoxWidth - marginRight}
            y2={marginTop + chartHeight * ratio}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Y-axis line */}
        <line
          x1={marginLeft}
          y1={marginTop}
          x2={marginLeft}
          y2={marginTop + chartHeight}
          stroke="#d1d5db"
          strokeWidth="1"
        />

        {/* Stacked bars */}
        {chartData.map((d, i) => {
          const x = marginLeft + i * barWidth + barPadding / 2;
          const actualBarWidth = barWidth - barPadding;
          
          // Normalize to ensure total doesn't exceed 100%
          const total = d.compliant + d.warning + d.breach;
          const normalizedCompliant = (d.compliant / total) * 100;
          const normalizedWarning = (d.warning / total) * 100;
          const normalizedBreach = (d.breach / total) * 100;
          
          const compliantHeight = (normalizedCompliant / 100) * chartHeight;
          const warningHeight = (normalizedWarning / 100) * chartHeight;
          const breachHeight = (normalizedBreach / 100) * chartHeight;
          
          // Calculate Y positions for labels (center of each segment)
          const compliantY = marginTop + chartHeight - compliantHeight / 2;
          const warningY = marginTop + chartHeight - compliantHeight - warningHeight / 2;
          const breachY = marginTop + chartHeight - compliantHeight - warningHeight - breachHeight / 2;
          
          // Minimum height to show label (in pixels)
          const minHeightForLabel = 18;

          return (
            <g key={i}>
              {/* Compliant (green) - bottom */}
              <rect
                x={x}
                y={marginTop + chartHeight - compliantHeight}
                width={actualBarWidth}
                height={compliantHeight}
                fill="#22c55e"
                rx="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <title>{`${d.date} - Compliant: ${Math.round(normalizedCompliant)}% (${Math.round(d.compliant)} covenants)`}</title>
              </rect>
              {/* Compliant label */}
              {compliantHeight >= minHeightForLabel && (
                <text
                  x={x + actualBarWidth / 2}
                  y={compliantY}
                  fontSize="10"
                  fill="white"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontWeight="600"
                  className="pointer-events-none"
                >
                  {Math.round(normalizedCompliant)}%
                </text>
              )}
              
              {/* Warning (amber) - middle */}
              <rect
                x={x}
                y={marginTop + chartHeight - compliantHeight - warningHeight}
                width={actualBarWidth}
                height={warningHeight}
                fill="#f59e0b"
                rx="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <title>{`${d.date} - Warning: ${Math.round(normalizedWarning)}% (${Math.round(d.warning)} covenants)`}</title>
              </rect>
              {/* Warning label */}
              {warningHeight >= minHeightForLabel && (
                <text
                  x={x + actualBarWidth / 2}
                  y={warningY}
                  fontSize="10"
                  fill="white"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontWeight="600"
                  className="pointer-events-none"
                >
                  {Math.round(normalizedWarning)}%
                </text>
              )}
              
              {/* Breach (red) - top */}
              <rect
                x={x}
                y={marginTop + chartHeight - compliantHeight - warningHeight - breachHeight}
                width={actualBarWidth}
                height={breachHeight}
                fill="#ef4444"
                rx="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <title>{`${d.date} - Breach: ${Math.round(normalizedBreach)}% (${Math.round(d.breach)} covenants)`}</title>
              </rect>
              {/* Breach label */}
              {breachHeight >= minHeightForLabel && (
                <text
                  x={x + actualBarWidth / 2}
                  y={breachY}
                  fontSize="10"
                  fill="white"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontWeight="600"
                  className="pointer-events-none"
                >
                  {Math.round(normalizedBreach)}%
                </text>
              )}
              
              {/* X-axis label */}
              <text
                x={x + actualBarWidth / 2}
                y={viewBoxHeight - 10}
                fontSize="12"
                fill="#374151"
                textAnchor="middle"
              >
                {d.date}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-sm text-gray-600">Compliant</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-amber-500" />
          <span className="text-sm text-gray-600">Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-sm text-gray-600">Breach</span>
        </div>
      </div>
    </div>
  );
}
