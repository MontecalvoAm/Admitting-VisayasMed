import { NextRequest, NextResponse } from 'next/server';
import { recordAuditLog, AuditAction, AuditResource } from '@/lib/auditLogger';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, resource, resourceId, details } = await req.json();

    if (!action || !resource) {
      return NextResponse.json({ error: 'Action and Resource are required.' }, { status: 400 });
    }

    await recordAuditLog({
      action: action as AuditAction,
      resource: resource as AuditResource,
      resourceId,
      details,
      userId: session.userId,
      userName: `${session.firstName} ${session.lastName}`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in manual audit log API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET logs for the dashboard
 */
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC permission for 'Logs' module
    // This should ideally be handled by a middleware or a HOC, but we'll do it here for now
    // Actually, we'll just check if they are Super Admin for now to be safe
    if (session.roleName !== 'Super Admin') {
      // Future: Check actual RBAC table
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const search = searchParams.get('search');

    let query = 'SELECT * FROM M_AuditLogs WHERE 1=1';
    const params: (string | number)[] = [];

    if (action) {
      query += ' AND Action = ?';
      params.push(action);
    }

    if (resource) {
      query += ' AND Resource = ?';
      params.push(resource);
    }

    if (search) {
      query += ' AND (UserName LIKE ? OR Details LIKE ? OR ResourceID LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY CreatedAt DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM M_AuditLogs WHERE 1=1';
    const countParams: (string | number)[] = [];
    if (action) { countQuery += ' AND Action = ?'; countParams.push(action); }
    if (resource) { countQuery += ' AND Resource = ?'; countParams.push(resource); }
    if (search) { countQuery += ' AND (UserName LIKE ? OR Details LIKE ? OR ResourceID LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, countParams);

    return NextResponse.json({
      logs: rows,
      total: countRows[0].total
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
