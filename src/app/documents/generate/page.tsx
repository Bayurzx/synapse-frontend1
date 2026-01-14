'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DocumentWizard } from '@/components/documents';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

function GenerateDocumentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const templateId = searchParams.get('template') || undefined;
  const borrowerId = searchParams.get('borrower') || undefined;

  const handleComplete = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  const handleCancel = () => {
    router.push('/documents');
  };

  return (
    <DocumentWizard
      initialTemplateId={templateId}
      initialBorrowerId={borrowerId}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}

export default function GenerateDocumentPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Generate Document</h1>
        <p className="text-gray-500 mt-1">
          Create a new loan document with risk-adaptive terms and covenants
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }>
        <GenerateDocumentContent />
      </Suspense>
    </div>
  );
}
