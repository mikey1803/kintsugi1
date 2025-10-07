// utils/KintsugiAI.js - Custom Wellness AI for Kintsugi

export class KintsugiAI {
  constructor() {
    this.conversationContext = [];
    this.userName = null;
    this.lastMoodCheckIn = null;
    this.sessionStartTime = new Date();
  }

  // Core wellness knowledge base
  wellnessResponses = {
    greetings: [
      "Hello! I'm Kintsugi, your personal wellness companion. How are you feeling today?",
      "Welcome back! I'm here to support your wellness journey. What's on your mind?",
      "Hi there! I'm Kintsugi. Think of me as your gentle guide to inner peace. How can I help?",
    ],

    stress: [
      "I hear that you're feeling stressed. Let's try the 4-7-8 breathing technique: Breathe in for 4 counts, hold for 7, exhale for 8. This activates your body's relaxation response.",
      "Stress is your body's way of signaling that you need care. Try the 5-4-3-2-1 grounding technique: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste.",
      "When stress feels overwhelming, remember: this feeling is temporary. Try placing one hand on your chest, one on your belly, and focus on breathing deeply into your belly for 3 minutes.",
    ],

    anxiety: [
      "Anxiety can feel scary, but you're not alone. Try this: Look around and name 3 things you can see, 2 you can hear, and 1 you can touch. This helps anchor you in the present moment.",
      "Your anxiety is valid, and it will pass. Let's try progressive muscle relaxation: Tense your shoulders for 5 seconds, then release. Notice the contrast between tension and relaxation.",
      "Anxiety often comes from worrying about the future. Right now, in this moment, you are safe. Take three deep breaths with me and focus only on the sensation of breathing.",
    ],

    sadness: [
      "It's okay to feel sad. Sadness is a natural emotion that honors what matters to you. Would you like to talk about what's weighing on your heart?",
      "Sadness can feel heavy, but it's also a sign of your capacity to love and care. Consider journaling three things you're grateful for today, no matter how small.",
      "Your feelings are valid. Sometimes the best thing we can do is sit with our sadness gently, like comforting a friend. You deserve the same kindness you'd show others.",
    ],

    happiness: [
      "I'm so glad to hear you're feeling good! Happiness is precious. What's bringing you joy today?",
      "Your positive energy is wonderful! Consider taking a moment to savor this feeling and maybe share it with someone you care about.",
      "It's beautiful when happiness visits us. You might want to write about this moment in a gratitude journal to remember it during harder times.",
    ],

    overwhelm: [
      "Feeling overwhelmed is like trying to drink from a fire hose. Let's break things down: What's the ONE most important thing you need to focus on right now?",
      "When everything feels urgent, nothing truly is. Try the 'brain dump' technique: Write down every worry or task, then circle just 3 that truly matter today.",
      "Overwhelm often comes from trying to control too much. Take a deep breath and ask: 'What can I influence right now?' Focus only on that.",
    ],

    motivation: [
      "Motivation comes and goes like waves, but discipline and self-compassion are your steady anchors. What's one small step you can take today?",
      "Remember: progress over perfection. Even tiny steps forward are victories worth celebrating. What would make today feel meaningful to you?",
      "Your journey matters, and so do you. Sometimes the most courageous thing is simply showing up. You're already doing that by being here.",
    ],

    sleep: [
      "Good sleep is the foundation of wellness. Try the '3-2-1 rule': No screens 3 hours before, no food 2 hours before, no work 1 hour before bed.",
      "If your mind races at bedtime, try this: Imagine you're describing your day to someone who cares about you. This shifts your brain from anxiety to reflection.",
      "Create a 'worry window' - set aside 10 minutes during the day to write down concerns, so bedtime is protected for rest and peace.",
    ],

    relationships: [
      "Healthy relationships are built on understanding, respect, and healthy boundaries. What aspect of relationships is on your mind?",
      "Remember: you can't control others, only how you respond. Setting boundaries isn't selfish - it's necessary for genuine connection.",
      "The most important relationship you'll ever have is with yourself. How you treat yourself sets the standard for how others treat you.",
    ],

    mindfulness: [
      "Mindfulness is like coming home to yourself. Try this: Place your feet flat on the floor and notice the connection. You are here, in this moment, and that's enough.",
      "Mindfulness isn't about emptying your mind - it's about noticing what's there with kindness. Even noticing that you're distracted IS mindfulness.",
      "Right now, take three conscious breaths. Feel the air entering and leaving your body. This simple act is a profound gift to your nervous system.",
    ],
  };

