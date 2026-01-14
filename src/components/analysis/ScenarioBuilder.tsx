'use client';

import React, { useState, useEffect } from 'react';
import { ScenarioParams } from '@/services/api';
import { Sparkles } from 'lucide-react';

export type ScenarioType = 'income_change' | 'expense_change' | 'debt_change' | 'interest_rate_change' | 'economic_downturn';

interface Borrower {
  id: string;
  name: string;
  risk_score: number;
  risk_tier: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface SuggestedScenario {
  type: ScenarioType;
  label: string;
  description: string;
  suggestedChange: number;
  impact: 'high' | 'medium' | 'low';
  rationale: string;
}

interface CovenantContext {
  covenantId: string;
  covenantName: string;
  covenantCode: string;
  currentValue: number;
  threshold: number;
  operator: string;
  status: string;
  formula?: string;
  suggestedScenarios: SuggestedScenario[];
}

interface ScenarioBuilderProps {
  borrowers: Borrower[];
  selectedBorrowerId: string;
  onBorrowerChange: (borrowerId: string) => void;
  onRunSimulation: (params: ScenarioParams) => void;
  isLoading?: boolean;
  covenantContext?: CovenantContext | null;
}

const SCENARIO_TYPES: { value: ScenarioType; label: string; description: string }[] = [
  { value: 'income_change', label: 'Income Change', description: 'Simulate revenue/income changes' },
  { value: 'expense_change', label: 'Expense Change', description: 'Simulate operating expense changes' },
  { value: 'debt_change', label: 'Debt Change', description: 'Simulate new debt or paydowns' },
  { value: 'interest_rate_change', label: 'Interest Rate Change', description: 'Simulate rate environment changes' },
  { value: 'economic_downturn', label: 'Economic Downturn', description: 'Simulate recession scenario' },
];

export function ScenarioBuilder({
  borrowers,
  selectedBorrowerId,
  onBorrowerChange,
  onRunSimulation,
  isLoading = false,
  covenantContext,
}: ScenarioBuilderProps) {
  const [scenarioType, setScenarioType] = useState<ScenarioType>('income_change');
  const [changePercent, setChangePercent] = useState(-15);
  const [includeDebtChange, setIncludeDebtChange] = useState(false);
  const [includeRateShock, setIncludeRateShock] = useState(false);
  const [debtChangePercent, setDebtChangePercent] = useState(10);
  const [rateChangePercent, setRateChangePercent] = useState(2);

  // Auto-select recommended scenario when covenant context is available
  useEffect(() => {
    if (covenantContext && covenantContext.suggestedScenarios && covenantContext.suggestedScenarios.length > 0) {
      const highImpact = covenantContext.suggestedScenarios.find(s => s.impact === 'high');
      if (highImpact) {
        setScenarioType(highImpact.type);
        setChangePercent(highImpact.suggestedChange);
      }
    }
  }, [covenantContext]);

  const handleRunSimulation = () => {
    const parameters: Record<string, number> = {
      change_percent: changePercent / 100,
    };

    if (includeDebtChange) {
      parameters.debt_change_percent = debtChangePercent / 100;
    }
    if (includeRateShock) {
      parameters.rate_change_percent = rateChangePercent / 100;
    }

    onRunSimulation({
      borrower_id: selectedBorrowerId,
      scenario_type: scenarioType,
      parameters,
    });
  };

  const handleSuggestedScenarioClick = (scenario: SuggestedScenario) => {
    setScenarioType(scenario.type);
    setChangePercent(scenario.suggestedChange);
  };

  const selectedBorrower = borrowers.find(b => b.id === selectedBorrowerId);
  const currentSuggestion = covenantContext?.suggestedScenarios?.find(s => s.type === scenarioType);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Scenario Builder</h3>

      {/* Borrower Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Borrower</label>
        <select
          value={selectedBorrowerId}
          onChange={(e) => onBorrowerChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a borrower...</option>
          {borrowers.map((borrower) => (
            <option key={borrower.id} value={borrower.id}>
              {borrower.name} ({borrower.risk_tier})
            </option>
          ))}
        </select>
      </div>

      {/* Selected Borrower Info */}
      {selectedBorrower && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Risk Score</span>
            <span className={`font-semibold ${
              selectedBorrower.risk_tier === 'HIGH' ? 'text-red-600' :
              selectedBorrower.risk_tier === 'MEDIUM' ? 'text-amber-600' : 'text-green-600'
            }`}>
              {selectedBorrower.risk_score}
            </span>
          </div>
        </div>
      )}

