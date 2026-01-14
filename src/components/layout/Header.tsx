'use client';

import { Bell, Settings, User, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { synapseApi, Alert } from '@/services/api';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [alertCount, setAlertCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Fetch unacknowledged alerts count
    const fetchAlerts = async () => {
      try {
        const alerts = await synapseApi.alerts.list({ acknowledged: false });
        setAlertCount(alerts.length);
        setRecentAlerts(alerts.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      }
    };

    fetchAlerts();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-synapse-border bg-white px-4 lg:px-6">
      {/* Left side - Menu button for mobile */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        {/* Breadcrumb or page title could go here */}
        <div className="hidden lg:block">
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-500 hover:text-gray-700"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {alertCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border border-synapse-border bg-white shadow-lg">
              <div className="border-b border-synapse-border p-3">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {recentAlerts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No new notifications
                  </div>
                ) : (
                  recentAlerts.map((alert, index) => (
                    <div
                      key={alert.id ? `alert-${alert.id}` : `alert-idx-${index}`}
                      className="border-b border-synapse-border p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 h-2 w-2 rounded-full ${getSeverityColor(
                            alert.severity
                          )}`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {alert.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {alert.borrower_name}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-synapse-border p-2">
                <a
                  href="/alerts"
                  className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-synapse-primary hover:bg-synapse-light"
                >
                  View all alerts
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          className="p-2 text-gray-500 hover:text-gray-700"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 border-l border-synapse-border pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-synapse-primary text-white">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden text-sm font-medium text-gray-700 lg:block">
            John Smith
          </span>
        </div>
      </div>
    </header>
  );
}
