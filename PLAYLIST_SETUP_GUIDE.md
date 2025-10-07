# 🎵 How to Add Your Custom Playlists

## Quick Setup Guide

Since you want to add your own curated playlists for each mood, here's the easiest way:

### Step 1: Update the ChatbotScreen.js file

In your `screens/ChatbotScreen.js` file, around **line 122-156**, you'll see this section with placeholder playlist URLs:

```javascript
const moodPlaylists = {
  'sad': {
    name: 'Healing Hearts',
    description: 'Gentle music to help process sadness and find comfort 💙',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX7qK8ma5wgG1' // Replace with your sad playlist
  },
  'happy': {
    name: 'Pure Joy', 
    description: 'Uplifting tracks to amplify your happiness ✨',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd' // Replace with your happy playlist
  },
  // ... etc
};
```

### Step 2: Get Your Spotify Playlist Links

1. Open Spotify (app or web)
2. Go to your playlist
3. Click the **three dots (...)** menu
4. Select **Share** → **Copy link to playlist**
5. You'll get a link like: `https://open.spotify.com/playlist/1A2B3C4D5E6F7G8H9I0J1K`

### Step 3: Replace the URLs

Simply replace each `url:` value with your own playlist links:

```javascript
'sad': {
  name: 'Your Sad Playlist Name',
  description: 'Your custom description 💙',
  url: 'https://open.spotify.com/playlist/YOUR_ACTUAL_PLAYLIST_ID'
},
```

## Mood Categories Available:

- **sad** - For processing sadness and grief
- **happy** - For amplifying joy and celebration  
- **anxious** - For calming anxiety and worry
- **angry** - For channeling anger constructively
- **stressed** - For stress relief and relaxation
- **calm** - For maintaining peace and tranquility
- **neutral** - For everyday background vibes

## Pro Tips:

### For Each Mood, Consider:

**Sad Playlists:**
- Slower tempo (60-80 BPM)
- Minor keys, acoustic instruments
- Artists like Phoebe Bridgers, Bon Iver, The National
- Themes: healing, processing, gentle comfort

**Happy Playlists:**
- Higher tempo (120-140 BPM)  
- Major keys, bright instruments
- Artists like Lizzo, Pharrell, The 1975
- Themes: celebration, energy, positivity

**Anxious Playlists:**
- Very slow tempo (40-70 BPM)
- Minimal percussion, ambient sounds
- Artists like Ólafur Arnalds, Nils Frahm, Brian Eno
- Themes: breathing space, safety, grounding

**Angry Playlists:**
- Can be intense but not destructive
- Artists like Rage Against the Machine, Foo Fighters
- Themes: empowerment, release, transformation

## Current Implementation:

Your app will automatically:
1. **Detect emotions** from user messages
2. **Show music button** when appropriate  
3. **Open your curated playlist** in Spotify
4. **Display custom descriptions** you write

The music button appears when users express emotions like:
- "I'm so sad today"
- "I'm really happy!"  
- "I feel anxious"
- "I'm so angry"
- "I'm stressed out"

Perfect integration with your empathetic Kintsugi AI! 🌸