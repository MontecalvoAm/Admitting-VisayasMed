import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/form-schema?name=doctor-registration
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Missing ?name= parameter' }, { status: 400 });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM form_schemas WHERE schema_name = ? LIMIT 1',
      [name]
    );

    const schema = (rows as any[])[0];

    if (!schema) {
      return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
    }

    // MySQL JSON columns come back as strings; parse them
    return NextResponse.json({
      id: schema.id,
      schema_name: schema.schema_name,
      steps: typeof schema.steps === 'string' ? JSON.parse(schema.steps) : schema.steps,
      fields: typeof schema.fields === 'string' ? JSON.parse(schema.fields) : schema.fields,
      created_at: schema.created_at,
      updated_at: schema.updated_at,
    });
  } catch (error) {
    console.error('[form-schema GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/form-schema — create new schema
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { schema_name, steps, fields } = body;

    if (!schema_name || !steps || !fields) {
      return NextResponse.json({ error: 'schema_name, steps, and fields are required.' }, { status: 400 });
    }

    const [result] = await pool.execute(
      'INSERT INTO form_schemas (schema_name, steps, fields) VALUES (?, ?, ?)',
      [schema_name, JSON.stringify(steps), JSON.stringify(fields)]
    );

    return NextResponse.json({ success: true, insertId: (result as any).insertId }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'A schema with that name already exists.' }, { status: 409 });
    }
    console.error('[form-schema POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/form-schema — update an existing schema by id
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, schema_name, steps, fields } = body;

    if (!id || !steps || !fields) {
      return NextResponse.json({ error: 'id, steps, and fields are required.' }, { status: 400 });
    }

    await pool.execute(
      'UPDATE form_schemas SET steps = ?, fields = ?, schema_name = COALESCE(?, schema_name) WHERE id = ?',
      [JSON.stringify(steps), JSON.stringify(fields), schema_name ?? null, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[form-schema PUT]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
