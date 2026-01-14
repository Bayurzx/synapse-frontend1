'use client';

import { FileText, Send, Eye, CheckCircle, Edit, Clock, User } from 'lucide-react';

export interface HistoryEvent {
  id: string;
  type: 'created' | 'edited' | 'sent' | 'viewed' | 'signed' | 'executed' | 'comment';
  description: string;
  timestamp: string;
  user?: string;
  details?: string;
}

interface DocumentHistoryProps {
  events: HistoryEvent[];
  isLoading?: boolean;
}

const eventConfig: Record<string, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  created: {
    icon: <FileText className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  edited: {
    icon: <Edit className="h-4 w-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  sent: {
    icon: <Send className="h-4 w-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  viewed: {
    icon: <Eye className="h-4 w-4" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  signed: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  executed: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  comment: {
    icon: <User className="h-4 w-4" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export function DocumentHistory({ events, isLoading }: DocumentHistoryProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-1/4 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">No history available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-6">
        {events.map((event, index) => {
          const config = eventConfig[event.type] || eventConfig.comment;
          
          return (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon */}
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${config.bgColor} ${config.color} ring-4 ring-white`}
              >
                {config.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {event.description}
                    </p>
                    {event.user && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        by {event.user}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                {event.details && (
                  <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                    {event.details}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper to generate sample history for demo
export function generateSampleHistory(documentId: string): HistoryEvent[] {
  const now = new Date();
  return [
    {
      id: '1',
      type: 'created',
      description: 'Document created',
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: 'John Smith',
    },
    {
      id: '2',
      type: 'edited',
      description: 'Terms updated',
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      user: 'John Smith',
      details: 'Updated interest rate margin from 150 bps to 175 bps',
    },
    {
      id: '3',
      type: 'sent',
      description: 'Sent for signature via DocuSign',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      user: 'John Smith',
    },
    {
      id: '4',
      type: 'viewed',
      description: 'Document viewed by signer',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '5',
      type: 'signed',
      description: 'Document signed',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      user: 'Jane Doe (Borrower)',
    },
  ];
}

export default DocumentHistory;
