# Seed Scripts

## Create Admin User

This script creates an admin user in the database.

### Usage

**Default admin (email: admin@findstore.com, password: admin123):**
```bash
npm run seed:admin
```

**Custom email and password:**
```bash
npm run seed:admin your-email@example.com yourpassword
```

**Custom email, password, and name:**
```bash
npm run seed:admin your-email@example.com yourpassword "Admin Name"
```

**Or run directly:**
```bash
node scripts/seedAdmin.js
node scripts/seedAdmin.js admin@example.com admin123
node scripts/seedAdmin.js admin@example.com admin123 "Admin User"
```

### Examples

```bash
# Create default admin
npm run seed:admin

# Create admin with custom credentials
npm run seed:admin admin@mystore.com MySecurePassword123

# Create admin with custom name
npm run seed:admin admin@mystore.com MySecurePassword123 "Store Administrator"
```

### Notes

- If a user with the same email already exists, the script will update that user to admin role
- If you provide a password when updating an existing user, it will be updated
- Passwords are automatically hashed using bcrypt
- Make sure your MongoDB connection is configured in `.env` file before running

