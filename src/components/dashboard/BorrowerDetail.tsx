'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  FileText,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  DollarSign,
  Activity,
  FileEdit,
  Download,
  Shield,
} from 'lucide-react';
import { synapseApi, RiskProfile, Facility, Amendment } from '@/services/api';
import RiskScoreCard, { TrafficLight } from './RiskScoreCard';
import RiskTrendChart from './RiskTrendChart';

interface BorrowerDetailProps {
  borrowerId: string;
}

export default function BorrowerDetail({ borrowerId }: BorrowerDetailProps) {
  // Validate borrowerId before making API calls
  const isValidId = Boolean(borrowerId && borrowerId !== 'undefined' && borrowerId.trim() !== '');

  // Fetch borrower details
  const { data: borrower, isLoading: borrowerLoading } = useQuery({
    queryKey: ['borrower', borrowerId],
    queryFn: () => synapseApi.borrowers.get(borrowerId),
    enabled: isValidId,
  });

  // Fetch risk profile
  const { data: riskProfile, isLoading: riskLoading } = useQuery({
    queryKey: ['borrower', borrowerId, 'risk-profile'],
    queryFn: () => synapseApi.borrowers.getRiskProfile(borrowerId),
    enabled: isValidId,
  });

  // Fetch facilities
  const { data: facilities, isLoading: facilitiesLoading } = useQuery({
    queryKey: ['borrower', borrowerId, 'facilities'],
    queryFn: () => synapseApi.facilities.getByBorrower(borrowerId),
    enabled: isValidId,
  });

  // Fetch amendments for this borrower
  const { data: allAmendments } = useQuery({
    queryKey: ['amendments'],
    queryFn: synapseApi.amendments.list,
    enabled: isValidId,
  });

  // Filter amendments for this borrower
  const borrowerAmendments = allAmendments?.filter(
    (a) => a.borrower_id?.toString() === borrowerId
  ) || [];

  const isLoading = borrowerLoading || riskLoading || facilitiesLoading;

  // TODO: Debug logging - remove after fixing
  // console.log('=== BorrowerDetail Debug ===');
  // console.log('borrowerId:', borrowerId);
  // console.log('borrower data:', borrower);
  // console.log('riskProfile data:', riskProfile);
  // console.log('facilities data:', facilities);
  // console.log('============================');

  // Show error if borrowerId is invalid
  if (!isValidId) {
    return (
      <div className="card p-8 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-amber-500" />
        <p className="text-gray-700 font-medium">Invalid borrower ID</p>
        <Link href="/borrowers" className="btn btn--primary mt-4">
          Back to Borrowers
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <BorrowerDetailSkeleton />;
  }

  if (!borrower) {
    return (
      <div className="card p-8 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-amber-500" />
        <p className="text-gray-700 font-medium">Borrower not found</p>
        <Link href="/borrowers" className="btn btn--primary mt-4">
          Back to Borrowers
        </Link>
      </div>
    );
  }

  // Generate mock trend data for demo
  const trendData = generateMockTrendData(borrower.risk_score);

  // Calculate total exposure from facilities
  const totalExposure = facilities?.reduce((acc, f) => acc + (f.commitment_amount || 0), 0) || 0;
  const facilitiesCount = facilities?.length || 0;
  const activeCovenants = facilities?.reduce((acc, f) => acc + (f.status === 'active' ? 1 : 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/borrowers"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{borrower.name}</h1>
            <p className="text-gray-500">
              {borrower.industry} • {borrower.status === 'active' ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
        <RiskScoreCard
          score={borrower.risk_score}
          tier={borrower.risk_tier}
          size="lg"
          showLabel
          trend={riskProfile?.trend}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Exposure"
          value={`$${(totalExposure / 1000000).toFixed(1)}M`}
          color="blue"
        />
        <StatCard
          icon={FileText}
          label="Facilities"
          value={facilitiesCount.toString()}
          color="green"
        />
        <StatCard
          icon={Activity}
          label="Active Covenants"
          value={activeCovenants.toString()}
          color="amber"
        />
        <StatCard
          icon={Calendar}
          label="Last Assessed"
          value={formatRelativeTime(riskProfile?.last_updated || borrower.last_assessed)}
          color="gray"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk Trend Chart */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Score Trend</h2>
            <RiskTrendChart
              data={trendData}
              height={180}
              title="12-Month Trend"
              threshold={60}
            />
          </div>

          {/* Key Risk Factors */}
          {riskProfile && riskProfile.key_factors && riskProfile.key_factors.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Risk Factors</h2>
              <div className="space-y-4">
                {riskProfile.key_factors.map((factor, index) => (
                  <RiskFactorRow key={index} factor={factor} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Facilities */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Facilities</h2>
              <Link href={`/documents?borrower=${borrowerId}`} className="text-sm text-blue-600 hover:text-blue-700">
                View all →
              </Link>
            </div>
            {facilities && facilities.length > 0 ? (
              <div className="space-y-3">
                {facilities.slice(0, 3).map((facility) => (
                  <FacilityCard key={facility.id} facility={facility} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No facilities found</p>
            )}
          </div>

          {/* Amendments */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Amendments</h2>
              <Link href="/amendments" className="text-sm text-blue-600 hover:text-blue-700">
                View all →
              </Link>
            </div>
            {borrowerAmendments.length > 0 ? (
              <div className="space-y-3">
                {borrowerAmendments.slice(0, 5).map((amendment) => (
                  <AmendmentCard key={amendment.id} amendment={amendment} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No amendments found</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/monitoring?borrowerId=${borrowerId}&borrowerName=${encodeURIComponent(borrower.name)}`}
                className="btn btn--primary w-full flex items-center justify-center gap-2"
              >
                <Shield className="h-4 w-4" />
                View Covenants
              </Link>
              <Link
                href={`/documents/generate?borrower=${borrowerId}`}
                className="btn btn--secondary w-full flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Generate Document
              </Link>
              <Link
                href={`/scenarios?borrower=${encodeURIComponent(borrower.name)}&borrowerId=${borrowerId}`}
                className="btn btn--secondary w-full flex items-center justify-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Run Scenario
              </Link>
              <Link
                href={`/amendments?borrower=${borrowerId}`}
                className="btn btn--secondary w-full flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Create Amendment
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'amber' | 'gray';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function RiskFactorRow({ factor }: { factor: RiskProfile['key_factors'][0] }) {
  const impactColors = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50',
  };

  const ImpactIcon = factor.impact === 'positive' ? TrendingDown : factor.impact === 'negative' ? TrendingUp : Minus;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded ${impactColors[factor.impact]}`}>
          <ImpactIcon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{factor.name}</p>
          <p className="text-sm text-gray-500">{factor.description}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">{factor.value.toFixed(2)}</p>
        {factor.threshold && (
          <p className="text-xs text-gray-500">Threshold: {factor.threshold}</p>
        )}
      </div>
    </div>
  );
}

function FacilityCard({ facility }: { facility: Facility }) {
  const utilizationPercent = facility.commitment_amount > 0 
    ? (facility.outstanding_amount / facility.commitment_amount) * 100 
    : 0;
  const utilizationStatus: 'green' | 'amber' | 'red' =
    utilizationPercent < 70 ? 'green' : utilizationPercent < 90 ? 'amber' : 'red';

  return (
    <div className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-gray-900 text-sm">{facility.facility_type}</p>
        <TrafficLight status={utilizationStatus} size="sm" />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          ${(facility.outstanding_amount / 1000000).toFixed(1)}M / ${(facility.commitment_amount / 1000000).toFixed(1)}M
        </span>
        <span className="text-gray-400">{utilizationPercent.toFixed(0)}%</span>
      </div>
      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            utilizationStatus === 'green' ? 'bg-green-500' :
            utilizationStatus === 'amber' ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
        />
      </div>
    </div>
  );
}

function BorrowerDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="skeleton h-10 w-10 rounded-lg" />
        <div className="skeleton h-12 w-12 rounded-xl" />
        <div>
          <div className="skeleton h-6 w-48 mb-2" />
          <div className="skeleton h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4">
            <div className="skeleton h-16 w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="skeleton h-48 w-full" />
        </div>
        <div className="card p-6">
          <div className="skeleton h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Unknown';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function AmendmentCard({ amendment }: { amendment: Amendment }) {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending_review: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    sent_for_signature: 'bg-purple-100 text-purple-700',
    sent: 'bg-purple-100 text-purple-700',
    signed: 'bg-green-100 text-green-700',
    executed: 'bg-green-100 text-green-700',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    sent_for_signature: 'Sent for Signature',
    sent: 'Sent',
    signed: 'Signed',
    executed: 'Executed',
  };

  const typeLabels: Record<string, string> = {
    covenant_modification: 'Covenant Mod',
    covenant_waiver: 'Waiver',
    margin_adjustment: 'Margin Adj',
    maturity_extension: 'Extension',
  };

  return (
    <Link
      href={`/amendments/${amendment.id}`}
      className="block p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileEdit className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900 text-sm">
            {amendment.amendment_number ? `Amendment #${amendment.amendment_number}` : 'Amendment'}
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[amendment.status] || 'bg-gray-100 text-gray-700'}`}>
          {statusLabels[amendment.status] || amendment.status}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-1">
        {typeLabels[amendment.amendment_type] || amendment.amendment_type}
      </p>
      <p className="text-xs text-gray-400 truncate">{amendment.change_summary}</p>
      {(amendment.status === 'signed' || amendment.status === 'executed') && (
        <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
          <Download className="h-3 w-3" />
          <span>Signed PDF available</span>
        </div>
      )}
    </Link>
  );
}

function generateMockTrendData(currentScore: number): { date: string; value: number }[] {
  const data = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    
    // Generate realistic trend towards current score
    const baseScore = currentScore - 10 + Math.random() * 5;
    const trend = (11 - i) / 11;
    const value = baseScore + (currentScore - baseScore) * trend + (Math.random() - 0.5) * 8;
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(0, Math.min(100, value)),
    });
  }
  
  // Ensure last value is close to current score
  data[data.length - 1].value = currentScore;
  
  return data;
}
