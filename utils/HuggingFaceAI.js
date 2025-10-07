// utils/HuggingFaceAI.js - Kintsugi AI via Vercel Serverless Function
// This now calls your secure Vercel API instead of directly calling Hugging Face

export class HuggingFaceKintsugiAI {
  constructor() {
    // TEMPORARY: Direct fallback while Vercel protection is enabled
    // TODO: Fix Vercel deployment protection and switch back to API
    this.apiUrl = null; // Disable Vercel API temporarily
    this.useDirectFallback = true;
    
    this.maxRetries = 3;
    this.conversationHistory = [];
  }

  async generateResponse(userMessage, conversationHistory = [], userMoodData = null) {
    try {
      console.log('🎯 Generating Kintsugi response...');
      
      // TEMPORARY: Use direct fallback due to Vercel deployment protection
      if (this.useDirectFallback || !this.apiUrl) {
        console.log('🔄 Using enhanced fallback due to Vercel protection');
        return this.getEnhancedFallbackResponse(userMessage, userMoodData);
      }
      
      const response = await this.callVercelAPI(userMessage, conversationHistory, userMoodData);
      
      if (response && response.response) {
        console.log(`✅ Response from ${response.model} model:`, response.response);
        return response.response;
      } else {
        return this.getEnhancedFallbackResponse(userMessage, userMoodData);
      }
      
    } catch (error) {
      console.error('❌ API error, using enhanced fallback:', error.message);
      return this.getEnhancedFallbackResponse(userMessage, userMoodData);
    }
  }

