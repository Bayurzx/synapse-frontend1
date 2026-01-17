'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { synapseApi } from '@/services/api';
import { Bell, Check, Eye, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [checkLimit, setCheckLimit] = useState(3);
  const [excludeRecent, setExcludeRecent] = useState(true);
  const [randomSample, setRandomSample] = useState(true);
  const [onlyNonCompliant, setOnlyNonCompliant] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [checkResults, setCheckResults] = useState<any>(null);

  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => synapseApi.alerts.list(),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => synapseApi.alerts.acknowledge(id, 'current_user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const checkCovenantsMutation = useMutation({
    mutationFn: (params: {
      limit: number;
      random_sample: boolean;
      exclude_recent: boolean;
      only_non_compliant: boolean;
    }) => synapseApi.covenants.check({
      check_all: true,
      limit: params.limit,
      random_sample: params.random_sample,
      exclude_recent: params.exclude_recent,
      only_non_compliant: params.only_non_compliant,
      dry_run: false,
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['covenants'] });
      setShowCheckModal(false);
      setCheckResults(data.data);
      setShowResults(true);
    },
    onError: (error) => {
      alert(`Failed to check covenants: ${error}`);
    },
  });

  const filteredAlerts = alerts?.filter((alert) => {
    if (filter === 'all') return true;
    return alert.severity === filter;
  });

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          dot: 'bg-red-500',
          badge: 'bg-red-100 text-red-700',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          dot: 'bg-amber-500',
          badge: 'bg-amber-100 text-amber-700',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          dot: 'bg-blue-500',
          badge: 'bg-blue-100 text-blue-700',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          dot: 'bg-gray-500',
          badge: 'bg-gray-100 text-gray-700',
        };
    }
  };

  const handleViewAlert = (alert: { covenant_id?: string; borrower_id: string }) => {
    if (alert.covenant_id) {
      router.push(`/monitoring/${alert.covenant_id}`);
    } else {
      router.push(`/borrowers/${alert.borrower_id}`);
    }
  };

  const handleCheckCovenants = () => {
    checkCovenantsMutation.mutate({
      limit: checkLimit,
      random_sample: randomSample,
      exclude_recent: excludeRecent,
      only_non_compliant: onlyNonCompliant,
    });
  };

  // Count alerts by severity for filter tabs
  const alertCounts = {
    critical: alerts?.filter((a) => a.severity === 'critical').length || 0,
    warning: alerts?.filter((a) => a.severity === 'warning').length || 0,
    info: alerts?.filter((a) => a.severity === 'info').length || 0,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Alerts</h1>
        <button
          onClick={() => setShowCheckModal(true)}
          className="btn btn--primary flex items-center gap-2"
          disabled={checkCovenantsMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 ${checkCovenantsMutation.isPending ? 'animate-spin' : ''}`} />
          Check Covenants
        </button>
      </div>

      {/* Check Covenants Modal */}
      {showCheckModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Check Covenant Compliance</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Borrowers to Check (max 12)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={checkLimit}
                  onChange={(e) => setCheckLimit(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Each borrower takes ~40 seconds to check (multiple covenants)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="onlyNonCompliant"
                  checked={onlyNonCompliant}
                  onChange={(e) => setOnlyNonCompliant(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="onlyNonCompliant" className="text-sm text-gray-700">
                  Only check borrowers with breach/warning covenants
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="randomSample"
                  checked={randomSample}
                  onChange={(e) => setRandomSample(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="randomSample" className="text-sm text-gray-700">
                  Random sample (otherwise checks oldest first)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="excludeRecent"
                  checked={excludeRecent}
                  onChange={(e) => setExcludeRecent(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="excludeRecent" className="text-sm text-gray-700">
                  Exclude borrowers checked in last 24 hours
                </label>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Estimated time:</strong> ~{Math.floor(checkLimit * 40 / 60)} min {checkLimit * 40 % 60} sec
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Checking {checkLimit} borrower{checkLimit > 1 ? 's' : ''} with all their covenants
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCheckModal(false)}
                className="flex-1 btn btn--secondary"
                disabled={checkCovenantsMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleCheckCovenants}
                className="flex-1 btn btn--primary"
                disabled={checkCovenantsMutation.isPending}
              >
                {checkCovenantsMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  'Start Check'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'critical', 'warning', 'info'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab !== 'all' && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-white/20">
                {alertCounts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Check Results Card */}
      {showResults && checkResults && (
        <div className="card p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                Covenant Check Complete
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Checked {checkResults.checked_count} covenants
              </p>
            </div>
            <button
              onClick={() => setShowResults(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {checkResults.summary.compliant}
              </div>
              <div className="text-sm text-gray-600">Compliant</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">
                {checkResults.summary.warning}
              </div>
              <div className="text-sm text-gray-600">Warning</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {checkResults.summary.critical}
              </div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                {checkResults.summary.breach}
              </div>
              <div className="text-sm text-gray-600">Breach</div>
            </div>
          </div>

          {(checkResults.summary.warning > 0 || checkResults.summary.critical > 0 || checkResults.summary.breach > 0) && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                ⚠️ New alerts may have been created for status changes. Check the alerts list below.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Alerts List */}
      {isLoading ? (
        <div className="card divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4">
              <div className="skeleton h-5 w-48 mb-2" />
              <div className="skeleton h-4 w-64 mb-2" />
              <div className="skeleton h-3 w-32" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-red-500">Failed to load alerts. Please try again.</p>
        </div>
      ) : filteredAlerts && filteredAlerts.length > 0 ? (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const styles = getSeverityStyles(alert.severity);
            return (
              <div
                key={alert.id}
                className={`card p-4 ${styles.bg} border ${styles.border}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 rounded-full ${styles.dot}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{alert.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles.badge}`}>
                          {alert.severity}
                        </span>
                        {alert.acknowledged && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Acknowledged
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{alert.borrower_name}</span>
                        <span>•</span>
                        <span>{new Date(alert.created_at).toLocaleString()}</span>
                        {alert.acknowledged_by && (
                          <>
                            <span>•</span>
                            <span>Acknowledged by {alert.acknowledged_by}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeMutation.mutate(alert.id)}
                        disabled={acknowledgeMutation.isPending}
                        className="btn btn--secondary text-sm flex items-center gap-1"
                      >
                        <Check className="h-4 w-4" />
                        Acknowledge
                      </button>
                    )}
                    <button 
                      onClick={() => handleViewAlert(alert)}
                      className="btn btn--secondary text-sm flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No alerts found</p>
        </div>
      )}
    </div>
  );
}
