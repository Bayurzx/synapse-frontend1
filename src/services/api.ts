/**
 * Synapse API Client Service
 * 
 * Provides typed API methods for all Synapse backend endpoints.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types
export interface Borrower {
  id: string;
  name: string;
  industry: string;
  risk_score: number;
  risk_tier: 'LOW' | 'MEDIUM' | 'HIGH';
  facilities_count: number;
  total_exposure: number;
  status: 'active' | 'inactive';
  last_assessed: string;
  // Additional fields from backend
  company_type?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  incorporation_date?: string;
}

export interface RiskProfile {
  borrower_id: string;
  risk_score: number;
  risk_tier: 'LOW' | 'MEDIUM' | 'HIGH';
  key_factors: RiskFactor[];
  trend: 'improving' | 'stable' | 'deteriorating';
  last_updated: string;
}

export interface RiskFactor {
  name: string;
  value: number;
  threshold?: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface Facility {
  id: string;
  borrower_id: string;
  borrower_name: string;
  facility_type: string;
  commitment_amount: number;
  outstanding_amount: number;
  currency: string;
  maturity_date: string;
  interest_rate: number;
  status: 'active' | 'inactive';
}

export interface Covenant {
  id: string;
  covenant_id?: number;
  facility_id: string;
  borrower_name?: string;
  covenant_type: string;
  covenant_name?: string;
  covenant_code?: string;
  current_value: number;
  threshold: number;
  threshold_value?: number;
  operator: string;
  threshold_operator?: string;
  status: 'compliant' | 'warning' | 'critical' | 'breach';
  compliance_status?: string;
  headroom: number;
  headroom_percent?: number;
  days_to_breach?: number;
  last_checked: string;
  created_at?: string;
  // Additional fields from backend
  warning_threshold?: number;
  critical_threshold?: number;
  document_section?: string;
  document_page?: number;
  effective_date?: string;
  testing_frequency?: string;
}

export interface CovenantHistory {
  covenant_id: string;
  timestamp: string;
  value: number;
  status: string;
  // Additional fields from backend
  history_id?: number;
  measured_at?: string;
  measured_value?: number;
  threshold_value?: number;
  compliance_status?: string;
  headroom_percent?: number;
  trend_direction?: string;
  days_to_breach?: number;
  created_at?: string;
}

export interface Alert {
  id: string;
  type: 'covenant_warning' | 'covenant_breach' | 'risk_change';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  borrower_id: string;
  borrower_name: string;
  covenant_id?: string;
  created_at: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved: boolean;
  resolved_at?: string;
}

export interface ScenarioParams {
  borrower_id: string;
  scenario_type: 'income_change' | 'expense_change' | 'debt_change' | 'interest_rate_change' | 'economic_downturn';
  parameters: Record<string, number>;
}

export interface ScenarioResult {
  scenario_id?: string;
  borrower_id: string;
  scenario_type: string;
  projected_metrics: Record<string, number>;
  current_metrics?: Record<string, number>;
  covenant_impacts: CovenantImpact[];
  affected_sections: AffectedSection[];
  recommendations: Recommendation[];
  overall_risk_change?: string;
  breach_probability?: number;
}

export interface AffectedSection {
  document_id?: number | null;
  document_name: string;
  document_type: string;
  section_reference: string;
  page_number: number;
  covenant_name: string;
  impact_description: string;
}

export interface CovenantImpact {
  covenant_id: string | number;
  covenant_name?: string;
  covenant_code?: string;
  covenant_type: string;
  current_value: number;
  projected_value: number;
  threshold_value?: number;
  threshold_operator?: string;
  current_status: string;
  projected_status: string;
  current_headroom?: number;
  projected_headroom?: number;
  headroom_change: number;
  status_change?: boolean;
  impact_severity?: string;
}

export interface Recommendation {
  priority: number;
  category?: string;
  type: string;
  recommendation?: string;
  description: string;
  rationale: string;
  estimated_impact?: string;
}

export interface Amendment {
  id: string;
  document_id?: number;  // Backend document ID for API calls
  borrower_id: string;
  borrower_name: string;
  facility_id: string;
  facility_name?: string;
  amendment_type: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'sent_for_signature' | 'signed' | 'executed' | 'sent';
  change_summary: string;
  created_at: string;
  created_by: string;
  document_name?: string;
  amendment_number?: number;
}

export interface Document {
  document_id: number;
  facility_id: number;
  document_type: string;
  document_name: string;
  template_id: string;
  template_version: string | null;
  content_html: string;
  content_pdf_path: string | null;
  variables_json: Record<string, unknown>;
  docusign_envelope_id: string | null;
  signing_status: 'draft' | 'pending_signature' | 'sent' | 'signed' | 'executed' | 'approved' | 'rejected';
  signed_at: string | null;
  version: number;
  parent_document_id: number | null;
  is_amendment: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Legacy fields for backward compatibility
  id?: string;
  name?: string;
  borrower_id?: string;
  borrower_name?: string;
  status?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  document_type: string;
  variables: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

// Paginated response wrapper
interface PaginatedResponse<T> {
  status: 'success' | 'error';
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// API Response wrapper
interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.detail || error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

// Synapse API

// Raw API response type for borrowers (what the backend actually returns)
interface RawBorrower {
  borrower_id: number;
  company_name: string;
  company_type: string;
  industry: string;
  incorporation_date: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  customer_id: number;
  current_risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  last_risk_assessment: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_exposure?: number;
  facilities_count?: number;
}

// Raw API response type for facilities
interface RawFacility {
  facility_id: number;
  borrower_id: number;
  borrower_name?: string;
  facility_type: string;
  facility_name: string;
  commitment_amount: number;
  outstanding_amount?: number;
  currency: string;
  maturity_date?: string;
  interest_rate?: number;
  interest_rate_type?: string;
  status: string;
}

// Raw API response type for risk profile
interface RawRiskProfile {
  customer_id: number;
  risk_score: number;
  risk_tier: 'LOW' | 'MEDIUM' | 'HIGH';
  features: Record<string, number>;
  rule_results: Record<string, unknown>;
  explanations?: Array<{
    feature: string;
    value: number;
    impact: string;
    description: string;
  }>;
  calculated_at: string;
}

// Raw API response type for documents
interface RawDocument {
  document_id: number;
  facility_id: number;
  borrower_id?: number;
  borrower_name?: string;
  document_type: string;
  document_name: string;
  template_id: string;
  signing_status: string;
  signed_at?: string;
  created_at: string;
}

// Transform raw document to frontend Document type (for list view)
function transformDocument(raw: RawDocument): Document {
  return {
    document_id: raw.document_id,
    facility_id: raw.facility_id,
    document_type: raw.document_type,
    document_name: raw.document_name || `${raw.document_type} Document`,
    template_id: raw.template_id || '',
    template_version: null,
    content_html: '',
    content_pdf_path: null,
    variables_json: {},
    docusign_envelope_id: null,
    signing_status: mapSigningStatus(raw.signing_status) as Document['signing_status'],
    signed_at: raw.signed_at || null,
    version: 1,
    parent_document_id: null,
    is_amendment: false,
    created_by: '',
    created_at: raw.created_at,
    updated_at: raw.created_at,
    // Legacy fields
    id: String(raw.document_id),
    name: raw.document_name || `${raw.document_type} Document`,
    borrower_id: String(raw.borrower_id || raw.facility_id),
    borrower_name: raw.borrower_name || '',
    status: raw.signing_status,
  };
}

// Map backend signing_status to frontend status
function mapSigningStatus(status: string): Document['status'] {
  const statusMap: Record<string, Document['status']> = {
    'draft': 'draft',
    'pending_signature': 'pending_signature',
    'sent': 'sent',
    'signed': 'signed',
    'executed': 'executed',
    'approved': 'approved',
    'rejected': 'rejected',
  };
  return statusMap[status] || 'draft';
}

// Transform raw borrower to frontend Borrower type
function transformBorrower(raw: RawBorrower): Borrower {
  // Debug log to see what we're receiving
  // console.log('transformBorrower raw input:', raw);
  
  return {
    id: String(raw.borrower_id),
    name: raw.company_name || 'Unknown',
    industry: raw.industry || 'Unknown',
    risk_score: typeof raw.current_risk_score === 'number' ? raw.current_risk_score : 0,
    risk_tier: raw.risk_level || 'MEDIUM',
    facilities_count: raw.facilities_count ?? 0,
    total_exposure: raw.total_exposure ?? 0,
    status: raw.status === 'active' ? 'active' : 'inactive',
    // Handle various date formats - use updated_at as fallback
    last_assessed: raw.last_risk_assessment || raw.updated_at || new Date().toISOString(),
    // Additional fields from backend
    company_type: raw.company_type,
    primary_contact_name: raw.primary_contact_name,
    primary_contact_email: raw.primary_contact_email,
    incorporation_date: raw.incorporation_date,
  };
}

// Transform raw facility to frontend Facility type
function transformFacility(raw: RawFacility): Facility {
  return {
    id: String(raw.facility_id),
    borrower_id: String(raw.borrower_id),
    borrower_name: raw.borrower_name || '',
    facility_type: raw.facility_type,
    commitment_amount: raw.commitment_amount ?? 0,
    outstanding_amount: raw.outstanding_amount ?? 0,
    currency: raw.currency || 'USD',
    maturity_date: raw.maturity_date || '',
    interest_rate: raw.interest_rate ?? 0,
    status: raw.status === 'active' ? 'active' : 'inactive',
  };
}

// Transform raw risk profile to frontend RiskProfile type
function transformRiskProfile(raw: RawRiskProfile): RiskProfile {
  return {
    borrower_id: String(raw.customer_id),
    risk_score: raw.risk_score ?? 0,
    risk_tier: raw.risk_tier || 'MEDIUM',
    key_factors: (raw.explanations || []).map(exp => ({
      name: exp.feature,
      value: exp.value,
      impact: (exp.impact as 'positive' | 'negative' | 'neutral') || 'neutral',
      description: exp.description,
    })),
    trend: 'stable', // Default since backend doesn't provide this
    last_updated: raw.calculated_at || new Date().toISOString(),
  };
}

export const synapseApi = {
  // Borrowers
  borrowers: {
    list: async (page: number = 1, pageSize: number = 20) => {
      const response = await apiCall<PaginatedResponse<RawBorrower>>(`/v1/synapse/borrowers?page=${page}&page_size=${pageSize}`);
      console.log('borrowers.list raw response:', response);
      return {
        data: response.data.map(transformBorrower),
        pagination: response.pagination,
      };
    },
    // Legacy method for backward compatibility - fetches all borrowers
    listAll: async () => {
      const response = await apiCall<PaginatedResponse<RawBorrower>>('/v1/synapse/borrowers?page_size=100');
      console.log('borrowers.listAll raw response:', response);
      return response.data.map(transformBorrower);
    },
    get: async (id: string) => {
      // Single borrower endpoint returns { status, data: borrower }
      const response = await apiCall<ApiResponse<RawBorrower>>(`/v1/synapse/borrowers/${id}`);
      console.log('borrowers.get raw response:', response);
      if (response.data) {
        return transformBorrower(response.data);
      }
      throw new Error('Borrower not found');
    },
    getRiskProfile: async (id: string) => {
      const response = await apiCall<ApiResponse<RawRiskProfile>>(`/v1/synapse/borrowers/${id}/risk-profile`);
      console.log('borrowers.getRiskProfile raw response:', response);
      if (response.data) {
        return transformRiskProfile(response.data);
      }
      return undefined;
    },
    create: async (data: {
      company_name: string;
      company_type?: string;
      industry?: string;
      incorporation_date?: string;
      primary_contact_name?: string;
      primary_contact_email?: string;
      primary_contact_phone?: string;
      customer_id?: number;
    }) => {
      const response = await apiCall<ApiResponse<RawBorrower>>('/v1/synapse/borrowers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('borrowers.create raw response:', response);
      if (response.data) {
        return transformBorrower(response.data);
      }
      throw new Error('Failed to create borrower');
    },
  },

  // Facilities
  facilities: {
    list: async () => {
      const response = await apiCall<PaginatedResponse<RawFacility>>('/v1/synapse/facilities');
      return response.data.map(transformFacility);
    },
    get: async (id: string) => {
      const response = await apiCall<ApiResponse<RawFacility>>(`/v1/synapse/facilities/${id}`);
      return response.data ? transformFacility(response.data) : null;
    },
    getByBorrower: async (borrowerId: string) => {
      const response = await apiCall<PaginatedResponse<RawFacility>>(`/v1/synapse/borrowers/${borrowerId}/facilities`);
      console.log('facilities.getByBorrower raw response:', response);
      return response.data.map(transformFacility);
    },
  },

  // Covenants
  covenants: {
    list: async (filters?: { borrowerId?: string }) => {
      // Build query params
      const params = new URLSearchParams();
      if (filters?.borrowerId) {
        params.append('borrower_id', filters.borrowerId);
      } else {
        // Fetch covenants for dashboard/monitoring overview (API max is 100)
        params.append('page_size', '100');
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await apiCall<PaginatedResponse<Covenant>>(`/v1/synapse/covenants${query}`);
      return response.data;
    },
    get: async (id: string) => {
      const response = await apiCall<ApiResponse<Covenant>>(`/v1/synapse/covenants/${id}`);
      return response.data;
    },
    getHistory: async (id: string) => {
      const response = await apiCall<PaginatedResponse<CovenantHistory>>(`/v1/synapse/covenants/${id}/history`);
      return response.data;
    },
    getDashboard: () => apiCall<{ 
      data: {
        total_covenants: number;
        compliant: number;
        warning: number;
        critical: number;
        breach: number;
        facilities_monitored: number;
        active_alerts_24h: number;
        compliance_rate: number;
        timestamp: string;
      };
      status: string;
    }>('/v1/synapse/covenants/dashboard'),
    check: (params?: {
      covenant_id?: number;
      facility_id?: number;
      borrower_ids?: number[];
      check_all?: boolean;
      only_non_compliant?: boolean;
      limit?: number;
      random_sample?: boolean;
      exclude_recent?: boolean;
      dry_run?: boolean;
    }) => apiCall<{
      status: string;
      data: {
        checked_count: number;
        results: Covenant[];
        summary: {
          compliant: number;
          warning: number;
          critical: number;
          breach: number;
        };
      };
    }>('/v1/synapse/covenants/check', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    }),
  },

  // Alerts
  alerts: {
    list: async (filters?: { severity?: string; acknowledged?: boolean; status?: string }) => {
      const params = new URLSearchParams();
      if (filters?.severity) params.append('severity', filters.severity);
      // Map acknowledged=false to status=active (backend uses status, not acknowledged)
      if (filters?.acknowledged === false) {
        params.append('status', 'active');
      } else if (filters?.status) {
        params.append('status', filters.status);
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      
      // Raw alert type from backend
      interface RawAlert {
        alert_id: number;
        alert_type: string;
        severity: string;
        title: string;
        message: string;
        borrower_id: number;
        borrower_name?: string;
        facility_id?: number;
        covenant_id?: number;
        status: string;
        acknowledged_by?: string;
        acknowledged_at?: string;
        resolved_at?: string;
        created_at: string;
        metadata?: Record<string, unknown>;
      }
      
      const response = await apiCall<PaginatedResponse<RawAlert>>(`/v1/synapse/alerts${query}`);
      
      // Map backend severity to frontend severity
      // Backend uses: BREACH, WARNING, INFO (uppercase)
      // Frontend expects: critical, warning, info (lowercase)
      const mapSeverity = (severity: string): Alert['severity'] => {
        const sev = severity.toLowerCase();
        if (sev === 'breach') return 'critical';
        if (sev === 'warning') return 'warning';
        return 'info';
      };
      
      // Transform raw alerts to frontend Alert type
      return response.data.map((raw): Alert => ({
        id: String(raw.alert_id),
        type: raw.alert_type as Alert['type'],
        severity: mapSeverity(raw.severity),
        title: raw.title,
        message: raw.message,
        borrower_id: String(raw.borrower_id),
        borrower_name: raw.borrower_name || `Borrower ${raw.borrower_id}`,
        covenant_id: raw.covenant_id ? String(raw.covenant_id) : undefined,
        created_at: raw.created_at,
        acknowledged: raw.status === 'acknowledged' || !!raw.acknowledged_at,
        acknowledged_by: raw.acknowledged_by,
        acknowledged_at: raw.acknowledged_at,
        resolved: raw.status === 'resolved' || !!raw.resolved_at,
        resolved_at: raw.resolved_at,
      }));
    },
    acknowledge: (id: string, acknowledgedBy: string = 'current_user') => 
      apiCall<Alert>(`/v1/synapse/alerts/${id}/acknowledge`, { 
        method: 'PUT',
        body: JSON.stringify({ acknowledged_by: acknowledgedBy }),
      }),
    resolve: (id: string, resolutionNotes?: string) => 
      apiCall<Alert>(`/v1/synapse/alerts/${id}/resolve`, { 
        method: 'PUT',
        body: JSON.stringify({ resolution_notes: resolutionNotes }),
      }),
  },

  // Scenarios
  scenarios: {
    simulate: async (params: ScenarioParams): Promise<ScenarioResult> => {
      interface RawScenarioResult {
        scenario_id?: string;
        borrower_id: number;
        scenario_type: string;
        projected_metrics: Record<string, number>;
        current_metrics?: Record<string, number>;
        covenant_impacts: Array<{
          covenant_id: number;
          covenant_name?: string;
          covenant_code?: string;
          current_value: number;
          projected_value: number;
          threshold_value?: number;
          threshold_operator?: string;
          current_status: string;
          projected_status: string;
          current_headroom?: number;
          projected_headroom?: number;
          status_change?: boolean;
          impact_severity?: string;
        }>;
        affected_sections: Array<{
          document_id?: number | null;
          document_name: string;
          document_type: string;
          section_reference: string;
          page_number: number;
          covenant_name: string;
          impact_description: string;
        }>;
        recommendations: Array<{
          priority: number;
          category?: string;
          recommendation?: string;
          rationale: string;
          estimated_impact?: string;
        }>;
        overall_risk_change?: string;
        breach_probability?: number;
      }
      
      const response = await apiCall<{ status: string; data: RawScenarioResult }>('/v1/synapse/scenarios/simulate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      
      const raw = response.data;
      
      // Transform to frontend format
      return {
        scenario_id: raw.scenario_id,
        borrower_id: String(raw.borrower_id),
        scenario_type: raw.scenario_type,
        projected_metrics: raw.projected_metrics,
        current_metrics: raw.current_metrics,
        covenant_impacts: raw.covenant_impacts.map(impact => ({
          covenant_id: String(impact.covenant_id),
          covenant_name: impact.covenant_name,
          covenant_code: impact.covenant_code,
          covenant_type: impact.covenant_name || impact.covenant_code || 'Unknown',
          current_value: impact.current_value,
          projected_value: impact.projected_value,
          threshold_value: impact.threshold_value,
          threshold_operator: impact.threshold_operator,
          current_status: impact.current_status,
          projected_status: impact.projected_status,
          current_headroom: impact.current_headroom,
          projected_headroom: impact.projected_headroom,
          headroom_change: (impact.projected_headroom ?? 0) - (impact.current_headroom ?? 0),
          status_change: impact.status_change,
          impact_severity: impact.impact_severity,
        })),
        affected_sections: raw.affected_sections,
        recommendations: raw.recommendations.map(rec => ({
          priority: rec.priority,
          category: rec.category,
          type: rec.category || 'general',
          recommendation: rec.recommendation,
          description: rec.recommendation || '',
          rationale: rec.rationale,
          estimated_impact: rec.estimated_impact,
        })),
        overall_risk_change: raw.overall_risk_change,
        breach_probability: raw.breach_probability,
      };
    },
    compare: (scenarios: ScenarioParams[]) => apiCall<ScenarioResult[]>('/v1/synapse/scenarios/compare', {
      method: 'POST',
      body: JSON.stringify({ scenarios }),
    }),
  },

  // Amendments
  amendments: {
    list: async () => {
      // Raw amendment type from backend
      interface RawAmendment {
        document_id: number;
        facility_id: number;
        document_name: string;
        template_id: string;
        variables_json: {
          amendment_id?: string;
          amendment_type?: string;
          amendment_number?: number;
          change_summary?: Array<{ description: string; section: string }>;
          effective_date?: string;
          risk_level?: string;
          risk_score?: number;
        };
        docusign_envelope_id: string | null;
        signing_status: string;
        signed_at: string | null;
        created_by: string;
        created_at: string;
        borrower_id: number;
        facility_name: string;
        company_name: string;
      }
      
      const response = await apiCall<PaginatedResponse<RawAmendment>>('/v1/synapse/amendments');
      
      // Transform raw amendments to frontend Amendment type
      return response.data.map((raw): Amendment => {
        // Build change summary from array of changes or generate default based on type
        let changeSummaryText = raw.variables_json?.change_summary
          ?.map(c => c.description)
          .slice(0, 2)
          .join('; ');
        
        // If no change summary, generate a meaningful default based on amendment type
        if (!changeSummaryText) {
          const amendmentType = raw.variables_json?.amendment_type || raw.template_id?.replace('amendment_', '');
          switch (amendmentType) {
            case 'covenant_modification':
              changeSummaryText = 'Covenant threshold modifications pending review';
              break;
            case 'covenant_waiver':
              changeSummaryText = 'Temporary covenant waiver for compliance relief';
              break;
            case 'margin_adjustment':
              changeSummaryText = 'Interest margin adjustment based on risk assessment';
              break;
            case 'maturity_extension':
              changeSummaryText = 'Loan maturity date extension';
              break;
            default:
              changeSummaryText = 'Amendment changes pending review';
          }
        }
        
        // Map signing_status to Amendment status
        const mapStatus = (status: string): Amendment['status'] => {
          const statusMap: Record<string, Amendment['status']> = {
            'draft': 'draft',
            'pending_signature': 'pending_review',
            'pending_review': 'pending_review',
            'sent': 'sent',
            'signed': 'signed',
            'executed': 'executed',
            'approved': 'approved',
            'rejected': 'rejected',
          };
          return statusMap[status] || 'draft';
        };
        
        return {
          id: raw.variables_json?.amendment_id || String(raw.document_id),
          document_id: raw.document_id,  // Store document_id for API calls
          borrower_id: String(raw.borrower_id),
          borrower_name: raw.company_name || 'Unknown Borrower',
          facility_id: String(raw.facility_id),
          facility_name: raw.facility_name,
          amendment_type: raw.variables_json?.amendment_type || raw.template_id?.replace('amendment_', '') || 'unknown',
          status: mapStatus(raw.signing_status),
          change_summary: changeSummaryText,
          created_at: raw.created_at,
          created_by: raw.created_by || 'system',
          document_name: raw.document_name,
          amendment_number: raw.variables_json?.amendment_number,
        };
      });
    },
    get: (id: string) => apiCall<Amendment>(`/v1/synapse/amendments/${id}`),
    generate: async (params: { borrower_id: string; facility_id: string; amendment_type: string; reason: string }) => {
      // Transform frontend params to backend API format
      const requestBody = {
        facility_id: parseInt(params.facility_id, 10),
        amendment_type: params.amendment_type,
        changes: {
          reason: params.reason,
          // Add default changes based on amendment type
          ...(params.amendment_type === 'covenant_modification' && {
            covenant_changes: [],
          }),
          ...(params.amendment_type === 'covenant_waiver' && {
            waiver_duration_days: 90,
          }),
          ...(params.amendment_type === 'margin_adjustment' && {
            margin_change_bps: 50,
          }),
          ...(params.amendment_type === 'maturity_extension' && {
            extension_months: 12,
          }),
        },
        created_by: 'synapse_user',
      };
      
      const response = await apiCall<{ status: string; data: {
        amendment_id: string;
        document_id: number;
        facility_id: number;
        borrower_id: number;
        amendment_type: string;
        amendment_number: number;
        status: string;
        effective_date: string;
        current_risk_score: number;
        current_risk_level: string;
        created_at: string;
        created_by: string;
        changes: Record<string, unknown>;
        change_summary: Array<{ description: string; section: string }>;
      } }>('/v1/synapse/amendments/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      
      const raw = response.data;
      
      // Transform to frontend Amendment type
      return {
        id: raw.amendment_id,
        document_id: raw.document_id,  // Store document_id for API calls
        borrower_id: String(raw.borrower_id),
        borrower_name: '', // Not returned by generate endpoint
        facility_id: String(raw.facility_id),
        amendment_type: raw.amendment_type,
        status: raw.status as Amendment['status'],
        change_summary: raw.change_summary?.map(c => c.description).join('; ') || 'Amendment changes',
        created_at: raw.created_at,
        created_by: raw.created_by,
        amendment_number: raw.amendment_number,
      };
    },
    // Use document_id for API calls since backend expects integer document_id
    submitForReview: (documentId: number) => apiCall<{ status: string; data: Amendment }>(`/v1/synapse/amendments/${documentId}/submit-for-review`, { method: 'POST' }),
    approve: (documentId: number, approvedBy: string = 'synapse_user', comments?: string) => 
      apiCall<{ status: string; data: Amendment }>(`/v1/synapse/amendments/${documentId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approved_by: approvedBy, comments }),
      }),
    reject: (documentId: number, reason: string, rejectedBy: string = 'synapse_user') => 
      apiCall<{ status: string; data: Amendment }>(`/v1/synapse/amendments/${documentId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejected_by: rejectedBy, reason }),
      }),
    send: (documentId: number, signers?: Array<{ email: string; name: string }>) => 
      apiCall<{ status: string; data: Amendment }>(`/v1/synapse/amendments/${documentId}/send`, { 
        method: 'POST',
        body: signers ? JSON.stringify({ signers }) : undefined,
      }),
    execute: (documentId: number) => 
      apiCall<{ status: string; data: { document_id: number; status: string; executed_at: string; message: string } }>(`/v1/synapse/amendments/${documentId}/execute`, { 
        method: 'POST',
      }),
  },

  // Documents
  documents: {
    list: async () => {
      const response = await apiCall<PaginatedResponse<RawDocument>>('/v1/synapse/documents');
      return response.data.map(transformDocument);
    },
    get: async (id: string): Promise<Document | null> => {
      const response = await apiCall<ApiResponse<Document>>(`/v1/synapse/documents/${id}`);
      return response.data || null;
    },
    generate: async (params: { template_id: string; borrower_id: string; facility_id: string; variables: Record<string, unknown> }) => {
      const response = await apiCall<ApiResponse<Document>>('/v1/synapse/documents/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return response.data as Document;
    },
    preview: (id: string, format: 'html' | 'pdf' = 'html') =>
      apiCall<{ content: string; format: string }>(`/v1/synapse/documents/${id}/preview?format=${format}`),
    send: (id: string) => apiCall<Document>(`/v1/synapse/documents/${id}/send`, { method: 'POST' }),
    getStatus: (id: string) => apiCall<{ status: string; signed_at?: string }>(`/v1/synapse/documents/${id}/status`),
  },

  // Templates
  templates: {
    list: async () => {
      // Raw template type from backend
      interface RawTemplate {
        template_id: string;
        template_name: string;
        version: string;
        description: string;
        sections: number;
        variables: number;
      }
      
      const response = await apiCall<{ status: string; data: RawTemplate[] }>('/v1/synapse/templates');
      
      // Transform raw templates to frontend Template type
      return response.data.map((raw): Template => ({
        id: raw.template_id,
        name: raw.template_name,
        description: raw.description,
        document_type: raw.template_id.includes('amendment') ? 'amendment' : 
                       raw.template_id.includes('revolving') ? 'revolving_credit' :
                       raw.template_id.includes('promissory') ? 'promissory_note' :
                       raw.template_id.includes('compliance') ? 'compliance_cert' : 'term_loan',
        variables: [], // Variables are fetched separately via getVariables
      }));
    },
    get: (id: string) => apiCall<Template>(`/v1/synapse/templates/${id}`),
    getVariables: (id: string) => apiCall<TemplateVariable[]>(`/v1/synapse/templates/${id}/variables`),
  },
};

export default synapseApi;