  // Wellness techniques database
  techniques = {
    breathing: [
      "4-7-8 Breathing: Inhale for 4, hold for 7, exhale for 8. This activates your parasympathetic nervous system.",
      "Box Breathing: Inhale for 4, hold for 4, exhale for 4, pause for 4. Repeat 4 times.",
      "Belly Breathing: Place one hand on chest, one on belly. Breathe so only your belly hand moves.",
    ],

    grounding: [
      "5-4-3-2-1 Technique: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.",
      "Feet on Floor: Press your feet firmly into the ground. Notice the stability and support beneath you.",
      "Cool Water: Hold something cool or splash cool water on your wrists. Feel the temperature change.",
    ],

    journaling: [
      "Gratitude Triple: Write 3 things you're grateful for and WHY you're grateful for each one.",
      "Emotion Check: 'Right now I feel... because... and that's okay because...'",
      "Daily Highlight: What was one moment today that made you smile, even briefly?",
    ],

    movement: [
      "Gentle Neck Rolls: Slowly roll your neck in circles to release tension.",
      "Shoulder Blade Squeezes: Pull your shoulder blades together, hold for 5 seconds, release.",
      "Mindful Walking: Take 10 steps very slowly, focusing on each foot touching the ground.",
    ],
  };

  // Analyze user input and generate appropriate response
  generateResponse(userMessage, conversationHistory = [], userMoodData = null) {
    const message = userMessage.toLowerCase();
    
    // Update conversation context
    this.conversationContext.push(userMessage);
    
    // Detect user's emotional state and needs
    const emotionalState = this.detectEmotionalState(message);
    const needsTechnique = this.detectTechniqueRequest(message);
    const isCheckingProgress = this.isProgressCheck(message);
    
    // Generate contextual response
    if (this.isCrisisDetected(message)) {
      return this.provideCrisisSupport();
    } else if (needsTechnique) {
      return this.provideTechnique(needsTechnique);
    } else if (isCheckingProgress && userMoodData) {
      return this.provideMoodInsight(userMoodData);
    } else if (emotionalState) {
      return this.provideEmotionalSupport(emotionalState);
    } else if (this.isGreeting(message)) {
      return this.getRandomResponse('greetings');
    } else if (this.isAppreciationOrGratitude(message)) {
      return this.respondToGratitude();
    } else {
      return this.provideGeneralSupport(message);
    }
  }

  // Check if user is asking about their progress
  isProgressCheck(message) {
    const progressWords = ['progress', 'improvement', 'better', 'worse', 'how am i doing', 'tracking', 'mood history'];
    return progressWords.some(word => message.includes(word));
  }

  // Check for appreciation or gratitude
  isAppreciationOrGratitude(message) {
    const gratitudeWords = ['thank you', 'thanks', 'grateful', 'appreciate', 'helpful', 'better now'];
    return gratitudeWords.some(word => message.includes(word));
  }

  // Provide insights based on user's mood data
  provideMoodInsight(moodData) {
    if (!moodData || moodData.length === 0) {
      return "I don't have enough data about your recent moods yet, but every day is a new opportunity for growth. How are you feeling right now?";
    }

    const moodCounts = {};
    moodData.forEach(mood => {
      const emotion = mood.emotionName;
      moodCounts[emotion] = (moodCounts[emotion] || 0) + 1;
    });

    const dominantMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b);
    
    const insights = {
      Happy: "I've noticed you've been experiencing more positive emotions recently! 🌟 This is wonderful - you're building emotional resilience. Keep nurturing what brings you joy.",
      Sad: "I see you've been going through some difficult emotions lately. 💙 Remember, sadness is a natural part of healing. You're showing courage by acknowledging these feelings.",
      Angry: "I notice you've been experiencing some intense emotions. 🌿 Anger often signals that something important to you needs attention. Have you found healthy ways to express these feelings?",
      Neutral: "You've been in a steady, neutral space recently. 🌸 Sometimes this balanced state is exactly what we need for reflection and growth.",
      Okay: "You've been maintaining a stable emotional state lately. 🌱 This consistency shows inner strength. How does this feel for you?"
    };

