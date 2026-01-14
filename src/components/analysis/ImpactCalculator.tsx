'use client';

import React from 'react';
import { CovenantImpact, AffectedSection } from '@/services/api';

interface ImpactCalculatorProps {
  impacts: CovenantImpact[];
  affectedSections: AffectedSection[];
  isLoading?: boolean;
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'compliant':
      return 'text-green-600 bg-green-100';
    case 'warning':
      return 'text-amber-600 bg-amber-100';
    case 'critical':
    case 'breach':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

function getStatusIcon(status: string): string {
  switch (status.toLowerCase()) {
    case 'compliant':
      return '🟢';
    case 'warning':
      return '🟡';
    case 'critical':
    case 'breach':
      return '🔴';
    default:
      return '⚪';
  }
}

function formatValue(value: number): string {
  if (Math.abs(value) < 10) {
    return value.toFixed(2);
  }
  return value.toFixed(1);
}

export function ImpactCalculator({ impacts, affectedSections, isLoading = false }: ImpactCalculatorProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact Analysis</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (impacts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact Analysis</h3>
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>Run a simulation to see covenant impacts</p>
        </div>
      </div>
    );
  }

  const breachCount = impacts.filter(i => i.projected_status.toLowerCase() === 'breach' || i.projected_status.toLowerCase() === 'critical').length;
  const warningCount = impacts.filter(i => i.projected_status.toLowerCase() === 'warning').length;
  const compliantCount = impacts.filter(i => i.projected_status.toLowerCase() === 'compliant').length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact Analysis</h3>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{compliantCount}</div>
          <div className="text-xs text-green-700">Compliant</div>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-lg">
          <div className="text-2xl font-bold text-amber-600">{warningCount}</div>
          <div className="text-xs text-amber-700">Warning</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{breachCount}</div>
          <div className="text-xs text-red-700">Breach</div>
        </div>
      </div>

      {/* Covenant Impacts Table */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Covenant Impacts</h4>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Covenant</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Current</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">After</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {impacts.map((impact, index) => {
                const headroomChange = impact.headroom_change;
                const isWorsening = headroomChange < 0;
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-900">{impact.covenant_type}</div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <span>{getStatusIcon(impact.current_status)}</span>
                        <span className="font-mono">{formatValue(impact.current_value)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <span>{getStatusIcon(impact.projected_status)}</span>
                        <span className="font-mono">{formatValue(impact.projected_value)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        isWorsening ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isWorsening ? '↓' : '↑'} {Math.abs(headroomChange).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Affected Document Sections */}
      {affectedSections.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Affected Document Sections</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <ul className="space-y-2">
              {affectedSections.map((section, index) => (
                <li key={index} className="text-sm text-gray-700">
                  <div className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                    <div>
                      <span className="font-medium">{section.document_name}</span>
                      <span className="text-gray-500"> - Section {section.section_reference} (p.{section.page_number})</span>
                      <p className="text-xs text-gray-500 mt-0.5">{section.impact_description}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImpactCalculator;
