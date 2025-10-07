# Spotify API Integration Setup

## 🎵 Setting up Spotify API for Mood-Based Music Recommendations

### Step 1: Get Spotify API Credentials

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in the details:
   - **App Name**: Kintsugi Wellness App
   - **App Description**: AI-powered wellness companion with mood-based music recommendations
   - **Website**: Your Vercel deployment URL
   - **Redirect URI**: `http://localhost:3000` (for development)
5. Accept the terms and create the app
6. Copy your **Client ID** and **Client Secret**

### Step 2: Add Environment Variables to Vercel

1. Go to your Vercel dashboard
2. Select your kintsugi project
3. Go to Settings → Environment Variables
4. Add these variables:
   - `SPOTIFY_CLIENT_ID`: Your Spotify Client ID
   - `SPOTIFY_CLIENT_SECRET`: Your Spotify Client Secret

### Step 3: Deploy the New API Endpoint

The Spotify API endpoint is already created at:
`/api/spotify-mood-music.js`

Simply push your changes to trigger a new Vercel deployment:

```bash
git add .
git commit -m "Add Spotify mood-based music recommendations"
git push origin main
```

### Step 4: Test the Integration

Once deployed, the app will:

1. **Detect emotions** from user messages automatically
2. **Show music button** when emotional content is detected
3. **Call Spotify API** to find mood-matching playlists
4. **Open Spotify** with personalized recommendations

### Emotion-to-Music Mapping:

- **Happy** → Upbeat, energetic pop playlists
- **Sad** → Melancholic, healing indie music
- **Anxious** → Calming, peaceful ambient sounds  
- **Angry** → Intense rock/metal for energy release
- **Stressed** → Relaxing spa/meditation music
- **Neutral** → Chill indie-folk for any moment

### Fallback System:

- If Spotify API fails, curated fallback playlists are provided
- Always graceful degradation - never breaks the user experience
- Maintains the empathetic, caring tone of your Kintsugi AI

## 🌟 User Experience Flow:

1. User shares emotional message: *"I'm feeling really sad today"*
2. AI responds with empathy: *"Oh darling, I can feel how heavy your heart is..."*
3. Music button appears: **"Music for Your Mood 🎵"**
4. User taps → Spotify opens with curated sad/healing playlist
5. Perfect integration of emotional support + music therapy

This feature transforms your wellness app into a comprehensive emotional support system! 🎵💙