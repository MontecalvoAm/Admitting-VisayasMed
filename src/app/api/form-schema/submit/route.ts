import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/form-schema/submit
// Body: { schema_name: string, data: Record<string, any> }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { schema_name, data } = body;

    if (!schema_name || !data) {
      return NextResponse.json({ error: 'schema_name and data are required.' }, { status: 400 });
    }

    // Verify the schema exists
    const [rows] = await pool.execute(
      'SELECT id FROM form_schemas WHERE schema_name = ? LIMIT 1',
      [schema_name]
    );
    const schema = (rows as any[])[0];
    if (!schema) {
      return NextResponse.json({ error: 'Schema not found.' }, { status: 404 });
    }

    // Store the submission as JSON in form_submissions table
    await pool.execute(
      `CREATE TABLE IF NOT EXISTS form_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        schema_id INT NOT NULL,
        schema_name VARCHAR(100) NOT NULL,
        submission_data JSON NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schema_id) REFERENCES form_schemas(id)
      )`
    );

    const [result] = await pool.execute(
      'INSERT INTO form_submissions (schema_id, schema_name, submission_data) VALUES (?, ?, ?)',
      [schema.id, schema_name, JSON.stringify(data)]
    );

    return NextResponse.json({ success: true, insertId: (result as any).insertId }, { status: 201 });
  } catch (error) {
    console.error('[form-schema/submit POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
