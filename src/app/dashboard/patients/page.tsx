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

async function getAdmissions(page: number, limit: number, search?: string, date?: string) {
  const offset = (page - 1) * limit;
  const params: any[] = [];

  // Resilient grouping: Group by name only to handle corrupted/shifted birthdays
  const idSubquery = `
    SELECT MAX(Id) FROM M_Patients 
    WHERE IsDeleted = false
    GROUP BY TRIM(LastName), TRIM(GivenName), IFNULL(TRIM(MiddleName), ''), IFNULL(TRIM(Suffix), '')
  `;

  let query = `
    SELECT p.*, 
      (SELECT COUNT(*) FROM M_Patients p2 
       WHERE TRIM(p2.LastName) = TRIM(p.LastName) 
         AND TRIM(p2.GivenName) = TRIM(p.GivenName) 
         AND (TRIM(p2.MiddleName) = TRIM(p.MiddleName) OR (p2.MiddleName IS NULL AND p.MiddleName IS NULL))
         AND (TRIM(p2.Suffix) = TRIM(p.Suffix) OR (p2.Suffix IS NULL AND p.Suffix IS NULL))
         AND p2.IsDeleted = false
      ) as AdmissionCount
    FROM M_Patients p
    WHERE p.Id IN (${idSubquery})
  `;

  if (search || date) {
    const searchConditions = [];
    if (search) {
      searchConditions.push('(p.LastName LIKE ? OR p.GivenName LIKE ? OR p.AttendingPhysician LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (date) {
      // Find patients who have AT LEAST ONE admission on this date
      searchConditions.push(`EXISTS (
        SELECT 1 FROM M_Patients p3 
        WHERE TRIM(p3.LastName) = TRIM(p.LastName) 
          AND TRIM(p3.GivenName) = TRIM(p.GivenName) 
          AND (TRIM(p3.MiddleName) = TRIM(p.MiddleName) OR (p3.MiddleName IS NULL AND p.MiddleName IS NULL))
          AND (TRIM(p3.Suffix) = TRIM(p.Suffix) OR (p3.Suffix IS NULL AND p.Suffix IS NULL))
          AND DATE(p3.CreatedAt) = ?
          AND p3.IsDeleted = false
      )`);
      params.push(date);
    }
    query += ` AND ${searchConditions.join(' AND ')}`;
  }

  query += ` ORDER BY p.CreatedAt DESC LIMIT ? OFFSET ?`;
  
  const [rows] = await pool.query<RowDataPacket[]>(query, [...params, limit, offset]);
  
  // Total count query (matching the resilient grouping)
  let countQuery = `
    SELECT COUNT(DISTINCT TRIM(LastName), TRIM(GivenName), IFNULL(TRIM(MiddleName), ''), IFNULL(TRIM(Suffix), '')) as count 
    FROM M_Patients 
    WHERE IsDeleted = false
  `;
  const countParams: any[] = [];
  if (search || date) {
    if (search) {
      countQuery += ' AND (LastName LIKE ? OR GivenName LIKE ? OR AttendingPhysician LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (date) {
       countQuery += ' AND DATE(CreatedAt) = ?';
       countParams.push(date);
    }
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
  searchParams: Promise<{ page?: string; limit?: string; search?: string; date?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const awaitedParams = await searchParams;
  const currentPage = Number(awaitedParams.page) || 1;
  const itemsPerPage = Number(awaitedParams.limit) || 10;
  const search = awaitedParams.search || '';
  const date = awaitedParams.date || '';

  const { admissions, totalItems } = await getAdmissions(currentPage, itemsPerPage, search, date);
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
                admissions.map((record: any) => (
                  <PatientRow key={record.Id} patient={record} />
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

