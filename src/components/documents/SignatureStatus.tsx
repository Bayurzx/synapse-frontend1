'use client';

import { CheckCircle, Clock, Send, FileSignature, AlertCircle, XCircle } from 'lucide-react';

export type SignatureStatusType = 
  | 'draft'
  | 'pending_signature'
  | 'sent'
  | 'viewed'
  | 'signed'
  | 'executed'
  | 'declined'
  | 'expired'
  | 'approved'
  | 'rejected';

interface SignatureStatusProps {
  status: SignatureStatusType;
  signedAt?: string;
  sentAt?: string;
  signerName?: string;
  signerEmail?: string;
  showTimeline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<SignatureStatusType, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  draft: {
    label: 'Draft',
    icon: <FileSignature className="h-4 w-4" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
  },
  pending_signature: {
    label: 'Pending Signature',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  sent: {
    label: 'Sent for Signature',
    icon: <Send className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  viewed: {
    label: 'Viewed',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  signed: {
    label: 'Signed',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  executed: {
    label: 'Executed',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
  },
  declined: {
    label: 'Declined',
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  expired: {
    label: 'Expired',
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  approved: {
    label: 'Approved',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  rejected: {
    label: 'Rejected',
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

const timelineSteps: SignatureStatusType[] = ['draft', 'sent', 'viewed', 'signed', 'executed'];

export function SignatureStatus({
  status,
  signedAt,
  sentAt,
  signerName,
  signerEmail,
  showTimeline = false,
  size = 'md',
}: SignatureStatusProps) {
  // Fallback to 'draft' if status is not recognized
  const config = statusConfig[status] || statusConfig.draft;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCurrentStepIndex = () => {
    const index = timelineSteps.indexOf(status);
    return index >= 0 ? index : 0;
  };

  if (showTimeline) {
    const currentStep = getCurrentStepIndex();
    
    return (
      <div className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border ${config.bgColor} ${config.color} ${config.borderColor} ${sizeClasses[size]}`}
          >
            {config.icon}
            {config.label}
          </span>
          {signerName && (
            <span className="text-sm text-gray-500">
              {signerName} {signerEmail && `(${signerEmail})`}
            </span>
          )}
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-2">
          {timelineSteps.map((step, index) => {
            const stepConfig = statusConfig[step];
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                {index < timelineSteps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Timeline Labels */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {timelineSteps.map((step, index) => (
            <div key={step} className="flex items-center">
              <span className="w-8 text-center">{statusConfig[step].label.split(' ')[0]}</span>
              {index < timelineSteps.length - 1 && <div className="w-8" />}
            </div>
          ))}
        </div>

        {/* Timestamps */}
        {(sentAt || signedAt) && (
          <div className="text-sm text-gray-500 space-y-1">
            {sentAt && <p>Sent: {formatDate(sentAt)}</p>}
            {signedAt && <p>Signed: {formatDate(signedAt)}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bgColor} ${config.color} ${config.borderColor} ${sizeClasses[size]}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

export default SignatureStatus;
