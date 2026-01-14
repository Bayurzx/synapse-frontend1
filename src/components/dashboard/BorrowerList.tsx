'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Building2, Search, Filter, ChevronRight, ChevronDown, ArrowUpDown } from 'lucide-react';
import { Borrower } from '@/services/api';
import RiskScoreCard from './RiskScoreCard';

interface BorrowerListProps {
  borrowers: Borrower[];
  isLoading?: boolean;
}

type SortField = 'name' | 'risk_score' | 'industry' | 'last_assessed';
type SortOrder = 'asc' | 'desc';
type RiskFilter = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH';

export default function BorrowerList({ borrowers, isLoading }: BorrowerListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('ALL');
  const [sortField, setSortField] = useState<SortField>('risk_score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort borrowers
  const filteredBorrowers = useMemo(() => {
    let result = [...borrowers];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.industry.toLowerCase().includes(query)
      );
    }

    // Apply risk filter
    if (riskFilter !== 'ALL') {
      result = result.filter((b) => b.risk_tier === riskFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'risk_score':
          comparison = a.risk_score - b.risk_score;
          break;
        case 'industry':
          comparison = a.industry.localeCompare(b.industry);
          break;
        case 'last_assessed':
          comparison = new Date(a.last_assessed).getTime() - new Date(b.last_assessed).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [borrowers, searchQuery, riskFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const riskCounts = useMemo(() => {
    return {
      ALL: borrowers.length,
      LOW: borrowers.filter((b) => b.risk_tier === 'LOW').length,
      MEDIUM: borrowers.filter((b) => b.risk_tier === 'MEDIUM').length,
      HIGH: borrowers.filter((b) => b.risk_tier === 'HIGH').length,
    };
  }, [borrowers]);

  if (isLoading) {
    return <BorrowerListSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search borrowers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-synapse-primary focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn--secondary flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as RiskFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRiskFilter(filter)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    riskFilter === filter
                      ? filter === 'ALL'
                        ? 'bg-synapse-primary text-white'
                        : filter === 'LOW'
                        ? 'bg-green-500 text-white'
                        : filter === 'MEDIUM'
                        ? 'bg-amber-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase()} ({riskCounts[filter]})
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <div className="flex flex-wrap gap-2">
              {[
                { field: 'risk_score' as SortField, label: 'Risk Score' },
                { field: 'name' as SortField, label: 'Name' },
                { field: 'industry' as SortField, label: 'Industry' },
                { field: 'last_assessed' as SortField, label: 'Last Assessed' },
              ].map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => handleSort(field)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${
                    sortField === field
                      ? 'bg-synapse-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                  {sortField === field && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-gray-500">
        Showing {filteredBorrowers.length} of {borrowers.length} borrowers
      </p>

      {/* Borrowers List */}
      {filteredBorrowers.length > 0 ? (
        <div className="card divide-y divide-gray-100">
          {filteredBorrowers.map((borrower, index) => (
            <BorrowerRow key={borrower.id ? `borrower-${borrower.id}` : `borrower-idx-${index}`} borrower={borrower} />
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No borrowers match your filters</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setRiskFilter('ALL');
            }}
            className="btn btn--secondary mt-4"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

function BorrowerRow({ borrower }: { borrower: Borrower }) {
  // Format company type for display
  const formatCompanyType = (type?: string) => {
    if (!type) return '';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Link
      href={`/borrowers/${borrower.id}`}
      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{borrower.name}</p>
          <p className="text-sm text-gray-500">{borrower.industry}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm text-gray-500">
            {formatCompanyType(borrower.company_type) || 'Company'}
          </p>
          <p className="text-sm text-gray-400">
            {borrower.primary_contact_name || 'No contact'}
          </p>
        </div>
        <RiskScoreCard score={borrower.risk_score} tier={borrower.risk_tier} size="sm" />
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>
    </Link>
  );
}

function BorrowerListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="skeleton h-10 flex-1 rounded-lg" />
        <div className="skeleton h-10 w-24 rounded-lg" />
      </div>
      <div className="card divide-y divide-gray-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="skeleton h-10 w-10 rounded-lg" />
              <div>
                <div className="skeleton h-4 w-32 mb-2" />
                <div className="skeleton h-3 w-24" />
              </div>
            </div>
            <div className="skeleton h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
