'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorDisplay 
          error={this.state.error} 
          onRetry={this.handleRetry} 
        />
      );
    }

    return this.props.children;
  }
}

// Standalone error display component
interface ErrorDisplayProps {
  error?: Error | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
}

export function ErrorDisplay({
  error,
  title = 'Something went wrong',
  message,
  onRetry,
  showHomeLink = true,
}: ErrorDisplayProps) {
  const errorMessage = message || error?.message || 'An unexpected error occurred';

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 max-w-md text-center text-gray-500">{errorMessage}</p>
      
      <div className="mt-6 flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-lg bg-synapse-primary px-4 py-2 text-sm font-medium text-white hover:bg-synapse-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
        {showHomeLink && (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>
        )}
      </div>

      {process.env.NODE_ENV === 'development' && error && (
        <details className="mt-6 w-full max-w-lg">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Technical Details
          </summary>
          <pre className="mt-2 overflow-auto rounded-lg bg-gray-100 p-4 text-xs text-gray-700">
            {error.stack || error.message}
          </pre>
        </details>
      )}
    </div>
  );
}

// Empty state component
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-synapse-primary px-4 py-2 text-sm font-medium text-white hover:bg-synapse-primary/90"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Not found component
export function NotFound({ 
  resource = 'Page',
  backLink = '/dashboard',
  backLabel = 'Go to Dashboard'
}: { 
  resource?: string;
  backLink?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="text-6xl font-bold text-gray-200">404</div>
      <h2 className="mt-4 text-xl font-semibold text-gray-900">{resource} Not Found</h2>
      <p className="mt-2 text-gray-500">
        The {resource.toLowerCase()} you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Link
        href={backLink}
        className="mt-6 flex items-center gap-2 rounded-lg bg-synapse-primary px-4 py-2 text-sm font-medium text-white hover:bg-synapse-primary/90"
      >
        <Home className="h-4 w-4" />
        {backLabel}
      </Link>
    </div>
  );
}
