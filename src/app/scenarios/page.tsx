'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { synapseApi, ScenarioParams, ScenarioResult, Covenant } from '@/services/api';
import {
  ScenarioBuilder,
  ImpactCalculator,
  RecommendationPanel,
  ScenarioComparison,
  AmendmentPreview,
} from '@/components/analysis';
import { Info, Lightbulb } from 'lucide-react';

// Covenant context for scenario suggestions
export interface CovenantContext {
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

export interface SuggestedScenario {
  type: 'income_change' | 'expense_change' | 'debt_change' | 'interest_rate_change' | 'economic_downturn';
  label: string;
  description: string;
  suggestedChange: number;
  impact: 'high' | 'medium' | 'low';
  rationale: string;
}

// Map covenant codes to their formulas and recommended scenarios
const COVENANT_SCENARIO_MAP: Record<string, {
  formula: string;
  components: string[];
  scenarios: Omit<SuggestedScenario, 'suggestedChange'>[];
}> = {
  'ICR': {
    formula: 'EBITDA ÷ Interest Expense',
    components: ['EBITDA (earnings)', 'Interest Expense'],
    scenarios: [
      { type: 'income_change', label: 'Increase Revenue', description: 'Higher revenue increases EBITDA', impact: 'high', rationale: 'Revenue growth directly improves EBITDA, the numerator of ICR' },
      { type: 'expense_change', label: 'Reduce Operating Costs', description: 'Lower expenses increase EBITDA', impact: 'high', rationale: 'Cost reduction improves EBITDA without needing revenue growth' },
      { type: 'debt_change', label: 'Pay Down Debt', description: 'Less debt means lower interest expense', impact: 'medium', rationale: 'Reducing debt lowers interest payments, improving the ratio' },
      { type: 'interest_rate_change', label: 'Rate Environment', description: 'Test impact of rate changes on interest expense', impact: 'medium', rationale: 'Variable rate debt is sensitive to rate changes' },
    ],
  },
  'DTI': {
    formula: 'Total Debt ÷ Total Income',
    components: ['Total Debt', 'Total Income'],
    scenarios: [
      { type: 'income_change', label: 'Increase Income', description: 'Higher income reduces DTI ratio', impact: 'high', rationale: 'Income growth directly reduces the debt-to-income ratio' },
      { type: 'debt_change', label: 'Reduce Debt', description: 'Paying down debt improves DTI', impact: 'high', rationale: 'Debt reduction directly improves the ratio' },
    ],
  },
  'LR': {
    formula: 'Total Debt ÷ EBITDA',
    components: ['Total Debt', 'EBITDA'],
    scenarios: [
      { type: 'income_change', label: 'Increase EBITDA', description: 'Higher earnings reduce leverage', impact: 'high', rationale: 'EBITDA growth reduces the leverage ratio' },
      { type: 'debt_change', label: 'Reduce Debt', description: 'Paying down debt reduces leverage', impact: 'high', rationale: 'Debt reduction directly improves leverage' },
      { type: 'expense_change', label: 'Cut Operating Costs', description: 'Lower costs increase EBITDA', impact: 'medium', rationale: 'Cost reduction improves EBITDA' },
    ],
  },
  'CR': {
    formula: 'Current Assets ÷ Current Liabilities',
    components: ['Current Assets', 'Current Liabilities'],
    scenarios: [
      { type: 'income_change', label: 'Improve Cash Position', description: 'Higher revenue increases current assets', impact: 'medium', rationale: 'Revenue growth improves cash and receivables' },
      { type: 'debt_change', label: 'Reduce Short-term Debt', description: 'Lower current liabilities improve ratio', impact: 'high', rationale: 'Paying down short-term debt directly improves current ratio' },
    ],
  },
  'DSCR': {
    formula: 'Net Operating Income ÷ Total Debt Service',
    components: ['Net Operating Income', 'Debt Service (Principal + Interest)'],
    scenarios: [
      { type: 'income_change', label: 'Increase NOI', description: 'Higher operating income improves coverage', impact: 'high', rationale: 'NOI growth directly improves debt service coverage' },
      { type: 'expense_change', label: 'Reduce Operating Expenses', description: 'Lower expenses increase NOI', impact: 'high', rationale: 'Cost reduction improves net operating income' },
      { type: 'debt_change', label: 'Refinance Debt', description: 'Lower debt service payments', impact: 'medium', rationale: 'Refinancing can reduce principal and interest payments' },
      { type: 'interest_rate_change', label: 'Rate Impact', description: 'Test rate sensitivity on debt service', impact: 'medium', rationale: 'Rate changes affect interest portion of debt service' },
    ],
  },
};

// Default scenarios for unknown covenant types
const DEFAULT_SCENARIOS: Omit<SuggestedScenario, 'suggestedChange'>[] = [
  { type: 'income_change', label: 'Revenue Change', description: 'Simulate income increase or decrease', impact: 'medium', rationale: 'Revenue changes affect most financial covenants' },
  { type: 'expense_change', label: 'Expense Change', description: 'Simulate operating cost changes', impact: 'medium', rationale: 'Expense changes affect profitability metrics' },
  { type: 'debt_change', label: 'Debt Change', description: 'Simulate debt increase or paydown', impact: 'medium', rationale: 'Debt levels affect leverage and coverage ratios' },
];

// Build covenant context from API data
function buildCovenantContext(covenant: Covenant): CovenantContext {
  const code = covenant.covenant_code || covenant.covenant_type?.toUpperCase() || 'UNKNOWN';
  const mapping = COVENANT_SCENARIO_MAP[code] || { formula: 'Unknown', components: [], scenarios: DEFAULT_SCENARIOS };
  
  // Calculate suggested change based on how far from threshold
  const threshold = covenant.threshold_value ?? covenant.threshold ?? 0;
  const current = covenant.current_value ?? 0;
  const operator = covenant.threshold_operator || covenant.operator || '>=';
  
  // Determine how much improvement is needed
  let gapPercent = 0;
  if (operator === '>=' || operator === '>') {
    gapPercent = threshold > 0 ? ((threshold - current) / threshold) * 100 : 0;
  } else {
    gapPercent = current > 0 ? ((current - threshold) / current) * 100 : 0;
  }
  
  // Suggest a change that would close the gap plus add buffer
  const suggestedChange = Math.min(Math.max(Math.ceil(gapPercent * 1.2), 5), 30);
  
  return {
    covenantId: String(covenant.covenant_id || covenant.id),
    covenantName: covenant.covenant_name || code,
    covenantCode: code,
    currentValue: current,
    threshold: threshold,
    operator: operator,
    status: (covenant.compliance_status || covenant.status || 'unknown').toLowerCase(),
    formula: mapping.formula,
    suggestedScenarios: mapping.scenarios.map(s => ({
      ...s,
      suggestedChange: s.type === 'income_change' ? suggestedChange : 
                       s.type === 'expense_change' ? -suggestedChange :
                       s.type === 'debt_change' ? -suggestedChange : suggestedChange,
    })),
  };
}

function ScenariosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedBorrowerId, setSelectedBorrowerId] = useState('');
  const [currentResult, setCurrentResult] = useState<ScenarioResult | null>(null);
  const [comparisonScenarios, setComparisonScenarios] = useState<ScenarioResult[]>([]);
  const [activeTab, setActiveTab] = useState<'analysis' | 'comparison'>('analysis');
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const [covenantContext, setCovenantContext] = useState<CovenantContext | null>(null);

  // Get URL params (passed from monitoring page or borrower detail)
  const borrowerNameFromUrl = searchParams.get('borrower');
  const borrowerIdFromUrl = searchParams.get('borrowerId');
  const covenantIdFromUrl = searchParams.get('covenantId');
  const fromContext = searchParams.get('from');

  // Fetch borrowers
  const { data: borrowers = [] } = useQuery({
    queryKey: ['borrowers-all'],
    queryFn: synapseApi.borrowers.listAll,
  });

  // Fetch covenant details if coming from a covenant breach
  const { data: covenantData } = useQuery({
    queryKey: ['covenant', covenantIdFromUrl],
    queryFn: () => synapseApi.covenants.get(covenantIdFromUrl!),
    enabled: !!covenantIdFromUrl && fromContext === 'covenant',
  });

  // Build covenant context when data is available
  useEffect(() => {
    if (covenantData && fromContext === 'covenant') {
      setCovenantContext(buildCovenantContext(covenantData));
    }
  }, [covenantData, fromContext]);

  // Auto-select borrower when coming from monitoring page or borrower detail
  useEffect(() => {
    if (borrowers.length > 0 && !selectedBorrowerId) {
      // First try to match by borrower ID (from borrower detail page)
      if (borrowerIdFromUrl) {
        const matchingBorrower = borrowers.find(
          (b) => b.id === borrowerIdFromUrl
        );
        if (matchingBorrower) {
          setSelectedBorrowerId(matchingBorrower.id);
          setShowWorkflowGuide(true);
          return;
        }
      }
      // Then try to match by borrower name (from monitoring page)
      if (borrowerNameFromUrl) {
        const matchingBorrower = borrowers.find(
          (b) => b.name.toLowerCase() === decodeURIComponent(borrowerNameFromUrl).toLowerCase()
        );
        if (matchingBorrower) {
          setSelectedBorrowerId(matchingBorrower.id);
          setShowWorkflowGuide(true);
        }
      }
    }
  }, [borrowerNameFromUrl, borrowerIdFromUrl, borrowers, selectedBorrowerId]);

  // Simulation mutation
  const simulationMutation = useMutation({
    mutationFn: synapseApi.scenarios.simulate,
    onSuccess: (result) => {
      setCurrentResult(result);
      setResultAddedToComparison(false); // Reset when new simulation runs
    },
  });

  // Amendment generation mutation
  const amendmentMutation = useMutation({
    mutationFn: (params: { borrower_id: string; facility_id: string; amendment_type: string; reason: string }) =>
      synapseApi.amendments.generate(params),
    onSuccess: (amendment) => {
      router.push(`/amendments/${amendment.id}`);
    },
  });

  const handleRunSimulation = (params: ScenarioParams) => {
    simulationMutation.mutate(params);
  };

  // Track if current result has been added to comparison
  const [resultAddedToComparison, setResultAddedToComparison] = useState(false);

  const handleAddToComparison = () => {
    if (currentResult && comparisonScenarios.length < 5 && !resultAddedToComparison) {
      // Create a deep copy to avoid reference issues
      const scenarioCopy = JSON.parse(JSON.stringify(currentResult));
      setComparisonScenarios([...comparisonScenarios, scenarioCopy]);
      setResultAddedToComparison(true);
    }
  };

  const handleRemoveFromComparison = (index: number) => {
    setComparisonScenarios(comparisonScenarios.filter((_, i) => i !== index));
  };

  const handleGenerateAmendment = async (amendmentType: string, reason: string) => {
    if (!selectedBorrowerId || !currentResult) return;

    // Get first facility for the borrower (simplified)
    try {
      const facilities = await synapseApi.facilities.getByBorrower(selectedBorrowerId);
      if (facilities.length > 0) {
        amendmentMutation.mutate({
          borrower_id: selectedBorrowerId,
          facility_id: facilities[0].id,
          amendment_type: amendmentType,
          reason: reason,
        });
      }
    } catch (error) {
      console.error('Failed to get facilities:', error);
    }
  };

  return (
    <div className="p-6">
      {/* Covenant Context Banner - shown when coming from a specific covenant breach */}
      {covenantContext && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800">
                Remediating: {covenantContext.covenantName} ({covenantContext.covenantCode})
              </h4>
              <div className="mt-2 text-sm text-amber-700">
                <p><strong>Formula:</strong> {covenantContext.formula}</p>
                <p className="mt-1">
                  <strong>Current:</strong> {covenantContext.currentValue.toFixed(2)} | 
                  <strong> Required:</strong> {covenantContext.operator} {covenantContext.threshold.toFixed(2)} |
                  <strong> Status:</strong> <span className={covenantContext.status === 'breach' ? 'text-red-600 font-semibold' : 'text-amber-600'}>{covenantContext.status.toUpperCase()}</span>
                </p>
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium text-amber-800 mb-2">Recommended Scenarios:</p>
                <div className="flex flex-wrap gap-2">
                  {covenantContext.suggestedScenarios.slice(0, 3).map((scenario, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        scenario.impact === 'high' ? 'bg-green-100 text-green-800' :
                        scenario.impact === 'medium' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                      title={scenario.rationale}
                    >
                      {scenario.impact === 'high' && '⭐ '}
                      {scenario.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Guide Banner - shown when coming from monitoring page without specific covenant */}
      {showWorkflowGuide && borrowerNameFromUrl && !covenantContext && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-800">Amendment Workflow</h4>
              <p className="text-sm text-blue-700 mt-1">
                To generate an amendment for <strong>{decodeURIComponent(borrowerNameFromUrl)}</strong>:
              </p>
              <ol className="text-sm text-blue-700 mt-2 list-decimal list-inside space-y-1">
                <li>Run a scenario simulation to analyze covenant impacts</li>
                <li>Review the recommendations and projected metrics</li>
                <li>Generate an amendment with data-driven justification</li>
              </ol>
              <button
                onClick={() => setShowWorkflowGuide(false)}
                className="text-sm text-blue-600 hover:text-blue-800 mt-2 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Scenario Analysis</h1>
        <p className="text-gray-600 mt-1">
          Simulate what-if scenarios to understand covenant impacts and generate proactive amendments
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'analysis'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Scenario Analysis
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'comparison'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Comparison ({comparisonScenarios.length})
          </button>
        </nav>
      </div>

      {activeTab === 'analysis' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Builder */}
          <div className="space-y-6">
            <ScenarioBuilder
              borrowers={borrowers}
              selectedBorrowerId={selectedBorrowerId}
              onBorrowerChange={setSelectedBorrowerId}
              onRunSimulation={handleRunSimulation}
              isLoading={simulationMutation.isPending}
              covenantContext={covenantContext}
            />

            {/* Add to Comparison Button */}
            {currentResult && (
              <button
                onClick={handleAddToComparison}
                disabled={comparisonScenarios.length >= 5 || resultAddedToComparison}
                className="w-full py-2 border border-blue-500 text-blue-600 font-medium rounded-lg hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-white transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>
                  {resultAddedToComparison 
                    ? 'Added ✓ (Run new simulation to add more)' 
                    : `Add to Comparison (${comparisonScenarios.length}/5)`}
                </span>
              </button>
            )}

            <AmendmentPreview
              scenarioResult={currentResult}
              onGenerate={handleGenerateAmendment}
              isGenerating={amendmentMutation.isPending}
            />
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <ImpactCalculator
              impacts={currentResult?.covenant_impacts || []}
              affectedSections={currentResult?.affected_sections || []}
              isLoading={simulationMutation.isPending}
            />

            <RecommendationPanel
              recommendations={currentResult?.recommendations || []}
              onGenerateAmendment={() => {
                if (currentResult?.recommendations?.[0]) {
                  handleGenerateAmendment(
                    currentResult.recommendations[0].type,
                    currentResult.recommendations[0].rationale
                  );
                }
              }}
              isLoading={simulationMutation.isPending}
            />
          </div>
        </div>
      ) : (
        <div>
          <ScenarioComparison
            scenarios={comparisonScenarios}
            onAddScenario={() => setActiveTab('analysis')}
            onRemoveScenario={handleRemoveFromComparison}
            maxScenarios={5}
          />

          {comparisonScenarios.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium text-blue-800">Comparison Tips</div>
                  <ul className="mt-1 text-sm text-blue-700 space-y-1">
                    <li>• Compare different severity levels to find the tipping point</li>
                    <li>• Test multiple scenario types to understand combined effects</li>
                    <li>• Use the best-case scenario to negotiate covenant modifications</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {simulationMutation.isError && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Failed to run simulation. Please try again.</span>
          </div>
        </div>
      )}

      {amendmentMutation.isError && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Failed to generate amendment. Please try again.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function ScenariosPage() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="skeleton h-8 w-64 mb-4" />
        <div className="skeleton h-4 w-96 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-96 w-full" />
          <div className="skeleton h-96 w-full" />
        </div>
      </div>
    }>
      <ScenariosPageContent />
    </Suspense>
  );
}