    return insights[dominantMood] || "I can see you're on a unique emotional journey. Every feeling you experience is valid and part of your growth. What would you like to explore about your recent experiences?";
  }

  // Respond to gratitude and appreciation
  respondToGratitude() {
    const gratitudeResponses = [
      "Your gratitude fills my heart! 💙 It takes wisdom to appreciate support - that's a beautiful quality you possess.",
      "Thank you for sharing that with me. Gratitude is one of the most healing emotions. You're practicing something truly powerful. ✨",
      "I'm honored to be part of your wellness journey. Your openness to growth and healing inspires me. 🌸",
      "Your appreciation means so much. Remember, you're doing the real work of healing - I'm just here to support you. 🌿",
    ];

    return gratitudeResponses[Math.floor(Math.random() * gratitudeResponses.length)];
  }

  // Detect emotional state from user input
  detectEmotionalState(message) {
    const stressWords = ['stress', 'stressed', 'overwhelmed', 'pressure', 'busy', 'hectic', 'rushed'];
    const anxietyWords = ['anxious', 'anxiety', 'worried', 'nervous', 'panic', 'fear', 'scared'];
    const sadWords = ['sad', 'depressed', 'down', 'low', 'upset', 'crying', 'hurt', 'heartbroken'];
    const happyWords = ['happy', 'good', 'great', 'amazing', 'wonderful', 'excited', 'joy', 'fantastic'];
    const overwhelmWords = ['overwhelmed', 'too much', 'can\'t cope', 'drowning', 'exhausted'];

    if (stressWords.some(word => message.includes(word))) return 'stress';
    if (anxietyWords.some(word => message.includes(word))) return 'anxiety';
    if (sadWords.some(word => message.includes(word))) return 'sadness';
    if (happyWords.some(word => message.includes(word))) return 'happiness';
    if (overwhelmWords.some(word => message.includes(word))) return 'overwhelm';

    return null;
  }

  // Detect if user is asking for a specific technique
  detectTechniqueRequest(message) {
    if (message.includes('breathing') || message.includes('breath')) return 'breathing';
    if (message.includes('grounding') || message.includes('anchor')) return 'grounding';
    if (message.includes('journal') || message.includes('write')) return 'journaling';
    if (message.includes('exercise') || message.includes('movement') || message.includes('stretch')) return 'movement';
    return null;
  }

  // Check for crisis indicators
  isCrisisDetected(message) {
    const crisisWords = ['suicide', 'kill myself', 'end it all', 'no point', 'hurt myself', 'self harm'];
    return crisisWords.some(word => message.includes(word));
  }

  // Check for greetings
  isGreeting(message) {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you'];
    return greetings.some(greeting => message.includes(greeting));
  }

  // Provide emotional support based on state
  provideEmotionalSupport(state) {
    const responses = this.wellnessResponses[state];
    const response = this.getRandomResponse(state);
    
    // Add a technique suggestion
    const technique = this.getRandomTechnique();
    return `${response}\n\n💙 Try this: ${technique}`;
  }

  // Provide a wellness technique
  provideTechnique(techniqueType) {
    const techniques = this.techniques[techniqueType];
    const technique = techniques[Math.floor(Math.random() * techniques.length)];
    
    return `Here's a ${techniqueType} technique for you:\n\n🌟 ${technique}\n\nTake your time with this. Remember, healing happens in small, gentle steps.`;
  }

  // Crisis support response
  provideCrisisSupport() {
    return `I'm concerned about you, and I want you to know that you matter. Your life has value, and there are people who can help you through this difficult time.

🆘 **Please reach out for immediate support:**
• Crisis Text Line: Text HOME to 741741
• National Suicide Prevention Lifeline: 988
• Or call emergency services: 911

You don't have to face this alone. Professional counselors are trained to help with exactly what you're experiencing.

💙 In this moment: You are not alone. This pain is temporary. Help is available.`;
  }

  // General supportive response
  provideGeneralSupport(message) {
    const supportiveResponses = [
      "I hear you. Your feelings are valid, and I'm here to support you on your wellness journey.",
      "Thank you for sharing that with me. What you're experiencing matters, and so do you.",
      "It takes courage to reach out. What would feel most helpful for you right now?",
      "Every step toward self-care, no matter how small, is meaningful. How can I support you today?",
      "Your wellness journey is unique to you. What feels most important to focus on right now?",
    ];

    const response = supportiveResponses[Math.floor(Math.random() * supportiveResponses.length)];
    
    // Add a gentle technique
    const technique = this.getRandomTechnique();
    return `${response}\n\n🌱 Gentle reminder: ${technique}`;
  }

  // Get random response from category
  getRandomResponse(category) {
    const responses = this.wellnessResponses[category];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Get random wellness technique
  getRandomTechnique() {
    const allTechniques = Object.values(this.techniques).flat();
    return allTechniques[Math.floor(Math.random() * allTechniques.length)];
  }

  // Check if user needs professional help
  needsProfessionalHelp(message) {
    const professionalHelpIndicators = [
      'therapy', 'therapist', 'counselor', 'medication', 'doctor',
      'severe', 'can\'t function', 'can\'t sleep for days', 'not eating'
    ];

    return professionalHelpIndicators.some(indicator => 
      message.toLowerCase().includes(indicator)
    );
  }

  // Get wellness tip of the day
  getDailyWellnessTip() {
    const tips = [
      "🌅 Start your day with three deep breaths and one thing you're grateful for.",
      "💧 Stay hydrated! Your brain is 73% water and needs proper hydration to function well.",
      "🚶‍♀️ A 10-minute walk can boost your mood for up to 2 hours.",
      "📱 Take regular breaks from screens. Your eyes and mind will thank you.",
      "🛌 Quality sleep is not a luxury - it's essential for mental health.",
      "🌿 Spend time in nature, even if it's just looking at a plant or the sky.",
      "💝 Practice self-compassion. Treat yourself like you would a good friend.",
      "🎨 Like Kintsugi pottery, your experiences - even difficult ones - add beauty to who you are.",
      "🌸 Progress isn't always linear. Some days you rest, some days you grow - both are valuable.",
      "💙 Your feelings are temporary visitors - acknowledge them, but remember they don't define you.",
    ];

    return tips[Math.floor(Math.random() * tips.length)];
  }

  // Get encouraging affirmations
  getAffirmation() {
    const affirmations = [
      "You are worthy of love and kindness, especially from yourself.",
      "Your journey is unique and valuable, just like you are.",
      "Every small step forward is a victory worth celebrating.",
      "You have survived 100% of your difficult days so far - you're stronger than you know.",
      "Like the Japanese art of Kintsugi, your healing makes you more beautiful, not less.",
      "Your feelings are valid, your experiences matter, and you deserve support.",
      "You don't have to be perfect to be worthy of love and respect.",
      "Growth happens in spirals, not straight lines - and that's perfectly okay.",
    ];

    return affirmations[Math.floor(Math.random() * affirmations.length)];
  }

  // Provide Kintsugi philosophy integration
  getKintsugiWisdom() {
    const wisdom = [
      "🏺 In Kintsugi, broken pottery is mended with gold, making it more beautiful than before. Your healing journey does the same for you.",
      "✨ Kintsugi teaches us that scars are not something to hide, but golden veins that make us unique and strong.",
      "🌟 Like Kintsugi art, your struggles become part of your beauty - they don't diminish you, they distinguish you.",
      "💛 The gold in Kintsugi pottery highlights the breaks instead of hiding them. Your growth highlights your resilience.",
      "🎨 Kintsugi reminds us: there is beauty in being broken and strength in the healing process.",
    ];

    return wisdom[Math.floor(Math.random() * wisdom.length)];
  }

  // Enhanced general support with Kintsugi philosophy
  provideGeneralSupport(message) {
    const includeKintsugiWisdom = Math.random() < 0.3; // 30% chance to include Kintsugi wisdom
    
    const supportiveResponses = [
      "I hear you. Your feelings are valid, and I'm here to support you on your wellness journey.",
      "Thank you for sharing that with me. What you're experiencing matters, and so do you.",
      "It takes courage to reach out. What would feel most helpful for you right now?",
      "Every step toward self-care, no matter how small, is meaningful. How can I support you today?",
      "Your wellness journey is unique to you. What feels most important to focus on right now?",
      "I'm honored that you're sharing this with me. Your trust means everything.",
    ];

    const response = supportiveResponses[Math.floor(Math.random() * supportiveResponses.length)];
    
    if (includeKintsugiWisdom) {
      const wisdom = this.getKintsugiWisdom();
      return `${response}\n\n${wisdom}`;
    } else {
      // Add a gentle technique
      const technique = this.getRandomTechnique();
      return `${response}\n\n🌱 Gentle reminder: ${technique}`;
    }
  }
}