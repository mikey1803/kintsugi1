// api/kintsugi-chat.js - Vercel serverless function for Hugging Face API

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔥 Kintsugi API called!', { method: req.method, body: req.body });
    
    const { message, conversationHistory = [], userMoodData = null } = req.body;

    if (!message) {
      console.log('❌ No message provided');
      return res.status(400).json({ error: 'Message is required' });
    }

    // Use environment variable for API token (secure)
    const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;
    
    if (!HUGGING_FACE_TOKEN) {
      console.error('❌ Hugging Face token not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }
    
    console.log('✅ Token found, proceeding with AI call...');

    // Build context for the AI
    let context = buildKintsugiContext(message, conversationHistory, userMoodData);

    // Try different models in order of preference
    const models = [
      'facebook/blenderbot-400M-distill',
      'microsoft/DialoGPT-small',
      'gpt2'
    ];

    let response = null;
    let usedModel = null;

    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        
        const apiResponse = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HUGGING_FACE_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: context,
            parameters: {
              max_new_tokens: 50,
              temperature: 0.7,
              return_full_text: false
            },
            options: {
              wait_for_model: true
            }
          })
        });

        if (apiResponse.ok) {
          const result = await apiResponse.json();
          
          if (Array.isArray(result) && result.length > 0) {
            response = result[0].generated_text || result[0].text;
          } else if (result.generated_text) {
            response = result.generated_text;
          }

          if (response) {
            usedModel = model;
            break;
          }
        } else {
          console.log(`Model ${model} failed with status: ${apiResponse.status}`);
        }
      } catch (error) {
        console.log(`Model ${model} error:`, error.message);
        continue;
      }
    }

    // If all models failed, use fallback
    if (!response) {
      response = getFallbackResponse(message);
      usedModel = 'fallback';
    } else {
      response = postProcessResponse(response, message);
    }

    return res.status(200).json({
      response: response,
      model: usedModel,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      response: getFallbackResponse(req.body?.message || '')
    });
  }
}

function buildKintsugiContext(message, conversationHistory, userMoodData) {
  let context = "I am Kintsugi, a compassionate wellness AI inspired by the Japanese art of golden repair. ";
  
  if (userMoodData && userMoodData.length > 0) {
    const recentMoods = userMoodData.map(m => m.emotionName).join(", ");
    context += `The user has recently felt: ${recentMoods}. `;
  }
  
  if (conversationHistory && conversationHistory.length > 0) {
    const recent = conversationHistory.slice(-4).join(" ");
    context += `Previous conversation: ${recent} `;
  }
  
  context += `User says: "${message}". I respond with empathy and wisdom:`;
  
  return context;
}

function postProcessResponse(rawResponse, userMessage) {
  if (!rawResponse) return getFallbackResponse(userMessage);

  let cleanResponse = rawResponse
    .replace(/^.*I respond with empathy and wisdom:\s*/i, '')
    .replace(/User says:.*$/i, '')
    .replace(/I am Kintsugi.*?wisdom:\s*/i, '')
    .trim();

  // Ensure appropriate length
  if (cleanResponse.length > 200) {
    cleanResponse = cleanResponse.substring(0, 200).trim();
    const lastSentence = Math.max(
      cleanResponse.lastIndexOf('.'),
      cleanResponse.lastIndexOf('!'),
      cleanResponse.lastIndexOf('?')
    );
    
    if (lastSentence > 50) {
      cleanResponse = cleanResponse.substring(0, lastSentence + 1);
    }
  }

  // Add Kintsugi touch
  if (!/[🌸💙🌿✨🌱🏺💛🎨]/.test(cleanResponse)) {
    cleanResponse += " 🌸";
  }

  return cleanResponse || getFallbackResponse(userMessage);
}

function getFallbackResponse(userMessage = "") {
  const responses = [
    "I hear you, and I want you to know that like the cracks in Kintsugi pottery, our struggles can become sources of strength and beauty. 🌸",
    "Thank you for sharing with me. In the art of Kintsugi, broken places are mended with gold, making them more beautiful than before. You too have this strength within you. 💛",
    "I'm here to listen and support you. Just as Kintsugi transforms broken pottery into something even more precious, your experiences are shaping you into someone uniquely valuable. 🌿",
    "Your feelings are valid and important. Like the golden veins in Kintsugi art, your journey through challenges creates something beautiful and resilient. ✨"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}