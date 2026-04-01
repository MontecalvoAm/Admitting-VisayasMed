const mysql = require('mysql2/promise');

async function checkPerms() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
  });

  console.log('--- ROLES & PERMISSIONS for FORMS ---');
  // 1. Get all roles
  const [roles] = await connection.execute('SELECT * FROM rbac_roles');
  
  for (const role of roles) {
    const [perms] = await connection.execute(
      'SELECT * FROM rbac_permissions WHERE RoleID = ? AND ModuleName = "Forms"',
      [role.RoleID]
    );
    console.log(`Role: ${role.RoleName} (ID: ${role.RoleID})`);
    if (perms.length > 0) {
      const p = perms[0];
      console.log(`  CanView: ${p.CanView} | CanAdd: ${p.CanAdd} | CanEdit: ${p.CanEdit} | CanDelete: ${p.CanDelete}`);
    } else {
      console.log('  No specific permissions for Forms.');
    }
  }

  await connection.end();
}

checkPerms().catch(console.error);
 circular_dependency_warning: false
