'use client';

import { usePathname } from 'next/navigation';
import MainLayout from './MainLayout';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

// Pages that should NOT have the sidebar/header layout
const FULL_PAGE_ROUTES = ['/'];

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Check if current route should be full-page (no sidebar)
  const isFullPage = FULL_PAGE_ROUTES.includes(pathname);
  
  if (isFullPage) {
    return <>{children}</>;
  }
  
  return <MainLayout>{children}</MainLayout>;
}
