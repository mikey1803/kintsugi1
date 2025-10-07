// config/MoodPlaylists.js
// Curated Spotify playlists for each mood - easily update your links here

export const MOOD_PLAYLISTS = {
  'sad': {
    name: 'sad ',
    description: 'it is okay to feel sad 💙',
    url: 'https://open.spotify.com/playlist/35ZK8JN6apJZjxtivxuAD0?si=7qi5lDpHQ0qVfgM2Ij2iHw&pi=BdfWzYavQkiT6', // UPDATE: Replace with your sad playlist
    emoji: '💙',
    color: '#6BB6FF'
  },
  
  'happy': {
    name: 'Pure Joy',
    description: 'Uplifting tracks to amplify your happiness ✨',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd', // UPDATE: Replace with your happy playlist
    emoji: '✨',
    color: '#FFD93D'
  },
  
  'anxious': {
    name: 'Calm Mind',
    description: 'Peaceful sounds to ease anxiety and bring tranquility 🕊️',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO', // UPDATE: Replace with your anxiety playlist
    emoji: '🕊️',
    color: '#A8E6CF'
  },
  
  'angry': {
    name: 'Release & Transform',
    description: 'Powerful music to channel anger into strength ⚡',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DWWJOmJ7nRx0C', // UPDATE: Replace with your anger playlist
    emoji: '⚡',
    color: '#FF6B6B'
  },
  
  'stressed': {
    name: 'Deep Breathe',
    description: 'Relaxing vibes to melt away stress and tension 🧘‍♀️',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ', // UPDATE: Replace with your stress playlist
    emoji: '🧘‍♀️',
    color: '#DDA0DD'
  },
  
  'calm': {
    name: 'Peaceful Moments',
    description: 'Serene music to maintain your inner peace 🌸',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX1s9knjP51Oa', // UPDATE: Replace with your calm playlist
    emoji: '🌸',
    color: '#FFB6C1'
  },
  
  'neutral': {
    name: 'Everyday Vibes',
    description: 'Perfect background music for any moment 🍃',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DXdbXVyNiajnn', // UPDATE: Replace with your neutral playlist
    emoji: '🍃',
    color: '#98FB98'
  }
};

// Quick playlist recommendations for specific situations
export const SITUATION_PLAYLISTS = {
  'breakup': {
    name: 'Healing Heartbreak',
    description: 'Music to help you through the pain of lost love 💔',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX7Jl5KP2eZaS', // UPDATE: Replace with your breakup playlist
    emoji: '💔'
  },
  
  'motivation': {
    name: 'Rise Up',
    description: 'Powerful tracks to ignite your inner fire 🔥',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DXdPec7aLTmlC', // UPDATE: Replace with your motivation playlist
    emoji: '🔥'
  },
  
  'sleep': {
    name: 'Dream Softly',
    description: 'Gentle lullabies for peaceful rest 😴',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX6GwdWRQMQpq', // UPDATE: Replace with your sleep playlist
    emoji: '😴'
  },
  
  'workout': {
    name: 'Energy Boost',
    description: 'High-energy tracks to power your workout 💪',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP', // UPDATE: Replace with your workout playlist
    emoji: '💪'
  }
};

/*
HOW TO UPDATE YOUR PLAYLISTS:

1. Create your playlists in Spotify
2. Right-click on the playlist → Share → Copy Link
3. Replace the URLs above with your playlist links
4. Customize the names and descriptions to match your vision
5. The app will automatically use your curated playlists!

Example Spotify playlist URL formats:
- https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd
- https://open.spotify.com/playlist/1A2B3C4D5E6F7G8H9I0J1K

PLAYLIST CURATION TIPS:
- Sad: Indie, acoustic, slower tempo, healing themes
- Happy: Pop, upbeat, major keys, celebratory
- Anxious: Ambient, nature sounds, slow tempo, minimal lyrics  
- Angry: Rock, metal, intense but not aggressive towards self
- Stressed: Classical, spa music, meditation sounds
- Calm: Lo-fi, soft indie, gentle instrumentals
- Neutral: Indie folk, chill pop, versatile vibes
*/