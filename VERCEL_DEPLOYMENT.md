# 🚀 Vercel Deployment Guide for Kintsugi AI

## Steps to Deploy Your Secure AI API

### 1. **Prepare Your Files**
Make sure you have:
- ✅ `api/kintsugi-chat.js` (created)
- ✅ `vercel.json` (already exists)
- ✅ Updated `utils/HuggingFaceAI.js` (updated)

### 2. **Install Vercel CLI**
```bash
npm install -g vercel
```

### 3. **Login to Vercel**
```bash
vercel login
```

### 4. **Deploy Your Project**
From your project root directory:
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Y
- **Which scope?** → Choose your account
- **Link to existing project?** → N (for first deployment)
- **Project name?** → kintsugi-app (or your preferred name)
- **Directory?** → ./ (current directory)

### 5. **Set Environment Variable**
After deployment, set your Hugging Face token:

**Option A: Via Vercel Dashboard**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project
3. Go to Settings → Environment Variables
4. Add:
   - **Name**: `HUGGING_FACE_TOKEN`
   - **Value**: `hf_YOUR_HUGGING_FACE_TOKEN_HERE`
   - **Environment**: All (Production, Preview, Development)

**Option B: Via CLI**
```bash
vercel env add HUGGING_FACE_TOKEN
# Paste your token when prompted
# Select all environments
```

### 6. **Update Your App**
After deployment, update your `utils/HuggingFaceAI.js`:

```javascript
// Replace this line:
this.apiUrl = 'https://your-app-name.vercel.app/api/kintsugi-chat';

// With your actual Vercel URL (you'll get this after deployment):
this.apiUrl = 'https://kintsugi-app-xyz123.vercel.app/api/kintsugi-chat';
```

### 7. **Test Your API**
You can test your deployed API with:
```bash
curl -X POST https://your-app-name.vercel.app/api/kintsugi-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I am feeling stressed"}'
```

### 8. **Redeploy After Changes**
Whenever you make changes:
```bash
vercel --prod
```

## 🔧 **For Local Testing**
If you want to test locally first:

1. **Create `.env.local` file:**
```bash
HUGGING_FACE_TOKEN=hf_YOUR_HUGGING_FACE_TOKEN_HERE
```

2. **Install Vercel dev dependencies:**
```bash
npm install vercel --save-dev
```

3. **Run locally:**
```bash
vercel dev
```

4. **Update your app for local testing:**
```javascript
this.apiUrl = 'http://localhost:3000/api/kintsugi-chat';
```

## 🎯 **Why This Fixes Everything**

✅ **No More CORS**: Server-side API calls work perfectly  
✅ **No More 404**: Your API controls which models to use  
✅ **Secure Tokens**: Hidden in environment variables  
✅ **Reliable**: Vercel's infrastructure is rock-solid  
✅ **Fast**: Edge functions deploy globally  

## 🚨 **Important Notes**

1. **Don't commit `.env.local`** - add it to `.gitignore`
2. **Test your API endpoint** before updating the mobile app
3. **Keep your Hugging Face token secret**
4. **Monitor your API usage** on Vercel dashboard

Your Kintsugi AI will be much more reliable once deployed to Vercel! 🌸