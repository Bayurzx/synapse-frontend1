'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { synapseApi } from '@/services/api';
import { 
  ArrowLeft, 
  FileText, 
  Send, 
  Download, 
  Building2,
  Calendar,
  Loader2,
  Hash,
  FileCode,
  GitBranch,
  User
} from 'lucide-react';
import Link from 'next/link';
import { DocumentPreview, SignatureStatus, DocumentHistory, generateSampleHistory } from '@/components/documents';
import type { SignatureStatusType } from '@/components/documents';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data: documentData, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: () => synapseApi.documents.get(id),
  });

  const { data: status } = useQuery({
    queryKey: ['document-status', id],
    queryFn: () => synapseApi.documents.getStatus(id),
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!documentData, // Only fetch status if document exists
    retry: false, // Don't retry on error (document may not have envelope)
  });

  const sendMutation = useMutation({
    mutationFn: () => synapseApi.documents.send(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['document-status', id] });
    },
  });

  const handleDownload = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/v1/synapse/documents/${id}/download?format=pdf`
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Download failed' }));
        alert(error.detail || 'Failed to download document');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `document-${id}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download document');
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

  if (!documentData) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Document not found</p>
        <Link href="/documents" className="btn btn--secondary mt-4">
          Back to Documents
        </Link>
      </div>
    );
  }

  // Use correct field names from API response
  // Priority: 1) status endpoint response, 2) document's signing_status, 3) fallback to draft
  const signingStatus = documentData.signing_status || 'draft';
  // Map backend status values to SignatureStatusType
  const mapStatus = (s: string): SignatureStatusType => {
    const statusMap: Record<string, SignatureStatusType> = {
      'draft': 'draft',
      'pending_signature': 'pending_signature',
      'sent': 'sent',
      'viewed': 'viewed',
      'signed': 'signed',
      'executed': 'executed',
      'declined': 'declined',
      'expired': 'expired',
      // Handle any legacy/alternative status names
      'pending': 'pending_signature',
      'completed': 'signed',
    };
    return statusMap[s] || 'draft';
  };
  const signatureStatus = mapStatus(status?.status || signingStatus);
  const canSend = signingStatus === 'draft';
  const history = generateSampleHistory(id);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-500" />
              {documentData.document_name || documentData.document_type?.replace(/_/g, ' ')}
            </h1>
            <p className="text-gray-500 mt-1">
              Document ID: {documentData.document_id}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={!documentData.content_pdf_path}
              className="btn btn--secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!documentData.content_pdf_path ? 'PDF not available' : 'Download PDF'}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            {canSend && (
              <button
                onClick={() => sendMutation.mutate()}
                disabled={sendMutation.isPending}
                className="btn btn--primary flex items-center gap-2"
              >
                {sendMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send for Signature
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - Document Preview */}
        <div className="col-span-2">
          <DocumentPreview 
            documentId={id} 
            hasPdf={!!documentData.content_pdf_path}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Document Info */}
          <div className="card p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Document Details</h2>
            <dl className="space-y-3">
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Document ID</dt>
                  <dd className="text-sm font-medium text-gray-900">{documentData.document_id}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Document Name</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {documentData.document_name || 'N/A'}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileCode className="h-4 w-4 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Document Type</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {documentData.document_type?.replace(/_/g, ' ')}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GitBranch className="h-4 w-4 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Template</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {documentData.template_id?.replace(/_/g, ' ') || 'N/A'}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Facility ID</dt>
                  <dd className="text-sm font-medium text-gray-900">{documentData.facility_id || 'N/A'}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Created By</dt>
                  <dd className="text-sm font-medium text-gray-900">{documentData.created_by || 'N/A'}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Created</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {documentData.created_at ? new Date(documentData.created_at).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
              </div>
              {documentData.is_amendment && (
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-amber-500" />
                  <div>
                    <dt className="text-xs text-gray-500">Amendment</dt>
                    <dd className="text-sm font-medium text-amber-600">Yes (v{documentData.version})</dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {/* Signature Status */}
          <div className="card p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Signature Status</h2>
            <SignatureStatus
              status={signatureStatus}
              showTimeline
              signedAt={status?.signed_at || documentData.signed_at || undefined}
            />
          </div>

          {/* Document History */}
          <div className="card p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Activity History</h2>
            <DocumentHistory events={history} />
          </div>
        </div>
      </div>
    </div>
  );
}
