'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, AlertCircle, Info, Check, Clock, ChevronRight, Bell } from 'lucide-react';
import type { Alert } from '@/services/api';

interface AlertPanelProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  maxItems?: number;
  showViewAll?: boolean;
}

export default function AlertPanel({
  alerts,
  onAcknowledge,
  onResolve,
  maxItems = 5,
  showViewAll = true,
}: AlertPanelProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filteredAlerts = alerts
    .filter(alert => {
      if (filter === 'all') return true;
      // Handle case-insensitive comparison for severity
      const alertSeverity = alert.severity?.toLowerCase();
      // Map 'breach' to 'critical' for filtering purposes
      const normalizedSeverity = alertSeverity === 'breach' ? 'critical' : alertSeverity;
      return normalizedSeverity === filter;
    })
    .slice(0, maxItems);

  const getSeverityIcon = (severity: string) => {
    const sev = severity?.toLowerCase();
    switch (sev) {
      case 'critical':
      case 'breach':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    const sev = severity?.toLowerCase();
    switch (sev) {
      case 'critical':
      case 'breach':
        return 'bg-red-50 border-red-100';
      case 'warning':
        return 'bg-amber-50 border-amber-100';
      default:
        return 'bg-blue-50 border-blue-100';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const criticalCount = alerts.filter(a => {
    const sev = a.severity?.toLowerCase();
    return sev === 'critical' || sev === 'breach';
  }).length;
  const warningCount = alerts.filter(a => a.severity?.toLowerCase() === 'warning').length;
  const infoCount = alerts.filter(a => {
    const sev = a.severity?.toLowerCase();
    return sev === 'info' || (sev !== 'critical' && sev !== 'breach' && sev !== 'warning');
  }).length;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Active Alerts</h2>
          {alerts.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              {alerts.filter(a => !a.acknowledged).length} new
            </span>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'text-synapse-primary border-b-2 border-synapse-primary bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({alerts.length})
        </button>
        <button
          onClick={() => setFilter('critical')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'critical'
              ? 'text-red-600 border-b-2 border-red-600 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🔴 Critical ({criticalCount})
        </button>
        <button
          onClick={() => setFilter('warning')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'warning'
              ? 'text-amber-600 border-b-2 border-amber-600 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🟡 Warning ({warningCount})
        </button>
        <button
          onClick={() => setFilter('info')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'info'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ℹ️ Info ({infoCount})
        </button>
      </div>

      {/* Alert list */}
      <div className="divide-y divide-gray-100">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert, index) => (
            <div
              key={alert.id || `alert-${index}`}
              className={`p-4 ${getSeverityBg(alert.severity)} border-l-4 ${
                (() => {
                  const sev = alert.severity?.toLowerCase();
                  if (sev === 'critical' || sev === 'breach') return 'border-l-red-500';
                  if (sev === 'warning') return 'border-l-amber-500';
                  return 'border-l-blue-500';
                })()
              }`}
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {alert.title}
                    </span>
                    {alert.acknowledged && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <Check className="h-3 w-3" />
                        Acknowledged
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{alert.borrower_name}</p>
                  <p className="text-sm text-gray-500 mt-1">{alert.message}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(alert.created_at)}
                    </span>
                    {alert.acknowledged && alert.acknowledged_by && (
                      <span className="text-xs text-gray-400">
                        by {alert.acknowledged_by}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {!alert.acknowledged && onAcknowledge && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="btn btn--secondary text-xs px-2 py-1"
                    >
                      Acknowledge
                    </button>
                  )}
                  {alert.covenant_id && (
                    <Link
                      href={`/monitoring/${alert.covenant_id}`}
                      className="btn btn--secondary text-xs px-2 py-1 flex items-center gap-1"
                    >
                      View <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No alerts to display</p>
          </div>
        )}
      </div>

      {/* View all link */}
      {showViewAll && alerts.length > maxItems && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Link
            href="/alerts"
            className="flex items-center justify-center gap-1 text-sm text-synapse-primary hover:text-synapse-primary/80 font-medium"
          >
            View All Alerts
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

// Compact alert badge for header/sidebar
interface AlertBadgeProps {
  count: number;
  severity?: 'critical' | 'warning' | 'info';
}

export function AlertBadge({ count, severity = 'critical' }: AlertBadgeProps) {
  if (count === 0) return null;

  const colors = {
    critical: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  };

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white rounded-full ${colors[severity]}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
