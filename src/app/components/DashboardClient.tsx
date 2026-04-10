'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import PatientActions from './PatientActions';

import { AdmitData } from '@/lib/schemas';

interface DashboardClientProps {
  patient: AdmitData & { Id: number; CreatedAt?: string };
}

const DashboardClient: React.FC<DashboardClientProps> = ({ patient }) => {
  const router = useRouter();

  return (
    <PatientActions 
      patient={patient} 
      isAdmission={true}
      onInteraction={() => router.refresh()} 
    />
  );
};

export default DashboardClient;
