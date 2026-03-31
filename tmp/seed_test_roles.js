const mysql = require('mysql2/promise');

async function seedRoles() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
  });

  try {
    console.log('--- Seeding Admin and Staff Roles ---');
    
    // Add Admin Role
    const [adminResult] = await pool.query(
      "INSERT INTO M_Roles (RoleName, Description, CreatedBy) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE Description=VALUES(Description)",
      ['Admin', 'Administrative access with some restrictions', 'System']
    );
    
    // Add Staff Role
    const [staffResult] = await pool.query(
      "INSERT INTO M_Roles (RoleName, Description, CreatedBy) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE Description=VALUES(Description)",
      ['Staff', 'Standard user with limited view/add access', 'System']
    );

    const [roles] = await pool.query("SELECT RoleID, RoleName FROM M_Roles WHERE RoleName IN ('Admin', 'Staff')");
    const [modules] = await pool.query("SELECT ModuleID, ModuleName FROM M_Modules");

    for (const role of roles) {
      for (const mod of modules) {
        let view = 1, add = 0, edit = 0, del = 0;
        
        if (role.RoleName === 'Admin') {
          view = 1; add = 1; edit = 1;
          if (mod.ModuleName === 'Patients') del = 1;
          if (mod.ModuleName === 'Users' || mod.ModuleName === 'Roles') { add = 0; edit = 0; del = 0; }
        } else if (role.RoleName === 'Staff') {
          view = 1;
          if (mod.ModuleName === 'Patients') add = 1;
          if (mod.ModuleName === 'Users' || mod.ModuleName === 'Roles' || mod.ModuleName === 'Forms') view = 0;
        }

        await pool.query(
          "INSERT INTO M_RolePermissions (RoleID, ModuleID, CanView, CanAdd, CanEdit, CanDelete) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE CanView=VALUES(CanView), CanAdd=VALUES(CanAdd), CanEdit=VALUES(CanEdit), CanDelete=VALUES(CanDelete)",
          [role.RoleID, mod.ModuleID, view, add, edit, del]
        );
      }
    }

    console.log('--- Seeding completed ---');
    await pool.end();
  } catch (err) {
    console.error('Seed failed:', err);
  }
}

seedRoles();
