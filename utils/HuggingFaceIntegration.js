// utils/HuggingFaceIntegration.js
// Vercel API Integration for Advanced Hugging Face AI

class HuggingFaceTherapist {
  constructor() {
    // Use your actual Vercel deployment URL
    this.vercelApiUrl = 'https://kintsugi-app-main-eegl351av-mikwy1803s-projects.vercel.app/api/huggingface-chat';
    // Fallback for local development
    this.localApiUrl = 'http://localhost:3000/api/huggingface-chat';
    this.conversationHistory = [];
    console.log('🚀 Vercel API Therapist initialized with production URL');
  }

  async generateTherapeuticResponse(userMessage, emotionContext = null, crisisLevel = 'none') {
    try {
      // If crisis detected, use our local crisis response
      if (crisisLevel !== 'none') {
        return this.generateCrisisResponse(userMessage, crisisLevel);
      }

      console.log('🔗 Calling Vercel API for advanced response...');
      
      // Call our Vercel API endpoint
      const response = await this.callVercelAPI(userMessage, emotionContext);
      
      // Update conversation history
      this.conversationHistory.push({
        user: userMessage,
        assistant: response,
        timestamp: new Date(),
        emotion: emotionContext
      });
      
      console.log('✅ Advanced AI response generated via Vercel');
      return response;
      
    } catch (error) {
      console.error('🚨 Vercel API Error:', error);
      return this.getFallbackResponse(userMessage, emotionContext);
    }
  }

  buildTherapeuticPrompt(userMessage, emotionContext) {
    const systemPrompt = `You are a compassionate, professional mental health counselor named Kintsugi AI. You provide empathetic, therapeutic responses that validate emotions and offer gentle guidance. You always:
- Acknowledge the person's feelings
- Ask thoughtful follow-up questions
- Provide emotional validation
- Offer practical coping strategies when appropriate
- Maintain professional boundaries
- Show genuine care and empathy

Current conversation context:`;
    
    // Add recent conversation history for context
    let conversationContext = '';
    if (this.conversationHistory.length > 0) {
      const recentMessages = this.conversationHistory.slice(-3);
      conversationContext = recentMessages.map(msg => 
        `Human: ${msg.user}\nTherapist: ${msg.assistant}`
      ).join('\n\n');
    }
    
    const emotionInfo = emotionContext ? `\n\nDetected emotion: ${emotionContext.emotion} (intensity: ${emotionContext.intensity})` : '';
    
    return `${systemPrompt}\n\n${conversationContext}\n\nHuman: ${userMessage}${emotionInfo}\n\nTherapist:`;
  }

