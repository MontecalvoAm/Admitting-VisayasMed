import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getEffectivePermissions } from '@/lib/rbac';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await getEffectivePermissions(session.userId, session.roleId);
    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching my permissions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
