# DEPLOYMENT GUIDE - Frontend to Vercel

## Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository with this frontend code
- Render backend deployed and running

## Backend URL
Your backend is deployed at: `https://voxify-backend-5ayx.onrender.com`

## Step 1: Prepare Your Repository

1. Ensure all files are committed to Git
2. Push your code to GitHub

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI

```bash
npm install -g vercel
cd client
vercel
```

### Option B: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select the `client` folder as root directory
5. Configure environment variables (see Step 3 below)
6. Click "Deploy"

## Step 3: Add Environment Variables in Vercel

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add this variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://voxify-backend-5ayx.onrender.com`
   - **Environments**: Select "Production", "Preview", and "Development"

3. Click "Save"
4. Redeploy the project

## Step 4: Verify the Deployment

1. Visit your Vercel deployment URL
2. Try uploading a file or generating text-to-speech
3. Check browser console for any API errors

## Environment Variables Explained

- **Development** (Local): Uses `http://localhost:3001` from `.env.local`
- **Production** (Vercel): Uses `https://voxify-backend-5ayx.onrender.com` from `.env.production`

## Troubleshooting

### CORS Errors
If you see CORS errors, ensure your Render backend has CORS enabled for your Vercel domain.

In your backend's `index.js`, update CORS configuration:
```javascript
const cors = require('cors');
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://your-vercel-domain.vercel.app' // Add your actual Vercel URL
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

### Files Not Loading
Make sure the build command is correct:
```bash
npm run build
```

This generates optimized files in the `dist/` folder that Vercel serves.

## Next Deployments

For future updates:
1. Push your code to GitHub
2. Vercel will automatically redeploy (if auto-deployment is enabled)
3. Or manually redeploy from the Vercel dashboard

