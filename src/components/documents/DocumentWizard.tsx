'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { synapseApi } from '@/services/api';
import { 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  AlertTriangle,
  Loader2,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import TrafficLight, { getRiskTrafficLightStatus } from '@/components/common/TrafficLight';

interface DocumentWizardProps {
  initialTemplateId?: string;
  initialBorrowerId?: string;
  onComplete?: (documentId: string) => void;
  onCancel?: () => void;
}

type WizardStep = 'template' | 'borrower' | 'terms' | 'review';

interface WizardState {
  templateId: string;
  borrowerId: string;
  facilityId: string;
  variables: Record<string, unknown>;
  recommendationsApplied: boolean;
}

const steps: { id: WizardStep; label: string }[] = [
  { id: 'template', label: 'Select Template' },
  { id: 'borrower', label: 'Select Borrower' },
  { id: 'terms', label: 'Configure Terms' },
  { id: 'review', label: 'Review & Generate' },
];

export function DocumentWizard({
  initialTemplateId,
  initialBorrowerId,
  onComplete,
  onCancel,
}: DocumentWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    initialTemplateId ? (initialBorrowerId ? 'terms' : 'borrower') : 'template'
  );
  const [state, setState] = useState<WizardState>({
    templateId: initialTemplateId || '',
    borrowerId: initialBorrowerId || '',
    facilityId: '',
    variables: {},
    recommendationsApplied: false,
  });

  // Queries
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: synapseApi.templates.list,
  });

  const { data: borrowers, isLoading: borrowersLoading } = useQuery({
    queryKey: ['borrowers-all'],
    queryFn: synapseApi.borrowers.listAll,
  });

  const { data: selectedBorrower } = useQuery({
    queryKey: ['borrower', state.borrowerId],
    queryFn: () => synapseApi.borrowers.get(state.borrowerId),
    enabled: !!state.borrowerId,
  });

  const { data: riskProfile } = useQuery({
    queryKey: ['risk-profile', state.borrowerId],
    queryFn: () => synapseApi.borrowers.getRiskProfile(state.borrowerId),
    enabled: !!state.borrowerId,
  });

  const { data: facilities } = useQuery({
    queryKey: ['facilities', state.borrowerId],
    queryFn: () => synapseApi.facilities.getByBorrower(state.borrowerId),
    enabled: !!state.borrowerId,
  });

  // Auto-populate form fields when a facility is selected
  useEffect(() => {
    if (state.facilityId && facilities) {
      const selectedFacility = facilities.find(f => f.id === state.facilityId);
      if (selectedFacility) {
        setState((prev) => ({
          ...prev,
          variables: {
            ...prev.variables,
            commitment_amount: `$${selectedFacility.commitment_amount.toLocaleString()}`,
            // Calculate term in months from maturity date if available
            term_months: prev.variables.term_months || 24,
            // Use facility's interest rate if available
            interest_margin: prev.variables.interest_margin || selectedFacility.interest_rate || 75,
          },
        }));
      }
    }
  }, [state.facilityId, facilities]);

  // Build the complete variables object for document generation
  const buildDocumentVariables = () => {
    const selectedFacility = facilities?.find(f => f.id === state.facilityId);
    const now = new Date();
    const effectiveDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Calculate dates
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const fiveYearsFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000 * 5);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
    
    // Build borrower object from selected borrower data
    const borrowerVars = {
      company_name: selectedBorrower?.name || '',
      entity_type: selectedBorrower?.company_type || 'corporation',
      jurisdiction: 'Delaware', // Default jurisdiction
      signatory_name: selectedBorrower?.primary_contact_name || '',
      signatory_title: 'Chief Financial Officer', // Default title
    };
    
    // Build lender object with defaults
    const lenderVars = {
      company_name: 'Synapse Lending Platform',
      signatory_name: 'John Smith',
      signatory_title: 'Senior Vice President',
    };
    
    // Build base facility object
    const facilityVars: Record<string, unknown> = {
      commitment_amount: selectedFacility?.commitment_amount || 1000000,
      base_rate: 'SOFR',
      margin_bps: state.variables.interest_margin || 75,
      maturity_date: selectedFacility?.maturity_date || fiveYearsFromNow.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      interest_payment_frequency: 'monthly',
      minimum_prepayment_amount: 100000,
    };
    
    // Build covenants object
    const covenantsVars: Record<string, unknown> = {
      dti_threshold: state.variables.dti_threshold || 0.45,
      icr_threshold: state.variables.icr_threshold || 2.0,
      leverage_threshold: 3.5,
      minimum_liquidity: 250000,
      max_additional_debt: 500000,
      testing_frequency: state.variables.reporting_frequency || 'quarterly',
    };
    
    // Base variables common to all templates
    const baseVars: Record<string, unknown> = {
      effective_date: effectiveDate,
      borrower: borrowerVars,
      lender: lenderVars,
      facility: facilityVars,
      covenants: covenantsVars,
      risk_tier: riskProfile?.risk_tier || 'MEDIUM',
      governing_law_jurisdiction: 'New York',
    };
    
    // Add template-specific variables
    switch (state.templateId) {
      case 'revolving_credit_facility':
        // Revolving credit needs availability_end_date and borrowing terms
        facilityVars.availability_end_date = oneYearFromNow.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        facilityVars.borrowing_notice_days = 3;
        facilityVars.minimum_borrowing_amount = 25000;
        facilityVars.commitment_fee_bps = 25;
        // Add utilization threshold to covenants
        covenantsVars.utilization_threshold = riskProfile?.risk_tier === 'HIGH' ? 0.75 : riskProfile?.risk_tier === 'MEDIUM' ? 0.85 : 0.95;
        covenantsVars.current_ratio_threshold = riskProfile?.risk_tier === 'HIGH' ? 1.50 : riskProfile?.risk_tier === 'MEDIUM' ? 1.25 : 1.10;
        covenantsVars.minimum_working_capital = 100000;
        break;
        
      case 'covenant_compliance_certificate':
        // Compliance certificate needs original agreement date and certificate details
        baseVars.original_agreement_date = oneYearAgo.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        baseVars.certificate = {
          reporting_period_start: quarterStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          reporting_period_end: quarterEnd.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          certificate_date: effectiveDate,
          // Actual metrics - use sample values or calculate from borrower data
          actual_dti: 0.38,
          dti_headroom: 15.6,
          dti_status: 'COMPLIANT',
          dti_status_class: 'compliant',
          actual_icr: 2.8,
          icr_headroom: 12.0,
          icr_status: 'COMPLIANT',
          icr_status_class: 'compliant',
          actual_leverage: 3.2,
          leverage_headroom: 8.6,
          leverage_status: 'COMPLIANT',
          leverage_status_class: 'compliant',
          actual_liquidity: '$325,000.00',
          liquidity_headroom: 30.0,
          liquidity_status: 'COMPLIANT',
          liquidity_status_class: 'compliant',
          // Financial data
          total_monthly_debt: '$21,000.00',
          gross_monthly_income: '$55,000.00',
          ebitda: '$1,200,000.00',
          interest_expense: '$428,571.00',
          total_debt: '$3,840,000.00',
          cash: '$200,000.00',
          cash_equivalents: '$75,000.00',
          available_credit: '$50,000.00',
          // Exception flags
          has_exceptions: false,
          no_exceptions: true,
        };
        break;
        
      case 'loan_amendment':
        // Amendment needs original agreement date and amendment details
        baseVars.original_agreement_date = oneYearAgo.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        baseVars.amendment = {
          amendment_number: 1,
          effective_date: effectiveDate,
          reason_for_amendment: "the Borrower's risk profile has improved based on recent financial performance",
          // Covenant changes
          dti_change: true,
          previous_dti_threshold: 0.35,
          icr_change: true,
          previous_icr_threshold: 3.0,
          leverage_change: false,
          previous_leverage_threshold: 3.0,
          // Margin changes
          previous_margin_bps: 175,
          // Maturity extension (optional)
          previous_maturity_date: fiveYearsFromNow.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        };
        // Amendment type flags
        baseVars.amendment_type_covenant_modification = true;
        baseVars.amendment_type_margin_adjustment = true;
        baseVars.amendment_type_maturity_extension = false;
        baseVars.amendment_type_covenant_waiver = false;
        break;
        
      case 'promissory_note':
        // Promissory note needs principal_amount
        facilityVars.principal_amount = `$${(selectedFacility?.commitment_amount || 1000000).toLocaleString()}.00`;
        break;
        
      default:
        // term_loan_agreement and others use base variables
        break;
    }
    
    return {
      ...baseVars,
      // Include any additional flat variables from user input
      ...state.variables,
    };
  };

  // Generate document mutation
  const generateMutation = useMutation({
    mutationFn: () => {
      const variables = buildDocumentVariables();
      return synapseApi.documents.generate({
        template_id: state.templateId,
        borrower_id: state.borrowerId,
        facility_id: state.facilityId,
        variables,
      });
    },
    onSuccess: (data) => {
      // Use document_id from the response
      const documentId = data?.document_id ? String(data.document_id) : undefined;
      if (documentId) {
        onComplete?.(documentId);
      }
    },
  });

  // Risk-based recommendations
  const getRecommendations = () => {
    if (!riskProfile) return null;
    
    const riskTier = riskProfile.risk_tier;
    const recommendations: Record<string, { value: string | number; label: string }> = {};

    if (riskTier === 'HIGH') {
      recommendations.interest_margin = { value: 175, label: '+175 bps' };
      recommendations.dti_threshold = { value: 0.35, label: '≤0.35' };
      recommendations.icr_threshold = { value: 3.0, label: '≥3.0' };
      recommendations.reporting_frequency = { value: 'monthly', label: 'Monthly' };
    } else if (riskTier === 'MEDIUM') {
      recommendations.interest_margin = { value: 125, label: '+125 bps' };
      recommendations.dti_threshold = { value: 0.40, label: '≤0.40' };
      recommendations.icr_threshold = { value: 2.5, label: '≥2.5' };
      recommendations.reporting_frequency = { value: 'quarterly', label: 'Quarterly' };
    } else {
      recommendations.interest_margin = { value: 75, label: '+75 bps' };
      recommendations.dti_threshold = { value: 0.45, label: '≤0.45' };
      recommendations.icr_threshold = { value: 2.0, label: '≥2.0' };
      recommendations.reporting_frequency = { value: 'quarterly', label: 'Quarterly' };
    }

    return recommendations;
  };

  const applyRecommendations = () => {
    const recommendations = getRecommendations();
    if (recommendations) {
      setState((prev) => ({
        ...prev,
        recommendationsApplied: true,
        variables: {
          ...prev.variables,
          interest_margin: recommendations.interest_margin.value,
          dti_threshold: recommendations.dti_threshold.value,
          icr_threshold: recommendations.icr_threshold.value,
          reporting_frequency: recommendations.reporting_frequency.value,
        },
      }));
    }
  };

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case 'template':
        return !!state.templateId;
      case 'borrower':
        return !!state.borrowerId;
      case 'terms':
        return !!state.facilityId;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const selectedTemplate = templates?.find((t) => t.id === state.templateId);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = step.id === currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isCurrent
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      isCurrent ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 w-full mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                    style={{ minWidth: '60px' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="card p-6">
        {/* Step 1: Select Template */}
        {currentStep === 'template' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Document Template</h2>
            {templatesLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 border rounded-lg animate-pulse">
                    <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3" />
                    <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-full bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {templates?.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setState((prev) => ({ ...prev, templateId: template.id }))}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      state.templateId === template.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 mb-3">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Borrower */}
        {currentStep === 'borrower' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Borrower</h2>
            {borrowersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-lg animate-pulse">
                    <div className="h-5 w-1/3 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-1/4 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {borrowers?.map((borrower) => (
                  <button
                    key={borrower.id}
                    onClick={() => setState((prev) => ({ ...prev, borrowerId: borrower.id, facilityId: '' }))}
                    className={`w-full p-4 border rounded-lg text-left transition-all flex items-center justify-between ${
                      state.borrowerId === borrower.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{borrower.name}</h3>
                      <p className="text-sm text-gray-500">{borrower.industry}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <TrafficLight
                        status={getRiskTrafficLightStatus(borrower.risk_tier)}
                        size="sm"
                        showLabel
                        label={`${borrower.risk_score}`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Configure Terms */}
        {currentStep === 'terms' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configure Loan Terms</h2>
              
              {/* Facility Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Facility
                </label>
                <select
                  value={state.facilityId}
                  onChange={(e) => setState((prev) => ({ ...prev, facilityId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a facility...</option>
                  {facilities?.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.facility_type} - ${(facility.commitment_amount / 1000000).toFixed(1)}M
                    </option>
                  ))}
                </select>
              </div>

              {/* Loan Terms */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commitment Amount
                  </label>
                  <input
                    type="text"
                    value={state.variables.commitment_amount as string || ''}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        variables: { ...prev.variables, commitment_amount: e.target.value },
                      }))
                    }
                    placeholder="$3,000,000"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (SOFR +)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={state.variables.interest_margin as number || ''}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          variables: { ...prev.variables, interest_margin: Number(e.target.value) },
                        }))
                      }
                      placeholder="175"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">bps</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Term (months)
                  </label>
                  <input
                    type="number"
                    value={state.variables.term_months as number || ''}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        variables: { ...prev.variables, term_months: Number(e.target.value) },
                      }))
                    }
                    placeholder="24"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Covenant Thresholds - shown after recommendations applied */}
                {state.recommendationsApplied && (
                  <div className="pt-4 border-t border-gray-200 space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">Applied Covenant Terms</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          DTI Threshold
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={state.variables.dti_threshold as number || ''}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              variables: { ...prev.variables, dti_threshold: Number(e.target.value) },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          ICR Threshold
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={state.variables.icr_threshold as number || ''}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              variables: { ...prev.variables, icr_threshold: Number(e.target.value) },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Reporting Frequency
                      </label>
                      <select
                        value={state.variables.reporting_frequency as string || 'quarterly'}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            variables: { ...prev.variables, reporting_frequency: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="semi-annually">Semi-Annually</option>
                        <option value="annually">Annually</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Risk-Based Recommendations */}
            <div>
              {riskProfile && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrafficLight
                      status={getRiskTrafficLightStatus(riskProfile.risk_tier)}
                      size="md"
                    />
                    <span className="font-semibold text-gray-900">
                      {riskProfile.risk_tier} RISK (Score: {riskProfile.risk_score})
                    </span>
                  </div>

                  <h3 className="text-sm font-medium text-gray-700 mb-2">Recommended Terms:</h3>
                  <ul className="space-y-1 text-sm text-gray-600 mb-4">
                    {getRecommendations() && Object.entries(getRecommendations()!).map(([key, rec]) => (
                      <li key={key} className="flex items-center gap-2">
                        <span className="text-green-500">•</span>
                        {key.replace(/_/g, ' ')}: {rec.label}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={applyRecommendations}
                    disabled={state.recommendationsApplied}
                    className={`btn w-full flex items-center justify-center gap-2 transition-all ${
                      state.recommendationsApplied 
                        ? 'bg-green-50 border-green-300 text-green-700 cursor-default'
                        : 'btn--secondary hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    {state.recommendationsApplied ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Recommendations Applied
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Apply Recommendations
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Clause Preview */}
              <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Clause Preview</h3>
                <div className="text-sm text-gray-600 bg-gray-50 rounded p-3">
                  <p className="font-medium text-gray-800 mb-1">Article 7.1(a) - DTI</p>
                  <p>
                    &quot;The Borrower shall maintain a Debt-to-Income Ratio of not greater than{' '}
                    <span className="font-semibold text-blue-600">
                      {String(state.variables.dti_threshold ?? '0.45')}
                    </span>
                    ...&quot;
                  </p>
                  {riskProfile?.risk_tier === 'HIGH' && (
                    <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Conservative clause (high-risk borrower)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Generate */}
        {currentStep === 'review' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Generate</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Document Summary</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500">Template</dt>
                    <dd className="font-medium text-gray-900">{selectedTemplate?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Borrower</dt>
                    <dd className="font-medium text-gray-900">{selectedBorrower?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Risk Score</dt>
                    <dd className="font-medium text-gray-900">
                      {riskProfile?.risk_score} ({riskProfile?.risk_tier})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Interest Margin</dt>
                    <dd className="font-medium text-gray-900">
                      +{String(state.variables.interest_margin ?? 0)} bps
                    </dd>
                  </div>
                  {state.variables.dti_threshold !== undefined && (
                    <div>
                      <dt className="text-gray-500">DTI Threshold</dt>
                      <dd className="font-medium text-gray-900">
                        ≤{String(state.variables.dti_threshold)}
                      </dd>
                    </div>
                  )}
                  {state.variables.icr_threshold !== undefined && (
                    <div>
                      <dt className="text-gray-500">ICR Threshold</dt>
                      <dd className="font-medium text-gray-900">
                        ≥{String(state.variables.icr_threshold)}
                      </dd>
                    </div>
                  )}
                  {state.variables.reporting_frequency !== undefined && (
                    <div>
                      <dt className="text-gray-500">Reporting Frequency</dt>
                      <dd className="font-medium text-gray-900 capitalize">
                        {String(state.variables.reporting_frequency)}
                      </dd>
                    </div>
                  )}
                  {state.variables.commitment_amount !== undefined && (
                    <div>
                      <dt className="text-gray-500">Commitment Amount</dt>
                      <dd className="font-medium text-gray-900">
                        {String(state.variables.commitment_amount)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {generateMutation.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  <p className="font-medium">Error generating document</p>
                  <p className="text-sm">{(generateMutation.error as Error).message}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={currentStepIndex === 0 ? onCancel : goBack}
          className="btn btn--secondary flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {currentStepIndex === 0 ? 'Cancel' : 'Back'}
        </button>

        {currentStep === 'review' ? (
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="btn btn--primary flex items-center gap-2"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Generate Document
                <Check className="h-4 w-4" />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={!canProceed()}
            className="btn btn--primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default DocumentWizard;
