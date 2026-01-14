'use client';

interface TrafficLightProps {
  status: 'green' | 'amber' | 'red';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showLabel?: boolean;
}

export default function TrafficLight({
  status,
  size = 'md',
  label,
  showLabel = false,
}: TrafficLightProps) {
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

  const displayLabel = label || labels[status];

  return (
    <div className="flex items-center gap-1.5" title={displayLabel}>
      <span
        className={`inline-block rounded-full ${sizeClasses[size]} ${colors[status]}`}
        role="img"
        aria-label={displayLabel}
      />
      {showLabel && <span className="text-xs text-gray-600">{displayLabel}</span>}
    </div>
  );
}

// Covenant status to traffic light status converter
export function getTrafficLightStatus(covenantStatus: string): 'green' | 'amber' | 'red' {
  switch (covenantStatus.toLowerCase()) {
    case 'compliant':
      return 'green';
    case 'warning':
      return 'amber';
    case 'critical':
    case 'breach':
      return 'red';
    default:
      return 'green';
  }
}

// Risk tier to traffic light status converter
export function getRiskTrafficLightStatus(riskTier: string): 'green' | 'amber' | 'red' {
  switch (riskTier.toUpperCase()) {
    case 'LOW':
      return 'green';
    case 'MEDIUM':
      return 'amber';
    case 'HIGH':
      return 'red';
    default:
      return 'green';
  }
}
