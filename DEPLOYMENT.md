# Deployment Guide

This guide will help you deploy the Find Store application to **Vercel** (frontend) and **Railway** (backend).

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Railway account (free tier available)
- MongoDB Atlas account (free tier available)
- Git repository with your code

---

## Part 1: Backend Deployment (Railway)

### Step 1: Prepare Backend for Railway

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

### Step 2: Deploy to Railway

1. Go to [Railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will auto-detect your backend folder. If not:
   - Click on the service
   - Go to **Settings** → **Root Directory**
   - Set it to `backend`

### Step 3: Configure Environment Variables

In Railway dashboard, go to your service → **Variables** tab and add:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/findstore?retryWrites=true&w=majority
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secret-key-here (if you use JWT)
```

**Important Notes:**
- Replace `username`, `password`, and `cluster.mongodb.net` with your actual MongoDB Atlas credentials
- For MongoDB Atlas, ensure:
  - Your Railway deployment IP is whitelisted (or use `0.0.0.0/0` for all IPs)
  - Database user has proper permissions
  - Connection string is correct

### Step 4: Get Your Backend URL

1. After deployment, Railway will provide a URL like: `https://your-app.up.railway.app`
2. Copy this URL - you'll need it for the frontend configuration
3. The backend API will be accessible at: `https://your-app.up.railway.app/api`

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend for Vercel

1. Ensure your code is pushed to GitHub

### Step 2: Deploy to Vercel

1. Go to [Vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables

In Vercel dashboard, go to your project → **Settings** → **Environment Variables** and add:

```
VITE_API_URL=https://your-railway-app.up.railway.app/api
```

**Important:** Replace `https://your-railway-app.up.railway.app` with your actual Railway backend URL.

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your frontend
3. You'll get a URL like: `https://your-app.vercel.app`

---

## Part 3: Configure CORS (Backend)

### Update CORS Settings

Your backend needs to allow requests from your Vercel frontend URL. Update `backend/server.js`:

```javascript
// Update CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app', // Add your Vercel URL
    'https://*.vercel.app' // Allow all Vercel preview deployments
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

After updating, redeploy to Railway.

---

## Part 4: MongoDB Atlas Configuration

### Step 1: Network Access

1. Go to MongoDB Atlas → **Network Access**
2. Add IP Address:
   - For Railway: Add `0.0.0.0/0` (allow all IPs) OR add Railway's specific IPs
   - For local development: Add your current IP

### Step 2: Database Access

1. Go to **Database Access**
2. Ensure your database user has read/write permissions
3. If needed, create a new user with proper permissions

### Step 3: Connection String

1. Go to **Database** → **Connect**
2. Choose **"Connect your application"**
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Replace `<dbname>` with `findstore` (or your database name)
6. Use this in Railway environment variables

---

## Part 5: File Uploads (Optional)

If you're using file uploads, Railway's filesystem is ephemeral. Consider:

1. **Option 1: Use Cloud Storage**
   - AWS S3
   - Cloudinary
   - Upload files directly to cloud storage instead of local filesystem

2. **Option 2: Use Railway Volumes** (Paid feature)
   - Create a volume in Railway
   - Mount it to `/uploads` directory

3. **Option 3: Use MongoDB GridFS**
   - Store files in MongoDB

---

## Troubleshooting

### Backend Issues

**Problem:** Backend not starting
- Check Railway logs
- Verify `MONGODB_URI` is set correctly
- Ensure MongoDB Atlas allows Railway IPs

**Problem:** CORS errors
- Update CORS settings in `server.js` with your Vercel URL
- Redeploy backend

### Frontend Issues

**Problem:** API calls failing
- Verify `VITE_API_URL` is set correctly in Vercel
- Check browser console for errors
- Ensure backend is running and accessible

**Problem:** Build failing
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### MongoDB Issues

**Problem:** Connection timeout
- Check Network Access in MongoDB Atlas
- Verify connection string format
- Ensure database user has correct permissions

---

## Environment Variables Summary

### Backend (Railway)
```
MONGODB_URI=mongodb+srv://...
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secret-key
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-railway-app.up.railway.app/api
```

---

## Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured
- [ ] CORS configured correctly
- [ ] MongoDB Atlas network access configured
- [ ] Test API endpoints
- [ ] Test authentication flow
- [ ] Test file uploads (if applicable)
- [ ] Monitor logs for errors

---

## Custom Domains (Optional)

### Vercel Custom Domain
1. Go to Vercel project → **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

### Railway Custom Domain
1. Go to Railway service → **Settings** → **Networking**
2. Add custom domain
3. Configure DNS records

---

## Monitoring

- **Railway**: Check logs in Railway dashboard
- **Vercel**: Check logs in Vercel dashboard
- **MongoDB Atlas**: Monitor in Atlas dashboard

---

## Support

If you encounter issues:
1. Check deployment logs
2. Verify environment variables
3. Test API endpoints directly
4. Check MongoDB Atlas connection
5. Review CORS configuration

---

**Happy Deploying! 🚀**

