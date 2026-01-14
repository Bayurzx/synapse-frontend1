'use client';

import { FileText, FileCheck, FilePlus, FileEdit, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export interface Template {
  id: string;
  name: string;
  description: string;
  document_type: string;
  icon?: string;
}

interface TemplateGalleryProps {
  templates?: Template[];
  isLoading?: boolean;
  onSelectTemplate?: (template: Template) => void;
}

const defaultTemplates: Template[] = [
  {
    id: 'term_loan_agreement',
    name: 'Term Loan Agreement',
    description: 'Standard term loan agreement with customizable covenants and pricing',
    document_type: 'term_loan',
  },
  {
    id: 'revolving_credit_facility',
    name: 'Revolving Credit',
    description: 'Revolving credit facility agreement with draw-down provisions',
    document_type: 'revolving_credit',
  },
  {
    id: 'promissory_note',
    name: 'Promissory Note',
    description: 'Simple promissory note for straightforward lending arrangements',
    document_type: 'promissory_note',
  },
  {
    id: 'loan_amendment',
    name: 'Loan Amendment',
    description: 'Amendment document for modifying existing loan terms',
    document_type: 'amendment',
  },
  {
    id: 'covenant_compliance_certificate',
    name: 'Compliance Certificate',
    description: 'Quarterly covenant compliance certification document',
    document_type: 'compliance_cert',
  },
];

const getTemplateIcon = (documentType: string) => {
  switch (documentType) {
    case 'term_loan':
      return <FileText className="h-6 w-6" />;
    case 'revolving_credit':
      return <FileCheck className="h-6 w-6" />;
    case 'promissory_note':
      return <FilePlus className="h-6 w-6" />;
    case 'amendment':
      return <FileEdit className="h-6 w-6" />;
    default:
      return <FileText className="h-6 w-6" />;
  }
};

const getTemplateColor = (documentType: string) => {
  switch (documentType) {
    case 'term_loan':
      return 'bg-blue-50 text-blue-600';
    case 'revolving_credit':
      return 'bg-teal-50 text-teal-600';
    case 'promissory_note':
      return 'bg-purple-50 text-purple-600';
    case 'amendment':
      return 'bg-amber-50 text-amber-600';
    case 'compliance_cert':
      return 'bg-green-50 text-green-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export function TemplateGallery({ templates, isLoading, onSelectTemplate }: TemplateGalleryProps) {
  const displayTemplates = templates && templates.length > 0 ? templates : defaultTemplates;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-12 w-12 rounded-lg bg-gray-200 mb-3" />
            <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-full bg-gray-100 rounded mb-1" />
            <div className="h-4 w-2/3 bg-gray-100 rounded mb-4" />
            <div className="h-9 w-full bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {displayTemplates.map((template, index) => (
        <div
          key={template.id ? `template-${template.id}` : `template-idx-${index}`}
          className="card p-4 hover:shadow-md transition-all duration-200 hover:border-blue-200 group"
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${getTemplateColor(
              template.document_type
            )} mb-3 transition-transform group-hover:scale-105`}
          >
            {getTemplateIcon(template.document_type)}
          </div>
          <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">{template.description}</p>
          {onSelectTemplate ? (
            <button
              onClick={() => onSelectTemplate(template)}
              className="btn btn--secondary w-full text-sm flex items-center justify-center gap-1 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200"
            >
              Use Template
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <Link
              href={`/documents/generate?template=${template.id}`}
              className="btn btn--secondary w-full text-sm flex items-center justify-center gap-1 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200"
            >
              Use Template
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

export default TemplateGallery;
