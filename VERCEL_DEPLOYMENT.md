# Deploy to Vercel - Full Stack Guide

This guide will help you deploy both frontend and backend to Vercel.

## 📋 Prerequisites

- GitHub account
- Vercel account (free tier available)
- MongoDB Atlas account (free tier available)
- Git repository with your code

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Ensure all code is committed and pushed to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

### Step 2: Deploy to Vercel

1. **Go to [Vercel.com](https://vercel.com)** and sign in with GitHub

2. **Click "Add New Project"**

3. **Import your GitHub repository**

4. **Configure the project:**
   - **Framework Preset**: Other (or Vite if available)
   - **Root Directory**: Leave as root (`.`)
   - **Build Command**: Leave empty (Vercel will auto-detect)
   - **Output Directory**: Leave empty (Vercel will auto-detect)
   - **Install Command**: Leave empty (Vercel will auto-detect)

   **OR** manually set:
   - **Root Directory**: `.`
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install && cd ../backend && npm install`

### Step 3: Configure Environment Variables

In Vercel dashboard, go to your project → **Settings** → **Environment Variables** and add:

#### Required Variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/findstore?retryWrites=true&w=majority
NODE_ENV=production
```

#### Optional Variables:

```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=https://your-app.vercel.app
```

**Important Notes:**
- Replace `username`, `password`, and `cluster.mongodb.net` with your actual MongoDB Atlas credentials
- For MongoDB Atlas, ensure:
  - Network Access allows all IPs (`0.0.0.0/0`) or Vercel's IPs
  - Database user has proper permissions
  - Connection string is correct

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will:
   - Install dependencies for both frontend and backend
   - Build the frontend
   - Set up the backend as serverless functions
3. Wait for deployment to complete

### Step 5: Get Your URLs

After deployment, you'll get:
- **Frontend URL**: `https://your-app.vercel.app`
- **Backend API**: `https://your-app.vercel.app/api`
- **Uploads**: `https://your-app.vercel.app/uploads`

---

## 🔧 Project Structure for Vercel

Your project structure should be:
```
.
├── backend/
│   ├── server.js (exports Express app)
│   ├── routes/
│   ├── models/
│   └── package.json
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── vercel.json (root configuration)
```

---

## 📝 Environment Variables Summary

### Required:
```
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
```

### Optional:
```
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-app.vercel.app
```

**Note:** The frontend will automatically use `/api` as the API URL when deployed on Vercel (no `VITE_API_URL` needed).

---

## 🔍 How It Works

1. **Frontend**: Vercel serves the built React app from `frontend/dist`
2. **Backend**: Vercel converts your Express app into serverless functions
3. **Routing**: 
   - `/api/*` → Backend serverless function
   - `/uploads/*` → Backend serverless function
   - Everything else → Frontend React app

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** API routes not working
- Check Vercel function logs
- Verify `MONGODB_URI` is set correctly
- Ensure MongoDB Atlas allows Vercel IPs

**Problem:** MongoDB connection timeout
- Check Network Access in MongoDB Atlas (add `0.0.0.0/0`)
- Verify connection string format
- Check database user permissions

**Problem:** CORS errors
- Backend CORS is configured to allow Vercel domains
- Check if `FRONTEND_URL` is set correctly

### Frontend Issues

**Problem:** Frontend not loading
- Check build logs in Vercel
- Verify `frontend/dist` directory exists after build
- Check browser console for errors

**Problem:** API calls failing
- Verify API routes are accessible at `/api/*`
- Check network tab in browser dev tools
- Ensure backend environment variables are set

### Build Issues

**Problem:** Build failing
- Check Vercel build logs
- Verify all dependencies are in `package.json`
- Ensure Node.js version is compatible (Vercel uses Node 18+ by default)

---

## 📦 File Uploads on Vercel

**Important:** Vercel serverless functions have an ephemeral filesystem. Uploaded files will be lost when the function restarts.

### Solutions:

1. **Use Cloud Storage** (Recommended):
   - AWS S3
   - Cloudinary
   - Upload directly to cloud storage instead of local filesystem

2. **Use MongoDB GridFS**:
   - Store files in MongoDB
   - Works well with Vercel serverless

3. **Use Vercel Blob Storage** (if available):
   - Vercel's own storage solution

**Current Setup:** Your uploads folder won't persist. Consider migrating to cloud storage.

---

## 🔄 Updating Your Deployment

1. **Make changes to your code**
2. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Update code"
   git push origin main
   ```
3. **Vercel will automatically redeploy** (if auto-deploy is enabled)

Or manually trigger deployment:
- Go to Vercel dashboard
- Click "Redeploy"

---

## 🌐 Custom Domain (Optional)

1. Go to Vercel project → **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `FRONTEND_URL` environment variable if needed

---

## 📊 Monitoring

- **Vercel Dashboard**: View logs, analytics, and deployments
- **Function Logs**: Check serverless function execution logs
- **MongoDB Atlas**: Monitor database connections and queries

---

## ✅ Post-Deployment Checklist

- [ ] Frontend accessible at Vercel URL
- [ ] Backend API accessible at `/api/*`
- [ ] Environment variables configured
- [ ] MongoDB Atlas network access configured
- [ ] Test authentication flow
- [ ] Test API endpoints
- [ ] Check function logs for errors
- [ ] Test file uploads (if applicable)

---

## 🎯 Quick Reference

**Frontend URL**: `https://your-app.vercel.app`  
**Backend API**: `https://your-app.vercel.app/api`  
**Test Endpoint**: `https://your-app.vercel.app/api/products`

**Environment Variables:**
- `MONGODB_URI` (required)
- `NODE_ENV=production` (required)
- `JWT_SECRET` (if using JWT)
- `FRONTEND_URL` (optional, for CORS)

---

## 🆘 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check function execution logs
3. Verify environment variables
4. Test API endpoints directly
5. Check MongoDB Atlas connection
6. Review CORS configuration

---

**Happy Deploying! 🚀**

