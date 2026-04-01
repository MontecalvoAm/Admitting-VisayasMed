import React from 'react';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Users, Shield } from 'lucide-react';
import UsersRegistry from '@/app/components/UsersRegistry';
import RolesRegistry from '@/app/components/RolesRegistry';
import Link from 'next/link';

async function getUsers(page: number, limit: number, search?: string, roleId?: string, status?: string) {
  const offset = (page - 1) * limit;
  const params: any[] = [];
  const countParams: any[] = [];

  let query = `
    SELECT u.*, r.RoleName 
    FROM M_Users u 
    LEFT JOIN M_Roles r ON u.RoleID = r.RoleID 
    WHERE 1=1
  `;
  
  let countQuery = 'SELECT COUNT(*) as count FROM M_Users u WHERE 1=1';

  const conditions = [];
  if (search) {
    conditions.push('(u.FirstName LIKE ? OR u.LastName LIKE ? OR u.Email LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s);
    countParams.push(s, s, s);
  }
  if (roleId) {
    conditions.push('u.RoleID = ?');
    params.push(roleId);
    countParams.push(roleId);
  }
  if (status) {
    const isDeleted = status === 'Inactive';
    conditions.push('u.IsDeleted = ?');
    params.push(isDeleted);
    countParams.push(isDeleted);
  } else {
    // Default to only showing active users if no status filter is applied
    conditions.push('u.IsDeleted = false');
  }

  if (conditions.length > 0) {
    const combined = ` AND ${conditions.join(' AND ')}`;
    query += combined;
    countQuery += combined;
  }

  query += ' ORDER BY u.CreatedAt DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  const [countRows] = await pool.query<RowDataPacket[]>(countQuery, countParams);
  
  return {
    users: JSON.parse(JSON.stringify(rows)),
    totalItems: (countRows[0] as any).count,
  };
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; tab?: string; search?: string; role?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const awaitedParams = await searchParams;
  const currentPage = Number(awaitedParams.page) || 1;
  const itemsPerPage = Number(awaitedParams.limit) || 5;
  const currentTab = awaitedParams.tab || 'users';
  const search = awaitedParams.search || '';
  const role = awaitedParams.role || '';
  const status = awaitedParams.status || '';

  const { users, totalItems } = await getUsers(currentPage, itemsPerPage, search, role, status);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-2xl w-fit border border-slate-200">
        <Link 
          href="/dashboard/users?tab=users"
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            currentTab === 'users' 
              ? 'bg-white text-vmed-blue-dark shadow-sm border border-slate-100' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <Users className="w-4 h-4" />
          System Users
        </Link>
        <Link 
          href="/dashboard/users?tab=roles"
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            currentTab === 'roles' 
              ? 'bg-white text-vmed-blue-dark shadow-sm border border-slate-100' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <Shield className="w-4 h-4" />
          Access Roles
        </Link>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {currentTab === 'users' ? (
          <UsersRegistry 
            users={users}
            totalItems={totalItems}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
          />
        ) : (
          <RolesRegistry 
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>
    </div>
  );
}
