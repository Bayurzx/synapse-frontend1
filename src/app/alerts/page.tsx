'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { synapseApi } from '@/services/api';
import { Bell, Check, Eye } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

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
      </div>

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
