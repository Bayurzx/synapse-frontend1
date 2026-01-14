'use client';

import React, { useState } from 'react';
import { ScenarioResult, Recommendation } from '@/services/api';

interface AmendmentPreviewProps {
  scenarioResult: ScenarioResult | null;
  onGenerate: (amendmentType: string, reason: string) => void;
  isGenerating?: boolean;
}

const AMENDMENT_TYPES = [
  { value: 'covenant_modification', label: 'Covenant Modification', description: 'Adjust covenant thresholds' },
  { value: 'covenant_waiver', label: 'Covenant Waiver', description: 'Temporary waiver of covenant' },
  { value: 'margin_adjustment', label: 'Margin Adjustment', description: 'Adjust interest margin' },
  { value: 'maturity_extension', label: 'Maturity Extension', description: 'Extend loan maturity date' },
];

export function AmendmentPreview({ scenarioResult, onGenerate, isGenerating = false }: AmendmentPreviewProps) {
  const [selectedType, setSelectedType] = useState('covenant_modification');
  const [reason, setReason] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  if (!scenarioResult) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Amendment Preview</h3>
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>Run a scenario simulation first to preview amendments</p>
        </div>
      </div>
    );
  }

  const breachedCovenants = (scenarioResult.covenant_impacts || []).filter(
    i => i.projected_status.toLowerCase() === 'breach' || i.projected_status.toLowerCase() === 'critical'
  );

  const handleGenerate = () => {
    const defaultReason = breachedCovenants.length > 0
      ? `Scenario analysis indicates potential covenant breaches: ${breachedCovenants.map(c => c.covenant_type).join(', ')}`
      : 'Proactive covenant adjustment based on scenario analysis';
    
    onGenerate(selectedType, reason || defaultReason);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Amendment Preview</h3>

      {/* Breached Covenants Summary */}
      {breachedCovenants.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="font-medium text-red-800">Projected Covenant Breaches</div>
              <ul className="mt-1 text-sm text-red-700 space-y-1">
                {breachedCovenants.map((covenant, index) => (
                  <li key={index}>
                    {covenant.covenant_type}: {covenant.current_value.toFixed(2)} → {covenant.projected_value.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Amendment Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Amendment Type</label>
        <div className="grid grid-cols-2 gap-2">
          {AMENDMENT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`p-3 text-left border rounded-lg transition-colors ${
                selectedType === type.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{type.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Reason Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason for amendment..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Preview Toggle */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="w-full mb-4 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center space-x-1"
      >
        <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
        <svg className={`w-4 h-4 transition-transform ${showPreview ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Preview Content */}
      {showPreview && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Proposed Changes</div>
          <div className="space-y-2 text-sm">
            {selectedType === 'covenant_modification' && breachedCovenants.map((covenant, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-600">{covenant.covenant_type} Threshold:</span>
                <span>
                  <span className="line-through text-gray-400 mr-2">
                    {covenant.current_value.toFixed(2)}
                  </span>
                  <span className="font-medium text-blue-600">
                    {(covenant.projected_value * 1.1).toFixed(2)}
                  </span>
                </span>
              </div>
            ))}
            {selectedType === 'covenant_waiver' && (
              <div className="text-gray-600">
                Temporary waiver for affected covenants for 90 days
              </div>
            )}
            {selectedType === 'margin_adjustment' && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Interest Margin:</span>
                <span>
                  <span className="line-through text-gray-400 mr-2">+100 bps</span>
                  <span className="font-medium text-blue-600">+150 bps</span>
                </span>
              </div>
            )}
            {selectedType === 'maturity_extension' && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Maturity Extension:</span>
                <span className="font-medium text-blue-600">+12 months</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Generating Amendment...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Generate Amendment</span>
          </>
        )}
      </button>
    </div>
  );
}

export default AmendmentPreview;
