'use client';

import React from 'react';
import { ScenarioResult } from '@/services/api';

interface ScenarioComparisonProps {
  scenarios: ScenarioResult[];
  onAddScenario?: () => void;
  onRemoveScenario?: (index: number) => void;
  maxScenarios?: number;
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

function getScenarioLabel(type: string): string {
  switch (type) {
    case 'income_change':
      return 'Income Change';
    case 'expense_change':
      return 'Expense Change';
    case 'debt_change':
      return 'Debt Change';
    case 'interest_rate_change':
      return 'Rate Change';
    case 'economic_downturn':
      return 'Downturn';
    default:
      return type;
  }
}

export function ScenarioComparison({ 
  scenarios, 
  onAddScenario, 
  onRemoveScenario,
  maxScenarios = 5 
}: ScenarioComparisonProps) {
  if (scenarios.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Scenario Comparison</h3>
          {onAddScenario && (
            <button
              onClick={onAddScenario}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Scenario</span>
            </button>
          )}
        </div>
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          <p>Run multiple scenarios to compare them side by side</p>
        </div>
      </div>
    );
  }

  // Get all unique covenant types across all scenarios
  const allCovenantTypes = Array.from(
    new Set(scenarios.flatMap(s => s.covenant_impacts.map(i => i.covenant_type)))
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Scenario Comparison</h3>
        {onAddScenario && scenarios.length < maxScenarios && (
          <button
            onClick={onAddScenario}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Scenario</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="flex space-x-4 min-w-max">
          {scenarios.map((scenario, index) => {
            const breachCount = scenario.covenant_impacts.filter(
              i => i.projected_status === 'breach' || i.projected_status === 'critical'
            ).length;
            const warningCount = scenario.covenant_impacts.filter(
              i => i.projected_status === 'warning'
            ).length;

            return (
              <div 
                key={index} 
                className="flex-shrink-0 w-64 border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Scenario {index + 1}</div>
                      <div className="text-xs text-gray-500">{getScenarioLabel(scenario.scenario_type)}</div>
                    </div>
                    {onRemoveScenario && scenarios.length > 1 && (
                      <button
                        onClick={() => onRemoveScenario(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Breaches:</span>
                    <span className={`font-semibold ${breachCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {breachCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Warnings:</span>
                    <span className={`font-semibold ${warningCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {warningCount}
                    </span>
                  </div>
                </div>

                {/* Covenant Status */}
                <div className="px-4 py-3">
                  <div className="text-xs font-medium text-gray-500 uppercase mb-2">Covenants</div>
                  <div className="space-y-2">
                    {allCovenantTypes.map((covenantType) => {
                      const impact = scenario.covenant_impacts.find(i => i.covenant_type === covenantType);
                      if (!impact) return null;
                      
                      return (
                        <div key={covenantType} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{covenantType}</span>
                          <div className="flex items-center space-x-1">
                            <span>{getStatusIcon(impact.projected_status)}</span>
                            <span className="font-mono text-xs">
                              {impact.projected_value.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recommendations Count */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Recommendations:</span>
                    <span className="font-semibold text-blue-600">{scenario.recommendations.length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
          <span className="flex items-center space-x-1">
            <span>🟢</span>
            <span>Compliant</span>
          </span>
          <span className="flex items-center space-x-1">
            <span>🟡</span>
            <span>Warning</span>
          </span>
          <span className="flex items-center space-x-1">
            <span>🔴</span>
            <span>Breach</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default ScenarioComparison;
