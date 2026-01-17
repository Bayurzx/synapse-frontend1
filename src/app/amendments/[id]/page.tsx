'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { synapseApi, Amendment } from '@/services/api';
import { 
  ArrowLeft, 
  FileEdit, 
  Send, 
  Check,
  X,
  Building2,
  Calendar,
  Loader2,
  Hash,
  FileText,
  User,
  AlertTriangle,
  Clock,
  Download,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SignerModal } from '@/components/common/SignerModal';
import ExecuteAmendmentDialog from '@/components/common/ExecuteAmendmentDialog';
import Confetti from '@/components/common/Confetti';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AmendmentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showSignerModal, setShowSignerModal] = useState(false);
  const [showExecuteDialog, setShowExecuteDialog] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Find amendment from list (since backend may not have individual get endpoint working)
  const { data: amendments, isLoading, refetch } = useQuery({
    queryKey: ['amendments'],
    queryFn: synapseApi.amendments.list,
  });

  const amendment = amendments?.find(a => a.id === id);

  const submitForReviewMutation = useMutation({
    mutationFn: () => {
      if (!amendment?.document_id) throw new Error('Document ID not found');
      return synapseApi.amendments.submitForReview(amendment.document_id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['amendments'] });
      await refetch();
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => {
      if (!amendment?.document_id) throw new Error('Document ID not found');
      return synapseApi.amendments.approve(amendment.document_id, 'synapse_user', 'Approved via Synapse UI');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['amendments'] });
      await refetch();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!amendment?.document_id) throw new Error('Document ID not found');
      return synapseApi.amendments.reject(amendment.document_id, 'Rejected via Synapse UI - terms not acceptable', 'synapse_user');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['amendments'] });
      await refetch();
    },
  });

  const sendMutation = useMutation({
    mutationFn: (signers?: Array<{ email: string; name: string }>) => {
      if (!amendment?.document_id) throw new Error('Document ID not found');
      return synapseApi.amendments.send(amendment.document_id, signers);
    },
    onSuccess: async () => {
      setShowSignerModal(false);
      await queryClient.invalidateQueries({ queryKey: ['amendments'] });
      await refetch();
    },
  });

  const handleSendWithSigners = async (signers: Array<{ email: string; name: string }>) => {
    await sendMutation.mutateAsync(signers);
  };

  const executeMutation = useMutation({
    mutationFn: () => {
      if (!amendment?.document_id) throw new Error('Document ID not found');
      return synapseApi.amendments.execute(amendment.document_id);
    },
    onSuccess: async () => {
      // Show confetti!
      setShowConfetti(true);
      setShowExecuteDialog(false);
      
      // Hide confetti after animation
      setTimeout(() => setShowConfetti(false), 4000);
      
      await queryClient.invalidateQueries({ queryKey: ['amendments'] });
      await refetch();
    },
  });

  const handleExecute = async () => {
    await executeMutation.mutateAsync();
  };

  const handleDownloadPdf = async () => {
    if (!amendment?.document_id) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/v1/synapse/documents/${amendment.document_id}/download?format=pdf`
      );
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.detail || 'Failed to download document');
        return;
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${amendment.document_name || 'document'}_signed.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download document');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'executed':
      case 'signed':
        return 'bg-green-100 text-green-700';
      case 'approved':
      case 'sent':
      case 'sent_for_signature':
        return 'bg-blue-100 text-blue-700';
      case 'pending_review':
        return 'bg-amber-100 text-amber-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileEdit className="h-5 w-5 text-gray-500" />;
      case 'pending_review':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'approved':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <X className="h-5 w-5 text-red-500" />;
      case 'sent':
      case 'sent_for_signature':
        return <Send className="h-5 w-5 text-blue-500" />;
      case 'signed':
      case 'executed':
        return <Check className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
        <div className="h-8 w-64 bg-gray-200 rounded mb-6" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-96 bg-gray-100 rounded-lg" />
          <div className="h-96 bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!amendment) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-amber-400" />
        <p className="text-gray-500">Amendment not found</p>
        <p className="text-sm text-gray-400 mt-1">ID: {id}</p>
        <Link href="/amendments" className="btn btn--secondary mt-4">
          Back to Amendments
        </Link>
      </div>
    );
  }

  const canSubmitForReview = amendment.status === 'draft';
  const canApprove = amendment.status === 'pending_review';
  const canReject = amendment.status === 'pending_review';
  const canSend = amendment.status === 'approved';
  const canExecute = amendment.status === 'signed';

  return (
    <div>
      {/* Confetti Animation */}
      <Confetti active={showConfetti} duration={4000} />

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/amendments"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Amendments
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
              <FileEdit className="h-6 w-6 text-blue-500" />
              {amendment.document_name || `Amendment ${amendment.amendment_number || ''}`}
            </h1>
            <p className="text-gray-500 mt-1">
              {amendment.borrower_name} • {amendment.amendment_type.replace(/_/g, ' ')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canSubmitForReview && (
              <button
                onClick={() => submitForReviewMutation.mutate()}
                disabled={submitForReviewMutation.isPending}
                className="btn btn--secondary flex items-center gap-2"
              >
                {submitForReviewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit for Review
              </button>
            )}
            {canReject && (
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending}
                className="btn btn--secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Reject
              </button>
            )}
            {canApprove && (
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="btn btn--primary flex items-center gap-2"
              >
                {approveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Approve
              </button>
            )}
            {canSend && (
              <button
                onClick={() => setShowSignerModal(true)}
                disabled={sendMutation.isPending}
                className="btn btn--primary flex items-center gap-2"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send for Signature
              </button>
            )}
            {canExecute && (
              <button
                onClick={() => setShowExecuteDialog(true)}
                className="btn bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Execute Amendment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Signer Modal */}
      <SignerModal
        isOpen={showSignerModal}
        onClose={() => setShowSignerModal(false)}
        onSend={handleSendWithSigners}
        documentName={amendment?.document_name || `Amendment ${amendment?.amendment_number || ''}`}
        isLoading={sendMutation.isPending}
      />

      {/* Execute Amendment Dialog */}
      <ExecuteAmendmentDialog
        isOpen={showExecuteDialog}
        onClose={() => setShowExecuteDialog(false)}
        onExecute={handleExecute}
        amendmentName={amendment?.document_name || `Amendment ${amendment?.amendment_number || ''}`}
        borrowerName={amendment?.borrower_name || 'Unknown Borrower'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Change Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="card p-6">
            <div className="flex items-center gap-4">
              {getStatusIcon(amendment.status)}
              <div>
                <p className="text-sm text-gray-500">Current Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(amendment.status)}`}>
                  {amendment.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Change Summary */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Change Summary</h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-600">{amendment.change_summary}</p>
            </div>
          </div>

          {/* Workflow */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Amendment Workflow</h2>
            <div className="flex items-center gap-2 text-sm overflow-x-auto pb-2">
              {[
                { key: 'draft', label: 'Draft', icon: '📝' },
                { key: 'pending_review', label: 'Pending Review', icon: '⏳' },
                { key: 'approved', label: 'Approved', icon: '✅' },
                { key: 'sent', label: 'Sent', icon: '✍️' },
                { key: 'signed', label: 'Signed', icon: '📄' },
                { key: 'executed', label: 'Executed', icon: '✅' },
              ].map((step, index, arr) => {
                const isActive = step.key === amendment.status || 
                  (step.key === 'sent' && amendment.status === 'sent_for_signature');
                const isPast = arr.findIndex(s => s.key === amendment.status || 
                  (s.key === 'sent' && amendment.status === 'sent_for_signature')) > index;
                const isRejected = amendment.status === 'rejected';
                
                return (
                  <div key={step.key} className="flex items-center">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap ${
                      isActive ? 'bg-blue-100 text-blue-700' : 
                      isPast ? 'bg-green-50 text-green-600' : 
                      'bg-gray-50 text-gray-400'
                    }`}>
                      <span>{step.icon}</span>
                      <span>{step.label}</span>
                    </div>
                    {index < arr.length - 1 && (
                      <span className={`mx-2 ${isPast ? 'text-green-400' : 'text-gray-300'}`}>→</span>
                    )}
                  </div>
                );
              })}
              {amendment.status === 'rejected' && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 text-red-700 whitespace-nowrap ml-4">
                  <span>❌</span>
                  <span>Rejected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Amendment Details */}
          <div className="card p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Amendment Details</h2>
            <dl className="space-y-3">
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Amendment ID</dt>
                  <dd className="text-sm font-medium text-gray-900 font-mono">{amendment.id}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileEdit className="h-4 w-4 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Amendment Type</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {amendment.amendment_type.replace(/_/g, ' ')}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Borrower</dt>
                  <dd className="text-sm font-medium text-gray-900">{amendment.borrower_name}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Facility</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {amendment.facility_name || `Facility ${amendment.facility_id}`}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Created By</dt>
                  <dd className="text-sm font-medium text-gray-900">{amendment.created_by}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Created</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {new Date(amendment.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Quick Actions */}
          <div className="card p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {/* Download Signed PDF - only show when signed */}
              {(amendment.status === 'signed' || amendment.status === 'executed') && (
                <button
                  onClick={handleDownloadPdf}
                  className="btn btn--primary w-full justify-center flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Signed PDF
                </button>
              )}
              <Link
                href={`/borrowers/${amendment.borrower_id}`}
                className="btn btn--secondary w-full justify-center"
              >
                View Borrower
              </Link>
              <Link
                href="/scenarios"
                className="btn btn--secondary w-full justify-center"
              >
                Run New Scenario
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
