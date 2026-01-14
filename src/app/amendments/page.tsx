'use client';

import { useQuery } from '@tanstack/react-query';
import { synapseApi } from '@/services/api';
import { FileEdit, Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type FilterStatus = 'all' | 'draft' | 'pending_review' | 'approved' | 'executed';

export default function AmendmentsPage() {
  const [filter, setFilter] = useState<FilterStatus>('all');
  
  const { data: amendments, isLoading } = useQuery({
    queryKey: ['amendments'],
    queryFn: synapseApi.amendments.list,
  });

  // Filter amendments based on selected filter
  const filteredAmendments = amendments?.filter((amendment) => {
    if (filter === 'all') return true;
    if (filter === 'executed') {
      return amendment.status === 'executed' || amendment.status === 'signed';
    }
    if (filter === 'approved') {
      return amendment.status === 'approved' || amendment.status === 'sent' || amendment.status === 'sent_for_signature';
    }
    return amendment.status === filter;
  });

  // Count amendments by status for filter badges
  const statusCounts = {
    all: amendments?.length || 0,
    draft: amendments?.filter(a => a.status === 'draft').length || 0,
    pending_review: amendments?.filter(a => a.status === 'pending_review').length || 0,
    approved: amendments?.filter(a => ['approved', 'sent', 'sent_for_signature'].includes(a.status)).length || 0,
    executed: amendments?.filter(a => ['executed', 'signed'].includes(a.status)).length || 0,
  };

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'pending_review', label: 'Pending Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'executed', label: 'Executed' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'executed':
      case 'signed':
        return 'badge badge--success';
      case 'approved':
      case 'sent_for_signature':
        return 'badge badge--info';
      case 'pending_review':
        return 'badge badge--warning';
      case 'rejected':
        return 'badge badge--danger';
      default:
        return 'badge badge--info';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return '📝';
      case 'pending_review':
        return '⏳';
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'sent_for_signature':
        return '✍️';
      case 'signed':
        return '📄';
      case 'executed':
        return '✅';
      default:
        return '📋';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Amendments</h1>
        <Link href="/scenarios" className="btn btn--primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Generate Amendment
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
              filter === tab.key ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              {statusCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Amendments List */}
      {isLoading ? (
        <div className="card divide-y divide-gray-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4">
              <div className="skeleton h-5 w-48 mb-2" />
              <div className="skeleton h-4 w-64 mb-2" />
              <div className="skeleton h-3 w-32" />
            </div>
          ))}
        </div>
      ) : filteredAmendments && filteredAmendments.length > 0 ? (
        <div className="card divide-y divide-gray-100">
          {filteredAmendments.map((amendment) => (
            <Link
              key={amendment.id}
              href={`/amendments/${amendment.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getStatusIcon(amendment.status)}</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {amendment.document_name || `Amendment #${amendment.amendment_number || amendment.id.slice(-6)}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {amendment.borrower_name} • {amendment.amendment_type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {amendment.change_summary}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={getStatusBadge(amendment.status)}>
                  {amendment.status.replace(/_/g, ' ')}
                </span>
                <span className="text-sm text-gray-400">
                  {new Date(amendment.created_at).toLocaleDateString()}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <FileEdit className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No amendments yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Generate an amendment from the Scenario Analysis page
          </p>
          <Link href="/scenarios" className="btn btn--primary mt-4">
            Go to Scenario Analysis
          </Link>
        </div>
      )}

      {/* Workflow Legend */}
      <div className="card p-4 mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Amendment Workflow</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span>📝</span>
            <span className="text-gray-600">Draft</span>
          </div>
          <span className="text-gray-300">→</span>
          <div className="flex items-center gap-2">
            <span>⏳</span>
            <span className="text-gray-600">Pending Review</span>
          </div>
          <span className="text-gray-300">→</span>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span className="text-gray-600">Approved</span>
          </div>
          <span className="text-gray-300">→</span>
          <div className="flex items-center gap-2">
            <span>✍️</span>
            <span className="text-gray-600">Sent for Signature</span>
          </div>
          <span className="text-gray-300">→</span>
          <div className="flex items-center gap-2">
            <span>📄</span>
            <span className="text-gray-600">Signed</span>
          </div>
          <span className="text-gray-300">→</span>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span className="text-gray-600">Executed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
