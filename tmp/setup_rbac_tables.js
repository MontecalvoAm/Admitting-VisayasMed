const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
  });

  try {
    console.log('--- Creating M_Modules table ---');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS M_Modules (
        ModuleID INT AUTO_INCREMENT PRIMARY KEY,
        ModuleName VARCHAR(100) NOT NULL UNIQUE,
        ModulePath VARCHAR(255) NOT NULL,
        Icon VARCHAR(50),
        SortOrder INT DEFAULT 0,
        CreatedBy VARCHAR(100) DEFAULT 'System',
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedBy VARCHAR(100),
        UpdatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,
        IsDeleted TINYINT(1) DEFAULT 0,
        DeletedBy VARCHAR(100),
        DeletedAt DATETIME
      )
    `);

    console.log('--- Creating M_RolePermissions table ---');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS M_RolePermissions (
        RolePermissionID INT AUTO_INCREMENT PRIMARY KEY,
        RoleID INT NOT NULL,
        ModuleID INT NOT NULL,
        CanView TINYINT(1) DEFAULT 0,
        CanAdd TINYINT(1) DEFAULT 0,
        CanEdit TINYINT(1) DEFAULT 0,
        CanDelete TINYINT(1) DEFAULT 0,
        CreatedBy VARCHAR(100) DEFAULT 'System',
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedBy VARCHAR(100),
        UpdatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,
        IsDeleted TINYINT(1) DEFAULT 0,
        DeletedBy VARCHAR(100),
        DeletedAt DATETIME,
        CONSTRAINT FK_RolePerm_Role FOREIGN KEY (RoleID) REFERENCES M_Roles(RoleID),
        CONSTRAINT FK_RolePerm_Module FOREIGN KEY (ModuleID) REFERENCES M_Modules(ModuleID)
      )
    `);

    console.log('--- Creating M_UserPermissions table ---');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS M_UserPermissions (
        UserPermissionID INT AUTO_INCREMENT PRIMARY KEY,
        UserID INT NOT NULL,
        ModuleID INT NOT NULL,
        CanView TINYINT(1) DEFAULT 0,
        CanAdd TINYINT(1) DEFAULT 0,
        CanEdit TINYINT(1) DEFAULT 0,
        CanDelete TINYINT(1) DEFAULT 0,
        CreatedBy VARCHAR(100) DEFAULT 'System',
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedBy VARCHAR(100),
        UpdatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,
        IsDeleted TINYINT(1) DEFAULT 0,
        DeletedBy VARCHAR(100),
        DeletedAt DATETIME,
        CONSTRAINT FK_UserPerm_User FOREIGN KEY (UserID) REFERENCES M_Users(UserID),
        CONSTRAINT FK_UserPerm_Module FOREIGN KEY (ModuleID) REFERENCES M_Modules(ModuleID)
      )
    `);

    console.log('--- Seeding M_Modules ---');
    const modules = [
      ['Dashboard', '/dashboard', 'LayoutDashboard', 1],
      ['Patients', '/dashboard/patients', 'Users', 2],
      ['Forms', '/dashboard/forms', 'ClipboardList', 3],
      ['Users', '/dashboard/users', 'Settings', 4],
      ['Roles', '/dashboard/roles', 'Shield', 5],
    ];

    for (const [name, path, icon, sort] of modules) {
      await pool.query(
        'INSERT INTO M_Modules (ModuleName, ModulePath, Icon, SortOrder) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE ModulePath=VALUES(ModulePath), Icon=VALUES(Icon), SortOrder=VALUES(SortOrder)',
        [name, path, icon, sort]
      );
    }

    console.log('--- Seeding Default Permissions for Super Admin (RoleID = 1) ---');
    const [moduleRows] = await pool.query('SELECT ModuleID FROM M_Modules');
    for (const mod of moduleRows) {
      await pool.query(
        'INSERT INTO M_RolePermissions (RoleID, ModuleID, CanView, CanAdd, CanEdit, CanDelete) VALUES (?, ?, 1, 1, 1, 1) ON DUPLICATE KEY UPDATE CanView=1, CanAdd=1, CanEdit=1, CanDelete=1',
        [1, mod.ModuleID]
      );
    }

    console.log('--- Migration completed successfully ---');
    await pool.end();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
