import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Missing ?name= parameter' }, { status: 400 });
    }

    const [formRows] = await pool.execute(
      'SELECT id, schema_name, created_at, updated_at FROM M_Forms WHERE schema_name = ? LIMIT 1',
      [name]
    );
    const formRow = (formRows as any[])[0];

    if (!formRow) {
      return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
    }

    const formId = formRow.id;

    // Fetch Steps
    const [stepRows] = await pool.execute(
      'SELECT id, label, order_index FROM M_FormSteps WHERE form_id = ? ORDER BY order_index ASC',
      [formId]
    );
    const steps = (stepRows as any[]).map(r => ({
      id: r.id.startsWith(name + '_') ? r.id.substring(name.length + 1) : r.id,
      label: r.label,
      order: r.order_index
    }));

    // Fetch Fields
    const [fieldRows] = await pool.execute(
      'SELECT id, step_id, label, name, type, is_required, placeholder, options, order_index FROM M_FormFields WHERE form_id = ? ORDER BY order_index ASC',
      [formId]
    );
    const fields = (fieldRows as any[]).map(r => ({
      id: r.id.startsWith(name + '_') ? r.id.substring(name.length + 1) : r.id,
      stepId: r.step_id.startsWith(name + '_') ? r.step_id.substring(name.length + 1) : r.step_id,
      label: r.label,
      name: r.name,
      type: r.type,
      required: Boolean(r.is_required),
      placeholder: r.placeholder || '',
      options: typeof r.options === 'string' ? JSON.parse(r.options) : (r.options || [])
    }));

    return NextResponse.json({
      id: formRow.id,
      schema_name: formRow.schema_name,
      steps,
      fields,
      created_at: formRow.created_at,
      updated_at: formRow.updated_at,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error) {
    console.error('[form-schema GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper to diff and UPSERT steps and fields
async function syncFormSchema(connection: any, formId: number, formName: string, steps: any[], fields: any[]) {
  const validStepIds = new Set<string>();
  let stepOrder = 1;

  for (const step of steps) {
    const globalStepId = `${formName}_${step.id}`;
    validStepIds.add(globalStepId);
    await connection.execute(
      `INSERT INTO M_FormSteps (id, form_id, label, order_index) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE label=VALUES(label), order_index=VALUES(order_index)`,
      [globalStepId, formId, step.label || `Step ${stepOrder}`, step.order || stepOrder]
    );
    stepOrder++;
  }

  // Delete purged steps
  const [existingSteps] = await connection.execute('SELECT id FROM M_FormSteps WHERE form_id = ?', [formId]);
  for (const row of existingSteps) {
    if (!validStepIds.has(row.id)) {
      await connection.execute('DELETE FROM M_FormSteps WHERE id = ?', [row.id]);
    }
  }

  const validFieldIds = new Set<string>();
  let fieldOrderMap: Record<string, number> = {};

  for (const field of fields) {
    const globalStepId = `${formName}_${field.stepId}`;
    const globalFieldId = `${formName}_${field.id}`;
    validFieldIds.add(globalFieldId);

    if (!fieldOrderMap[globalStepId]) fieldOrderMap[globalStepId] = 1;
    const fOrder = fieldOrderMap[globalStepId]++;
    
    const isReq = field.required ? 1 : 0;
    const optionsJSON = field.options ? JSON.stringify(field.options) : JSON.stringify([]);

    await connection.execute(
      `INSERT INTO M_FormFields (id, form_id, step_id, label, name, type, is_required, placeholder, options, order_index) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         step_id=VALUES(step_id), label=VALUES(label), name=VALUES(name), type=VALUES(type), 
         is_required=VALUES(is_required), placeholder=VALUES(placeholder), options=VALUES(options), 
         order_index=VALUES(order_index)`,
      [
        globalFieldId, formId, globalStepId, field.label || 'Unnamed', field.name || 'unnamed',
        field.type || 'text', isReq, field.placeholder || '', optionsJSON, fOrder
      ]
    );
  }

  // Delete purged fields
  const [existingFields] = await connection.execute('SELECT id FROM M_FormFields WHERE form_id = ?', [formId]);
  for (const row of existingFields) {
    if (!validFieldIds.has(row.id)) {
      await connection.execute('DELETE FROM M_FormFields WHERE id = ?', [row.id]);
    }
  }
}

export async function POST(req: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const body = await req.json();
    const { schema_name, steps, fields } = body;

    if (!schema_name || !steps || !fields) {
      return NextResponse.json({ error: 'schema_name, steps, and fields are required.' }, { status: 400 });
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      'INSERT INTO M_Forms (schema_name) VALUES (?)',
      [schema_name]
    );
    const formId = (result as any).insertId;

    await syncFormSchema(connection, formId, schema_name, steps, fields);

    await connection.commit();
    return NextResponse.json({ success: true, insertId: formId }, { status: 201 });
  } catch (error: any) {
    await connection.rollback();
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'A schema with that name already exists.' }, { status: 409 });
    }
    console.error('[form-schema POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    connection.release();
  }
}

export async function PUT(req: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const body = await req.json();
    const { id, schema_name, steps, fields } = body;

    if (!id || !steps || !fields) {
      return NextResponse.json({ error: 'id, steps, and fields are required.' }, { status: 400 });
    }

    await connection.beginTransaction();

    const [formRows] = await connection.execute('SELECT schema_name FROM M_Forms WHERE id = ? FOR UPDATE', [id]);
    const formRow = (formRows as any[])[0];
    if (!formRow) {
      await connection.rollback();
      return NextResponse.json({ error: 'Form not found.' }, { status: 404 });
    }

    const currentName = schema_name || formRow.schema_name;
    if (schema_name && schema_name !== formRow.schema_name) {
      await connection.execute('UPDATE M_Forms SET schema_name = ? WHERE id = ?', [schema_name, id]);
    }

    await syncFormSchema(connection, id, currentName, steps, fields);

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('[form-schema PUT]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    connection.release();
  }
}
