'use client';

import React from 'react';
import { Recommendation } from '@/services/api';

interface RecommendationPanelProps {
  recommendations: Recommendation[];
  onGenerateAmendment?: () => void;
  isLoading?: boolean;
}

function getPriorityColor(priority: number): string {
  if (priority === 1) return 'bg-red-100 text-red-700 border-red-200';
  if (priority === 2) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (priority === 3) return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function getPriorityLabel(priority: number): string {
  if (priority === 1) return 'Critical';
  if (priority === 2) return 'High';
  if (priority === 3) return 'Medium';
  return 'Low';
}

function getTypeIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'covenant_waiver':
      return '🛡️';
    case 'covenant_modification':
      return '📝';
    case 'margin_adjustment':
      return '💰';
    case 'maturity_extension':
      return '📅';
    case 'collateral_enhancement':
      return '🔒';
    default:
      return '💡';
  }
}

export function RecommendationPanel({ 
  recommendations, 
  onGenerateAmendment,
  isLoading = false 
}: RecommendationPanelProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p>Run a simulation to get recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>

      <div className="space-y-3 mb-6">
        {recommendations.map((rec, index) => (
          <div 
            key={index}
            className={`border rounded-lg p-4 ${getPriorityColor(rec.priority)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getTypeIcon(rec.type)}</span>
                <span className="font-medium">{rec.description}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(rec.priority)}`}>
                {getPriorityLabel(rec.priority)}
              </span>
            </div>
            <p className="text-sm opacity-80">{rec.rationale}</p>
          </div>
        ))}
      </div>

      {onGenerateAmendment && recommendations.length > 0 && (
        <button
          onClick={onGenerateAmendment}
          className="w-full py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Generate Amendment</span>
        </button>
      )}
    </div>
  );
}

export default RecommendationPanel;
