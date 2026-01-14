'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { synapseApi, Borrower } from '@/services/api';
import { Building2, Loader2, Plus, ExternalLink } from 'lucide-react';
import { BorrowerList } from '@/components/dashboard';
import { AddBorrowerDialog, useSuccessToast } from '@/components/common';
import type { BorrowerFormData } from '@/components/common';
import Link from 'next/link';

export default function BorrowersPage() {
  const [page, setPage] = useState(1);
  const [allBorrowers, setAllBorrowers] = useState<Borrower[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBorrowerId, setNewBorrowerId] = useState<string | null>(null);
  const pageSize = 20;
  const queryClient = useQueryClient();
  const router = useRouter();
  const showSuccess = useSuccessToast();

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['borrowers', page],
    queryFn: () => synapseApi.borrowers.list(page, pageSize),
  });

  const createMutation = useMutation({
    mutationFn: (data: BorrowerFormData) => synapseApi.borrowers.create(data),
    onSuccess: (newBorrower) => {
      // Reset to first page and refetch
      setPage(1);
      setAllBorrowers([]);
      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
      
      // Store the new borrower ID and show success toast
      setNewBorrowerId(newBorrower.id);
      showSuccess(`Borrower "${newBorrower.name}" created successfully!`);
    },
  });

  // Accumulate borrowers as pages are loaded
  const borrowers = page === 1 ? (data?.data || []) : [...allBorrowers.slice(0, (page - 1) * pageSize), ...(data?.data || [])];
  const pagination = data?.pagination;
  const hasMore = pagination?.has_next || false;
  const totalItems = pagination?.total_items || borrowers.length;

  const handleLoadMore = () => {
    setAllBorrowers(borrowers);
    setPage(p => p + 1);
  };

  const handleCreateBorrower = async (formData: BorrowerFormData) => {
    await createMutation.mutateAsync(formData);
  };

  const handleViewNewBorrower = () => {
    if (newBorrowerId) {
      router.push(`/borrowers/${newBorrowerId}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Borrowers</h1>
        <button 
          onClick={() => setIsAddDialogOpen(true)}
          className="btn btn--primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Borrower
        </button>
      </div>

      {/* Success banner with link to new borrower */}
      {newBorrowerId && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Building2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">Borrower created successfully!</p>
              <p className="text-sm text-green-600">A default loan facility has been generated.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/borrowers/${newBorrowerId}`}
              className="btn btn--primary btn--sm flex items-center gap-2"
            >
              View Borrower
              <ExternalLink className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setNewBorrowerId(null)}
              className="text-green-600 hover:text-green-800 px-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {error ? (
        <div className="card p-8 text-center">
          <p className="text-red-500">Failed to load borrowers. Please try again.</p>
        </div>
      ) : borrowers.length === 0 && !isLoading ? (
        <div className="card p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No borrowers found</p>
          <button 
            onClick={() => setIsAddDialogOpen(true)}
            className="btn btn--primary mt-4"
          >
            Add your first borrower
          </button>
        </div>
      ) : (
        <>
          <BorrowerList borrowers={borrowers} isLoading={isLoading && page === 1} />
          
          {/* Load More / Pagination Info */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-sm text-gray-500">
              Showing {borrowers.length} of {totalItems} borrowers
            </p>
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={isFetching}
                className="btn btn--secondary flex items-center gap-2"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Load More (${totalItems - borrowers.length} remaining)`
                )}
              </button>
            )}
          </div>
        </>
      )}

      {/* Add Borrower Dialog */}
      <AddBorrowerDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={() => {
          // Dialog handles closing, mutation handles refetch
        }}
        onCreate={handleCreateBorrower}
      />
    </div>
  );
}
