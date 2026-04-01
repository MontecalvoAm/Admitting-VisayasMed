import pool from './db';
import { getSession } from './session';
import { headers } from 'next/headers';

export type AuditAction = 'LOGIN' | 'FAILED_LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'PRINT' | 'EXPORT' | 'VIEW' | 'RESTORE' | 'PERMANENT_DELETE';
export type AuditResource = 'Patient' | 'Admission' | 'User' | 'Role' | 'Form' | 'Settings' | 'System' | 'Archive';

interface AuditLogParams {
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string | number;
  details?: string | object;
  userId?: number; // Optional: Manual override (e.g. for login)
  userName?: string; // Optional: Manual override
}

/**
 * Record an event in the M_AuditLogs table.
 * Can be called from Route Handlers.
 */
export async function recordAuditLog({
  action,
  resource,
  resourceId,
  details,
  userId,
  userName
}: AuditLogParams) {
  try {
    let finalUserId = userId;
    let finalUserName = userName;

    // If not provided, try to get from session
    if (!finalUserId) {
      const session = await getSession();
      if (session) {
        finalUserId = session.userId;
        finalUserName = `${session.firstName} ${session.lastName}`;
      }
    }

    // Get request headers for IP and User Agent
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = headerList.get('user-agent') || 'Unknown';

    // Format details
    const finalDetails = typeof details === 'object' ? JSON.stringify(details) : details;

    await pool.query(
      `INSERT INTO M_AuditLogs 
      (UserID, UserName, Action, Resource, ResourceID, Details, IPAddress, UserAgent) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalUserId || null,
        finalUserName || 'System',
        action,
        resource,
        resourceId?.toString() || null,
        finalDetails || null,
        ip,
        userAgent
      ]
    );

    return true;
  } catch (error) {
    console.error('Error recording audit log:', error);
    return false;
  }
}
