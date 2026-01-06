# Quick Vercel Deployment - 5 Minutes

## 🚀 Deploy Both Frontend & Backend to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. Click **"Add New Project"**
3. Import your repository
4. **Configure:**
   - Root Directory: `.` (root)
   - Framework: Other (or leave auto-detect)
   - Build Command: Leave empty (auto-detect)
   - Output Directory: Leave empty (auto-detect)

### Step 3: Add Environment Variables

In Vercel → Settings → Environment Variables, add:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/findstore?retryWrites=true&w=majority
NODE_ENV=production
```

**Optional:**
```
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-app.vercel.app
```
### Step 4: Deploy!

Click **"Deploy"** and wait for completion.

### Step 5: Test

- Frontend: `https://your-app.vercel.app`
- API: `https://your-app.vercel.app/api/products`

---

## ⚙️ MongoDB Atlas Setup

1. **Network Access**: Add `0.0.0.0/0` (allow all IPs)
2. **Database Access**: Create user with read/write permissions
3. **Connection String**: Use in `MONGODB_URI` environment variable

---

## 🐛 Quick Troubleshooting

**API not working?**
- Check MongoDB Atlas Network Access (add `0.0.0.0/0`)
- Verify `MONGODB_URI` is correct

**Frontend not loading?**
- Check build logs in Vercel
- Verify build completed successfully

**CORS errors?**
- Backend is configured to allow Vercel domains automatically

---

📖 **Full Guide**: See `VERCEL_DEPLOYMENT.md`