  async callVercelAPI(message, emotionContext) {
    console.log('� Calling Vercel API endpoint...');
    
    try {
      const response = await fetch(this.vercelApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          emotion: emotionContext?.emotion || null,
          conversationHistory: this.conversationHistory.slice(-3) // Send recent context
        })
      });

      console.log('📡 Vercel API Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Vercel API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Vercel API Response:', data);
      
      if (data.success && data.response) {
        return data.response;
      } else {
        throw new Error('Invalid response format from Vercel API');
      }
      
    } catch (error) {
      console.error('🚨 Vercel API Error:', error);
      throw error;
    }
  }

  ensureTherapeuticTone(response, emotionContext) {
    // Remove the original prompt from response if it's included
    let cleanResponse = response.split('Therapist:').pop() || response;
    cleanResponse = cleanResponse.trim();
    
    // Add empathetic emojis based on emotion
    const emotionEmojis = {
      sad: '💙',
      happy: '🌟',
      angry: '💪',
      anxious: '🤗',
      confused: '💫',
      default: '💛'
    };
    
    const emoji = emotionContext ? 
      emotionEmojis[emotionContext.emotion] || emotionEmojis.default : 
      emotionEmojis.default;
    
    // Ensure response starts with empathetic acknowledgment
    if (!cleanResponse.match(/^(💙|🌟|💪|🤗|💫|💛|I |Thank|That|What|It)/)) {
      cleanResponse = `${emoji} ${cleanResponse}`;
    }
    
    // Ensure response isn't too short or generic
    if (cleanResponse.length < 50) {
      cleanResponse += ` I'm here to listen and support you through whatever you're experiencing. What feels most important for you to explore right now?`;
    }
    
    return cleanResponse;
  }

  generateCrisisResponse(userMessage, crisisLevel) {
    // Use our existing crisis detection system for safety
    const crisisResponses = {
      immediate: `🚨 I'm really concerned about what you've shared. Your life has value and you deserve support right now.

**If you're in immediate danger, please call 911 or go to your nearest emergency room.**

**Crisis Support Available 24/7:**
• **988 Suicide & Crisis Lifeline**: Call or text 988
• **Crisis Text Line**: Text HOME to 741741

You are not alone. These feelings can change. Please reach out for help right now. 💙`,

      high: `💙 I can hear that you're going through something really difficult right now. Thank you for sharing this with me - that takes courage.

**Support Resources:**
• **988 Suicide & Crisis Lifeline**: Call or text 988 (free, 24/7)
• **Crisis Text Line**: Text HOME to 741741
• Consider reaching out to a mental health professional

Your feelings are valid, but you don't have to go through this alone. Professional support can make a real difference. 💛`,

      moderate: `💙 I can sense you're struggling right now, and I want you to know that these feelings are valid and you deserve support.

What's feeling most overwhelming for you right now? Sometimes talking through what we're experiencing can help us feel less alone with it. 💛`
    };

    return crisisResponses[crisisLevel] || crisisResponses.moderate;
  }

  getFallbackResponse(userMessage, emotionContext) {
    const fallbacks = [
      `💙 I hear you, and I'm here to listen. Sometimes when technology doesn't work perfectly, our connection as humans becomes even more important. What's really on your heart right now?`,
      
      `💛 Thank you for sharing with me. Even when systems aren't perfect, your feelings and experiences are completely valid. What would feel most helpful for us to explore together?`,
      
      `🌟 I'm glad you're here, even when things feel frustrating. Your willingness to reach out shows strength. What's the most pressing thing you'd like to talk through right now?`
    ];
    
    const baseResponse = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    
    // Add emotion-specific support if available
    if (emotionContext && emotionContext.emotion === 'sad') {
      return baseResponse + `\n\nI can sense there's sadness in what you're sharing. That's completely valid - sadness often shows us what matters to us. 💙`;
    }
    
    return baseResponse;
  }

  // Clear conversation history for new sessions
  clearHistory() {
    this.conversationHistory = [];
  }

  // Get conversation summary for context
  getConversationSummary() {
    if (this.conversationHistory.length === 0) return null;
    
    const emotions = this.conversationHistory.map(msg => msg.emotion).filter(Boolean);
    const dominantEmotion = emotions.length > 0 ? emotions[emotions.length - 1] : null;
    
    return {
      messageCount: this.conversationHistory.length,
      dominantEmotion: dominantEmotion,
      lastMessage: this.conversationHistory[this.conversationHistory.length - 1],
      topics: this.extractTopics()
    };
  }

  extractTopics() {
    // Simple topic extraction from conversation history
    const allText = this.conversationHistory.map(msg => msg.user).join(' ').toLowerCase();
    
    const topics = [];
    if (allText.includes('relationship') || allText.includes('love') || allText.includes('breakup')) {
      topics.push('relationships');
    }
    if (allText.includes('work') || allText.includes('job') || allText.includes('project')) {
      topics.push('work_stress');
    }
    if (allText.includes('family') || allText.includes('parents')) {
      topics.push('family');
    }
    if (allText.includes('sad') || allText.includes('depressed') || allText.includes('down')) {
      topics.push('depression');
    }
    if (allText.includes('anxious') || allText.includes('worried') || allText.includes('stress')) {
      topics.push('anxiety');
    }
    
    return topics;
  }
}

export default HuggingFaceTherapist;