'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { synapseApi } from '@/services/api';
import { wsClient } from '@/services/websocket';
import { RefreshCw, Download, Activity } from 'lucide-react';
import {
  CovenantStatusGrid,
  PortfolioComplianceChart,
  AlertPanel,
  CriticalCovenantList,
} from '@/components/monitoring';
import TrafficLight from '@/components/common/TrafficLight';

function MonitoringSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4">
            <div className="skeleton h-4 w-20 mb-2" />
            <div className="skeleton h-8 w-12" />
          </div>
        ))}
      </div>
      <div className="card p-6">
        <div className="skeleton h-6 w-48 mb-4" />
        <div className="skeleton h-64 w-full" />
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch covenant dashboard data (summary stats)
  const { data: dashboard, isLoading: dashboardLoading, error, refetch } = useQuery({
    queryKey: ['covenants', 'dashboard'],
    queryFn: synapseApi.covenants.getDashboard,
  });

  // Fetch covenants list (for the grid)
  const { data: covenantsList = [], isLoading: covenantsLoading, refetch: refetchCovenants } = useQuery({
    queryKey: ['covenants', 'list'],
    queryFn: synapseApi.covenants.list,
  });

  // Fetch alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => synapseApi.alerts.list(),
  });

  // Acknowledge alert mutation
  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => synapseApi.alerts.acknowledge(id, 'current_user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const covenants = covenantsList || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dashboardData = (dashboard?.data || dashboard || {}) as any;

  // Use summary stats from dashboard API
  const totalCovenants = dashboardData.total_covenants || covenants.length;
  const compliantCount = dashboardData.compliant || covenants.filter(c => (c.compliance_status || c.status) === 'compliant').length;
  const warningCount = dashboardData.warning || covenants.filter(c => (c.compliance_status || c.status) === 'warning').length;
  const breachCount = (dashboardData.breach || 0) + (dashboardData.critical || 0) || covenants.filter(c => {
    const status = c.compliance_status || c.status;
    return status === 'breach' || status === 'critical';
  }).length;
  const complianceRate = dashboardData.compliance_rate 
    ? Math.round(dashboardData.compliance_rate) 
    : (totalCovenants > 0 ? Math.round((compliantCount / totalCovenants) * 100) : 0);

  const isLoading = dashboardLoading || covenantsLoading;

  // WebSocket subscription for real-time updates
  useEffect(() => {
    wsClient.connect();
    
    const unsubscribeCovenant = wsClient.subscribe('covenant:*', () => {
      queryClient.invalidateQueries({ queryKey: ['covenants'] });
    });

    const unsubscribeAlert = wsClient.subscribe('alert:*', () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    });

    return () => {
      unsubscribeCovenant();
      unsubscribeAlert();
    };
  }, [queryClient]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      await refetchCovenants();
      await queryClient.invalidateQueries({ queryKey: ['alerts'] });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGenerateAmendment = (covenantId: string) => {
    const covenant = covenants.find(c => c.id === covenantId || String(c.covenant_id) === covenantId);
    if (covenant) {
      router.push(`/amendments?borrower=${covenant.borrower_name || 'Unknown'}&covenant=${covenantId}`);
    }
  };

  const handleRunScenario = (covenantId: string) => {
    const covenant = covenants.find(c => c.id === covenantId || String(c.covenant_id) === covenantId);
    if (covenant) {
      router.push(`/scenarios?borrower=${covenant.borrower_name || 'Unknown'}`);
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    acknowledgeMutation.mutate(alertId);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Covenant Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time covenant compliance tracking and alerts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn--secondary flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="btn btn--secondary flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {isLoading ? (
        <MonitoringSkeleton />
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-red-500">Failed to load covenant data. Please try again.</p>
          <button onClick={() => refetch()} className="btn btn--primary mt-4">
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Covenants</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalCovenants}</p>
                </div>
                <Activity className="h-8 w-8 text-gray-300" />
              </div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Compliant</p>
                  <p className="text-2xl font-semibold text-green-600">{compliantCount}</p>
                  <p className="text-xs text-gray-400">{complianceRate}% compliance</p>
                </div>
                <TrafficLight status="green" size="lg" />
              </div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Warning</p>
                  <p className="text-2xl font-semibold text-amber-600">{warningCount}</p>
                  <p className="text-xs text-gray-400">Approaching threshold</p>
                </div>
                <TrafficLight status="amber" size="lg" />
              </div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Breach</p>
                  <p className="text-2xl font-semibold text-red-600">{breachCount}</p>
                  <p className="text-xs text-gray-400">Requires action</p>
                </div>
                <TrafficLight status="red" size="lg" />
              </div>
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Covenant Status Matrix - 2 columns */}
            <div className="lg:col-span-2">
              <CovenantStatusGrid
                covenants={covenants}
                onCovenantClick={(covenant) => router.push(`/monitoring/${covenant.id}`)}
              />
            </div>

            {/* Alert Panel - 1 column */}
            <div>
              <AlertPanel
                alerts={alerts}
                onAcknowledge={handleAcknowledgeAlert}
                maxItems={5}
              />
            </div>
          </div>

          {/* Critical Covenants */}
          {(breachCount > 0 || warningCount > 0) && (
            <CriticalCovenantList
              covenants={covenants}
              onGenerateAmendment={handleGenerateAmendment}
              onRunScenario={handleRunScenario}
            />
          )}

          {/* Compliance Trend Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PortfolioComplianceChart height={200} />
            
            {/* Quick Stats */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Average Headroom</span>
                  <span className="font-semibold text-gray-900">
                    {covenants.length > 0
                      ? (() => {
                          const validHeadrooms = covenants
                            .map(c => c.headroom)
                            .filter(h => typeof h === 'number' && !isNaN(h));
                          if (validHeadrooms.length === 0) return '—';
                          const avg = validHeadrooms.reduce((sum, h) => sum + h, 0) / validHeadrooms.length;
                          return `${avg.toFixed(1)}%`;
                        })()
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Covenants at Risk</span>
                  <span className="font-semibold text-amber-600">
                    {covenants.filter(c => typeof c.headroom === 'number' && c.headroom < 20 && c.headroom >= 0).length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Active Alerts</span>
                  <span className="font-semibold text-red-600">
                    {alerts.filter(a => !a.acknowledged).length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Borrowers Monitored</span>
                  <span className="font-semibold text-gray-900">
                    {new Set(covenants.map(c => c.borrower_name)).size}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