      {/* Quick Scenario Suggestions - shown when covenant context is available */}
      {covenantContext && covenantContext.suggestedScenarios && covenantContext.suggestedScenarios.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-800">Suggested for {covenantContext.covenantCode}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {covenantContext.suggestedScenarios.map((scenario, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestedScenarioClick(scenario)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  scenarioType === scenario.type
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-100'
                }`}
                title={scenario.rationale}
              >
                {scenario.impact === 'high' && '⭐ '}
                {scenario.label}
                <span className="ml-1 opacity-75">
                  ({scenario.suggestedChange > 0 ? '+' : ''}{scenario.suggestedChange}%)
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scenario Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Scenario Type</label>
        <select
          value={scenarioType}
          onChange={(e) => setScenarioType(e.target.value as ScenarioType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SCENARIO_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {SCENARIO_TYPES.find(t => t.value === scenarioType)?.description}
        </p>
        {/* Show rationale if this is a suggested scenario */}
        {currentSuggestion && (
          <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {currentSuggestion.rationale}
          </p>
        )}
      </div>

      {/* Change Slider */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {scenarioType === 'income_change' ? 'Income Change' :
           scenarioType === 'expense_change' ? 'Expense Change' :
           scenarioType === 'debt_change' ? 'Debt Change' :
           scenarioType === 'interest_rate_change' ? 'Rate Change' : 'Severity'}
        </label>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold text-gray-900">
              {changePercent > 0 ? '+' : ''}{changePercent}%
            </span>
            <span className={`text-sm px-2 py-1 rounded ${
              changePercent < -10 ? 'bg-red-100 text-red-700' :
              changePercent < 0 ? 'bg-amber-100 text-amber-700' :
              changePercent > 10 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {changePercent < -10 ? 'Severe' :
               changePercent < 0 ? 'Moderate' :
               changePercent > 10 ? 'Strong' : 'Neutral'}
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="30"
            value={changePercent}
            onChange={(e) => setChangePercent(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>-30%</span>
            <span>0%</span>
            <span>+30%</span>
          </div>
        </div>
      </div>

      {/* Additional Parameters */}
      <div className="mb-6 space-y-3">
        <label className="block text-sm font-medium text-gray-700">Additional Parameters</label>
        
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeDebtChange}
            onChange={(e) => setIncludeDebtChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Include debt change</span>
        </label>
        {includeDebtChange && (
          <div className="ml-7 flex items-center space-x-2">
            <input
              type="number"
              value={debtChangePercent}
              onChange={(e) => setDebtChangePercent(Number(e.target.value))}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-sm text-gray-500">% debt increase</span>
          </div>
        )}

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeRateShock}
            onChange={(e) => setIncludeRateShock(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Interest rate shock</span>
        </label>
        {includeRateShock && (
          <div className="ml-7 flex items-center space-x-2">
            <input
              type="number"
              value={rateChangePercent}
              onChange={(e) => setRateChangePercent(Number(e.target.value))}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              step="0.25"
            />
            <span className="text-sm text-gray-500">% rate increase</span>
          </div>
        )}
      </div>

      {/* Run Button */}
      <button
        onClick={handleRunSimulation}
        disabled={!selectedBorrowerId || isLoading}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Running Simulation...</span>
          </>
        ) : (
          <span>Run Simulation</span>
        )}
      </button>
    </div>
  );
}

export default ScenarioBuilder;
