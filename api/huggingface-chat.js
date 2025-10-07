// api/huggingface-chat.js
// Vercel API endpoint for Hugging Face integration

export default async function handler(req, res) {
  // Enable CORS for your app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, emotion, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('🤗 Processing Hugging Face request:', { message, emotion });

    // Build therapeutic prompt
    const therapeuticPrompt = buildTherapeuticPrompt(message, emotion, conversationHistory);
    
    // Call Hugging Face API
    const huggingFaceResponse = await callHuggingFaceAPI(therapeuticPrompt);
    
    // Process and clean the response
    const therapeuticResponse = processTherapeuticResponse(huggingFaceResponse, emotion);

    console.log('✅ Generated response:', therapeuticResponse);

    res.status(200).json({
      success: true,
      response: therapeuticResponse,
      emotion: emotion,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Hugging Face API Error:', error);
    
    // Return a fallback therapeutic response
    const fallbackResponse = getFallbackTherapeuticResponse(req.body.message, req.body.emotion);
    
    res.status(200).json({
      success: true,
      response: fallbackResponse,
      emotion: req.body.emotion || 'supportive',
      isFallback: true,
      timestamp: new Date().toISOString()
    });
  }
}

function buildTherapeuticPrompt(message, emotion, conversationHistory) {
  const systemPrompt = `You are Kintsugi AI, a compassionate mental health counselor. You provide empathetic, therapeutic responses that:
- Validate emotions with care
- Ask thoughtful follow-up questions
- Offer gentle guidance
- Show genuine empathy
- Use therapeutic language
- Keep responses concise but meaningful

Current conversation context:`;

  // Add recent conversation for context
  let contextHistory = '';
  if (conversationHistory.length > 0) {
    const recent = conversationHistory.slice(-2);
    contextHistory = recent.map(msg => `Human: ${msg.user}\nTherapist: ${msg.assistant}`).join('\n');
  }

  const emotionContext = emotion ? `\nDetected emotion: ${emotion}` : '';
  
  return `${systemPrompt}\n${contextHistory}\n\nHuman: ${message}${emotionContext}\nTherapist:`;
}

async function callHuggingFaceAPI(prompt) {
  const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;
  
  if (!HUGGING_FACE_TOKEN) {
    throw new Error('Hugging Face token not configured');
  }

  const response = await fetch('https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUGGING_FACE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_length: 150,
        temperature: 0.8,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.1,
        return_full_text: false
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Handle different response formats
  if (Array.isArray(data) && data.length > 0) {
    return data[0].generated_text || data[0].text || '';
  }
  return data.generated_text || data.text || '';
}

function processTherapeuticResponse(response, emotion) {
  // Clean the response
  let cleanResponse = response.replace(/^(Therapist:|Human:|Assistant:)/i, '').trim();
  
  // Add appropriate emoji based on emotion
  const emotionEmojis = {
    sad: '💙',
    happy: '🌟', 
    angry: '💪',
    anxious: '🤗',
    confused: '💫',
    frustrated: '💛',
    default: '💙'
  };

  const emoji = emotionEmojis[emotion] || emotionEmojis.default;
  
  // Ensure response starts with empathy
  if (!cleanResponse.match(/^(💙|🌟|💪|🤗|💫|💛|I |Thank|That|What|It)/)) {
    cleanResponse = `${emoji} ${cleanResponse}`;
  }

  // Ensure minimum length and helpfulness
  if (cleanResponse.length < 40) {
    cleanResponse += ` I'm here to listen and support you. What feels most important to explore right now?`;
  }

  return cleanResponse;
}

function getFallbackTherapeuticResponse(message, emotion) {
  const emotionEmojis = {
    sad: '💙',
    happy: '🌟',
    angry: '💪', 
    anxious: '🤗',
    confused: '💫',
    frustrated: '💛',
    default: '💙'
  };

  const emoji = emotionEmojis[emotion] || emotionEmojis.default;
  
  const fallbacks = [
    `${emoji} I hear you, and I'm here to listen. Your feelings are completely valid. What's weighing most heavily on your heart right now?`,
    
    `${emoji} Thank you for sharing that with me. I can sense this is important to you. What would feel most helpful to explore together?`,
    
    `${emoji} I'm glad you felt comfortable sharing this. Your experience matters, and I want to understand more. What aspect feels most significant to you?`
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}