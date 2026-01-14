'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import TrafficLight, { getTrafficLightStatus } from '@/components/common/TrafficLight';
import type { Covenant } from '@/services/api';

interface CovenantStatusGridProps {
  covenants: Covenant[];
  onCovenantClick?: (covenant: Covenant) => void;
}

export default function CovenantStatusGrid({ covenants, onCovenantClick }: CovenantStatusGridProps) {
  const [sortBy, setSortBy] = useState<'borrower' | 'status'>('borrower');

  // Group covenants by borrower
  const covenantsByBorrower = covenants.reduce((acc, covenant) => {
    const borrowerName = covenant.borrower_name || 'Unknown';
    if (!acc[borrowerName]) {
      acc[borrowerName] = [];
    }
    acc[borrowerName].push(covenant);
    return acc;
  }, {} as Record<string, Covenant[]>);

  // Get unique covenant types for columns
  const covenantTypes = [...new Set(covenants.map(c => c.covenant_code || c.covenant_type))].sort();

  // Sort borrowers
  const sortedBorrowers = Object.entries(covenantsByBorrower).sort((a, b) => {
    if (sortBy === 'status') {
      // Sort by worst status first
      const getWorstStatus = (covenants: Covenant[]) => {
        if (covenants.some(c => (c.compliance_status || c.status) === 'breach' || (c.compliance_status || c.status) === 'critical')) return 0;
        if (covenants.some(c => (c.compliance_status || c.status) === 'warning')) return 1;
        return 2;
      };
      return getWorstStatus(a[1]) - getWorstStatus(b[1]);
    }
    return a[0].localeCompare(b[0]);
  });

  // Covenant type abbreviations
  const typeAbbreviations: Record<string, string> = {
    'debt_to_income': 'DTI',
    'interest_coverage': 'ICR',
    'leverage': 'LEV',
    'current_ratio': 'CURR',
    'cash_flow': 'CASH',
    'dti': 'DTI',
    'icr': 'ICR',
  };

  const getTypeLabel = (type: string) => {
    return typeAbbreviations[type.toLowerCase()] || type.substring(0, 4).toUpperCase();
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Covenant Status Matrix</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'borrower' | 'status')}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-synapse-primary"
          >
            <option value="borrower">Borrower Name</option>
            <option value="status">Status (Critical First)</option>
          </select>
        </div>
      </div>

      {sortedBorrowers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm sticky left-0 bg-gray-50">
                  Borrower
                </th>
                {covenantTypes.map((type) => (
                  <th
                    key={type}
                    className="text-center py-3 px-4 font-medium text-gray-500 text-sm min-w-[60px]"
                    title={type}
                  >
                    {getTypeLabel(type)}
                  </th>
                ))}
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {sortedBorrowers.map(([borrower, borrowerCovenants]) => {
                const hasIssue = borrowerCovenants.some(
                  c => {
                    const status = c.compliance_status || c.status;
                    return status === 'breach' || status === 'critical' || status === 'warning';
                  }
                );
                return (
                  <tr
                    key={borrower}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      hasIssue ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900 sticky left-0 bg-inherit">
                      <Link
                        href={`/borrowers/${borrowerCovenants[0]?.facility_id?.toString().split('-')[0] || ''}`}
                        className="hover:text-synapse-primary transition-colors"
                      >
                        {borrower}
                      </Link>
                    </td>
                    {covenantTypes.map((type) => {
                      const covenant = borrowerCovenants.find(c => (c.covenant_code || c.covenant_type) === type);
                      const status = covenant ? (covenant.compliance_status || covenant.status) : null;
                      const currentValue = covenant?.current_value ?? covenant?.threshold_value ?? 0;
                      const threshold = covenant?.threshold ?? covenant?.threshold_value ?? 0;
                      const operator = covenant?.operator ?? covenant?.threshold_operator ?? '<=';
                      return (
                        <td key={type} className="py-3 px-4 text-center">
                          {covenant ? (
                            <button
                              onClick={() => onCovenantClick?.(covenant)}
                              className="inline-flex items-center justify-center hover:scale-110 transition-transform"
                              title={`${currentValue.toFixed(2)} ${operator} ${threshold.toFixed(2)}`}
                            >
                              <TrafficLight
                                status={getTrafficLightStatus(status || 'compliant')}
                                size="md"
                              />
                            </button>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-2">
                      <Link
                        href={`/monitoring/${borrowerCovenants[0]?.id || borrowerCovenants[0]?.covenant_id || ''}`}
                        className="text-gray-400 hover:text-synapse-primary transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500">
          <p>No covenant data available</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 p-4 border-t border-gray-200 bg-gray-50">
        <span className="text-sm text-gray-500">Legend:</span>
        <div className="flex items-center gap-2">
          <TrafficLight status="green" size="sm" />
          <span className="text-sm text-gray-600">Compliant</span>
        </div>
        <div className="flex items-center gap-2">
          <TrafficLight status="amber" size="sm" />
          <span className="text-sm text-gray-600">Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <TrafficLight status="red" size="sm" />
          <span className="text-sm text-gray-600">Breach</span>
        </div>
      </div>
    </div>
  );
}
