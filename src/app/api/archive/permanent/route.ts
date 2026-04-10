import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/rbac';
import { recordAuditLog, AuditAction, AuditResource } from '@/lib/auditLogger';

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permission for Archive module (Delete permission needed for Permanent Delete)
  const canDelete = await hasPermission(session.userId, session.roleId, 'Archive', 'Delete');
  if (!canDelete) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  try {
    const { type, id } = await req.json();

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID are required' }, { status: 400 });
    }

    let tableName = '';
    let idColumn = '';
    let resourceName = '';
    let nameLog = '';

    if (type === 'users') {
      tableName = 'M_Users';
      idColumn = 'UserID';
      resourceName = 'User';
      
      const [userRows] = await pool.query<RowDataPacket[]>(
        `SELECT FirstName, LastName FROM ${tableName} WHERE ${idColumn} = ?`,
        [id]
      );
      nameLog = userRows.length > 0 ? `${userRows[0].FirstName} ${userRows[0].LastName}` : 'Unknown User';
    } else if (type === 'patients') {
      tableName = 'M_Patients';
      idColumn = 'PatientID';
      resourceName = 'Patient';
      
      const [patientRows] = await pool.query<RowDataPacket[]>(
        `SELECT LastName, GivenName FROM ${tableName} WHERE ${idColumn} = ?`,
        [id]
      );
      nameLog = patientRows.length > 0 ? `${patientRows[0].LastName}, ${patientRows[0].GivenName}` : 'Unknown Patient';
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // If patient, also permanently delete all their admissions first (Foreign Key constraint)
      if (type === 'patients') {
        await connection.execute(
          'DELETE FROM M_Admissions WHERE PatientID = ?',
          [id]
        );
      }

      // Actual permanent delete from DB
      const [result] = await connection.execute<ResultSetHeader>(
        `DELETE FROM ${tableName} WHERE ${idColumn} = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    // Record Audit Log
    await recordAuditLog({
      action: 'PERMANENT_DELETE' as AuditAction,
      resource: resourceName as AuditResource,
      resourceId: id.toString(),
      details: `${resourceName} record permanently deleted from database: ${nameLog}`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error permanently deleting record:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
