import React from 'react';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Search, Download, Plus, Clock, Filter } from 'lucide-react';
import PatientActions from '@/app/components/PatientActions';
import PaginationWrapper from '@/app/components/PaginationWrapper';
import PatientRow from '@/app/components/PatientRow';
import PatientsRegistryHeader from '@/app/components/PatientsRegistryHeader';

async function getAdmissions(page: number, limit: number, search?: string, date?: string, caseType?: string) {
  const offset = (page - 1) * limit;
  const params: any[] = [];

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
  
  const [rows] = await pool.query<RowDataPacket[]>(query, [...params, limit, offset]);
  
  // Total count query (much simpler now)
  let countQuery = `
    SELECT COUNT(*) as count 
    FROM M_Patients p
    WHERE IsDeleted = false
  `;
  const countParams: any[] = [];
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

  const [countRows] = await pool.query<RowDataPacket[]>(countQuery, countParams);
  
  return {
    admissions: JSON.parse(JSON.stringify(rows)),
    totalItems: (countRows[0] as any).count,
  };
}

export const dynamic = 'force-dynamic';

// async function getAdmissions... moved imports to top

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; search?: string; date?: string; caseType?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const awaitedParams = await searchParams;
  const currentPage = Number(awaitedParams.page) || 1;
  const itemsPerPage = Number(awaitedParams.limit) || 5;
  const search = awaitedParams.search || '';
  const date = awaitedParams.date || '';
  const caseType = awaitedParams.caseType || '';

  const { admissions, totalItems } = await getAdmissions(currentPage, itemsPerPage, search, date, caseType);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="space-y-6">
      <PatientsRegistryHeader />

      {/* Data Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
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
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No patient records found.
                  </td>
                </tr>
              ) : (
                admissions.map((record: any, index: number) => (
                  <PatientRow key={record.Id} patient={record} index={index} />
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Section */}
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

