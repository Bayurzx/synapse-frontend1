'use client';

import { use } from 'react';
import { BorrowerDetail } from '@/components/dashboard';

interface BorrowerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function BorrowerDetailPage({ params }: BorrowerDetailPageProps) {
  const { id } = use(params);
  
  return <BorrowerDetail borrowerId={id} />;
}
