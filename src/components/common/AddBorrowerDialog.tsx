'use client';

import { useState, useEffect } from 'react';
import { X, Wand2, AlertTriangle, Building2, User, Mail, Phone, Loader2 } from 'lucide-react';

// Company name generators
const companyPrefixes = ['Global', 'Premier', 'Elite', 'Pacific', 'Atlantic', 'Summit', 'Apex', 'Pinnacle', 'Sterling', 'Horizon'];
const companySuffixes = ['Industries', 'Holdings', 'Enterprises', 'Solutions', 'Partners', 'Group', 'Capital', 'Ventures', 'Corp', 'LLC'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris'];

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 
  'Construction', 'Transportation', 'Energy', 'Agriculture', 'Education',
  'Professional Services', 'Hospitality', 'Real Estate', 'Media', 'Telecommunications'
];

const companyTypes = [
  { value: 'corporation', label: 'Corporation' },
  { value: 'llc', label: 'LLC' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'sole_proprietor', label: 'Sole Proprietorship' },
];

interface AddBorrowerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCreate: (data: BorrowerFormData) => Promise<void>;
}

export interface BorrowerFormData {
  company_name: string;
  company_type: string;
  industry: string;
  incorporation_date: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
}

function generateRandomCompanyName(): string {
  const prefix = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
  const useLastName = Math.random() > 0.5;
  return useLastName ? `${lastName} ${suffix}` : `${prefix} ${suffix}`;
}

function generateRandomPhone(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const line = Math.floor(Math.random() * 9000) + 1000;
  return `(${areaCode}) ${prefix}-${line}`;
}

function generateRandomDate(): string {
  const year = Math.floor(Math.random() * 25) + 2000; // 2000-2024
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

export function AddBorrowerDialog({ isOpen, onClose, onSuccess, onCreate }: AddBorrowerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BorrowerFormData>({
    company_name: '',
    company_type: 'corporation',
    industry: 'Technology',
    incorporation_date: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        company_name: '',
        company_type: 'corporation',
        industry: 'Technology',
        incorporation_date: '',
        primary_contact_name: '',
        primary_contact_email: '',
        primary_contact_phone: '',
      });
      setError(null);
    }
  }, [isOpen]);

  const handleAutoGenerate = () => {
    setFormData(prev => ({
      ...prev,
      company_name: generateRandomCompanyName(),
      company_type: companyTypes[Math.floor(Math.random() * companyTypes.length)].value,
      industry: industries[Math.floor(Math.random() * industries.length)],
      incorporation_date: generateRandomDate(),
      primary_contact_phone: generateRandomPhone(),
      // Keep contact name and email empty - user must fill these for DocuSign
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.company_name.trim()) {
      setError('Company name is required');
      return;
    }
    if (!formData.primary_contact_name.trim()) {
      setError('Primary contact name is required for DocuSign');
      return;
    }
    if (!formData.primary_contact_email.trim()) {
      setError('Primary contact email is required for DocuSign');
      return;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.primary_contact_email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate(formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create borrower');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Add New Borrower</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Auto-generate button */}
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={handleAutoGenerate}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md"
          >
            <Wand2 className="h-4 w-4" />
            Auto-Generate Demo Data
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Generates random company details. You must still enter contact name and email.
          </p>
        </div>

        {/* Info about auto-assignment */}
        <div className="mx-4 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
          <Building2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800">Demo Mode</p>
            <p className="text-blue-700 mt-1">
              New borrowers are automatically linked to existing Credit_AI customers for risk assessment integration.
            </p>
          </div>
        </div>

        {/* Warning about DocuSign */}
        <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">DocuSign Integration</p>
            <p className="text-amber-700 mt-1">
              The contact name and email are used for document signing. 
              Please enter your real details if you want to test the signing flow.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter company name"
            />
          </div>

          {/* Company Type & Industry */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Type
              </label>
              <select
                value={formData.company_type}
                onChange={(e) => setFormData(prev => ({ ...prev, company_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {companyTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Incorporation Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Incorporation Date
            </label>
            <input
              type="date"
              value={formData.incorporation_date}
              onChange={(e) => setFormData(prev => ({ ...prev, incorporation_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Primary Contact (Required for DocuSign)
            </h3>
          </div>

          {/* Contact Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.primary_contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_name: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Smith"
              />
            </div>
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={formData.primary_contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_email: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="john.smith@company.com"
              />
            </div>
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={formData.primary_contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_phone: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Borrower'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddBorrowerDialog;
