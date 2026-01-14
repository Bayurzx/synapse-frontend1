'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Activity, 
  Bell, 
  TrendingUp, 
  FileEdit,
  ChevronLeft,
  ChevronRight,
  Plus,
  Zap,
  X
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Portfolio overview' },
  { href: '/borrowers', label: 'Borrowers', icon: Users, description: 'Manage borrowers' },
  { href: '/documents', label: 'Documents', icon: FileText, description: 'Document center' },
  { href: '/monitoring', label: 'Monitoring', icon: Activity, description: 'Covenant monitoring' },
  { href: '/alerts', label: 'Alerts', icon: Bell, description: 'Alert management' },
  { href: '/scenarios', label: 'Scenarios', icon: TrendingUp, description: 'What-if analysis' },
  { href: '/amendments', label: 'Amendments', icon: FileEdit, description: 'Loan amendments' },
];

const quickActions = [
  { href: '/documents?action=generate', label: 'New Document', icon: Plus },
  { href: '/scenarios?action=new', label: 'Run Scenario', icon: Zap },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-700 px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-synapse-primary">
              <span className="text-lg font-bold text-white">S</span>
            </div>
            <span className="text-xl font-semibold text-white">SYNAPSE</span>
          </Link>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-synapse-primary mx-auto">
            <span className="text-lg font-bold text-white">S</span>
          </div>
        )}
        {/* Mobile close button */}
        {mobileOpen && onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Quick Actions */}
      {!collapsed && (
        <div className="px-3 py-4 border-b border-gray-700">
          <p className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Quick Actions
          </p>
          <div className="space-y-1">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  onClick={onMobileClose}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-synapse-secondary hover:bg-gray-700 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span>{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {!collapsed && (
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Navigation
          </p>
        )}
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-synapse-primary text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <div className="flex-1">
                      <span>{item.label}</span>
                      <p className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-500 group-hover:text-gray-400'}`}>
                        {item.description}
                      </p>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-gray-700 p-4">
          <div className="rounded-lg bg-gray-800 p-3">
            <p className="text-xs font-medium text-gray-400">Synapse Platform</p>
            <p className="text-xs text-gray-500">v1.0.0 • LMA EDGE</p>
          </div>
        </div>
      )}

      {/* Toggle Button - Desktop only */}
      <button
        onClick={onToggle}
        className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 items-center justify-center rounded-full border border-gray-600 bg-synapse-dark text-gray-400 hover:text-white"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col fixed left-0 top-0 z-40 h-screen bg-synapse-dark transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onMobileClose}
          />
          {/* Sidebar */}
          <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-synapse-dark lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
