# Fix Login Issue - Quick Guide

## Problem: Can't Login After Changing Admin Name

If you changed the admin name and now can't login, here's how to fix it:

## Solution 1: Reset Admin Password (Recommended)

If you know the email address you used, reset the password:

```bash
cd backend
node scripts/resetAdmin.js your-email@example.com newpassword
```

**Example:**
```bash
node scripts/resetAdmin.js admin@findstore.com admin123
```

This will:
- Find the user by email
- Reset the password to what you specify
- Set the role to admin
- Update the name

## Solution 2: Recreate Admin User

If you don't remember the email, you can create a fresh admin user:

```bash
cd backend
npm run seed:admin your-email@example.com your-password "Your Name"
```

**Example:**
```bash
npm run seed:admin admin@findstore.com admin123 "Admin User"
```

## Solution 3: Use Default Credentials

Reset to default admin credentials:

```bash
cd backend
npm run seed:admin
```

This creates/updates admin with:
- Email: `admin@findstore.com`
- Password: `admin123`
- Name: `Admin User`

## Important Notes

1. **Email is case-insensitive** - You can use `Admin@FindStore.com` or `admin@findstore.com`

2. **After running the script, use the EXACT credentials shown** - The script will display:
   ```
   📋 Login Credentials:
      Email: admin@findstore.com
      Password: admin123
   ```

3. **If you changed the email** - You MUST use the new email to login, not the old one

4. **If you changed the password** - You MUST use the new password to login

## Still Can't Login?

1. **Check backend console** - Look for error messages when you try to login
2. **Verify MongoDB connection** - Make sure backend can connect to database
3. **Check the script output** - The script shows exactly what credentials to use
4. **Try creating a new user** - Register a new account first, then make it admin:
   ```bash
   # First register on the website, then run:
   node scripts/resetAdmin.js your-registered-email@example.com your-password
   ```

## Quick Commands Reference

```bash
# Create/update admin with default credentials
npm run seed:admin

# Create/update admin with custom credentials
npm run seed:admin email@example.com password "Name"

# Reset password for existing user
node scripts/resetAdmin.js email@example.com newpassword
```

