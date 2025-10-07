// api/spotify-mood-music.js
// Vercel Serverless Function for Spotify Mood-Based Music Recommendations

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emotion, mood } = req.body;

    // Get Spotify access token
    const spotifyToken = await getSpotifyAccessToken();
    
    if (!spotifyToken) {
      return res.status(500).json({ error: 'Failed to authenticate with Spotify' });
    }

    // Get mood-based playlist recommendation
    const playlist = await getMoodBasedPlaylist(emotion, mood, spotifyToken);

    return res.status(200).json({
      success: true,
      playlist: playlist,
      emotion: emotion,
      message: `Here's some ${emotion.toLowerCase()} music to match your mood 🎵`
    });

  } catch (error) {
    console.error('Spotify API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to get music recommendation',
      fallback: getFallbackPlaylist(req.body.emotion)
    });
  }
}

// Get Spotify Access Token using Client Credentials Flow
async function getSpotifyAccessToken() {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing Spotify credentials');
      return null;
    }

    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error(`Spotify auth failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;

  } catch (error) {
    console.error('Error getting Spotify token:', error);
    return null;
  }
}

// Get mood-based playlist from Spotify
async function getMoodBasedPlaylist(emotion, mood, accessToken) {
  try {
    // Map emotions to Spotify search terms and audio features
    const moodMapping = {
      'happy': {
        query: 'happy upbeat positive energy',
        genre: 'pop',
        valence: 0.8,
        energy: 0.7
      },
      'sad': {
        query: 'sad melancholy emotional healing',
        genre: 'indie',
        valence: 0.2,
        energy: 0.3
      },
      'anxious': {
        query: 'calm relaxing meditation peaceful',
        genre: 'ambient',
        valence: 0.5,
        energy: 0.2
      },
      'angry': {
        query: 'intense rock metal powerful',
        genre: 'rock',
        valence: 0.3,
        energy: 0.9
      },
      'neutral': {
        query: 'chill indie folk acoustic',
        genre: 'indie-folk',
        valence: 0.6,
        energy: 0.5
      },
      'stressed': {
        query: 'relaxing spa meditation calm',
        genre: 'classical',
        valence: 0.4,
        energy: 0.2
      }
    };

    const moodConfig = moodMapping[emotion?.toLowerCase()] || moodMapping['neutral'];

    // Search for playlists
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(moodConfig.query)}&type=playlist&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Spotify search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const playlists = searchData.playlists?.items || [];

    if (playlists.length === 0) {
      return getFallbackPlaylist(emotion);
    }

    // Select best playlist (prioritize curated playlists with more followers)
    const bestPlaylist = playlists
      .filter(p => p.tracks?.total > 10) // Has decent number of tracks
      .sort((a, b) => (b.followers?.total || 0) - (a.followers?.total || 0))[0];

    if (bestPlaylist) {
      return {
        name: bestPlaylist.name,
        description: bestPlaylist.description,
        url: bestPlaylist.external_urls?.spotify,
        image: bestPlaylist.images?.[0]?.url,
        tracks: bestPlaylist.tracks?.total,
        owner: bestPlaylist.owner?.display_name,
        spotifyUri: bestPlaylist.uri
      };
    }

    return getFallbackPlaylist(emotion);

  } catch (error) {
    console.error('Error getting mood playlist:', error);
    return getFallbackPlaylist(emotion);
  }
}

// Fallback playlists if Spotify API fails
function getFallbackPlaylist(emotion) {
  const fallbackPlaylists = {
    'happy': {
      name: 'Feel Good Indie Rock',
      description: 'Uplifting indie tracks to boost your mood 🌟',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd',
      emotion: 'happy'
    },
    'sad': {
      name: 'Life Sucks',
      description: 'Sometimes you need to feel it all 💙',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX7qK8ma5wgG1',
      emotion: 'sad'
    },
    'anxious': {
      name: 'Peaceful Piano',
      description: 'Gentle piano music for calm moments 🕊️',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO',
      emotion: 'anxious'
    },
    'angry': {
      name: 'Rock This',
      description: 'Channel that energy into powerful music ⚡',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DWWJOmJ7nRx0C',
      emotion: 'angry'
    },
    'neutral': {
      name: 'Indie Folk & Chill',
      description: 'Perfect for any moment 🍃',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DXdbXVyNiajnn',
      emotion: 'neutral'
    },
    'stressed': {
      name: 'Deep Focus',
      description: 'Ambient sounds to ease your mind 🧘‍♀️',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ',
      emotion: 'stressed'
    }
  };

  return fallbackPlaylists[emotion?.toLowerCase()] || fallbackPlaylists['neutral'];
}