# Admin User Setup Guide

## Creating an Admin User

To create an admin user, you need to run the seed script from the backend folder.

### Step 1: Navigate to Backend Folder
```bash
cd backend
```

### Step 2: Run the Seed Script

**Option 1: Use Default Credentials**
```bash
npm run seed:admin
```
This will create an admin user with:
- Email: `admin@findstore.com`
- Password: `admin123`
- Name: `Admin User`

**Option 2: Use Custom Credentials**
```bash
node scripts/seedAdmin.js your-email@example.com your-password Your Name
```

Example:
```bash
node scripts/seedAdmin.js admin@mystore.com mypassword123 Admin User
```

### Step 3: Verify the Admin User

After running the script, you should see:
```
✅ Connected to MongoDB
✅ Admin user created successfully!
   Email: admin@findstore.com
   Password: admin123
   Name: Admin User

🎉 Admin user is ready!
You can now login with these credentials.
```

### Step 4: Login

1. Go to the login page: `http://localhost:5173/login` (or your frontend URL)
2. Enter the email and password you used
3. Click "Sign in"

## Troubleshooting

### "Invalid credentials" Error

If you get "Invalid credentials" when trying to login:

1. **Check if admin user exists:**
   - Make sure you ran the seed script successfully
   - Check the console output for any errors

2. **Verify your credentials:**
   - Make sure you're using the exact email and password from the seed script
   - Check for typos (email is case-insensitive but must match exactly)
   - Make sure there are no extra spaces

3. **Reset the admin password:**
   ```bash
   node scripts/seedAdmin.js admin@findstore.com newpassword123 Admin User
   ```

4. **Check MongoDB connection:**
   - Make sure MongoDB is running
   - Verify your `.env` file has the correct `MONGODB_URI`
   - Check backend server logs for connection errors

5. **Check backend server:**
   - Make sure the backend server is running on port 5000
   - Check backend console for any error messages

### Common Issues

**Issue: "MONGODB_URI is not set"**
- Solution: Create a `.env` file in the backend folder with your MongoDB connection string

**Issue: "Cannot connect to MongoDB"**
- Solution: Check your MongoDB connection string and make sure MongoDB is running

**Issue: "User already exists"**
- Solution: The script will update the existing user. If you want to change the password, run the script again with the new password.

## Need Help?

If you're still having issues:
1. Check the backend console for error messages
2. Verify your MongoDB connection
3. Make sure both frontend and backend servers are running
4. Try creating a new admin user with different credentials

