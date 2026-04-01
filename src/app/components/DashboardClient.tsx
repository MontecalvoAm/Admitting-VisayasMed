'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import PatientActions from './PatientActions';

interface DashboardClientProps {
  id: number;
  patient: any;
}

const DashboardClient: React.FC<DashboardClientProps> = ({ id, patient }) => {
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
