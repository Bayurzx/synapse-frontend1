'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { synapseApi } from '@/services/api';
import { FileText, Plus, Search, Filter, CheckCircle, Clock, FileEdit, Send, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { TemplateGallery, SignatureStatus } from '@/components/documents';
import type { SignatureStatusType } from '@/components/documents';

type FilterTab = 'all' | 'draft' | 'sent' | 'approved' | 'amendments';

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: synapseApi.documents.list,
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: synapseApi.templates.list,
  });

  // Filter documents based on active tab, search, and additional filters
  const filteredDocuments = documents?.filter((doc) => {
    const docStatus = doc.status || doc.signing_status;
    
    // Tab filter
    if (activeTab === 'draft' && docStatus !== 'draft') return false;
    if (activeTab === 'sent' && docStatus !== 'sent' && docStatus !== 'pending_signature') return false;
    if (activeTab === 'approved' && docStatus !== 'approved' && docStatus !== 'signed' && docStatus !== 'executed') return false;
    if (activeTab === 'amendments' && !doc.document_type.toLowerCase().includes('amendment')) return false;

    // Additional status filter from More Filters
    if (statusFilter.length > 0 && !statusFilter.includes(docStatus)) return false;

    // Date range filter
    if (dateRange.start && new Date(doc.created_at) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(doc.created_at) > new Date(dateRange.end)) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        doc.document_type.toLowerCase().includes(query) ||
        (doc.borrower_name || '').toLowerCase().includes(query) ||
        (doc.document_name || '').toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getDocumentIcon = (documentType: string) => {
    if (documentType.toLowerCase().includes('amendment')) {
      return <FileEdit className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  const getDocumentIconColor = (status: string) => {
    switch (status) {
      case 'signed':
      case 'executed':
      case 'approved':
        return 'bg-green-50 text-green-600';
      case 'pending_signature':
        return 'bg-amber-50 text-amber-600';
      case 'sent':
        return 'bg-blue-50 text-blue-600';
      case 'rejected':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const tabs: { id: FilterTab; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <FileText className="h-4 w-4" /> },
    { id: 'draft', label: 'Draft', icon: <FileEdit className="h-4 w-4" /> },
    { id: 'sent', label: 'Sent for Signature', icon: <Send className="h-4 w-4" /> },
    { id: 'approved', label: 'Approved/Signed', icon: <CheckCircle className="h-4 w-4" /> },
    { id: 'amendments', label: 'Amendments', icon: <FileEdit className="h-4 w-4" /> },
  ];

  const allStatuses = ['draft', 'sent', 'approved', 'rejected', 'signed', 'executed', 'pending_signature'];

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setDateRange({ start: '', end: '' });
    setShowMoreFilters(false);
  };

  const hasActiveFilters = statusFilter.length > 0 || dateRange.start || dateRange.end;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Document Center</h1>
          <p className="text-gray-500 mt-1">
            Manage loan documents, amendments, and track signatures. Use amendment templates for covenant modifications, 
            covenant waivers, or margin adjustments when borrower circumstances change.
          </p>
        </div>
        <Link href="/documents/generate" className="btn btn--primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Generate Document
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents by type or borrower..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`btn flex items-center gap-2 ${hasActiveFilters ? 'btn--primary' : 'btn--secondary'}`}
          >
            <Filter className="h-4 w-4" />
            More Filters
            {hasActiveFilters && (
              <span className="bg-white text-blue-600 text-xs px-1.5 py-0.5 rounded-full">
                {statusFilter.length + (dateRange.start ? 1 : 0) + (dateRange.end ? 1 : 0)}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {/* More Filters Dropdown */}
          {showMoreFilters && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <button 
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear all
                  </button>
                )}
              </div>
              
              {/* Status Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {allStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => toggleStatusFilter(status)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        statusFilter.includes(status)
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {status.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Date Range Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Start date"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="End date"
                  />
                </div>
              </div>
              
              <button
                onClick={() => setShowMoreFilters(false)}
                className="w-full btn btn--primary text-sm"
              >
                Apply Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">Active filters:</span>
          {statusFilter.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full"
            >
              {status.replace(/_/g, ' ')}
              <button onClick={() => toggleStatusFilter(status)} className="hover:text-blue-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {dateRange.start && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full">
              From: {dateRange.start}
              <button onClick={() => setDateRange(prev => ({ ...prev, start: '' }))} className="hover:text-blue-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {dateRange.end && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full">
              To: {dateRange.end}
              <button onClick={() => setDateRange(prev => ({ ...prev, end: '' }))} className="hover:text-blue-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Documents List */}
      <div className="card mb-8">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {activeTab === 'all' ? 'All Documents' : tabs.find(t => t.id === activeTab)?.label}
          </h2>
          <span className="text-sm text-gray-500">
            {filteredDocuments?.length || 0} document{filteredDocuments?.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-32 bg-gray-100 rounded" />
                  </div>
                  <div className="h-6 w-24 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDocuments && filteredDocuments.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredDocuments.map((doc, index) => (
              <Link
                key={doc.id ? `doc-${doc.id}` : `doc-idx-${index}`}
                href={`/documents/${doc.id || doc.document_id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getDocumentIconColor(doc.status || doc.signing_status)}`}>
                    {getDocumentIcon(doc.document_type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {doc.name || doc.document_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {doc.template_id ? doc.template_id.replace(/_/g, ' ').replace(/amendment /i, '') : doc.document_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <SignatureStatus status={(doc.status || doc.signing_status) as SignatureStatusType} size="sm" />
                  <span className="text-sm text-gray-400">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'No documents match your search' : 'No documents yet'}
            </p>
            <Link href="/documents/generate" className="btn btn--primary">
              Generate Your First Document
            </Link>
          </div>
        )}
      </div>

      {/* Template Gallery */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Template Gallery</h2>
          <span className="text-sm text-gray-500">
            {templates?.length || 5} templates available
          </span>
        </div>
        <TemplateGallery templates={templates} isLoading={templatesLoading} />
      </div>
    </div>
  );
}
