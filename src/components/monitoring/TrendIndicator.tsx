'use client';

import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';

type TrendDirection = 'improving' | 'stable' | 'deteriorating' | 'up' | 'down';

interface TrendIndicatorProps {
  direction: TrendDirection;
  value?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  /** For covenants where lower is better (like DTI), invert the color logic */
  invertColors?: boolean;
}

export default function TrendIndicator({
  direction,
  value,
  label,
  size = 'md',
  showLabel = true,
  invertColors = false,
}: TrendIndicatorProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Normalize direction
  const normalizedDirection = 
    direction === 'up' ? 'deteriorating' :
    direction === 'down' ? 'improving' :
    direction;

  // Determine color based on direction and inversion
  const getColor = () => {
    const isPositive = normalizedDirection === 'improving';
    const isNegative = normalizedDirection === 'deteriorating';

    if (invertColors) {
      if (isPositive) return 'text-red-500';
      if (isNegative) return 'text-green-500';
    } else {
      if (isPositive) return 'text-green-500';
      if (isNegative) return 'text-red-500';
    }
    return 'text-gray-400';
  };

  const getIcon = () => {
    switch (normalizedDirection) {
      case 'improving':
        return invertColors ? (
          <TrendingDown className={sizeClasses[size]} />
        ) : (
          <TrendingUp className={sizeClasses[size]} />
        );
      case 'deteriorating':
        return invertColors ? (
          <TrendingUp className={sizeClasses[size]} />
        ) : (
          <TrendingDown className={sizeClasses[size]} />
        );
      default:
        return <Minus className={sizeClasses[size]} />;
    }
  };

  const getLabel = () => {
    if (label) return label;
    switch (normalizedDirection) {
      case 'improving':
        return 'Improving';
      case 'deteriorating':
        return 'Deteriorating';
      default:
        return 'Stable';
    }
  };

  return (
    <div className={`flex items-center gap-1 ${getColor()}`}>
      {getIcon()}
      {showLabel && (
        <span className={textSizes[size]}>
          {getLabel()}
          {value !== undefined && ` (${value > 0 ? '+' : ''}${value.toFixed(1)}%)`}
        </span>
      )}
    </div>
  );
}

// Compact trend arrow for tables
interface TrendArrowProps {
  direction: 'up' | 'down' | 'stable';
  size?: 'sm' | 'md';
  /** For metrics where up is bad */
  invertColors?: boolean;
}

export function TrendArrow({ direction, size = 'sm', invertColors = false }: TrendArrowProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
  };

  const getColor = () => {
    if (direction === 'stable') return 'text-gray-400';
    const isUp = direction === 'up';
    if (invertColors) {
      return isUp ? 'text-red-500' : 'text-green-500';
    }
    return isUp ? 'text-green-500' : 'text-red-500';
  };

  if (direction === 'stable') {
    return <Minus className={`${sizeClasses[size]} ${getColor()}`} />;
  }

  return direction === 'up' ? (
    <ArrowUp className={`${sizeClasses[size]} ${getColor()}`} />
  ) : (
    <ArrowDown className={`${sizeClasses[size]} ${getColor()}`} />
  );
}

// Headroom indicator with color coding
interface HeadroomIndicatorProps {
  headroom: number;
  size?: 'sm' | 'md' | 'lg';
  showBar?: boolean;
}

export function HeadroomIndicator({ headroom, size = 'md', showBar = false }: HeadroomIndicatorProps) {
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const getColor = () => {
    if (headroom < 0) return 'text-red-600 bg-red-50';
    if (headroom < 10) return 'text-red-500 bg-red-50';
    if (headroom < 20) return 'text-amber-600 bg-amber-50';
    return 'text-green-600 bg-green-50';
  };

  const getBarColor = () => {
    if (headroom < 0) return 'bg-red-500';
    if (headroom < 10) return 'bg-red-400';
    if (headroom < 20) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const displayValue = headroom < 0 ? 'BREACHED' : `${headroom.toFixed(1)}%`;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`px-2 py-0.5 rounded font-medium ${textSizes[size]} ${getColor()}`}
      >
        {displayValue}
      </span>
      {showBar && headroom >= 0 && (
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
          <div
            className={`h-full ${getBarColor()} transition-all duration-300`}
            style={{ width: `${Math.min(headroom, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Days to breach indicator
interface DaysToBreachProps {
  days?: number | null;
  size?: 'sm' | 'md';
  status?: string; // compliance status to show contextual message
}

export function DaysToBreachIndicator({ days, size = 'md', status }: DaysToBreachProps) {
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
  };

  // If days is null/undefined, show contextual message based on status
  if (days === undefined || days === null) {
    const normalizedStatus = status?.toLowerCase() || '';
    
    // If compliant, show "Not at risk"
    if (normalizedStatus === 'compliant' || normalizedStatus === '') {
      return (
        <span className={`${textSizes[size]} text-green-600 font-medium`}>
          Not at risk
        </span>
      );
    }
    
    // For warning/critical without days calculation, show dash
    return <span className={`${textSizes[size]} text-gray-400`}>—</span>;
  }

  if (days <= 0) {
    return (
      <span className={`${textSizes[size]} font-medium text-red-600`}>
        BREACHED
      </span>
    );
  }

  const getColor = () => {
    if (days <= 7) return 'text-red-600';
    if (days <= 30) return 'text-amber-600';
    return 'text-green-600';
  };

  return (
    <span className={`${textSizes[size]} font-medium ${getColor()}`}>
      {days} days
    </span>
  );
}
