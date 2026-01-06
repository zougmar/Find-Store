# Quick Deployment Checklist

## 🚀 Railway (Backend) - 5 Minutes

1. **Go to Railway.app** → New Project → Deploy from GitHub
2. **Select your repo** → Set Root Directory to `backend`
3. **Add Environment Variables:**
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/findstore?retryWrites=true&w=majority
   PORT=5000
   NODE_ENV=production
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. **Copy your Railway URL** (e.g., `https://your-app.up.railway.app`)

## ⚡ Vercel (Frontend) - 3 Minutes

1. **Go to Vercel.com** → Add New Project → Import GitHub repo
2. **Configure:**
   - Root Directory: `frontend`
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Add Environment Variable:**
   ```
   VITE_API_URL=https://your-railway-app.up.railway.app/api
   ```
4. **Deploy!**

## 🔧 MongoDB Atlas Setup

1. **Network Access:** Add `0.0.0.0/0` (allow all IPs)
2. **Database Access:** Create user with read/write permissions
3. **Get Connection String:** Database → Connect → Connect your application

## ✅ Test Your Deployment

- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-railway-app.up.railway.app/api`
- Test endpoint: `https://your-railway-app.up.railway.app/api/products`

## 🐛 Common Issues

**CORS Error?** → Update `FRONTEND_URL` in Railway with your Vercel URL

**MongoDB Connection Failed?** → Check Network Access in Atlas (add `0.0.0.0/0`)

**API Not Working?** → Verify `VITE_API_URL` in Vercel matches Railway URL

---

📖 **Full Guide:** See `DEPLOYMENT.md` for detailed instructions

