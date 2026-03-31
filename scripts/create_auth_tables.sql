CREATE TABLE IF NOT EXISTS M_Roles (
    RoleID INT AUTO_INCREMENT PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE,
    Description TEXT,
    CreatedBy VARCHAR(100),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedBy VARCHAR(100),
    UpdatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,
    IsDeleted BOOLEAN DEFAULT FALSE,
    DeletedAt DATETIME,
    DeletedBy VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS M_Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    RoleID INT,
    CreatedBy VARCHAR(100),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedBy VARCHAR(100),
    UpdatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,
    IsDeleted BOOLEAN DEFAULT FALSE,
    DeletedAt DATETIME,
    DeletedBy VARCHAR(100),
    FOREIGN KEY (RoleID) REFERENCES M_Roles(RoleID) ON DELETE SET NULL
);

INSERT INTO M_Roles (RoleName, Description, CreatedBy) VALUES
('Super Admin', 'Full system access and user management', 'System'),
('Admin', 'Can manage patient records and administrative tasks', 'System'),
...
('Staff', 'Can view and create patient admission forms', 'System')
ON DUPLICATE KEY UPDATE Description = VALUES(Description);

-- Seed Super Admin User
INSERT INTO M_Users (FirstName, LastName, Email, Password, RoleID, CreatedBy) 
SELECT 'Aljon', 'Montecalvo', 'aljon.montecalvo08@gmail.com', '$2b$10$F04iK0LlaAUTo8Dfi1B.E.jpaxZ5kOtYlOpvxYUCk9xSpLMUHZnHy', RoleID, 'System'
FROM M_Roles 
WHERE RoleName = 'Super Admin'
AND NOT EXISTS (SELECT 1 FROM M_Users WHERE Email = 'aljon.montecalvo08@gmail.com');
