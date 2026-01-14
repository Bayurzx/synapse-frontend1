'use client';

import Link from 'next/link';
import { AlertTriangle, FileText, BarChart3, ChevronRight } from 'lucide-react';
import TrafficLight, { getTrafficLightStatus } from '@/components/common/TrafficLight';
import TrendIndicator, { HeadroomIndicator, DaysToBreachIndicator } from './TrendIndicator';
import type { Covenant } from '@/services/api';

interface CriticalCovenantCardProps {
  covenant: Covenant;
  onGenerateAmendment?: (covenantId: string) => void;
  onRunScenario?: (covenantId: string) => void;
}

export default function CriticalCovenantCard({
  covenant,
  onGenerateAmendment,
  onRunScenario,
}: CriticalCovenantCardProps) {
  const status = covenant.compliance_status || covenant.status;
  const isBreach = status === 'breach' || status === 'critical';
  const currentValue = covenant.current_value ?? covenant.threshold_value ?? 0;
  const threshold = covenant.threshold ?? covenant.threshold_value ?? 0;
  const operator = covenant.operator ?? covenant.threshold_operator ?? '<=';
  const headroom = covenant.headroom ?? 0;
  const covenantId = covenant.id || String(covenant.covenant_id);

  // Determine trend direction based on headroom
  const getTrendDirection = (): 'improving' | 'stable' | 'deteriorating' => {
    if (headroom < 0) return 'deteriorating';
    if (headroom < 10) return 'deteriorating';
    if (headroom < 20) return 'stable';
    return 'improving';
  };

  return (
    <div
      className={`rounded-lg border p-4 ${
        isBreach
          ? 'bg-red-50 border-red-200'
          : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <TrafficLight
              status={getTrafficLightStatus(status)}
              size="lg"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {covenant.borrower_name || 'Unknown'}
              </span>
              <span className="text-gray-500">—</span>
              <span className="font-medium text-gray-700">
                {covenant.covenant_name || covenant.covenant_type}
              </span>
            </div>
            
            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Current:</span>
                <span className="ml-1 font-medium text-gray-900">
                  {currentValue.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Threshold:</span>
                <span className="ml-1 font-medium text-gray-900">
                  {operator} {threshold.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Headroom:</span>
                <span className="ml-1">
                  <HeadroomIndicator headroom={headroom} size="sm" />
                </span>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Trend:</span>
                <TrendIndicator
                  direction={getTrendDirection()}
                  size="sm"
                  showLabel={true}
                  invertColors={operator.includes('<')}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Days to breach:</span>
                <DaysToBreachIndicator days={covenant.days_to_breach} size="sm" status={status} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href={`/monitoring/${covenantId}`}
            className="btn btn--secondary text-sm flex items-center gap-1"
          >
            View Details
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 pt-3 border-t border-gray-200/50 flex items-center gap-2">
        <button
          onClick={() => onGenerateAmendment?.(covenantId)}
          className="btn btn--primary text-sm flex items-center gap-1"
        >
          <FileText className="h-4 w-4" />
          Generate Amendment
        </button>
        <button
          onClick={() => onRunScenario?.(covenantId)}
          className="btn btn--secondary text-sm flex items-center gap-1"
        >
          <BarChart3 className="h-4 w-4" />
          Run Scenario
        </button>
      </div>
    </div>
  );
}

// List of critical covenants
interface CriticalCovenantListProps {
  covenants: Covenant[];
  onGenerateAmendment?: (covenantId: string) => void;
  onRunScenario?: (covenantId: string) => void;
}

export function CriticalCovenantList({
  covenants,
  onGenerateAmendment,
  onRunScenario,
}: CriticalCovenantListProps) {
  const criticalCovenants = covenants.filter(c => {
    const status = c.compliance_status || c.status;
    return status === 'breach' || status === 'critical' || status === 'warning';
  });

  if (criticalCovenants.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Critical Covenants
        </h2>
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No critical covenants requiring attention</p>
        </div>
      </div>
    );
  }

  // Sort by severity (breach first, then warning)
  const sortedCovenants = [...criticalCovenants].sort((a, b) => {
    const severityOrder: Record<string, number> = { breach: 0, critical: 0, warning: 1, compliant: 2 };
    const statusA = a.compliance_status || a.status;
    const statusB = b.compliance_status || b.status;
    return (severityOrder[statusA] || 2) - (severityOrder[statusB] || 2);
  });

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Critical Covenants
        </h2>
        <span className="text-sm text-gray-500">
          {criticalCovenants.length} requiring attention
        </span>
      </div>
      <div className="space-y-4">
        {sortedCovenants.map((covenant) => (
          <CriticalCovenantCard
            key={covenant.id || covenant.covenant_id}
            covenant={covenant}
            onGenerateAmendment={onGenerateAmendment}
            onRunScenario={onRunScenario}
          />
        ))}
      </div>
    </div>
  );
}
