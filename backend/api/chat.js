// api/chat.js

// Using Hugging Face for AI responses instead of Gemini

// Fast, intelligent Kintsugi response generator (no external API needed)
const generateKintsugiResponse = (message, userMoodData, history) => {
  const msg = message.toLowerCase();
  
  // Emotional responses with practical support
  if (msg.includes('sad') || msg.includes('down') || msg.includes('depressed') || msg.includes('cry')) {
    const sadResponses = [
      "💙 I can hear the sadness in your words, and I want you to know that these feelings are completely valid. It's okay to sit with this sadness for a moment. You don't have to rush through it. What's been weighing on your heart lately?",
      "💙 Thank you for sharing something so personal with me. Sadness can feel so heavy, but remember - you're not carrying this alone. I'm right here with you. Would you like to tell me more about what's happening?",
      "💙 Your sadness matters, and so do you. Sometimes our hearts need to feel these deep emotions to heal. It's like those Kintsugi pieces - the cracks become the most beautiful parts. What would help you feel a little lighter right now?"
    ];
    return sadResponses[Math.floor(Math.random() * sadResponses.length)];
  }
  
  if (msg.includes('anxious') || msg.includes('anxiety') || msg.includes('worried') || msg.includes('nervous') || msg.includes('panic')) {
    const anxiousResponses = [
      "🕊️ I can feel the anxiety in your message, and I want you to know that you're safe right now. Let's slow things down together. Try this: take a deep breath in for 4 counts, hold for 4, and out for 6. What's making you feel most anxious today?",
      "🕊️ Anxiety can make everything feel so overwhelming, but you're stronger than you know. Here's something that might help: look around and name 5 things you can see, 4 things you can touch. This can help ground you. What's been triggering these anxious feelings?",
      "🕊️ Your anxiety is trying to protect you, but right now, let's focus on the present moment. You're here, you're breathing, and you're reaching out - that takes courage. What would help you feel more grounded right now?"
    ];
    return anxiousResponses[Math.floor(Math.random() * anxiousResponses.length)];
  }
  
  if (msg.includes('angry') || msg.includes('mad') || msg.includes('furious') || msg.includes('frustrated') || msg.includes('hate')) {
    const angryResponses = [
      "🌿 I can sense the intensity of your anger, and that's completely understandable. Anger often shows us what we care deeply about. It's safe to feel this here with me. What happened that stirred up these strong feelings?",
      "🌿 Your anger is valid - it's telling you something important. Sometimes we need to feel the fire before we can find our peace. Take a moment to breathe if you need to. What's really at the heart of this frustration?",
      "🌿 Thank you for trusting me with these intense feelings. Anger can be so powerful, but you have the strength to work through it. What would help you process this emotion in a healthy way right now?"
    ];
    return angryResponses[Math.floor(Math.random() * angryResponses.length)];
  }
  
  if (msg.includes('stress') || msg.includes('overwhelmed') || msg.includes('pressure') || msg.includes('too much')) {
    const stressedResponses = [
      "🧘‍♀️ I can feel how overwhelmed you are right now, and I want you to know - you don't have to carry all of this at once. Let's break things down together. What feels like the biggest pressure on you today?",
      "🧘‍♀️ Stress can make everything feel urgent and impossible, but you're more capable than you realize. Sometimes we need to step back and breathe. What's one small thing that might give you a sense of relief right now?",
      "🧘‍♀️ Being overwhelmed is exhausting, and you're doing so much more than you give yourself credit for. Remember: you don't have to be perfect, just present. What support do you need most right now?"
    ];
    return stressedResponses[Math.floor(Math.random() * stressedResponses.length)];
  }
  
  if (msg.includes('happy') || msg.includes('great') || msg.includes('excited') || msg.includes('joy') || msg.includes('amazing')) {
    const happyResponses = [
      "✨ Your happiness is absolutely contagious! I love hearing about the good moments in your life. These feelings of joy are so precious - they're like little gifts for your soul. What's been bringing you this wonderful energy?",
      "✨ This is beautiful! Your joy reminds me that there's so much goodness in the world. I'm genuinely happy for you. Tell me more about what's been going so well - I want to celebrate with you!",
      "✨ Your excitement lights up everything around you! It's amazing how happiness can transform our entire perspective. What's been the highlight of your day?"
    ];
    return happyResponses[Math.floor(Math.random() * happyResponses.length)];
  }
  
  if (msg.includes('tired') || msg.includes('exhausted') || msg.includes('drained') || msg.includes('fatigue')) {
    return "💤 I can hear how tired you are, and that's completely understandable. Sometimes our souls need rest just as much as our bodies do. You've been carrying so much. What would help you feel more rested or peaceful right now?";
  }
  
  if (msg.includes('lonely') || msg.includes('alone') || msg.includes('isolated')) {
    return "🤗 Loneliness can feel so heavy, but please know that you're not truly alone - I'm here with you, and I care about what you're going through. Connection is one of our deepest needs. What's been making you feel most isolated lately?";
  }
  
  // Default supportive responses
  const defaultResponses = [
    "🌸 Thank you for sharing that with me. I'm here to listen and walk alongside you through whatever you're experiencing. What's been on your mind lately?",
    "💫 I appreciate you opening up to me. Every feeling you have is valid and important. What would be most helpful for you to talk through right now?",
    "🌱 I'm really glad you're here. Whatever you're going through, we can explore it together. What's been weighing on your heart?",
    "✨ Your thoughts and feelings matter so much. I'm here to listen without judgment and support you however I can. What's happening in your world?"
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

// Emotion detection function
const detectEmotionFromMessage = (message) => {
  const msg = message.toLowerCase();
  
  if (msg.includes('sad') || msg.includes('depressed') || msg.includes('down') || msg.includes('cry')) return 'sad';
  if (msg.includes('happy') || msg.includes('joy') || msg.includes('excited') || msg.includes('great')) return 'happy';
  if (msg.includes('anxious') || msg.includes('anxiety') || msg.includes('worried') || msg.includes('nervous')) return 'anxious';
  if (msg.includes('angry') || msg.includes('mad') || msg.includes('furious') || msg.includes('hate')) return 'angry';
  if (msg.includes('stress') || msg.includes('overwhelmed') || msg.includes('pressure')) return 'stressed';
  if (msg.includes('calm') || msg.includes('peace') || msg.includes('relax')) return 'calm';
  
  return 'neutral';
};

// Music recommendation function with curated playlists
const getMusicRecommendation = (emotion) => {
  console.log('🎵 Getting curated music recommendation for emotion:', emotion);
  
  const moodPlaylists = {
    'sad': {
      name: 'Healing Hearts',
      description: 'Gentle music to help process sadness and find comfort 💙',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX7qK8ma5wgG1'
    },
    'happy': {
      name: 'Pure Joy',
      description: 'Uplifting tracks to amplify your happiness ✨',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd'
    },
    'anxious': {
      name: 'Calm Mind',
      description: 'Peaceful sounds to ease anxiety and bring tranquility 🕊️',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO'
    },
    'angry': {
      name: 'Release & Transform',
      description: 'Powerful music to channel anger into strength ⚡',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DWWJOmJ7nRx0C'
    },
    'stressed': {
      name: 'Deep Breathe',
      description: 'Relaxing vibes to melt away stress and tension 🧘‍♀️',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ'
    },
    'calm': {
      name: 'Peaceful Moments',
      description: 'Serene music to maintain your inner peace 🌸',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX1s9knjP51Oa'
    },
    'neutral': {
      name: 'Everyday Vibes',
      description: 'Perfect background music for any moment 🎶',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DXdbXVyNiajnn'
    }
  };

  const playlist = moodPlaylists[emotion] || moodPlaylists['neutral'];
  
  return {
    success: true,
    playlist: playlist,
    emotion: emotion,
    message: `Here's your perfect ${emotion} playlist 🎵`
  };
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }
  
  try {
    const { message, history, userMoodData } = request.body;

    // Fast, reliable rule-based response system (no external API dependencies)
    const text = generateKintsugiResponse(message, userMoodData, history);

    // Detect emotion and get music recommendation
    const detectedEmotion = detectEmotionFromMessage(message);
    const musicRecommendation = getMusicRecommendation(detectedEmotion);
    
    // Determine if we should show music button (for emotional messages)
    const shouldShowMusic = ['sad', 'happy', 'anxious', 'angry', 'stressed'].includes(detectedEmotion);

    return response.status(200).json({ 
      reply: text,
      emotion: detectedEmotion,
      musicRecommendation: musicRecommendation,
      showMusicButton: shouldShowMusic
    });

  } catch (error) {
    console.error("Error in AI function:", error);
    return response.status(500).json({ error: 'Failed to get AI response.' });
  }
}