'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { synapseApi } from '@/services/api';
import {
  ArrowLeft,
  FileText,
  BarChart3,
  Mail,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from 'lucide-react';
import TrafficLight, { getTrafficLightStatus } from '@/components/common/TrafficLight';
import { ComplianceChart } from '@/components/monitoring';
import { HeadroomIndicator, DaysToBreachIndicator } from '@/components/monitoring/TrendIndicator';

interface CovenantDetailPageProps {
  params: Promise<{ id: string }>;
}

function CovenantDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="skeleton h-8 w-64 mb-4" />
        <div className="skeleton h-4 w-48 mb-6" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      </div>
      <div className="card p-6">
        <div className="skeleton h-6 w-48 mb-4" />
        <div className="skeleton h-64 w-full" />
      </div>
    </div>
  );
}

export default function CovenantDetailPage({ params }: CovenantDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  // Fetch covenant details
  const { data: covenant, isLoading, error } = useQuery({
    queryKey: ['covenant', id],
    queryFn: () => synapseApi.covenants.get(id),
  });

  // Fetch covenant history
  const { data: history = [] } = useQuery({
    queryKey: ['covenant', id, 'history'],
    queryFn: () => synapseApi.covenants.getHistory(id),
    enabled: !!id,
  });

  // Helper functions for trend display
  // Use trend direction from history if available, otherwise derive from headroom
  const getTrendIcon = (direction: string | null, headroomValue: number) => {
    const trend = direction || (headroomValue < 0 ? 'deteriorating' : headroomValue < 10 ? 'at_risk' : headroomValue > 30 ? 'improving' : 'stable');
    
    if (trend === 'deteriorating') {
      return <TrendingDown className="h-5 w-5 text-red-500" />;
    }
    if (trend === 'at_risk' || (headroomValue >= 0 && headroomValue < 10)) {
      return <TrendingDown className="h-5 w-5 text-amber-500" />;
    }
    if (trend === 'improving') {
      return <TrendingUp className="h-5 w-5 text-green-500" />;
    }
    return <Minus className="h-5 w-5 text-gray-400" />;
  };

  const getTrendLabel = (direction: string | null, headroomValue: number) => {
    // If we have a trend direction from history, use it
    if (direction) {
      return direction.toUpperCase().replace('_', ' ');
    }
    // Otherwise derive from headroom
    if (headroomValue < 0) return 'DETERIORATING';
    if (headroomValue < 10) return 'AT RISK';
    if (headroomValue > 30) return 'IMPROVING';
    return 'STABLE';
  };

  // Transform history for chart - handle backend field names
  // Reverse to show chronological order (oldest to newest) since backend returns newest first
  const chartData = [...history].reverse().map((h) => {
    const date = new Date(h.measured_at || h.timestamp);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: h.measured_value ?? h.value ?? 0,
      status: (h.compliance_status || h.status || 'compliant').toLowerCase(),
      rawDate: date,
    };
  });

  // Calculate dynamic title based on actual date range
  const getChartTitle = () => {
    if (chartData.length < 2) return 'Compliance History';
    
    const firstDate = chartData[0]?.rawDate;
    const lastDate = chartData[chartData.length - 1]?.rawDate;
    
    if (!firstDate || !lastDate) return 'Compliance History';
    
    const diffMs = lastDate.getTime() - firstDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return `Compliance History (${diffDays} Days)`;
    if (diffDays <= 31) return `Compliance History (${Math.ceil(diffDays / 7)} Weeks)`;
    if (diffDays <= 365) return `Compliance History (${Math.ceil(diffDays / 30)} Months)`;
    return `Compliance History (${Math.round(diffDays / 365 * 10) / 10} Years)`;
  };

  if (isLoading) {
    return (
      <div>
        <Link
          href="/monitoring"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Monitoring
        </Link>
        <CovenantDetailSkeleton />
      </div>
    );
  }

  if (error || !covenant) {
    return (
      <div>
        <Link
          href="/monitoring"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Monitoring
        </Link>
        <div className="card p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-red-500">Failed to load covenant details.</p>
          <button
            onClick={() => router.push('/monitoring')}
            className="btn btn--primary mt-4"
          >
            Return to Monitoring
          </button>
        </div>
      </div>
    );
  }

  // Normalize field names (backend uses different names)
  const covenantType = covenant.covenant_type || 'Unknown';
  const covenantName = covenant.covenant_name || covenantType.replace(/_/g, ' ');
  const borrowerName = covenant.borrower_name || 'Unknown Borrower';
  const currentValue = covenant.current_value ?? 0;
  const thresholdValue = covenant.threshold_value ?? covenant.threshold ?? 0;
  const thresholdOperator = covenant.threshold_operator || covenant.operator || '<=';
  const complianceStatus = (covenant.compliance_status || covenant.status || 'compliant').toLowerCase();
  const lastChecked = covenant.last_checked || covenant.created_at || new Date().toISOString();
  
  // Get days_to_breach from latest history entry (not available in covenant object)
  const latestHistoryEntry = history.length > 0 ? history[0] : null;
  const daysToBreachValue = latestHistoryEntry?.days_to_breach ?? covenant.days_to_breach;

  // Calculate headroom based on operator type
  // For "<=" operators (like Leverage Ratio): headroom = ((threshold - current) / threshold) * 100
  // For ">=" operators (like Interest Coverage): headroom = ((current - threshold) / threshold) * 100
  const calculateHeadroom = () => {
    if (thresholdValue === 0) return 0;
    
    if (thresholdOperator === '<=' || thresholdOperator === '<') {
      // For "less than" covenants, headroom is how much room before hitting threshold
      return ((thresholdValue - currentValue) / thresholdValue) * 100;
    } else if (thresholdOperator === '>=' || thresholdOperator === '>') {
      // For "greater than" covenants, headroom is how much above threshold
      return ((currentValue - thresholdValue) / thresholdValue) * 100;
    }
    return 0;
  };
  
  // Use backend headroom if available, otherwise calculate it
  const headroom = covenant.headroom ?? covenant.headroom_percent ?? calculateHeadroom();

  // Get trend direction from latest history entry (reuse latestHistoryEntry from above)
  const trendDirection = latestHistoryEntry?.trend_direction?.toLowerCase() || null;

  const isBreach = complianceStatus === 'breach' || complianceStatus === 'critical';
  const isWarning = complianceStatus === 'warning';

  return (
    <div>
      {/* Back link */}
      <Link
        href="/monitoring"
        className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Monitoring
      </Link>

      {/* Header Card */}
      <div
        className={`card p-6 mb-6 ${
          isBreach
            ? 'border-l-4 border-l-red-500'
            : isWarning
            ? 'border-l-4 border-l-amber-500'
            : 'border-l-4 border-l-green-500'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <TrafficLight
                status={getTrafficLightStatus(complianceStatus)}
                size="lg"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {covenantName} - {borrowerName}
                </h1>
                <p className="text-gray-500">
                  {covenantType.replace(/_/g, ' ')} Covenant
                </p>
              </div>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isBreach
                ? 'bg-red-100 text-red-700'
                : isWarning
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {complianceStatus.toUpperCase()}
          </span>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Current Value</p>
            <p
              className={`text-2xl font-bold ${
                isBreach ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-gray-900'
              }`}
            >
              {currentValue.toFixed(4)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Threshold</p>
            <p className="text-2xl font-bold text-gray-900">
              {thresholdOperator} {thresholdValue.toFixed(4)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Headroom</p>
            <HeadroomIndicator headroom={headroom} size="lg" />
          </div>
        </div>
      </div>

      {/* Compliance History Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ComplianceChart
            data={chartData}
            threshold={thresholdValue}
            title={getChartTitle()}
            height={250}
            covenantType={covenantType}
          />
        </div>

        {/* Trend Analysis */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Analysis</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Direction</span>
              <div className="flex items-center gap-2">
                {getTrendIcon(trendDirection, headroom)}
                <span
                  className={`font-medium ${
                    trendDirection === 'deteriorating' || headroom < 0
                      ? 'text-red-600'
                      : trendDirection === 'improving' || headroom > 30
                      ? 'text-green-600'
                      : headroom < 10
                      ? 'text-amber-600'
                      : 'text-gray-600'
                  }`}
                >
                  {getTrendLabel(trendDirection, headroom)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Days to Breach</span>
              <DaysToBreachIndicator days={daysToBreachValue} status={complianceStatus} />
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Last Checked</span>
              <span className="text-gray-900">
                {new Date(lastChecked).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Root Cause Analysis (if in breach/warning) */}
          {(isBreach || isWarning) && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Potential Root Causes
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Revenue decline in recent quarter</li>
                <li>• Increased operating expenses</li>
                <li>• New debt obligations added</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push(`/scenarios?borrower=${encodeURIComponent(borrowerName)}&from=covenant&covenantId=${covenant.covenant_id || covenant.id}`)}
            className="btn btn--primary flex items-center gap-2"
            title="Run scenario analysis to understand impacts and generate an amendment"
          >
            <BarChart3 className="h-4 w-4" />
            Analyze & Remediate
          </button>
          <button
            onClick={() => router.push(`/amendments?covenant=${covenant.covenant_id || covenant.id}`)}
            className="btn btn--secondary flex items-center gap-2"
            title="View existing amendments for this covenant"
          >
            <FileText className="h-4 w-4" />
            View Amendments
          </button>
          <button className="btn btn--secondary flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Notify Borrower
          </button>
        </div>
        {(isBreach || isWarning) && (
          <p className="text-sm text-gray-500 mt-3">
            💡 Tip: Use "Analyze & Remediate" to run a scenario simulation and generate a data-driven amendment.
          </p>
        )}
      </div>
    </div>
  );
}