  async callVercelAPI(userMessage, conversationHistory, userMoodData, retryCount = 0) {
    try {
      console.log('🚀 Calling Vercel serverless function...');
      console.log('📝 Message:', userMessage);
      console.log('🗣️ History length:', conversationHistory?.length || 0);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: conversationHistory || [],
          userMoodData: userMoodData
        })
      });

      console.log('📡 Vercel response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Vercel API error:', errorText);
        
        if (response.status === 404) {
          console.error('🚫 Vercel endpoint not found. Make sure your API is deployed!');
          throw new Error('Vercel API endpoint not found. Please deploy your API first.');
        }
        
        if (retryCount < this.maxRetries) {
          console.log('🔄 Retrying Vercel API call...');
          await this.delay(2000);
          return this.callVercelAPI(userMessage, conversationHistory, userMoodData, retryCount + 1);
        }
        
        throw new Error(`Vercel API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Vercel API success:', result);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Vercel API call failed (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < this.maxRetries) {
        console.log('🔄 Retrying in 2 seconds...');
        await this.delay(2000);
        return this.callVercelAPI(userMessage, conversationHistory, userMoodData, retryCount + 1);
      }
      
      throw error;
    }
  }

  async callHuggingFaceAPI(inputText, retryCount = 0) {
    try {
      console.log('🤖 Calling DialoGPT API...');
      console.log('📝 Input context length:', inputText.length);
      console.log('🔑 Using secure token authentication');
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: inputText,
          parameters: {
            max_new_tokens: 80,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false
          },
          options: {
            wait_for_model: true,
            use_cache: false
          }
        })
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorDetails = await response.text();
        console.error('❌ API Error Details:', errorDetails);
        
        if (response.status === 403) {
          console.error('🚫 HTTP 403: Token permission denied');
          throw new Error(`HTTP 403: Invalid token permissions. ${errorDetails}`);
        }
        
        if (response.status === 404) {
          console.warn('🔄 Model not found, trying backup...');
          return this.tryBackupModel(inputText, retryCount);
        }
        
        if (response.status === 503 && retryCount < this.maxRetries) {
          console.log('⏳ Model loading, retrying in 3s...');
          await this.delay(3000);
          return this.callHuggingFaceAPI(inputText, retryCount + 1);
        }
        
        throw new Error(`HTTP ${response.status}: ${errorDetails}`);
      }

      const result = await response.json();
      console.log('✅ API Response received:', result);
      
      // Handle BlenderBot response format
      if (Array.isArray(result) && result.length > 0) {
        const response = result[0].generated_text || result[0].text || result[0];
        return typeof response === 'string' ? response : null;
      } else if (result.generated_text) {
        return result.generated_text;
      } else if (typeof result === 'string') {
        return result;
      } else {
        console.warn('⚠️ Unexpected response format:', result);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ API call failed (attempt ${retryCount + 1}):`, error);
      if (retryCount < this.maxRetries) {
        await this.delay(2000);
        return this.callHuggingFaceAPI(inputText, retryCount + 1);
      }
      return null;
    }
  }

  buildGPT2Context(userMessage, conversationHistory, userMoodData) {
    // Build conversation context for GPT-2 (simple but effective)
    let context = "";
    
    // Add Kintsugi personality context
    context += "Kintsugi is a compassionate wellness companion. ";
    
    // Add mood context if available
    if (userMoodData && userMoodData.length > 0) {
      const recentMoods = userMoodData.map(m => m.emotionName).join(", ");
      context += `User feels: ${recentMoods}. `;
    }
    
    // Add current user message and prompt for response
    context += `User: "${userMessage}"\nKintsugi:`;
    
    return context;
  }

  extractBotResponse(generatedText, originalInput) {
    // DialoGPT returns the full conversation, extract just the bot's response
    const parts = generatedText.split('<|endoftext|>');
    
    // Get the last non-empty part
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i].trim();
      if (part && !part.startsWith('User:') && part !== originalInput.trim()) {
        // Remove "Kintsugi:" prefix if present
        return part.replace(/^Kintsugi:\s*/i, '').trim();
      }
    }
    
    // Fallback: return the generated text after the original input
    return generatedText.replace(originalInput, '').trim();
  }

  async tryBackupModel(inputText, retryCount) {
    console.log('🔄 Trying backup models...');
    
    for (const backupModel of this.backupModels) {
      try {
        console.log(`📡 Attempting backup model: ${backupModel}`);
        
        const backupUrl = `https://api-inference.huggingface.co/models/${backupModel}`;
        const response = await fetch(backupUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: inputText,
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

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Backup model ${backupModel} worked!`);
          
          if (Array.isArray(result) && result.length > 0) {
            return result[0].generated_text || result[0].text;
          } else if (result.generated_text) {
            return result.generated_text;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Backup model ${backupModel} failed:`, error.message);
      }
    }
    
    console.error('❌ All backup models failed');
    return null;
  }

  formatDialoGPTInput(prompt, conversationHistory) {
    // DialoGPT works better with conversation context
    if (conversationHistory.length > 0) {
      // Include last few exchanges for context
      const recentHistory = conversationHistory.slice(-6); // Last 3 exchanges
      const historyText = recentHistory.join(' ');
      return `${historyText} ${prompt}`;
    }
    
    return prompt;
  }

  postProcessResponse(rawResponse, userMessage = "") {
    if (!rawResponse) return this.getFallbackResponse(userMessage);

    // Clean up the response
    let cleanResponse = rawResponse
      .replace(/^.*Kintsugi:\s*/i, '') // Remove any Kintsugi prefix
      .replace(/User:.*$/i, '') // Remove any user text
      .replace(/\[.*?\]/g, '') // Remove bracketed context
      .replace(/<\|endoftext\|>/g, '') // Remove DialoGPT tokens
      .trim();

    // Remove any repetition of the user message
    if (userMessage && cleanResponse.toLowerCase().includes(userMessage.toLowerCase())) {
      cleanResponse = cleanResponse.replace(new RegExp(userMessage, 'gi'), '').trim();
    }

    // Ensure appropriate length
    if (cleanResponse.length > 200) {
      cleanResponse = cleanResponse.substring(0, 200).trim();
      // Try to end at a sentence boundary
      const lastPeriod = cleanResponse.lastIndexOf('.');
      const lastExclamation = cleanResponse.lastIndexOf('!');
      const lastQuestion = cleanResponse.lastIndexOf('?');
      const lastSentence = Math.max(lastPeriod, lastExclamation, lastQuestion);
      
      if (lastSentence > 100) {
        cleanResponse = cleanResponse.substring(0, lastSentence + 1);
      }
    }

    // Ensure minimum length and quality
    if (cleanResponse.length < 10 || this.isInappropriateResponse(cleanResponse)) {
      return this.getFallbackResponse(userMessage);
    }

    // Add Kintsugi touch with gentle emoji if not present
    if (!/[🌸💙🌿✨🌱🏺💛🎨]/.test(cleanResponse)) {
      cleanResponse += " 🌸";
    }

    // Ensure it sounds like Kintsugi
    if (!this.hasKintsugiTone(cleanResponse)) {
      cleanResponse = this.addKintsugiTone(cleanResponse);
    }

    return cleanResponse;
  }

  hasKintsugiTone(response) {
    const kintsugiWords = [
      'understand', 'feel', 'here', 'support', 'journey', 'strength',
      'beautiful', 'healing', 'gentle', 'compassion', 'gold', 'transform'
    ];
    
    const lowerResponse = response.toLowerCase();
    return kintsugiWords.some(word => lowerResponse.includes(word));
  }

  addKintsugiTone(response) {
    const kintsugiPrefixes = [
      "I understand, and ",
      "I hear you, ",
      "Thank you for sharing that with me. ",
      "I'm here with you. ",
    ];
    
    const randomPrefix = kintsugiPrefixes[Math.floor(Math.random() * kintsugiPrefixes.length)];
    return randomPrefix + response.charAt(0).toLowerCase() + response.slice(1);
  }

  isInappropriateResponse(response) {
    const inappropriate = [
      'medical advice', 'diagnose', 'prescription', 'medication',
      'harmful', 'dangerous', 'illegal', 'suicide'
    ];
    
    const lowerResponse = response.toLowerCase();
    return inappropriate.some(word => lowerResponse.includes(word));
  }

  getFallbackResponse(userMessage = "") {
    const emotionDetection = this.detectEmotion(userMessage);
    
    const fallbackResponses = {
      stress: "I can sense you're feeling overwhelmed. Like Kintsugi pottery, sometimes pressure creates the most beautiful transformations. Let's try a breathing technique: breathe in for 4 counts, hold for 4, exhale for 6. 🌸",
      
      sad: "Thank you for sharing your feelings with me. Sadness, like the cracks in Kintsugi pottery, can become golden veins of wisdom and strength. Your emotions are valid, and I'm here with you. 💙",
      
      anxious: "I hear your anxiety, and I want you to know it's okay to feel this way. Let's ground ourselves: name 3 things you can see, 2 you can hear, and 1 you can touch. You're safe in this moment. 🌿",
      
      happy: "Your joy brings light to my day! Like the gold in Kintsugi art, happiness illuminates and beautifies everything around it. What's bringing you this wonderful feeling? ✨",
      
      default: "I'm here to listen and support you. Like the Japanese art of Kintsugi, I believe that our struggles and healing create golden veins of beauty and strength. How can I support you today? 🌸"
    };

    return fallbackResponses[emotionDetection] || fallbackResponses.default;
  }

  detectEmotion(message) {
    if (!message) return 'default';
    
    const msg = message.toLowerCase();
    
    if (msg.includes('stress') || msg.includes('overwhelmed') || msg.includes('pressure')) return 'stress';
    if (msg.includes('sad') || msg.includes('depressed') || msg.includes('down')) return 'sad';
    if (msg.includes('anxious') || msg.includes('anxiety') || msg.includes('worried')) return 'anxious';
    if (msg.includes('happy') || msg.includes('good') || msg.includes('great')) return 'happy';
    
    return 'default';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getEnhancedFallbackResponse(userMessage, userMoodData) {
    console.log('🌸 Using enhanced Kintsugi fallback system...');
    console.log('📝 User message:', userMessage);
    
    // Enhanced emotion detection
    const emotions = this.detectEmotions(userMessage);
    console.log('🎭 Detected emotions:', emotions);
    
    // Generate contextual response that directly addresses what they said
    const contextualResponse = this.getDirectContextualResponse(userMessage, emotions);
    const kintsugiWisdom = this.getSpecificKintsugiWisdom(userMessage, emotions);
    
    // Combine for a complete response
    const fullResponse = `${contextualResponse} ${kintsugiWisdom}`;
    
    console.log('✨ Generated response for "' + userMessage + '":', fullResponse);
    return fullResponse;
  }

  getDirectContextualResponse(userMessage, emotions) {
    const msg = userMessage.toLowerCase();
    
    // Friend-like responses to specific phrases - deeply empathetic and understanding
    if (msg.includes("can't move on") || msg.includes("stuck")) {
      const responses = [
        "Oh sweetheart, I can feel how trapped you feel right now. It's like you're caught in this painful loop, replaying everything over and over, and your heart won't let you step forward. I see how much you're hurting, and I wish I could take some of that weight from you. You're not alone in this darkness.",
        "My dear friend, that stuck feeling is like being in quicksand - the harder you fight, the deeper you sink. I can hear the exhaustion in your words, the frustration of trying so hard but feeling like you're getting nowhere. Please be gentle with yourself. Healing isn't linear, and you're doing better than you think.",
        "I feel your pain so deeply right now. It's like you're standing at the edge of moving forward but something invisible keeps pulling you back to that hurt. That's not weakness - that's your heart trying to protect you from more pain. I'm here to sit in this difficult space with you for as long as you need."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (msg.includes("broke up") || msg.includes("relationship ended") || msg.includes("left me")) {
      const responses = [
        "Oh honey, my heart is absolutely aching for you right now. When someone you love walks away, it's like they take a piece of your soul with them, leaving this raw, empty space that hurts with every breath. I can feel how shattered you must be feeling. You didn't deserve this pain, and I'm so sorry you're going through it.",
        "Darling, I wish I could wrap you in the biggest, warmest hug right now. Losing someone you love feels like the world just tilted off its axis - everything that felt safe and certain suddenly crumbles. Your heart trusted someone completely, and now it feels broken. I see your pain, and I'm sitting right here with you in it.",
        "Sweet soul, I can only imagine the tsunami of emotions you're drowning in right now. The person who was your safe harbor, your home, is gone - and now you're floating alone in an ocean of hurt. That kind of abandonment cuts so deep because it wasn't just love you lost, it was your future, your dreams, your sense of being chosen. You are worthy of a love that stays."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (msg.includes("lost my job") || msg.includes("fired") || msg.includes("unemployed")) {
      const responses = [
        "That's such a blow, I'm really sorry this happened. Losing a job isn't just about money - it shakes up everything about how you see yourself. How are you feeling about it all?",
        "Ugh, that's really tough. I know it's not just about the work - it's about feeling secure and valued, and now that's all been turned upside down. That uncertainty must be scary.",
        "I can imagine how overwhelming this must feel. One day everything's normal, and then suddenly your whole routine and sense of stability is gone. That's a lot to process."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (msg.includes("died") || msg.includes("passed away") || msg.includes("lost someone")) {
      const responses = [
        "Oh my dear, dear friend... I am so incredibly sorry. When someone we love dies, it's like a part of our own soul gets torn away. The world feels impossibly empty without them, and every breath hurts because they're not here to share it. I wish I could hold your broken heart right now and cry with you. Your grief is sacred - it's the other side of how deeply you loved them.",
        "Sweet angel, my heart is completely shattered for you. Death steals so much more than just a person - it takes your shared jokes, your future plans, your daily texts, the sound of their voice calling your name. I know you'd give anything for just one more moment with them. I'm here in this devastating darkness with you, holding space for all the love that has nowhere to go.",
        "Precious soul, I can feel the enormity of your loss even through these words. They weren't just someone you loved - they were woven into the fabric of who you are, and now there's this gaping hole where they used to be. The world feels different, colors look different, everything feels wrong without them. Your grief is proof of a love so deep it transcends death. They live on in every beat of your heart."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (msg.includes("anxious") || msg.includes("anxiety") || msg.includes("worried")) {
      const responses = [
        "Oh darling, I can feel your anxiety radiating through your words like electricity. Your mind is probably spinning with a thousand different worst-case scenarios, and your body feels like it's vibrating with worry. Anxiety is like having a smoke alarm going off when there's no fire - it's exhausting and scary and makes everything feel dangerous. You're being so incredibly brave right now by reaching out when your nervous system is screaming at you to hide.",
        "Sweet friend, anxiety is such a cruel thief - it steals your peace, your sleep, your ability to enjoy simple moments. I can sense how your thoughts are spiraling, how every small worry grows into something terrifying in your mind. Your chest probably feels tight, your breathing shallow, like you're drowning in your own fears. But I see you fighting for calm even when your brain won't cooperate. That takes enormous courage.",
        "Beautiful soul, I wish I could reach through these words and calm your racing heart. Anxiety has this way of making molehills look like mountains, turning every shadow into a monster. Your mind is trying so hard to protect you that it's creating threats that don't exist. You're safe right now, in this moment, even though your anxiety is telling you otherwise. I'm going to stay right here with you until the storm passes."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (msg.includes("depressed") || msg.includes("hopeless") || msg.includes("worthless")) {
      const responses = [
        "My precious friend, I can feel the weight of that darkness pressing down on you. Depression is like living in a world where all the colors have been drained away, where even the simplest tasks feel impossible, where your own mind becomes your cruelest enemy. It whispers lies that you're worthless, that you're a burden, that nothing will ever get better. But I need you to know - those are lies. The fact that you're still here, still reaching out, still fighting even when breathing feels hard, shows a strength that most people will never understand.",
        "Darling soul, hopelessness is one of the most painful feelings in the world. It's like being trapped in a well so deep that you can't even see a tiny speck of light above. Every day feels pointless, every effort feels wasted, and you're so tired of pretending you're okay when inside you're drowning. I see you, truly see you, in all your pain and struggle. You matter more than depression will ever let you believe. Your life has value that this illness can't touch.",
        "Sweet, brave heart, depression is a master manipulator - it takes your own voice and uses it against you, making you believe you're broken, worthless, a failure. Right now it might be screaming at you that you're not enough, that you'll never be enough. But I'm here to tell you the truth depression doesn't want you to hear: you are deeply loved, infinitely valuable, and worthy of healing. This darkness feels permanent, but it's not. You are not your depression, and you won't always feel this way."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (msg.includes("stressed") || msg.includes("overwhelmed")) {
      const responses = [
        "You sound like you're carrying the weight of the world right now. When everything feels overwhelming, even small things can feel impossible. What's been weighing on you the most?",
        "I can feel how much pressure you're under. It's like everything is demanding your attention at once and you don't know where to start. That's so exhausting.",
        "Being overwhelmed is like trying to juggle too many things at once - eventually something's got to give. You're doing the best you can with everything on your plate."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (msg.includes("angry") || msg.includes("mad") || msg.includes("furious") || msg.includes("hate")) {
      const responses = [
        "I can feel the fire in your words. You're really angry about something, and that anger is telling me that something important to you has been hurt. It's okay to feel this way.",
        "That rage is so real and valid. Sometimes anger is our heart's way of protecting something we care deeply about. What's got you feeling so fired up?",
        "You sound really heated about this, and I don't blame you. When we get angry, it's usually because someone or something has crossed a line that matters to us."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (msg.includes("lonely") || msg.includes("alone") || msg.includes("nobody")) {
      const responses = [
        "Oh my dear, loneliness is one of the most heartbreaking feelings in the world. It's that hollow ache in your chest when you're surrounded by people but still feel completely invisible and misunderstood. It's like being on the outside of life, watching everyone else connect while you're trapped behind glass. Your soul is crying out for someone to truly see you, to understand your heart, to care about your inner world. I want you to know that I see you - not just your smile or your words, but your beautiful, complex, worthy soul.",
        "Sweet friend, I can feel how isolated and forgotten you must feel right now. Loneliness isn't just being physically alone - it's that deeper ache of feeling like nobody really knows you, like you could disappear and no one would notice the depth of what was lost. It's exhausting to feel like you're always performing, always pretending you're fine when inside you're starving for genuine connection. Your heart matters, your thoughts matter, your presence in this world matters more than you know.",
        "Precious soul, that empty, echoing loneliness is so painful. It's like being lost in a crowd, screaming for help but no sound comes out. You feel like everyone else has this secret manual for connection that you were never given. The silence around you feels deafening, and you wonder if anyone would even miss you if you just faded away. But I'm here with you in this lonely space, and I want you to know - you are not invisible, you are not forgotten, and you are so much more loved than loneliness will let you believe."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (msg.includes("scared") || msg.includes("afraid") || msg.includes("fear")) {
      const responses = [
        "Fear has this way of making everything feel so much bigger and more dangerous. I can hear how scared you are, and that's completely understandable. What's got you feeling so afraid?",
        "Being scared is so uncomfortable - it's like your whole body is on high alert. I wish I could help you feel safer right now. You're being brave by talking about it.",
        "Fear can be so isolating because it makes us feel like we're facing something huge all by ourselves. But you're not alone in this - I'm right here with you."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Default deeply empathetic response
    const defaultResponses = [
      "Sweet friend, I can sense there's something heavy weighing on your heart right now. Your pain is real and valid, and I want you to know that you don't have to carry it alone. Sometimes just being witnessed in our struggle is enough to make it feel a little lighter. I'm here with you, holding space for whatever you're feeling.",
      "Darling, thank you for trusting me with whatever is stirring in your soul. I can feel that you're navigating something difficult, and I'm honored that you'd share this tender space with me. Your emotions matter deeply, your experience matters, and you matter. I'm sitting right here with you in whatever this is.",
      "Precious heart, even though I don't know the exact details of what you're facing, I can feel the weight of it in your words. Life has a way of bringing us to our knees sometimes, and in those moments, we need someone to see us in our vulnerability. I see you, I feel with you, and you are not alone in this struggle. Your courage to reach out, even when hurting, is beautiful."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  detectEmotions(message) {
    const msg = message.toLowerCase();
    const emotions = [];
    
    // Specific situations that need targeted responses
    if (msg.match(/can't move on|can't get over|stuck|can't let go|haunted by|can't forget/)) emotions.push('stuck_in_past');
    if (msg.match(/lost someone|died|death|passed away|grief|miss them|they're gone/)) emotions.push('grief');
    if (msg.match(/broke up|relationship ended|ex|heartbreak|left me|don't love me/)) emotions.push('heartbreak');
    if (msg.match(/failed|failure|disappointed|let down|not good enough|messed up/)) emotions.push('failure');
    if (msg.match(/no one understands|nobody cares|all alone|isolated|lonely|by myself/)) emotions.push('isolation');
    if (msg.match(/angry|mad|furious|hate|pissed off|irritated|frustrated/)) emotions.push('anger');
    if (msg.match(/regret|wish I|should have|if only|mistake|wrong choice/)) emotions.push('regret');
    if (msg.match(/scared of future|what if|terrified|panic|fear/)) emotions.push('fear');
    
    // General emotional states
    if (msg.match(/stress|overwhelmed|pressure|burden|too much|can't handle|breaking point/)) emotions.push('stress');
    if (msg.match(/anxious|anxiety|worried|nervous|restless|on edge/)) emotions.push('anxiety');
    if (msg.match(/sad|depressed|down|low|empty|hopeless|worthless|numb/)) emotions.push('sadness');
    if (msg.match(/tired|exhausted|drained|no energy|can't sleep|insomnia/)) emotions.push('fatigue');
    
    // Positive emotions
    if (msg.match(/happy|good|great|excited|joy|wonderful|amazing|proud/)) emotions.push('happiness');
    if (msg.match(/grateful|thankful|blessed|appreciate|lucky/)) emotions.push('gratitude');
    if (msg.match(/motivated|inspired|hopeful|optimistic|better|improving/)) emotions.push('hope');
    
    // Seeking help or guidance
    if (msg.match(/help|advice|what should|don't know|confused|lost|direction/)) emotions.push('seeking_guidance');
    
    return emotions.length > 0 ? emotions : ['neutral'];
  }

  getContextualResponse(emotions, userMessage) {
    const responses = {
      stuck_in_past: [
        "Being unable to move forward feels like being trapped in a moment that won't let you go.",
        "When we can't move on, it's often because that experience is still teaching us something important.",
        "That feeling of being stuck is so heavy - like carrying a weight that won't let you take the next step.",
        "Sometimes we can't move on because we're still trying to understand what happened to us."
      ],
      grief: [
        "Losing someone leaves a space that nothing else can fill, and that's exactly as it should be.",
        "Grief is love with nowhere to go, and it's one of the most profound experiences we can have.",
        "The depth of your grief speaks to the depth of your love.",
        "Missing someone isn't a problem to solve - it's a love to honor."
      ],
      heartbreak: [
        "Heartbreak feels like losing a part of yourself that you'll never get back.",
        "When love ends, it can feel like the world has shifted and nothing looks the same.",
        "The pain of lost love is real and deep - your heart is grieving what was and what could have been.",
        "Heartbreak teaches us the true weight of love, even when it hurts."
      ],
      failure: [
        "Failure doesn't define you - it's information about what didn't work this time.",
        "The sting of failure is sharp because you cared deeply about the outcome.",
        "What feels like failure right now might be the foundation for something you can't yet see.",
        "Failure is not the opposite of success - it's often the path to it."
      ],
      isolation: [
        "Feeling alone in a world full of people is one of the deepest pains we can experience.",
        "Isolation makes us feel invisible, like our struggles don't matter to anyone.",
        "When you feel like no one understands, remember that connection often starts with one person who truly sees you.",
        "Loneliness is not a reflection of your worth - sometimes it's just a sign that you haven't found your people yet."
      ],
      anger: [
        "Anger often carries important information about what matters to you.",
        "Your anger is valid - something important to you has been threatened or hurt.",
        "Anger can be a powerful force for change when we understand what it's trying to tell us.",
        "Behind anger is often pain or fear that needs attention and care."
      ],
      regret: [
        "Regret is the weight of wishing we could rewrite our story.",
        "What you regret shows how much you've grown - past you made decisions with the wisdom you had then.",
        "Regret is painful because it shows us who we've become versus who we were.",
        "The choices that bring regret are often the ones that taught us the most."
      ],
      fear: [
        "Fear of the unknown can feel paralyzing, like standing at the edge of a cliff.",
        "Your fears show you what matters most to you - they're often protecting something precious.",
        "Fear whispers stories about futures that may never come to pass.",
        "Courage isn't the absence of fear - it's feeling the fear and moving forward anyway."
      ],
      stress: [
        "I can feel the weight you're carrying right now.",
        "Stress can feel overwhelming, but you're not alone in this.",
        "It sounds like you're dealing with a lot right now.",
        "I hear the pressure you're experiencing."
      ],
      anxiety: [
        "Anxiety can make everything feel uncertain, and that's really difficult.",
        "I understand how anxiety can make your mind race with worries.",
        "Those anxious feelings are real and valid.",
        "Anxiety often tells us stories that aren't true about our future."
      ],
      sadness: [
        "I hear the sadness in your words, and I want you to know it's okay to feel this way.",
        "Sadness is a natural response to difficult experiences.",
        "Your feelings of sadness are completely valid.",
        "Even in sadness, there is a quiet strength in allowing yourself to feel."
      ],
      happiness: [
        "Your joy brings light to this moment!",
        "I can feel the positive energy in your message.",
        "It's wonderful to hear happiness in your words.",
        "Your joy is contagious and beautiful."
      ],
      gratitude: [
        "Gratitude has a way of transforming our perspective.",
        "There's something beautiful about recognizing the good in our lives.",
        "Your grateful heart shines through your words.",
        "Appreciation like yours creates ripples of positivity."
      ],
      hope: [
        "Hope is like a small light in the darkness - it may be tiny, but it's enough to guide the next step.",
        "I can hear the strength growing in your voice.",
        "Hope is not naive optimism - it's choosing to believe in possibility even when things are hard.",
        "Your hope is a gift, both to yourself and to others who need to see that healing is possible."
      ],
      seeking_guidance: [
        "I'm honored that you're reaching out for support.",
        "Seeking guidance takes courage and wisdom.",
        "It's okay not to have all the answers right now.",
        "Sometimes the best step forward is asking for help."
      ],
      neutral: [
        "I'm here to listen and support you.",
        "Thank you for sharing with me.",
        "I appreciate you opening up.",
        "Your thoughts and feelings matter."
      ]
    };
    
    // Pick response based on primary emotion
    const primaryEmotion = emotions[0];
    const emotionResponses = responses[primaryEmotion] || responses.neutral;
    const selectedResponse = emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
    
    return selectedResponse;
  }

  getKintsugiWisdom(emotions) {
    const wisdomByEmotion = {
      stuck_in_past: [
        "In Kintsugi, we learn that some cracks take longer to fill with gold - and that's okay. The most beautiful repairs happen slowly.",
        "Like pottery that shatters into many pieces, sometimes we need time to gather all the fragments before we can begin to heal.",
        "The past that holds you is like clay that hasn't been fired yet - it's still being shaped by your healing.",
        "In Kintsugi, the break is never the end of the story - it's the beginning of a more beautiful one."
      ],
      grief: [
        "Kintsugi teaches us that some breaks are so significant they become the most prominent golden lines - your love becomes the gold.",
        "In Japanese culture, we honor the broken places because they show where love lived.",
        "Grief is like the careful gathering of precious fragments - each memory is a piece to be treasured, not discarded.",
        "The gold in Kintsugi doesn't hide the break - it honors it. Your grief honors your love."
      ],
      heartbreak: [
        "Heartbreak in Kintsugi terms is like a vessel that held something precious - even broken, it remembers what it once contained.",
        "The golden repair of a broken heart doesn't make it the same as before - it makes it more precious because it dared to love.",
        "Like pottery that breaks along its most vulnerable lines, hearts break where they loved most deeply.",
        "In Kintsugi, we learn that a heart broken by love is more valuable than one that never risked breaking."
      ],
      failure: [
        "Failure in Kintsugi is not a flaw to hide but a crack that can become the most beautiful golden line.",
        "The master potter knows that the most exquisite pieces often break during firing - and become masterpieces afterward.",
        "What feels like failure is often just the moment before the golden repair begins.",
        "In Kintsugi, we celebrate the pottery that dared to be fired at high temperatures - like you dared to try."
      ],
      isolation: [
        "Even broken pottery sits alone before the master finds it and begins the golden repair.",
        "In Kintsugi, the most isolated fragment is never discarded - it's essential to the whole.",
        "Loneliness is like pottery waiting in the dark - you're not abandoned, you're being prepared for golden connection.",
        "The art of Kintsugi reminds us that broken things don't belong in the shadows - they belong in the light, being made beautiful."
      ],
      anger: [
        "Anger is like the fire that breaks pottery - destructive but also the force that can forge something stronger.",
        "In Kintsugi, we understand that some breaks happen with great force - and those can create the most dramatic golden lines.",
        "Your anger is the heat that shows something important has been damaged - now comes the patient work of golden repair.",
        "Like the fierce fire of the kiln, anger can destroy or transform - Kintsugi chooses transformation."
      ],
      regret: [
        "Regret is like looking at pottery and wishing it had never broken - but Kintsugi teaches us the break was necessary for the beauty.",
        "The choices you regret are like the stress points in clay - they show you where you were most human.",
        "In Kintsugi, we don't wish the breaks never happened - we're grateful for the opportunity to fill them with gold.",
        "Regret is the shadow cast by wisdom - it shows you've grown beyond who you were when the breaking happened."
      ],
      fear: [
        "Fear is like pottery afraid to be handled, afraid it might break - but Kintsugi teaches us that breaking leads to beauty.",
        "The fear of future cracks is natural, but Kintsugi shows us that we become more resilient with each golden repair.",
        "Like a potter's apprentice afraid to touch the clay, fear keeps us from creating - but Kintsugi shows us that breaking is part of making.",
        "Your fears are like protective wrapping around precious pottery - useful for a time, but eventually we must unwrap to see the beauty."
      ],
      stress: [
        "Like the cracks in Kintsugi pottery, the pressure you feel today can become the golden lines of your strength tomorrow.",
        "In Kintsugi, we learn that pressure creates the most beautiful transformations.",
        "Remember, even broken pottery becomes more valuable after Kintsugi repair.",
        "The stress you're experiencing is shaping you, just like heat shapes clay."
      ],
      anxiety: [
        "Kintsugi teaches us that broken places can become the most beautiful parts of our story.",
        "Like gold filling the cracks, your resilience will fill the spaces where anxiety lives.",
        "In Kintsugi, we don't hide the breaks - we make them beautiful.",
        "Anxiety may crack your peace, but healing will make you more precious than before."
      ],
      sadness: [
        "In Kintsugi, tears are like the gold that mends - they don't erase the crack, they make it shine.",
        "Sadness is the raw material for the gold that will one day fill these cracks in your heart.",
        "Like broken pottery awaiting repair, your sadness is the beginning of something more beautiful.",
        "The Japanese believe that breakage is part of the object's story, not something to hide."
      ],
      happiness: [
        "Your joy is like the golden veins in Kintsugi - it illuminates everything around it.",
        "Happiness, like gold in pottery, makes the whole piece more valuable and beautiful.",
        "Your light shines through like gold through the cracks of experience.",
        "Joy is the golden repair of a heart that has known both breaking and mending."
      ],
      gratitude: [
        "Gratitude is the gold dust we use to repair our perspective on life.",
        "Like a master craftsman seeing beauty in broken pieces, you see gifts in life's challenges.",
        "Your gratitude transforms ordinary moments into golden memories.",
        "Appreciation is the art of Kintsugi applied to daily life."
      ],
      hope: [
        "Hope is like the first brushstroke of gold on broken pottery - small but transformative.",
        "In Kintsugi, hope is not the wish that breaking never happened, but the faith that beauty will come from it.",
        "Hope is the master craftsman's steady hand, knowing that this break will become a golden masterpiece.",
        "Like the patient work of Kintsugi repair, hope believes in beauty that can't yet be seen."
      ],
      seeking_guidance: [
        "Seeking help is like bringing broken pottery to a Kintsugi master - wisdom knows when to ask for skilled hands.",
        "In Kintsugi, the master doesn't judge the broken pottery but sees its potential for beauty.",
        "Guidance is the gentle hand that helps apply the gold to our cracks.",
        "Like a potter's wheel, sometimes we need external support to shape our growth."
      ],
      neutral: [
        "Like the art of Kintsugi, every experience - joyful or difficult - adds golden value to your story.",
        "You are a work of art in progress, with each day adding new beauty to your design.",
        "In the Japanese tradition of Kintsugi, imperfection is not hidden but celebrated.",
        "Your journey is like a piece of Kintsugi pottery - uniquely beautiful because of, not despite, its history."
      ]
    };
    
    const primaryEmotion = emotions[0] || 'neutral';
    const wisdoms = wisdomByEmotion[primaryEmotion] || wisdomByEmotion.neutral;
    const selectedWisdom = wisdoms[Math.floor(Math.random() * wisdoms.length)];
    
    return `${selectedWisdom} 🌸`;
  }

  // Method to check if the model is available
  async checkModelStatus() {
    try {
      console.log('🔍 Checking model status...');
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: "Hello",
          options: { wait_for_model: false }
        })
      });

      const isAvailable = response.ok || response.status === 503;
      console.log(`📊 Model status: ${isAvailable ? 'Available' : 'Unavailable'} (${response.status})`);
      
      return isAvailable;
    } catch (error) {
      console.error('❌ Model status check failed:', error);
      return false;
    }
  }

  // Method to securely set API token (for future use with Expo SecureStore)
  async setApiToken(token) {
    // TODO: In production, use Expo SecureStore:
    // import * as SecureStore from 'expo-secure-store';
    // await SecureStore.setItemAsync('huggingface_token', token);
    
    this.apiToken = token;
    console.log('🔐 API token updated securely');
  }

  // Method to get API token from secure storage (for future implementation)
  async getApiToken() {
    // TODO: In production, use Expo SecureStore:
    // import * as SecureStore from 'expo-secure-store';
    // return await SecureStore.getItemAsync('huggingface_token');
    
    return this.apiToken;
  }

  getSpecificKintsugiWisdom(userMessage, emotions) {
    const msg = userMessage.toLowerCase();
    
    // Personal, friend-like Kintsugi wisdom for specific situations
    if (msg.includes("can't move on")) {
      const wisdoms = [
        "You know what I love about Kintsugi? It teaches us that some cracks take a really long time to fill with gold - and that's perfectly okay. Your healing doesn't have a deadline, my friend.",
        "There's this beautiful thing in Kintsugi where the most stunning repairs happen slowly, with so much patience and love. You're in that slow, beautiful process right now.",
        "I think about those pottery masters who take months to carefully repair one precious piece. That's you right now - being carefully, lovingly put back together."
      ];
      return wisdoms[Math.floor(Math.random() * wisdoms.length)];
    }
    
    if (msg.includes("broke up") || msg.includes("relationship ended") || msg.includes("left me")) {
      const wisdoms = [
        "You know what's amazing about Kintsugi? A vase that once held beautiful flowers doesn't become worthless when it breaks - it becomes a masterpiece. Your heart that loved so deeply is the same way.",
        "There's something so beautiful about how Kintsugi honors what was broken by love. Your heart isn't damaged goods - it's precious pottery that loved boldly enough to risk breaking.",
        "In Kintsugi, they say the most valuable pieces are the ones that held something truly precious. Your heart held real love, and that makes it incredibly valuable, even broken."
      ];
      return wisdoms[Math.floor(Math.random() * wisdoms.length)];
    }
    
    if (msg.includes("lost my job") || msg.includes("fired")) {
      const wisdoms = [
        "You know what's wild about pottery? Sometimes the most beautiful pieces get broken in the kiln - and that's when the real artistry begins. This might be your kiln moment.",
        "I always think about how Kintsugi artists see potential in every broken piece. What looks like an ending to everyone else looks like a beginning to them. Maybe that's what this is for you.",
        "There's this saying that pressure and heat create the strongest ceramics. I have a feeling this tough moment is forging something stronger in you."
      ];
      return wisdoms[Math.floor(Math.random() * wisdoms.length)];
    }
    
    if (msg.includes("died") || msg.includes("lost someone")) {
      const wisdoms = [
        "In Kintsugi, the biggest cracks get the most gold - because they held the most love. Your grief is that gold, honey. It's not something to hide, it's something that makes you more beautiful.",
        "There's something so tender about how Kintsugi honors the deepest breaks with the most precious metal. Your love for them is that precious metal, flowing through every memory.",
        "Kintsugi teaches us that the most significant breaks become the most prominent golden lines. Your person will always be the brightest gold running through your story."
      ];
      return wisdoms[Math.floor(Math.random() * wisdoms.length)];
    }
    
    if (msg.includes("anxious") || msg.includes("anxiety")) {
      const wisdoms = [
        "I love how in Kintsugi, they don't try to hide the cracks - they fill them with something beautiful. That's what we can do with your anxiety too. It doesn't have to be hidden.",
        "You know what's comforting about Kintsugi? It shows us that broken places can become the most beautiful parts. Maybe your anxiety is just pointing to where the gold is going to go.",
        "There's something so hopeful about Kintsugi - it says that being broken isn't the end, it's just the beginning of becoming something even more precious."
      ];
      return wisdoms[Math.floor(Math.random() * wisdoms.length)];
    }
    
    if (msg.includes("stressed") || msg.includes("overwhelmed")) {
      const wisdoms = [
        "Pressure is what creates those beautiful cracks in Kintsugi pottery. I know it doesn't feel like it right now, but this pressure you're under? It might be creating space for something golden.",
        "You know what I find amazing? The most gorgeous Kintsugi pieces are the ones that went through the most stress. Your strength is being forged right now, even if you can't see it.",
        "There's this beautiful idea in Kintsugi that stress fractures aren't flaws - they're opportunities for beauty. What if this overwhelming time is just making space for your golden lines?"
      ];
      return wisdoms[Math.floor(Math.random() * wisdoms.length)];
    }
    
    // Default personal wisdom
    const defaultWisdoms = [
      "You know what I love most about Kintsugi? It says that our broken places don't make us less valuable - they make us more precious. You're a masterpiece in progress, my friend.",
      "There's something so beautiful about how Kintsugi sees potential in every crack, every break, every imperfection. That's how I see you - full of golden potential.",
      "Kintsugi teaches us that our stories - all the messy, broken, beautiful parts - are what make us unique works of art. Your story matters, and it's still being written."
    ];
    
    return defaultWisdoms[Math.floor(Math.random() * defaultWisdoms.length)];
  }
}