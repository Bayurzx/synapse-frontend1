'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RiskScoreCardProps {
  score: number;
  tier: 'LOW' | 'MEDIUM' | 'HIGH';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  trend?: 'improving' | 'stable' | 'deteriorating';
  previousScore?: number;
}

export default function RiskScoreCard({
  score,
  tier,
  size = 'md',
  showLabel = false,
  trend,
  previousScore,
}: RiskScoreCardProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-lg',
  };

  const tierColors = {
    LOW: {
      bg: 'bg-green-500',
      ring: 'ring-green-200',
      text: 'text-green-700',
      label: 'Low Risk',
    },
    MEDIUM: {
      bg: 'bg-amber-500',
      ring: 'ring-amber-200',
      text: 'text-amber-700',
      label: 'Medium Risk',
    },
    HIGH: {
      bg: 'bg-red-500',
      ring: 'ring-red-200',
      text: 'text-red-700',
      label: 'High Risk',
    },
  };

  const colors = tierColors[tier] || tierColors.MEDIUM; // Default to MEDIUM if tier is invalid
  const TrendIcon = trend === 'improving' ? TrendingDown : trend === 'deteriorating' ? TrendingUp : Minus;
  const trendColor = trend === 'improving' ? 'text-green-500' : trend === 'deteriorating' ? 'text-red-500' : 'text-gray-400';

  // Ensure score is a valid number
  const safeScore = typeof score === 'number' && !isNaN(score) ? score : 0;
  const scoreChange = previousScore !== undefined && !isNaN(previousScore) ? safeScore - previousScore : null;

  return (
    <div className="flex items-center gap-2">
      {/* Traffic Light Score */}
      <div
        className={`${sizeClasses[size]} ${colors.bg} rounded-full flex items-center justify-center text-white font-semibold ring-2 ${colors.ring}`}
        title={`Risk Score: ${safeScore} (${colors.label})`}
      >
        {Math.round(safeScore)}
      </div>

      {/* Label and Trend */}
      {(showLabel || trend) && (
        <div className="flex flex-col">
          {showLabel && (
            <span className={`text-sm font-medium ${colors.text}`}>
              {colors.label}
            </span>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              <TrendIcon className={`h-3 w-3 ${trendColor}`} />
              <span className={`text-xs ${trendColor}`}>
                {trend === 'improving' ? 'Improving' : trend === 'deteriorating' ? 'Deteriorating' : 'Stable'}
                {scoreChange !== null && scoreChange !== 0 && (
                  <span className="ml-1">
                    ({scoreChange > 0 ? '+' : ''}{scoreChange})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Traffic Light Component (standalone)
export function TrafficLight({
  status,
  size = 'md',
  label,
}: {
  status: 'green' | 'amber' | 'red';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const colors = {
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  const labels = {
    green: 'Compliant',
    amber: 'Warning',
    red: 'Breach',
  };

  return (
    <div className="flex items-center gap-1.5" title={label || labels[status]}>
      <span className={`inline-block rounded-full ${sizeClasses[size]} ${colors[status]}`} />
      {label && <span className="text-xs text-gray-600">{label}</span>}
    </div>
  );
}

// Risk Score Badge (compact version)
export function RiskScoreBadge({
  score,
  tier,
}: {
  score: number;
  tier: 'LOW' | 'MEDIUM' | 'HIGH';
}) {
  const tierColors = {
    LOW: 'bg-green-100 text-green-800 border-green-200',
    MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
    HIGH: 'bg-red-100 text-red-800 border-red-200',
  };

  const colorClass = tierColors[tier] || tierColors.MEDIUM;
  const validTier = tier && tierColors[tier] ? tier : 'MEDIUM';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${
        validTier === 'LOW' ? 'bg-green-500' : validTier === 'MEDIUM' ? 'bg-amber-500' : 'bg-red-500'
      }`} />
      {Math.round(score)}
    </span>
  );
}
