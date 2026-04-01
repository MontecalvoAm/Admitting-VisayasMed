const mysql = require('mysql2/promise');

async function migrateFormsDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'admitting_db',
  });

  try {
    console.log('Beginning Form Schema database refactoring mapping...');

    // 1. Create tables
    await connection.execute(`SET FOREIGN_KEY_CHECKS = 0;`);
    await connection.execute(`DROP TABLE IF EXISTS M_FormFields;`);
    await connection.execute(`DROP TABLE IF EXISTS M_FormSteps;`);
    await connection.execute(`DROP TABLE IF EXISTS M_Forms;`);
    await connection.execute(`SET FOREIGN_KEY_CHECKS = 1;`);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS M_Forms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        schema_name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS M_FormSteps (
        id VARCHAR(50) PRIMARY KEY,
        form_id INT NOT NULL,
        label VARCHAR(255) NOT NULL,
        order_index INT NOT NULL DEFAULT 0,
        FOREIGN KEY (form_id) REFERENCES M_Forms(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS M_FormFields (
        id VARCHAR(50) PRIMARY KEY,
        form_id INT NOT NULL,
        step_id VARCHAR(50) NOT NULL,
        label VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        is_required TINYINT(1) DEFAULT 0,
        placeholder VARCHAR(255),
        options JSON,
        order_index INT NOT NULL DEFAULT 0,
        FOREIGN KEY (form_id) REFERENCES M_Forms(id) ON DELETE CASCADE,
        FOREIGN KEY (step_id) REFERENCES M_FormSteps(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[+] Relational tables M_Forms, M_FormSteps, M_FormFields created.');

    // 2. Fetch existing schemas to migrate
    const [existing] = await connection.execute('SELECT * FROM form_schemas');
    console.log(`Found ${existing.length} legacy schemas to migrate.`);

    for (const legacy of existing) {
      const formName = legacy.schema_name;
      const stepsRaw = typeof legacy.steps === 'string' ? JSON.parse(legacy.steps) : (legacy.steps || []);
      const fieldsRaw = typeof legacy.fields === 'string' ? JSON.parse(legacy.fields) : (legacy.fields || []);

      // Avoid duplicating M_Forms
      const [formCheck] = await connection.execute('SELECT id FROM M_Forms WHERE schema_name = ?', [formName]);
      let formId;
      
      if (formCheck.length > 0) {
        formId = formCheck[0].id;
        console.log(`[-] Form ${formName} already migrated.`);
      } else {
        const [insertRes] = await connection.execute('INSERT INTO M_Forms (schema_name) VALUES (?)', [formName]);
        formId = insertRes.insertId;
        console.log(`[+] Migrating Form: ${formName} (ID ${formId})`);

        // Insert Steps
        let stepOrder = 1;
        for (const step of stepsRaw) {
          const globalStepId = `${formName}_${step.id}`;
          await connection.execute(
            'INSERT INTO M_FormSteps (id, form_id, label, order_index) VALUES (?, ?, ?, ?)',
            [globalStepId, formId, step.label || `Step ${stepOrder}`, step.order || stepOrder]
          );
          stepOrder++;
        }

        // Insert Fields
        let fieldOrderMap = {}; // track field order per step
        for (const field of fieldsRaw) {
          const stepId = field.stepId;
          const globalStepId = `${formName}_${stepId}`;
          const globalFieldId = `${formName}_${field.id}`;

          if (!fieldOrderMap[globalStepId]) {
            fieldOrderMap[globalStepId] = 1;
          }
          const fOrder = fieldOrderMap[globalStepId]++;
          const isReq = field.required ? 1 : 0;
          const optionsJSON = field.options ? JSON.stringify(field.options) : JSON.stringify([]);

          await connection.execute(
            'INSERT INTO M_FormFields (id, form_id, step_id, label, name, type, is_required, placeholder, options, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              globalFieldId, formId, globalStepId, field.label || 'Unnamed', field.name || 'unnamed',
              field.type || 'text', isReq, field.placeholder || '', optionsJSON, fOrder
            ]
          );
        }
        console.log(`[+] Completed transferring ${stepsRaw.length} steps and ${fieldsRaw.length} fields for "${formName}".`);
      }
    }

    console.log('Migration Complete.');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

migrateFormsDatabase();
