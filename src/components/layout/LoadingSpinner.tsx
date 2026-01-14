'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export default function LoadingSpinner({ 
  size = 'md', 
  className = '',
  label 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin text-synapse-primary ${sizeClasses[size]}`} />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  );
}

// Full page loading state
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <LoadingSpinner size="xl" />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

// Skeleton components for loading states
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-white p-6 shadow-sm ${className}`}>
      <div className="h-4 w-1/3 rounded bg-gray-200" />
      <div className="mt-4 h-8 w-1/2 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-1/4 rounded bg-gray-200" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="h-4 w-1/4 rounded bg-gray-200" />
          <div className="h-4 w-1/4 rounded bg-gray-200" />
          <div className="h-4 w-1/4 rounded bg-gray-200" />
          <div className="h-4 w-1/4 rounded bg-gray-200" />
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-gray-100 p-4">
          <div className="flex gap-4">
            <div className="h-4 w-1/4 rounded bg-gray-100" />
            <div className="h-4 w-1/4 rounded bg-gray-100" />
            <div className="h-4 w-1/4 rounded bg-gray-100" />
            <div className="h-4 w-1/4 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 w-1/3 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div 
      className="animate-pulse rounded-lg bg-white p-4 shadow-sm"
      style={{ height }}
    >
      <div className="h-4 w-1/4 rounded bg-gray-200" />
      <div className="mt-4 flex h-[calc(100%-40px)] items-end gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div 
            key={i} 
            className="flex-1 rounded-t bg-gray-100"
            style={{ height: `${Math.random() * 60 + 20}%` }}
          />
        ))}
      </div>
    </div>
  );
}
