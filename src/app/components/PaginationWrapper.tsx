'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Pagination from './Pagination';

interface PaginationWrapperProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function PaginationWrapper({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage 
}: PaginationWrapperProps) {
  const router = useRouter();
  
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <Pagination 
      currentPage={currentPage} 
      totalPages={totalPages} 
      onPageChange={handlePageChange} 
      totalItems={totalItems} 
      itemsPerPage={itemsPerPage} 
    />
  );
}
