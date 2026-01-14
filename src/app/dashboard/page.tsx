'use client';

import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { synapseApi, Borrower } from '@/services/api';
import { wsClient, WebSocketEvent, RiskScoreUpdatePayload, AlertPayload } from '@/services/websocket';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Bell,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { TrafficLight } from '@/components/dashboard';

// KPI Card Component
function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
  href,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: 'blue' | 'green' | 'amber' | 'red';
  href?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  const content = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
        {trend && trendValue && (
          <div className="mt-2 flex items-center gap-1">
            <TrendIcon className={`h-4 w-4 ${
              trend === 'up' ? 'text-green-500' : 
              trend === 'down' ? 'text-red-500' : 
              'text-gray-400'
            }`} />
            <span className={`text-sm ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-gray-500'
            }`}>
              {trendValue}
            </span>
          </div>
        )}
      </div>
      <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="card p-6 hover:shadow-md transition-shadow cursor-pointer">
        {content}
      </Link>
    );
  }

  return <div className="card p-6">{content}</div>;
}

// Traffic Light Component - now imported from dashboard components

// Risk Distribution Bar Component
function RiskDistributionBar({ borrowers }: { borrowers: Borrower[] }) {
  const counts = {
    LOW: borrowers.filter(b => b.risk_tier === 'LOW').length,
    MEDIUM: borrowers.filter(b => b.risk_tier === 'MEDIUM').length,
    HIGH: borrowers.filter(b => b.risk_tier === 'HIGH').length,
  };
  const total = borrowers.length || 1;

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h2>
      <div className="space-y-3">
        {[
          { tier: 'LOW', label: 'Low Risk', color: 'bg-green-500', count: counts.LOW },
          { tier: 'MEDIUM', label: 'Medium Risk', color: 'bg-amber-500', count: counts.MEDIUM },
          { tier: 'HIGH', label: 'High Risk', color: 'bg-red-500', count: counts.HIGH },
        ].map(({ tier, label, color, count }) => (
          <div key={tier}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">{label}</span>
              <span className="font-medium text-gray-900">{count} ({Math.round((count / total) * 100)}%)</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full transition-all duration-500`}
                style={{ width: `${(count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-6">
            <div className="skeleton h-4 w-24 mb-4" />
            <div className="skeleton h-8 w-16 mb-2" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="skeleton h-6 w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        </div>
        <div className="card p-6">
          <div className="skeleton h-6 w-40 mb-4" />
          <div className="skeleton h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const queryClient = useQueryClient();

  // Fetch borrowers
  const { data: borrowers, isLoading: borrowersLoading, refetch: refetchBorrowers } = useQuery({
    queryKey: ['borrowers-all'],
    queryFn: synapseApi.borrowers.listAll,
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch covenants dashboard (summary stats)
  const { data: covenantsDashboard, isLoading: covenantsLoading, refetch: refetchCovenants } = useQuery({
    queryKey: ['covenants', 'dashboard'],
    queryFn: synapseApi.covenants.getDashboard,
    refetchInterval: 60000,
  });

  // Fetch covenants list (for the matrix)
  const { data: covenantsList, isLoading: covenantsListLoading, refetch: refetchCovenantsList } = useQuery({
    queryKey: ['covenants', 'list'],
    queryFn: synapseApi.covenants.list,
    refetchInterval: 60000,
  });

  // Fetch alerts
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => synapseApi.alerts.list({ acknowledged: false }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Handle WebSocket events for real-time updates
  const handleRiskScoreUpdate = useCallback((event: WebSocketEvent) => {
    const payload = event.payload as RiskScoreUpdatePayload;
    // Invalidate borrowers query to refetch with new data
    queryClient.invalidateQueries({ queryKey: ['borrowers'] });
    console.log('[Dashboard] Risk score updated:', payload);
  }, [queryClient]);

  const handleAlertCreated = useCallback((event: WebSocketEvent) => {
    const payload = event.payload as AlertPayload;
    // Invalidate alerts query to refetch
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
    console.log('[Dashboard] New alert:', payload);
  }, [queryClient]);

  const handleCovenantUpdate = useCallback(() => {
    // Invalidate covenants query to refetch
    queryClient.invalidateQueries({ queryKey: ['covenants', 'dashboard'] });
  }, [queryClient]);

  // Subscribe to WebSocket events
  useEffect(() => {
    const unsubscribeRisk = wsClient.onEvent('RISK_SCORE_UPDATE', handleRiskScoreUpdate);
    const unsubscribeAlert = wsClient.onEvent('ALERT_CREATED', handleAlertCreated);
    const unsubscribeCovenant = wsClient.onEvent('COVENANT_UPDATE', handleCovenantUpdate);

    return () => {
      unsubscribeRisk();
      unsubscribeAlert();
      unsubscribeCovenant();
    };
  }, [handleRiskScoreUpdate, handleAlertCreated, handleCovenantUpdate]);

  const handleRefresh = () => {
    refetchBorrowers();
    refetchCovenants();
    refetchCovenantsList();
    refetchAlerts();
  };

  const isLoading = borrowersLoading || covenantsLoading || covenantsListLoading || alertsLoading;

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Portfolio Overview</h1>
        <DashboardSkeleton />
      </div>
    );
  }

  // Calculate metrics
  const totalBorrowers = borrowers?.length || 0;
  const atRiskBorrowers = borrowers?.filter(b => b.risk_tier === 'HIGH').length || 0;
  
  // Use the dashboard summary data directly from backend
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dashboardData = (covenantsDashboard?.data || covenantsDashboard || {}) as any;
  const totalCovenants = dashboardData.total_covenants || 0;
  const compliantCovenants = dashboardData.compliant || 0;
  const warningCovenants = dashboardData.warning || 0;
  const criticalCovenants = dashboardData.critical || 0;
  const breachCovenants = dashboardData.breach || 0;
  const complianceRate = dashboardData.compliance_rate 
    ? Math.round(dashboardData.compliance_rate) 
    : (totalCovenants > 0 ? Math.round((compliantCovenants / totalCovenants) * 100) : 100);
  const activeAlerts = alerts?.length || 0;

  // Debug logging - remove after verification
  console.log('[Dashboard] Raw data:', {
    borrowers,
    covenantsDashboard,
    dashboardData,
    alerts,
  });
  console.log('[Dashboard] Calculated metrics:', {
    totalBorrowers,
    atRiskBorrowers,
    totalCovenants,
    compliantCovenants,
    warningCovenants,
    criticalCovenants,
    breachCovenants,
    complianceRate,
    activeAlerts,
  });

  // Get status for traffic light - handles both uppercase and lowercase status values
  const getCovenantStatus = (status: string): 'green' | 'amber' | 'red' => {
    const normalizedStatus = status?.toLowerCase() || '';
    switch (normalizedStatus) {
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
  };

  // Group covenants by borrower for the matrix (use covenantsList)
  // Backend returns covenant_code like: DTI, ICR, LEVERAGE, CURRENT, QUICK
  const covenants = covenantsList || [];
  const covenantsByBorrower = covenants.reduce((acc, covenant) => {
    const borrowerName = covenant.borrower_name || 'Unknown';
    if (!acc[borrowerName]) {
      acc[borrowerName] = {};
    }
    // Use compliance_status or status (backend returns uppercase like "COMPLIANT", "WARNING", "BREACH")
    const status = covenant.compliance_status || covenant.status || 'COMPLIANT';
    // Use covenant_code (backend returns: DTI, ICR, LEVERAGE, CURRENT, QUICK)
    const covenantKey = covenant.covenant_code || covenant.covenant_type || '';
    acc[borrowerName][covenantKey] = status;
    return acc;
  }, {} as Record<string, Record<string, string>>);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Portfolio Overview</h1>
        <button
          onClick={handleRefresh}
          className="btn btn--secondary flex items-center gap-2"
          title="Refresh data"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KPICard
          title="Total Borrowers"
          value={totalBorrowers}
          subtitle={`${totalBorrowers > 0 ? '+2 new' : 'No borrowers'}`}
          icon={Users}
          color="blue"
          href="/borrowers"
        />
        <KPICard
          title="At Risk Borrowers"
          value={atRiskBorrowers}
          subtitle={atRiskBorrowers > 0 ? 'Requires attention' : 'All healthy'}
          icon={AlertTriangle}
          color={atRiskBorrowers > 0 ? 'red' : 'green'}
          href="/borrowers?risk=HIGH"
        />
        <KPICard
          title="Covenant Compliance"
          value={`${complianceRate}%`}
          subtitle={`${compliantCovenants}/${totalCovenants} compliant`}
          icon={CheckCircle}
          color={complianceRate >= 90 ? 'green' : complianceRate >= 70 ? 'amber' : 'red'}
          href="/monitoring"
        />
        <KPICard
          title="Active Alerts"
          value={activeAlerts}
          subtitle={activeAlerts > 0 ? 'Unacknowledged' : 'All clear'}
          icon={Bell}
          color={activeAlerts > 0 ? 'amber' : 'green'}
          href="/alerts"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Risk Distribution - Left Column */}
        <div className="lg:col-span-1">
          {borrowers && <RiskDistributionBar borrowers={borrowers} />}
        </div>

        {/* Recent Alerts - Middle Column */}
        <div className="lg:col-span-1">
          <div className="card p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
              <Link href="/alerts" className="text-sm text-blue-600 hover:text-blue-700">
                View all →
              </Link>
            </div>
            
            {alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert, index) => (
                  <div
                    key={alert.id ? `alert-${alert.id}` : `alert-idx-${index}`}
                    className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <div
                      className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                        alert.severity === 'critical' ? 'bg-red-500' :
                        alert.severity === 'warning' ? 'bg-amber-500' :
                        'bg-blue-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {alert.title}
                      </p>
                      <p className="text-xs text-gray-500">{alert.borrower_name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No active alerts</p>
              </div>
            )}
          </div>
        </div>

        {/* Covenant Status Matrix - Right Column */}
        <div className="lg:col-span-1">
          <div className="card p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Covenant Status</h2>
              <Link href="/monitoring" className="text-sm text-blue-600 hover:text-blue-700">
                View all →
              </Link>
            </div>

            {/* Warning banner if there are non-compliant covenants */}
            {(warningCovenants > 0 || criticalCovenants > 0 || breachCovenants > 0) && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span className="text-amber-800">
                    {warningCovenants + criticalCovenants + breachCovenants} covenants need attention
                    {breachCovenants > 0 && <span className="font-medium text-red-600"> ({breachCovenants} breach)</span>}
                  </span>
                </div>
              </div>
            )}

            {Object.keys(covenantsByBorrower).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 font-medium text-gray-500">Borrower</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-500" title="Debt-to-Income">DTI</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-500" title="Interest Coverage Ratio">ICR</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-500" title="Current Ratio">CURR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(covenantsByBorrower).slice(0, 6).map(([borrower, covenantStatuses]) => (
                      <tr key={borrower} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 pr-4 font-medium text-gray-900 truncate max-w-[120px]">
                          {borrower}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {covenantStatuses['DTI'] ? (
                            <TrafficLight status={getCovenantStatus(covenantStatuses['DTI'])} />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {covenantStatuses['ICR'] ? (
                            <TrafficLight status={getCovenantStatus(covenantStatuses['ICR'])} />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {covenantStatuses['CURRENT'] ? (
                            <TrafficLight status={getCovenantStatus(covenantStatuses['CURRENT'])} />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalCovenants > 20 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Showing sample of {Math.min(covenants.length, 20)} / {totalCovenants} covenants
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No covenant data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/documents/generate" className="btn btn--primary flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Generate Document
          </Link>
          <Link href="/scenarios" className="btn btn--secondary flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Run Scenario Analysis
          </Link>
          <Link href="/monitoring" className="btn btn--secondary flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Check Covenants
          </Link>
        </div>
      </div>
    </div>
  );
}
