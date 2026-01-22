# Cloudinary Setup Guide for Image Uploads

## Why Cloudinary?

Vercel (and other serverless platforms) use a read-only filesystem, which means you cannot save files directly to disk. Cloudinary provides cloud-based image storage and is perfect for this use case.

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account (generous free tier available)
3. After signing up, you'll be taken to your dashboard

## Step 2: Get Your Cloudinary Credentials

1. In your Cloudinary dashboard, you'll see your **Cloud Name**, **API Key**, and **API Secret**
2. Copy these three values - you'll need them for environment variables

## Step 3: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following three environment variables:

   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   CLOUDINARY_API_KEY=your_api_key_here
   CLOUDINARY_API_SECRET=your_api_secret_here
   ```

4. Make sure to add them for **Production**, **Preview**, and **Development** environments
5. Click **Save**

## Step 4: Redeploy Your Application

After adding the environment variables, you need to redeploy:

1. Go to your Vercel project
2. Click on **Deployments**
3. Click the **⋯** (three dots) on your latest deployment
4. Select **Redeploy**

Or simply push a new commit to trigger a new deployment.

## Step 5: For Local Development (Optional)

If you want to test image uploads locally, add these variables to your `backend/.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Note:** Without Cloudinary configured, local development will still try to save files locally (which works on your machine but not on Vercel).

## Testing

After setup, try uploading an image in the admin panel. The image should:
- Upload successfully to Cloudinary
- Return a secure URL (https://res.cloudinary.com/...)
- Display correctly in your application

## Troubleshooting

### Error: "Cloudinary configuration is required for production"
- Make sure you've added all three environment variables in Vercel
- Verify the variable names are exactly: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Redeploy your application after adding the variables

### Error: "Failed to upload image to cloud storage"
- Check that your Cloudinary credentials are correct
- Verify your Cloudinary account is active
- Check the Vercel function logs for more details

### Images not displaying
- Cloudinary URLs should start with `https://res.cloudinary.com/`
- Make sure the URLs are being saved correctly in your database
- Check browser console for any CORS or loading errors

## Free Tier Limits

Cloudinary's free tier includes:
- 25 GB storage
- 25 GB monthly bandwidth
- 25 million monthly transformations

This is usually more than enough for most applications!
