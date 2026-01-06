# MongoDB Connection Setup Guide

## Error: "bad auth : authentication failed"

This error occurs when MongoDB cannot authenticate your connection. Here's how to fix it:

## For MongoDB Atlas (Cloud)

### Step 1: Get Your Connection String

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Go to your cluster
3. Click "Connect"
4. Choose "Connect your application"
5. Copy the connection string (it looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```

### Step 2: Update Your Connection String

Replace the placeholders:
- `<username>` - Your MongoDB Atlas database user
- `<password>` - Your MongoDB Atlas database password (URL-encoded if it contains special characters)
- `<dbname>` - Your database name (e.g., `findstore`)

**Example:**
```
mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/findstore?retryWrites=true&w=majority
```

### Step 3: Update Your .env File

In `backend/.env`, set:
```env
MONGODB_URI=mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/findstore?retryWrites=true&w=majority
```

### Step 4: Whitelist Your IP Address

1. In MongoDB Atlas, go to "Network Access"
2. Click "Add IP Address"
3. Add your current IP address (or use `0.0.0.0/0` for development - **NOT recommended for production**)

### Step 5: Verify Database User

1. In MongoDB Atlas, go to "Database Access"
2. Ensure your database user exists
3. Ensure the user has read/write permissions
4. If needed, create a new user:
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Set username and password
   - Set user privileges (at minimum: "Read and write to any database")

## For Local MongoDB

### Step 1: Install MongoDB Locally

Download from: https://www.mongodb.com/try/download/community

### Step 2: Start MongoDB Service

**Windows:**
```bash
# MongoDB should start automatically as a service
# Or start manually:
net start MongoDB
```

**Mac/Linux:**
```bash
mongod
```

### Step 3: Update Your .env File

```env
MONGODB_URI=mongodb://localhost:27017/findstore
```

## Common Issues and Solutions

### Issue 1: Password Contains Special Characters

If your password has special characters (like `@`, `#`, `%`, etc.), you need to URL-encode them:

- `@` becomes `%40`
- `#` becomes `%23`
- `%` becomes `%25`
- `&` becomes `%26`
- `+` becomes `%2B`
- `=` becomes `%3D`

**Example:**
If your password is `P@ssw0rd#123`, use `P%40ssw0rd%23123` in the connection string.

### Issue 2: IP Address Not Whitelisted

**Error:** "IP address not whitelisted"

**Solution:** Add your IP address in MongoDB Atlas Network Access settings.

### Issue 3: Database User Doesn't Exist

**Error:** "bad auth : authentication failed"

**Solution:** Create a database user in MongoDB Atlas Database Access section.

### Issue 4: Wrong Database Name

Make sure the database name in your connection string matches what you want to use (e.g., `findstore`).

## Testing Your Connection

After updating your `.env` file, restart your backend server:

```bash
cd backend
npm run dev
```

You should see:
```
MongoDB Connected: cluster0.xxxxx.mongodb.net
Server running on port 5000
```

## Quick Fix Checklist

- [ ] Connection string is correct in `.env` file
- [ ] Username and password are correct (URL-encoded if needed)
- [ ] IP address is whitelisted in MongoDB Atlas
- [ ] Database user exists and has proper permissions
- [ ] Database name is correct
- [ ] Backend server has been restarted after changes

## Still Having Issues?

1. Double-check your connection string format
2. Try creating a new database user with a simple password
3. Verify your IP is whitelisted
4. Check MongoDB Atlas status page for any service issues
5. Try connecting with MongoDB Compass using the same credentials to verify they work

