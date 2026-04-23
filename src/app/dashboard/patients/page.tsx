import React from 'react';
import { readPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/rbac';
import { getCachedData } from '@/lib/redisCache';
import PaginationWrapper from '@/app/components/PaginationWrapper';
import PatientRow from '@/app/components/PatientRow';
import PatientsRegistryHeader from '@/app/components/PatientsRegistryHeader';

async function getAdmissions(page: number, limit: number, search?: string, date?: string, caseType?: string) {
  const offset = (page - 1) * limit;
  const params: (string | number)[] = [];

  // Optimized query: Join M_Patients with their LATEST admission
  let query = `
    SELECT p.*, a.*, p.PatientID as Id, a.AdmissionID as CurrentAdmissionID,
      (SELECT COUNT(*) FROM M_Admissions a2 WHERE a2.PatientID = p.PatientID AND a2.IsDeleted = false) as AdmissionCount
    FROM M_Patients p
    JOIN M_Admissions a ON p.PatientID = a.PatientID
    -- Subquery to find only the LATEST admission per patient
    JOIN (
      SELECT PatientID, MAX(AdmissionID) as LatestAdmissionID
      FROM M_Admissions
      WHERE IsDeleted = false
      GROUP BY PatientID
    ) Latest ON a.AdmissionID = Latest.LatestAdmissionID
    WHERE p.IsDeleted = false
  `;

  const conditions = [];
  if (search) {
    conditions.push('(p.LastName LIKE ? OR p.GivenName LIKE ? OR a.AttendingPhysician LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (date) {
    // Optimized date filtering: match any admission on this date for the patient
    conditions.push(`EXISTS (
      SELECT 1 FROM M_Admissions a3 
      WHERE a3.PatientID = p.PatientID 
        AND DATE(a3.AdmittedAt) = ?
        AND a3.IsDeleted = false
    )`);
    params.push(date);
  }
  if (caseType) {
    conditions.push('a.ServiceCaseType = ?');
    params.push(caseType);
  }

  if (conditions.length > 0) {
    query += ` AND ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY a.AdmittedAt DESC LIMIT ? OFFSET ?`;
  
  const [rows] = await readPool.query<RowDataPacket[]>(query, [...params, limit, offset]);
  
  // Total count query (much simpler now)
  let countQuery = `
    SELECT COUNT(*) as count 
    FROM M_Patients p
    WHERE IsDeleted = false
  `;
  const countParams: (string | number)[] = [];
  const countConditions = [];
  if (search) {
    countConditions.push('(LastName LIKE ? OR GivenName LIKE ?)');
    countParams.push(`%${search}%`, `%${search}%`);
  }
  // Note: Filtering count by admission date/casetype is trickier if we only want unique patients
  // but for the registry, we want unique patients that match the criteria.
  if (date || caseType) {
    countQuery += ` AND EXISTS (SELECT 1 FROM M_Admissions a_count WHERE a_count.PatientID = p.PatientID AND a_count.IsDeleted = false`;
    if (date) {
      countQuery += ` AND DATE(a_count.AdmittedAt) = ?`;
      countParams.push(date);
    }
    if (caseType) {
      countQuery += ` AND a_count.ServiceCaseType = ?`;
      countParams.push(caseType);
    }
    countQuery += `)`;
  }

  if (countConditions.length > 0) {
    countQuery += ` AND ${countConditions.join(' AND ')}`;
  }

  const cacheKey = `patients:count:${search}:${date}:${caseType}`;
  const totalItems = await getCachedData(
    cacheKey,
    async () => {
      const [countRows] = await readPool.query<RowDataPacket[]>(countQuery, countParams);
      return (countRows[0] as { count: number }).count;
    },
    60 // Cache pagination count for 60 seconds
  );
  
  return {
    admissions: JSON.parse(JSON.stringify(rows)),
    totalItems,
  };
}

export const dynamic = 'force-dynamic';

// async function getAdmissions... moved imports to top

import PatientCard from '@/app/components/PatientCard';

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; search?: string; date?: string; caseType?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Check module permission
  const canView = await hasPermission(session.userId, session.roleId, 'Patients', 'View');
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-red-50/50 rounded-3xl border border-red-100 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-red-100 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-10a4 4 0 11-8 0 4 4 0 018 0zm-4-3v3M7 7h10" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Access Denied</h1>
        <p className="mt-2 text-slate-500 font-medium max-w-md mx-auto">
          You do not have sufficient permissions to access the patients module. Please contact your system administrator.
        </p>
      </div>
    );
  }

  const awaitedParams = await searchParams;
  const currentPage = Number(awaitedParams.page) || 1;
  const itemsPerPage = Number(awaitedParams.limit) || 10; // Updated default limit for cards
  const search = awaitedParams.search || '';
  const date = awaitedParams.date || '';
  const caseType = awaitedParams.caseType || '';

  const { admissions, totalItems } = await getAdmissions(currentPage, itemsPerPage, search, date, caseType);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="space-y-6">
      <PatientsRegistryHeader />

      {/* Desktop Table View */}
      <div className="hidden lg:block glass-panel rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Age / Sex</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Case Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date Admitted</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {admissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium italic">
                    No matching patient records found.
                  </td>
                </tr>
              ) : (
                admissions.map((record: Record<string, unknown>, index: number) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  return <PatientRow key={((record.Id as number) || index)} patient={record as any} index={index} />;
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {admissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium glass-panel rounded-2xl border border-slate-100 italic">
            No matching patient records found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {admissions.map((record: Record<string, unknown>, index: number) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <PatientCard key={((record.Id as number) || index)} patient={record as any} />
            ))}
          </div>
        )}
      </div>
      
      {/* Pagination Section */}
      <div className="glass-panel border border-slate-100 rounded-2xl">
        <PaginationWrapper 
          currentPage={currentPage} 
          totalPages={totalPages} 
          totalItems={totalItems} 
          itemsPerPage={itemsPerPage} 
        />
      </div>
    </div>
  );
}

