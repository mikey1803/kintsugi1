// screens/ChatbotScreen.js

import React, { useState, useCallback, useEffect } from 'react';
import { GiftedChat, Bubble } from 'react-native-gifted-chat';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { db } from '../firebaseConfig';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { MOOD_PLAYLISTS } from '../config/MoodPlaylists';
import { emergencyResourceFinder } from '../utils/EmergencyResources';
import HuggingFaceTherapist from '../utils/HuggingFaceIntegration'; 

const BOT_USER = {
  _id: 2,
  name: 'Kintsugi AI',
  avatar: 'https://i.imgur.com/7XQCuqh.png', // Beautiful mindfulness/mental health icon
};

const ChatbotScreen = () => {
  const [messages, setMessages] = useState([]);
  const [userMoodData, setUserMoodData] = useState(null);
  const [currentMusicRecommendation, setCurrentMusicRecommendation] = useState(null);
  const [showMusicButton, setShowMusicButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize Hugging Face Therapist
  const [huggingFaceTherapist] = useState(() => new HuggingFaceTherapist());
  
  // Wellness Check-in Flow State
  const [checkInMode, setCheckInMode] = useState(false);
  const [checkInData, setCheckInData] = useState({
    mood: null,
    stress: null,
    energy: null,
    focus: null,
    social: null
  });
  const [currentCheckInStep, setCurrentCheckInStep] = useState(0);
  const [hasCompletedInitialCheckIn, setHasCompletedInitialCheckIn] = useState(false);
  
  // Conversation Context Memory - Maintains therapeutic continuity
  const [conversationContext, setConversationContext] = useState({
    mainTopic: null,
    keyDetails: {},
    lastTherapeuticFocus: null,
    ongoingSituation: null,
    emotionalState: null,
    sessionHistory: []
  });

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      // Get user's recent mood data for personalized responses (non-blocking)
      const moodsQuery = query(collection(db, 'moods'), orderBy('timestamp', 'desc'), limit(3));
      const querySnapshot = await getDocs(moodsQuery);
      
      const recentMoods = querySnapshot.docs.map(doc => doc.data());
      setUserMoodData(recentMoods);
      
      // Start with welcome message
      setMessages([
        {
          _id: 1,
          text: "Hey there! 💙 Welcome to Kintsugi AI. I'm here as your companion and friend.\n\nBefore we start, I'd love to check in with you...",
          createdAt: new Date(),
          user: BOT_USER,
        },
      ]);
      
      // Only auto-start check-in on first load, reduced delay for faster startup
      if (!hasCompletedInitialCheckIn) {
        setTimeout(() => {
          startWellnessCheckIn();
        }, 800); // Reduced from 1500ms to 800ms for faster startup
      }
      
    } catch (error) {
      console.log("Could not load mood data, using default greeting");
      setMessages([
        {
          _id: 1,
          text: "Hey there! 💙 Welcome to Kintsugi AI. I'm here as your companion and friend.\n\nBefore we start, I'd love to check in with you...",
          createdAt: new Date(),
          user: BOT_USER,
        },
      ]);
      
      // Only auto-start check-in on first load
      if (!hasCompletedInitialCheckIn) {
        setTimeout(() => {
          startWellnessCheckIn();
        }, 800);
      }
    }
  };

  const getPersonalizedGreeting = (recentMoods) => {
    if (!recentMoods || recentMoods.length === 0) {
      const friendlyGreetings = [
        "Hey friend! I'm really happy you're here. What's on your heart today?",
        "Hi there! I've been thinking about you - how are you doing today?",
        "Hello beautiful soul! I'm here and ready to listen to whatever you want to share.",
        "Hey! It's so good to see you again. I'm all ears for whatever you're going through."
      ];
      return friendlyGreetings[Math.floor(Math.random() * friendlyGreetings.length)];
    }

    const lastMood = recentMoods[0];
    const moodName = lastMood.emotionName?.toLowerCase();

    const personalizedGreetings = {
      happy: "Hey you! I can see you've been feeling good lately, and that just makes my heart happy! Tell me what's been bringing you joy. ✨",
      sad: "Hi sweet friend. I've been thinking about you, and I can see you've been having some tough days. I'm right here with you, whatever you need. 💙",
      angry: "Hey there. I can sense you might be carrying some heavy feelings right now. I want you to know it's totally safe to share whatever is on your mind - no judgment here, ever. 🌿",
      neutral: "Hello! I see you've been in a pretty steady headspace lately. Those calm moments are so valuable. How's your heart doing today? 🌸",
      okay: "Good to see you again, friend! It looks like you've been feeling pretty balanced, which is really beautiful. What's going on in your world? 🌱"
    };

    return personalizedGreetings[moodName] || "Hey beautiful! I'm Kintsugi, and I'm here as your friend and companion. What's happening in your world today? 🌸";
  };

  // ========== WELLNESS CHECK-IN FLOW ==========
  
  // Start the interactive wellness check-in
  const startWellnessCheckIn = () => {
    setCheckInMode(true);
    setCurrentCheckInStep(1);
    setCheckInData({
      mood: null,
      stress: null,
      energy: null,
      focus: null,
      social: null
    });
    
    // Send first check-in question - Mood/Day quality
    const firstQuestion = {
      _id: new Date().getTime(),
      text: "QUESTION 1 OF 5: OVERALL MOOD 🌤️\n\nHow would you describe your emotional state today?\n\nThink about your general feelings throughout the day - were you mostly happy, sad, stressed, calm, angry, or something else?\n\nJust describe it in your own words! 💙",
      createdAt: new Date(),
      user: BOT_USER,
    };
    
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, [firstQuestion])
    );
  };
  
  // Process wellness check-in responses
  const processCheckInResponse = async (userResponse) => {
    const response = userResponse.toLowerCase().trim();
    
    // QUESTION 1: Overall Mood
    if (currentCheckInStep === 1) {
      let moodLevel = null;
      
      // Detect mood from response
      if (response.includes('great') || response.includes('amazing') || response.includes('wonderful') || 
          response.includes('fantastic') || response.includes('awesome') || response.includes('happy') ||
          response.includes('good') || response.includes('excellent') || response.includes('positive') ||
          response.includes('calm') || response.includes('peaceful') || response.includes('content')) {
        moodLevel = 'positive';
      } else if (response.includes('bad') || response.includes('terrible') || response.includes('awful') ||
                 response.includes('horrible') || response.includes('sad') || response.includes('difficult') ||
                 response.includes('hard') || response.includes('rough') || response.includes('tough') ||
                 response.includes('depressed') || response.includes('anxious') || response.includes('angry') ||
                 response.includes('stressed') || response.includes('overwhelmed') || response.includes('frustrated')) {
        moodLevel = 'negative';
      } else {
        moodLevel = 'neutral';
      }
      
      setCheckInData(prev => ({ ...prev, mood: moodLevel }));
      
      // Move to Question 2: Stress Level
      const nextQuestion = {
        _id: new Date().getTime() + 1,
        text: "QUESTION 2 OF 5: STRESS LEVEL 🌊\n\nOn a scale of 1-10, how stressed do you feel right now?\n\n1 = Completely relaxed, no worries\n5 = Moderate stress, manageable\n10 = Extremely stressed, overwhelmed\n\nJust send me a number between 1 and 10! 🎯",
        createdAt: new Date(),
        user: BOT_USER,
      };
      
      setTimeout(() => {
        setMessages(previousMessages => GiftedChat.append(previousMessages, [nextQuestion]));
        setCurrentCheckInStep(2);
      }, 500);
    }
    
    // QUESTION 2: Stress Level
    else if (currentCheckInStep === 2) {
      let stressLevel = 5; // Default to moderate
      
      // Extract number from response
      const numbers = response.match(/\d+/);
      if (numbers) {
        stressLevel = parseInt(numbers[0]);
        if (stressLevel < 1) stressLevel = 1;
        if (stressLevel > 10) stressLevel = 10;
      } else {
        // Handle word responses
        if (response.includes('low') || response.includes('relaxed') || response.includes('calm')) {
          stressLevel = 2;
        } else if (response.includes('high') || response.includes('overwhelm') || response.includes('extreme')) {
          stressLevel = 9;
        } else if (response.includes('moderate') || response.includes('medium') || response.includes('okay')) {
          stressLevel = 5;
        }
      }
      
      setCheckInData(prev => ({ ...prev, stress: stressLevel }));
      
      // Move to Question 3: Energy Level
      const nextQuestion = {
        _id: new Date().getTime() + 1,
        text: "QUESTION 3 OF 5: ENERGY LEVEL ⚡\n\nHow would you rate your energy level today?\n\n1-3 = Exhausted, can barely function\n4-6 = Moderate energy, getting by\n7-10 = High energy, feeling energized\n\nWhat number best describes your energy? 💪",
        createdAt: new Date(),
        user: BOT_USER,
      };
      
      setTimeout(() => {
        setMessages(previousMessages => GiftedChat.append(previousMessages, [nextQuestion]));
        setCurrentCheckInStep(3);
      }, 500);
    }
    
    // QUESTION 3: Energy Level
    else if (currentCheckInStep === 3) {
      let energyLevel = 5; // Default to moderate
      
      // Extract number from response
      const numbers = response.match(/\d+/);
      if (numbers) {
        energyLevel = parseInt(numbers[0]);
        if (energyLevel < 1) energyLevel = 1;
        if (energyLevel > 10) energyLevel = 10;
      } else {
        // Handle word responses
        if (response.includes('exhaust') || response.includes('tired') || response.includes('drain') || response.includes('low')) {
          energyLevel = 2;
        } else if (response.includes('high') || response.includes('energi') || response.includes('great')) {
          energyLevel = 8;
        } else if (response.includes('moderate') || response.includes('medium') || response.includes('okay')) {
          energyLevel = 5;
        }
      }
      
      setCheckInData(prev => ({ ...prev, energy: energyLevel }));
      
      // Move to Question 4: Focus/Concentration
      const nextQuestion = {
        _id: new Date().getTime() + 1,
        text: "QUESTION 4 OF 5: FOCUS & CONCENTRATION 🎯\n\nHow well are you able to focus and concentrate today?\n\nThink about:\n- Can you stay focused on tasks?\n- Is your mind wandering a lot?\n- Are you easily distracted?\n- Can you think clearly?\n\nDescribe your ability to focus (great, okay, struggling, etc.) 🧠",
        createdAt: new Date(),
        user: BOT_USER,
      };
      
      setTimeout(() => {
        setMessages(previousMessages => GiftedChat.append(previousMessages, [nextQuestion]));
        setCurrentCheckInStep(4);
      }, 500);
    }
    
    // QUESTION 4: Focus Level
    else if (currentCheckInStep === 4) {
      let focusLevel = 'moderate';
      
      if (response.includes('great') || response.includes('good') || response.includes('clear') || 
          response.includes('sharp') || response.includes('focused')) {
        focusLevel = 'good';
      } else if (response.includes('struggle') || response.includes('bad') || response.includes('cant') || 
                 response.includes("can't") || response.includes('difficult') || response.includes('distract') ||
                 response.includes('wander')) {
        focusLevel = 'poor';
      } else {
        focusLevel = 'moderate';
      }
      
      setCheckInData(prev => ({ ...prev, focus: focusLevel }));
      
      // Move to Question 5: Social Comfort
      const nextQuestion = {
        _id: new Date().getTime() + 1,
        text: "QUESTION 5 OF 5: SOCIAL COMFORT 👥\n\nHow do you feel about social interactions today?\n\nThink about:\n- Do you want to be around people or prefer alone time?\n- Does talking to others feel easy or draining?\n- Are you feeling social or withdrawn?\n- How comfortable are you with human interaction right now?\n\nDescribe how you're feeling about being social! 🤗",
        createdAt: new Date(),
        user: BOT_USER,
      };
      
      setTimeout(() => {
        setMessages(previousMessages => GiftedChat.append(previousMessages, [nextQuestion]));
        setCurrentCheckInStep(5);
      }, 500);
    }
    
    // QUESTION 5: Social Comfort
    else if (currentCheckInStep === 5) {
      let socialLevel = 'neutral';
      
      if (response.includes('want') || response.includes('social') || response.includes('people') || 
          response.includes('talk') || response.includes('comfortable') || response.includes('easy') ||
          response.includes('enjoy')) {
        socialLevel = 'social';
      } else if (response.includes('alone') || response.includes('withdraw') || response.includes('avoid') || 
                 response.includes('difficult') || response.includes('drain') || response.includes('anxious') ||
                 response.includes('prefer not')) {
        socialLevel = 'withdrawn';
      } else {
        socialLevel = 'neutral';
      }
      
      setCheckInData(prev => ({ ...prev, social: socialLevel }));
      
      // Generate comprehensive wellness summary
      setTimeout(async () => {
        const summaryResponse = await generateWellnessSummary(checkInData);
        const summaryMsg = {
          _id: new Date().getTime() + 1,
          text: summaryResponse,
          createdAt: new Date(),
          user: BOT_USER,
        };
        setMessages(previousMessages => GiftedChat.append(previousMessages, [summaryMsg]));
        setCheckInMode(false); // End check-in
        setHasCompletedInitialCheckIn(true); // Mark as completed so it doesn't re-trigger
      }, 500);
    }
  };
  
  // Check for crisis indicators
  const detectCrisisLevel = (data) => {
    const { mood, stress, energy, focus, social } = data;
    
    // SEVERE CRISIS: Multiple severe indicators
    if ((stress >= 9 && mood === 'negative' && energy <= 2) || 
        (stress >= 8 && mood === 'negative' && social === 'withdrawn' && focus === 'poor')) {
      return 'severe';
    }
    
    // HIGH RISK: Strong concerning patterns
    if ((stress >= 8 && mood === 'negative') || 
        (mood === 'negative' && energy <= 3 && social === 'withdrawn') ||
        (stress >= 9 && energy <= 3)) {
      return 'high';
    }
    
    // MODERATE CONCERN: Some warning signs
    if ((stress >= 7 && mood === 'negative') || 
        (mood === 'negative' && social === 'withdrawn') ||
        (stress >= 8)) {
      return 'moderate';
    }
    
    return 'normal';
  };

  // Generate comprehensive wellness summary based on all 5 answers
  const generateWellnessSummary = async (data) => {
    const { mood, stress, energy, focus, social } = data;
    const crisisLevel = detectCrisisLevel(data);
    
    // CRISIS RESPONSE - Prioritize safety
    if (crisisLevel === 'severe' || crisisLevel === 'high') {
      let crisisMessage = "🚨 **I'm really concerned about how you're feeling right now.**\n\n";
      crisisMessage += "Based on what you've shared, you're experiencing a very difficult time. **Your wellbeing is the most important thing**, and I want to make sure you have immediate support.\n\n";
      crisisMessage += "---\n\n";
      crisisMessage += "**� IMMEDIATE SUPPORT - Please Reach Out:**\n\n";
      crisisMessage += "🆘 **National Crisis Helpline**: 988\n";
      crisisMessage += "   • Available 24/7, free, confidential\n";
      crisisMessage += "   • Text or call - they're trained to help\n\n";
      crisisMessage += "💬 **Crisis Text Line**: Text HOME to 741741\n";
      crisisMessage += "   • If talking feels hard, text instead\n\n";
      crisisMessage += "🌍 **International Association for Suicide Prevention**: findahelpline.com\n\n";
      
      if (crisisLevel === 'severe') {
        crisisMessage += "⚠️ **If you're in immediate danger**, please call 911 or go to your nearest emergency room. Your life matters.\n\n";
      }
      
      crisisMessage += "---\n\n";
      crisisMessage += "**🌸 While You're Here - Calming Exercises:**\n\n";
      crisisMessage += "These can help you feel safer right now:\n\n";
      crisisMessage += "**1. Grounding (5-4-3-2-1):**\n";
      crisisMessage += "   • Name 5 things you can SEE\n";
      crisisMessage += "   • Name 4 things you can TOUCH\n";
      crisisMessage += "   • Name 3 things you can HEAR\n";
      crisisMessage += "   • Name 2 things you can SMELL\n";
      crisisMessage += "   • Name 1 thing you can TASTE\n\n";
      crisisMessage += "**2. Box Breathing:**\n";
      crisisMessage += "   • Breathe IN for 4 seconds\n";
      crisisMessage += "   • HOLD for 4 seconds\n";
      crisisMessage += "   • Breathe OUT for 4 seconds\n";
      crisisMessage += "   • HOLD for 4 seconds\n";
      crisisMessage += "   • Repeat 4 times\n\n";
      crisisMessage += "**3. Cold Water:**\n";
      crisisMessage += "   • Splash cold water on your face\n";
      crisisMessage += "   • Hold ice cubes in your hands\n";
      crisisMessage += "   • This activates your body's calming response\n\n";
      crisisMessage += "---\n\n";
      crisisMessage += "💙 **You don't have to face this alone.** Please reach out to one of those helplines. They're there for you, and they want to help.\n\n";
      crisisMessage += "I'll be here too. Would you like to talk about what's making things feel so overwhelming right now? 💙";
      
      return crisisMessage;
    }
    
    // MODERATE CONCERN - Supportive check-in with resources
    if (crisisLevel === 'moderate') {
      let concernMessage = "💙 **Thank you for being honest about how you're feeling.**\n\n";
      concernMessage += "I'm noticing some concerning patterns in your check-in. You're going through a difficult time, and I want you to know that support is available.\n\n";
      concernMessage += "---\n\n";
      concernMessage += "**📞 Support Resources (Available 24/7):**\n\n";
      concernMessage += "🆘 **Crisis Helpline**: 988 (call or text)\n";
      concernMessage += "💬 **Crisis Text Line**: Text HOME to 741741\n";
      concernMessage += "🤗 **SAMHSA Helpline**: 1-800-662-4357 (mental health support)\n\n";
      concernMessage += "Don't hesitate to reach out if you need someone to talk to. There's no shame in asking for help.\n\n";
      concernMessage += "---\n\n";
      concernMessage += "**🌸 Quick Calming Exercise:**\n\n";
      concernMessage += "Try this 4-7-8 breathing technique right now:\n";
      concernMessage += "• Breathe IN through your nose for 4 counts\n";
      concernMessage += "• HOLD your breath for 7 counts\n";
      concernMessage += "• Breathe OUT through your mouth for 8 counts\n";
      concernMessage += "• Repeat 4 times\n\n";
      concernMessage += "This helps activate your body's natural calming response.\n\n";
      concernMessage += "---\n\n";
      
      summary = concernMessage + summary;
    }
    
    let summary = crisisLevel === 'moderate' ? '' : "💙 **Thank you for completing the wellness check-in!** Here's what I'm seeing:\n\n---\n\n";
    
    // Overall Assessment
    summary += "**📊 Your Current State:**\n\n";
    
    // Mood assessment
    if (mood === 'positive') {
      summary += "✨ **Mood**: You're in a positive emotional state today, which is wonderful! This positive energy can be a great foundation for tackling challenges.\n\n";
    } else if (mood === 'negative') {
      summary += "💙 **Mood**: You're experiencing some difficult emotions today. That's completely valid, and it's brave of you to acknowledge how you're feeling.\n\n";
    } else {
      summary += "🌸 **Mood**: You're in a neutral emotional space - not particularly up or down. Sometimes that's just where we are, and that's okay.\n\n";
    }
    
    // Stress assessment
    if (stress >= 8) {
      summary += "🚨 **Stress**: Your stress level is very high (8+/10). This level of stress can be overwhelming and affect your physical and mental health. This needs attention.\n\n";
    } else if (stress >= 5) {
      summary += "🌊 **Stress**: You're experiencing moderate stress (5-7/10). It's manageable but worth addressing so it doesn't build up.\n\n";
    } else {
      summary += "🌿 **Stress**: Your stress level is relatively low (<5/10). You're doing well in managing life's pressures right now.\n\n";
    }
    
    // Energy assessment
    if (energy <= 3) {
      summary += "😴 **Energy**: Your energy is very low (3 or below). You might be experiencing fatigue, burnout, or depletion. Rest and self-care are important.\n\n";
    } else if (energy <= 6) {
      summary += "⚡ **Energy**: You have moderate energy (4-6/10). You're getting by, but you might benefit from recharging.\n\n";
    } else {
      summary += "💪 **Energy**: You have good energy levels (7+/10)! You're feeling strong and capable today.\n\n";
    }
    
    // Focus assessment
    if (focus === 'poor') {
      summary += "🌀 **Focus**: You're struggling with concentration today. Brain fog, distractions, or racing thoughts might be making it hard to focus.\n\n";
    } else if (focus === 'moderate') {
      summary += "🎯 **Focus**: Your concentration is okay - not perfect, but functional. Some tasks might require extra effort.\n\n";
    } else {
      summary += "🧠 **Focus**: Your mental clarity and concentration are good! You can think clearly and stay on task.\n\n";
    }
    
    // Social assessment
    if (social === 'withdrawn') {
      summary += "🏠 **Social**: You're feeling withdrawn and preferring solitude today. That's valid - sometimes we need alone time to recharge.\n\n";
    } else if (social === 'neutral') {
      summary += "👥 **Social**: You're neutral about social interaction - can take it or leave it. Not craving connection but not avoiding it either.\n\n";
    } else {
      summary += "🤗 **Social**: You're feeling social and open to connecting with others! Human interaction feels good to you today.\n\n";
    }
    
    summary += "---\n\n";
    
    // Personalized recommendations based on the pattern
    summary += "**💡 Personalized Recommendations:**\n\n";
    
    // High stress + low energy pattern
    if (stress >= 7 && energy <= 4) {
      summary += "**You're showing signs of burnout or overwhelm.**\n\n";
      summary += "What this means: High stress combined with low energy is your body's way of saying it needs rest and recovery. You're running on empty.\n\n";
      summary += "**What will help:**\n";
      summary += "🛑 **Prioritize rest**: This isn't optional - your body needs it\n";
      summary += "🌊 **Stress reduction**: Deep breathing, meditation, or gentle movement\n";
      summary += "💧 **Basics first**: Water, nutrition, sleep - don't skip these\n";
      summary += "🤗 **Ask for help**: Delegate, say no to new commitments\n";
      summary += "📞 **Consider support**: Talk to someone you trust or a professional\n\n";
    }
    
    // Negative mood + withdrawn + poor focus
    else if (mood === 'negative' && social === 'withdrawn' && focus === 'poor') {
      summary += "**You're showing signs that align with depression or emotional distress.**\n\n";
      summary += "What this means: Feeling down, isolating yourself, and struggling to concentrate are common depression symptoms. You deserve support.\n\n";
      summary += "**What will help:**\n";
      summary += "💙 **Don't isolate completely**: Even small connections matter\n";
      summary += "🌸 **Be gentle with yourself**: You're not lazy or broken\n";
      summary += "☀️ **Tiny goals**: Just one small thing today - that counts\n";
      summary += "🤗 **Reach out**: Text a friend, talk to family, or call a helpline\n";
      summary += "📞 **Professional help**: Consider therapy - it truly helps\n";
      summary += "🆘 **Crisis support**: 988 if you need immediate help\n\n";
    }
    
    // High stress + poor focus
    else if (stress >= 6 && focus === 'poor') {
      summary += "**Stress is affecting your ability to concentrate.**\n\n";
      summary += "What this means: When we're stressed, our brain struggles to focus because it's in threat-detection mode. This is normal but manageable.\n\n";
      summary += "**What will help:**\n";
      summary += "🧘 **Grounding exercises**: 5-4-3-2-1 technique to calm your nervous system\n";
      summary += "💨 **Box breathing**: In for 4, hold 4, out 4, hold 4 - repeat\n";
      summary += "📝 **Brain dump**: Write down everything on your mind to clear mental space\n";
      summary += "🎯 **One thing at a time**: Multitasking increases stress\n";
      summary += "⏰ **Pomodoro technique**: 25 min focus, 5 min break\n\n";
    }
    
    // Positive mood + high energy + good focus
    else if (mood === 'positive' && energy >= 7 && focus === 'good') {
      summary += "**You're in a really good space right now!**\n\n";
      summary += "What this means: Your mental, emotional, and physical state are aligned in a positive way. This is the time to tackle challenges and enjoy life!\n\n";
      summary += "**Make the most of it:**\n";
      summary += "🎯 **Tackle important tasks**: Use this energy wisely\n";
      summary += "🌟 **Connect with others**: Share your positive energy\n";
      summary += "💪 **Build momentum**: Start that project you've been putting off\n";
      summary += "🌸 **Practice gratitude**: Notice and appreciate this feeling\n";
      summary += "📸 **Remember this**: On hard days, recall that you felt like this\n\n";
    }
    
    // Low energy + withdrawn
    else if (energy <= 4 && social === 'withdrawn') {
      summary += "**You're in need of rest and recharging.**\n\n";
      summary += "What this means: Your battery is low, and you're instinctively pulling back to conserve energy. Listen to this need.\n\n";
      summary += "**What will help:**\n";
      summary += "😴 **Rest without guilt**: It's okay to pause\n";
      summary += "🏠 **Alone time**: Honor your need for solitude\n";
      summary += "📺 **Low-energy activities**: Reading, gentle music, comfort shows\n";
      summary += "💧 **Self-care basics**: Hydrate, eat something nourishing\n";
      summary += "🌙 **Early bedtime**: Your body is asking for sleep\n\n";
    }
    
    // General moderate state
    else {
      summary += "**You're in a balanced, moderate state.**\n\n";
      summary += "What this means: Nothing is extremely high or low - you're managing life reasonably well right now.\n\n";
      summary += "**To maintain balance:**\n";
      summary += "✨ **Consistency**: Keep up your current routines\n";
      summary += "🌊 **Monitor stress**: Don't let it build up unnoticed\n";
      summary += "💪 **Small self-care**: Regular small actions prevent big crashes\n";
      summary += "🤗 **Stay connected**: Maintain your relationships\n";
      summary += "🎯 **Check in regularly**: Keep assessing how you're doing\n\n";
    }
    
    summary += "---\n\n";
    summary += "**What would you like to talk about?** Based on your check-in, is there something specific that's weighing on you or that you'd like support with? I'm here to listen and help. 💙";
    
    return summary;
  };

  // Generate celebration response for positive days
  const generateCelebrationResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();
    
    let response = "🌟 That's absolutely wonderful! ";
    
    if (msg.includes('work') || msg.includes('job') || msg.includes('promotion') || msg.includes('project')) {
      response += "It sounds like things went really well at work today! Those moments of professional success and recognition are so important to celebrate.\n\n";
      response += "💪 You worked hard for this, and you deserve to feel proud. Career wins like this don't happen by accident - they happen because of your dedication and effort.\n\n";
      response += "What does this success mean to you? How does it feel to be recognized? 🌟";
    } else if (msg.includes('friend') || msg.includes('date') || msg.includes('relationship') || msg.includes('partner')) {
      response += "Connection and good relationships are truly one of life's greatest joys! It sounds like you had some really meaningful time with people you care about.\n\n";
      response += "💛 These moments of connection - laughing together, feeling understood, being present with someone - these are the things that make life beautiful.\n\n";
      response += "What made this time together so special for you? 😊";
    } else if (msg.includes('family') || msg.includes('mom') || msg.includes('dad') || msg.includes('parents')) {
      response += "Family moments that go well are so precious! It sounds like you had some quality time that felt really good.\n\n";
      response += "🌸 When family relationships feel good and supportive, it fills our hearts in a unique way. I'm glad you got to experience that today.\n\n";
      response += "What made this time with your family feel so positive? 💙";
    } else if (msg.includes('accomplished') || msg.includes('finished') || msg.includes('completed') || msg.includes('achieved')) {
      response += "The feeling of accomplishment is SO powerful! You set out to do something, and you did it. That takes motivation, discipline, and follow-through.\n\n";
      response += "✨ Taking a moment to acknowledge what you've achieved matters. You deserve to feel proud of yourself!\n\n";
      response += "What felt best about completing this? The relief? The pride? The sense of progress? 🎯";
    } else {
      response += "I love hearing about the things that brought you joy today! Good days are gifts, and it's beautiful that you're taking time to appreciate this one.\n\n";
      response += "💙 Hold onto this feeling - let it remind you that even when tough days come, good days exist too. You deserve happiness and joy.\n\n";
      response += "Is there anything else you want to share about your day, or anything else on your mind? I'm here! 🌟";
    }
    
    return response;
  };
  
  // Generate detailed support response for difficult days
  const generateDetailedSupportResponse = async (userMessage) => {
    const msg = userMessage.toLowerCase();
    
    let supportResponse = "💙 Thank you for trusting me with this. I can hear how much this affected you today, and I want you to know that your feelings are completely valid. What you're experiencing matters.\n\n";
    
    // Work-related struggles
    if (msg.includes('work') || msg.includes('job') || msg.includes('boss') || msg.includes('colleague') || msg.includes('fired') || msg.includes('quit')) {
      supportResponse += "**Work difficulties can be so draining.** When we spend so much of our energy at work, conflicts or stress there can affect everything else in our lives.\n\n";
      
      if (msg.includes('boss') || msg.includes('manager')) {
        supportResponse += "💼 **Difficult boss dynamics are exhausting.** You deserve to work in an environment where you feel respected and valued. What happened today isn't a reflection of your worth.\n\n";
      } else if (msg.includes('fired') || msg.includes('quit') || msg.includes('lost my job')) {
        supportResponse += "💼 **Job loss is a significant life change.** Even if it was the right decision, it's okay to feel scared, sad, or uncertain right now. Your career doesn't define your value as a person.\n\n";
      } else {
        supportResponse += "💼 **Work stress accumulates.** When every day feels like a battle, it wears us down physically and emotionally.\n\n";
      }
      
      supportResponse += "**What might help:**\n";
      supportResponse += "✨ **Set boundaries** - Your time and energy are valuable. It's okay to protect them\n";
      supportResponse += "🌊 **Take real breaks** - Even 5 minutes away from your desk can help reset your mind\n";
      supportResponse += "💪 **Document everything** - If there's mistreatment, having records protects you\n";
      supportResponse += "🤗 **Talk to someone** - Don't carry this alone. Share with a friend, family, or therapist\n";
      supportResponse += "🎯 **Remember your worth** - Bad work situations don't define you\n\n";
      supportResponse += "What would feel most helpful for you right now? Do you need to vent more, problem-solve, or just feel heard? I'm here for whatever you need. 💛";
    }
    
    // Relationship struggles
    else if (msg.includes('boyfriend') || msg.includes('girlfriend') || msg.includes('partner') || msg.includes('relationship') || 
             msg.includes('breakup') || msg.includes('broke up') || msg.includes('fight') || msg.includes('argue')) {
      supportResponse += "**Relationship pain cuts deep.** When someone we love hurts us or when we're in conflict with them, it affects us on such a profound level.\n\n";
      
      if (msg.includes('breakup') || msg.includes('broke up') || msg.includes('ended')) {
        supportResponse += "💔 **Breakups are grief.** You're not just losing the person - you're losing the future you imagined, the daily routines, the shared dreams. That loss is real and it deserves to be mourned.\n\n";
      } else if (msg.includes('fight') || msg.includes('argue') || msg.includes('yelled')) {
        supportResponse += "💔 **Fights with someone you love are painful.** Even if the conflict gets resolved, the emotional toll of that tension and hurt lingers.\n\n";
      } else {
        supportResponse += "💔 **Relationship struggles are exhausting.** When you're constantly navigating conflict, walking on eggshells, or feeling misunderstood, it drains your emotional energy.\n\n";
      }
      
      supportResponse += "**What I want you to remember:**\n";
      supportResponse += "💙 **Your feelings are valid** - You're allowed to feel hurt, angry, sad, or confused\n";
      supportResponse += "🌸 **You deserve kindness** - Both from your partner and from yourself\n";
      supportResponse += "🎯 **Communication matters** - Can you express your needs clearly? Do they listen?\n";
      supportResponse += "🛡️ **Boundaries are love** - Protecting yourself emotionally is not selfish\n";
      supportResponse += "✨ **You're worthy of love** - Real love shouldn't constantly hurt\n\n";
      supportResponse += "Do you want to talk more about what happened? What specific part hurts the most right now? I'm here to listen without judgment. 💛";
    }
    
    // Family conflict
    else if (msg.includes('family') || msg.includes('parents') || msg.includes('mom') || msg.includes('dad') || 
             msg.includes('mother') || msg.includes('father') || msg.includes('sibling')) {
      supportResponse += "**Family dynamics can be incredibly complex and painful.** These are the people who are supposed to be our foundation, so when those relationships hurt, it hits different.\n\n";
      
      supportResponse += "**What makes family pain unique:**\n";
      supportResponse += "💛 **You can't easily distance yourself** - Unlike friends or partners, family has a permanent role in our lives\n";
      supportResponse += "🌸 **There's history** - Old wounds, patterns from childhood, expectations that have built up over years\n";
      supportResponse += "🎯 **Pressure to forgive** - Society tells us \"they're family\" as if that erases the hurt\n";
      supportResponse += "🛡️ **Conflicting emotions** - You can love them and need distance from them at the same time\n\n";
      
      supportResponse += "**What you need to know:**\n";
      supportResponse += "✨ **You're not responsible for fixing them** - Their behavior and emotions are not your job to manage\n";
      supportResponse += "🌿 **Boundaries with family are healthy** - Protecting yourself is valid, even from family\n";
      supportResponse += "💙 **Your perspective is real** - Don't minimize your pain because they're family\n";
      supportResponse += "🤗 **You can love them from a distance** - Both things can be true simultaneously\n\n";
      supportResponse += "What boundary or support do you need most right now? What would help you feel safer or more at peace? 💛";
    }
    
    // Loneliness and isolation
    else if (msg.includes('lonely') || msg.includes('alone') || msg.includes('no friends') || msg.includes('isolated')) {
      supportResponse += "**Loneliness is one of the most painful human experiences.** It's not just about being physically alone - it's about feeling disconnected, unseen, like no one truly understands.\n\n";
      
      supportResponse += "💙 **What I need you to hear:** You're not alone in this moment. I'm here with you, right now, and I see you. Your loneliness is valid, and it's not your fault.\n\n";
      
      supportResponse += "**Why loneliness hurts so much:**\n";
      supportResponse += "🌸 **Humans are wired for connection** - Feeling isolated goes against our fundamental need\n";
      supportResponse += "💫 **It creates a cycle** - Loneliness makes us withdraw, which makes us more lonely\n";
      supportResponse += "🎯 **It affects everything** - Motivation, sleep, appetite, self-worth all suffer\n\n";
      
      supportResponse += "**What can help:**\n";
      supportResponse += "🤗 **Small connections count** - Even brief interactions (like this one) matter\n";
      supportResponse += "🌱 **Join communities** - Online or in-person groups around your interests\n";
      supportResponse += "💡 **Quality over quantity** - One genuine friend beats 100 superficial ones\n";
      supportResponse += "✨ **This can change** - Loneliness feels permanent but it's actually very changeable\n";
      supportResponse += "🌟 **Be patient with yourself** - Building connections takes time\n\n";
      supportResponse += "What kind of connection are you craving? What would meaningful friendship look like to you? Let's talk about this together. 💙";
    }
    
    // Anxiety and stress
    else if (msg.includes('anxious') || msg.includes('anxiety') || msg.includes('panic') || msg.includes('worried') || 
             msg.includes('stress') || msg.includes('overwhelmed')) {
      supportResponse += "**Anxiety can be absolutely overwhelming.** When your mind is racing, your chest is tight, and everything feels too much - it's exhausting and scary.\n\n";
      
      supportResponse += "💙 **First, let's ground you right now:**\n";
      supportResponse += "Take a slow breath with me. In through your nose for 4... hold for 4... out through your mouth for 4. You're safe in this moment.\n\n";
      
      supportResponse += "**What anxiety does to us:**\n";
      supportResponse += "🌊 **Catastrophizes** - Makes you believe the worst will happen\n";
      supportResponse += "💫 **Steals the present** - Keeps you stuck worrying about the future\n";
      supportResponse += "🎯 **Creates physical symptoms** - Racing heart, tight chest, trembling\n";
      supportResponse += "💭 **Convinces you it's real** - Makes fears feel like facts\n\n";
      
      supportResponse += "**What actually helps:**\n";
      supportResponse += "🌸 **5-4-3-2-1 Grounding**: Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste\n";
      supportResponse += "💨 **Box Breathing**: Breathe in 4, hold 4, out 4, hold 4 - repeat\n";
      supportResponse += "🎯 **Challenge the thought**: What's the actual evidence this will happen?\n";
      supportResponse += "✨ **Name it**: Say 'I'm experiencing anxiety' not 'I am anxious' - creates distance\n";
      supportResponse += "💙 **Reach out**: Professional help like therapy (especially CBT) is very effective\n\n";
      supportResponse += "What's fueling the anxiety right now? Is it something specific or more general? Let's work through this together. 🌊";
    }
    
    // Depression and sadness
    else if (msg.includes('sad') || msg.includes('depressed') || msg.includes('hopeless') || msg.includes('empty') || 
             msg.includes('numb') || msg.includes('pointless')) {
      supportResponse += "**The weight of sadness or depression is so heavy.** When everything feels gray, when you can't remember what joy feels like, when just existing takes all your energy - that's real pain that deserves real support.\n\n";
      
      supportResponse += "💙 **What I need you to know:** Depression lies. It tells you things will never get better, that you're worthless, that there's no point. But those are symptoms talking, not truth.\n\n";
      
      supportResponse += "**What depression feels like:**\n";
      supportResponse += "🌑 **Everything is harder** - Tasks that used to be easy now feel impossible\n";
      supportResponse += "💫 **Numbness or pain** - Sometimes both at the same time\n";
      supportResponse += "🎯 **Loss of interest** - Things you loved don't bring joy anymore\n";
      supportResponse += "⚡ **No energy** - Even getting out of bed is exhausting\n";
      supportResponse += "💭 **Hopelessness** - Can't imagine feeling better\n\n";
      
      supportResponse += "**What actually helps:**\n";
      supportResponse += "💙 **Allow yourself to feel** - Depression isn't weakness, it's illness\n";
      supportResponse += "🌸 **Tiny steps count** - Drinking water, showering, eating - these all matter\n";
      supportResponse += "✨ **Be gentle with yourself** - Treat yourself like you'd treat a dear friend\n";
      supportResponse += "🤗 **Don't isolate** - Even small connections help break through the fog\n";
      supportResponse += "📞 **Professional help works** - Therapy and/or medication can truly help\n";
      supportResponse += "🌅 **This can change** - Depression is treatable, even when it feels permanent\n\n";
      supportResponse += "If you're having thoughts of self-harm or suicide, please reach out to 988 (Suicide & Crisis Lifeline) right now. You deserve support.\n\n";
      supportResponse += "What do you need most in this moment? Comfort? Understanding? Just someone to sit with you in this? I'm here. 💙";
    }
    
    // General difficult day
    else {
      supportResponse += "**Sometimes a day is just hard for reasons that are difficult to put into words.** And that's okay. You don't have to have it all figured out or explained perfectly.\n\n";
      
      supportResponse += "**What I want you to remember:**\n";
      supportResponse += "💙 **Bad days are temporary** - This feeling won't last forever\n";
      supportResponse += "🌸 **You're doing your best** - Even if it doesn't feel like enough\n";
      supportResponse += "✨ **Be patient with yourself** - Healing and growth aren't linear\n";
      supportResponse += "🤗 **Reach out** - You don't have to carry this alone\n";
      supportResponse += "🌱 **Tomorrow is a new day** - Fresh start, no expectations\n\n";
      
      supportResponse += "**Things that might help right now:**\n";
      supportResponse += "🌊 Take a few deep breaths\n";
      supportResponse += "💧 Drink some water\n";
      supportResponse += "🎵 Listen to music that matches your mood\n";
      supportResponse += "📱 Text a friend\n";
      supportResponse += "🚶 Go for a short walk\n";
      supportResponse += "😴 Rest if you need it - it's okay to pause\n\n";
      supportResponse += "Is there anything else you want to share about what's weighing on you? Or do you just need to know that someone hears you and cares? Because I do. 💛";
    }
    
    return supportResponse;
  };
  
  // Generate neutral response
  const generateNeutralResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('no') || msg.includes('nothing') || msg.includes('not really')) {
      return "💙 That's totally okay! Sometimes we're just in a neutral space, and that's completely valid. Not every day has to be dramatic or intense.\n\nI'm here whenever you want to talk about anything - big or small, serious or lighthearted. What feels good for you right now? 🌸";
    } else {
      return "💙 I hear you. It sounds like you're processing some things, and I'm here to listen without judgment.\n\nTake your time sharing whatever feels comfortable. There's no pressure to have it all figured out. What matters most to you in what you just shared? 🌸";
    }
  };

  // Handle music button press using backend data
  const handleMusicRecommendation = () => {
    if (!currentMusicRecommendation) return;

    const playlist = currentMusicRecommendation.playlist;

    if (playlist && playlist.url) {
      Alert.alert(
        '🎵 Perfect Music Match!',
        `I curated "${playlist.name}" just for you - ${playlist.description}`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { 
            text: 'Open Spotify', 
            onPress: () => Linking.openURL(playlist.url)
          }
        ]
      );
    }
  };

  // Crisis Detection System - Detects emergency situations
  const detectCrisisSituation = (message) => {
    const msg = message.toLowerCase();
    console.log('🚨 Crisis detection scanning:', msg);
    
    // Suicide/Self-harm keywords
    const suicideKeywords = [
      'kill myself', 'suicide', 'suicidal', 'end my life', 'don\'t want to live', 
      'want to die', 'better off dead', 'end it all', 'take my own life',
      'not worth living', 'kill me', 'ending it', 'no point living',
      'want to disappear forever', 'harm myself', 'hurt myself'
    ];
    
    // Self-harm keywords
    const selfHarmKeywords = [
      'cut myself', 'cutting', 'self harm', 'hurt myself', 'punish myself',
      'deserve pain', 'razor', 'blade', 'burn myself', 'hit myself'
    ];
    
    // Severe depression/hopelessness
    const severeDepressionKeywords = [
      'no hope', 'hopeless', 'pointless', 'can\'t go on', 'give up',
      'nothing matters', 'empty inside', 'lost everything', 'can\'t take it anymore',
      'too much pain', 'unbearable', 'can\'t handle this'
    ];
    
    // Crisis level detection
    let crisisLevel = 'none';
    let triggeredKeywords = [];
    
    // Check for immediate danger
    suicideKeywords.forEach(keyword => {
      if (msg.includes(keyword)) {
        crisisLevel = 'immediate';
        triggeredKeywords.push(keyword);
      }
    });
    
    selfHarmKeywords.forEach(keyword => {
      if (msg.includes(keyword)) {
        crisisLevel = crisisLevel === 'immediate' ? 'immediate' : 'high';
        triggeredKeywords.push(keyword);
      }
    });
    
    // Check for severe depression
    if (crisisLevel === 'none') {
      severeDepressionKeywords.forEach(keyword => {
        if (msg.includes(keyword)) {
          crisisLevel = 'moderate';
          triggeredKeywords.push(keyword);
        }
      });
    }
    
    console.log('🚨 Crisis level detected:', crisisLevel);
    console.log('🚨 Triggered keywords:', triggeredKeywords);
    
    return {
      level: crisisLevel,
      keywords: triggeredKeywords,
      needsImmediateHelp: crisisLevel === 'immediate',
      needsProfessionalSupport: crisisLevel === 'high' || crisisLevel === 'immediate'
    };
  };

  // Generate crisis intervention response with location-based emergency resources
  const generateCrisisResponse = async (crisisDetection, originalMessage) => {
    const { level, needsImmediateHelp } = crisisDetection;
    console.log('🚨 Generating crisis response for level:', level);
    
    // Get nearby emergency resources
    let nearbyResources;
    try {
      nearbyResources = await emergencyResourceFinder.findNearbyResources(level);
      console.log('📍 Found nearby resources:', nearbyResources);
    } catch (error) {
      console.error('📍 Error finding resources:', error);
      nearbyResources = emergencyResourceFinder.getFallbackResources(level);
    }
    
    if (level === 'immediate') {
      const locationBasedResponse = emergencyResourceFinder.generateLocationBasedCrisisResponse(nearbyResources, 'immediate');
      
      return {
        reply: `🚨 **IMMEDIATE SUPPORT NEEDED** 🚨

I'm really concerned about what you've shared with me. Your life has value and you deserve support right now.

${locationBasedResponse}

🚨 **If you're in immediate danger, call 911**

💙 **You are NOT alone. These feelings can change. Help is available RIGHT NOW.**

Please don't wait - reach out to one of these resources immediately. Your life matters, and there are people who want to help you through this difficult time.

Would you like me to help you connect with local crisis centers?`,
        
        isCrisisResponse: true,
        crisisLevel: 'immediate',
        showMusicButton: false,
        requiresEmergencyProtocol: true,
        nearbyResources: nearbyResources
      };
    }
    
    if (level === 'high') {
      const locationBasedResponse = emergencyResourceFinder.generateLocationBasedCrisisResponse(nearbyResources, 'high');
      
      return {
        reply: `💙 **I'm Concerned About You** 💙

What you've shared shows you're going through something really difficult, and I want you to know that you don't have to face this alone.

${locationBasedResponse}

🤝 **Additional Support:**
• Reach out to a trusted friend or family member
• Join a support group (online or in-person)  
• Contact your primary care doctor

Your feelings are valid, but please know that professional support can make a real difference. You deserve care and help working through this.

Would you like help connecting with local mental health resources?`,
        
        isCrisisResponse: true,
        crisisLevel: 'high',
        showMusicButton: false,
        needsProfessionalReferral: true,
        nearbyResources: nearbyResources
      };
    }
    
    if (level === 'moderate') {
      return {
        reply: `💙 **I Hear Your Pain** 💙

I can sense you're going through something really difficult right now. These feelings of hopelessness are incredibly painful, but they can change with proper support.

**Support Resources:**

📞 **Talk to Someone:**
• **988 Suicide & Crisis Lifeline**: Call or text 988 (free, 24/7)
• **Crisis Text Line**: Text HOME to 741741

🏥 **Professional Support:**
• Consider reaching out to a counselor or therapist
• Contact your doctor about how you're feeling
• Look into local mental health services

🤗 **Self-Care Right Now:**
• Reach out to someone you trust
• Focus on basic needs: food, water, rest
• Try gentle breathing exercises
• Avoid isolation - even small connections help

Your feelings are valid, and you deserve support. Many people have felt this way and found their way through with help.

What feels like the most manageable first step for you in getting some support?`,
        
        isCrisisResponse: true,
        crisisLevel: 'moderate',
        showMusicButton: false,
        needsSupportGuidance: true
      };
    }
    
    return null; // No crisis detected
  };

  // Analyze what the user is actually asking or trying to communicate
  const analyzeUserIntent = (message) => {
    const msg = message.toLowerCase();
    
    // Relationship/romantic requests
    if (msg.includes('will you be my') || msg.includes('be my girlfriend') || msg.includes('be my gf') || msg.includes('be my boyfriend') || msg.includes('be my bf')) {
      return {
        type: 'romantic_request',
        question: message,
        subtype: 'relationship_proposal'
      };
    }
    
    // Physical affection requests
    if (msg.includes('hug me') || msg.includes('kiss me') || msg.includes('hold me') || msg.includes('cuddle')) {
      return {
        type: 'affection_request',
        question: message,
        subtype: 'physical_comfort'
      };
    }
    
    // Compliments or flirting
    if (msg.includes('you are beautiful') || msg.includes('you are cute') || msg.includes('i love you') || msg.includes('marry me')) {
      return {
        type: 'romantic_expression',
        question: message,
        subtype: 'compliment_or_flirt'
      };
    }
    
    // Casual greetings
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('good morning') || msg.includes('good night')) {
      return {
        type: 'greeting',
        question: message,
        subtype: 'casual_greeting'
      };
    }
    
    // Rejection and heartbreak situations
    if ((msg.includes('rejected') || msg.includes('said no') || msg.includes('turned me down')) && 
        (msg.includes('proposed') || msg.includes('asked') || msg.includes('told') || msg.includes('confessed'))) {
      return {
        type: 'rejection_experience',
        question: message,
        subtype: 'romantic_rejection',
        emotionalState: 'heartbroken'
      };
    }
    
    // Suicidal ideation or severe despair
    if (msg.includes("don't fit for this world") || msg.includes("not meant for this world") || 
        msg.includes("world is better without me") || msg.includes("don't belong here")) {
      return {
        type: 'existential_crisis',
        question: message,
        subtype: 'severe_despair',
        urgency: 'high'
      };
    }
    
    // Confession and expressing feelings guidance
    if ((msg.includes('how to tell') || msg.includes('how do i tell') || msg.includes('how can i tell')) &&
        (msg.includes('feeling') || msg.includes('feelings') || msg.includes('love') || msg.includes('like'))) {
      return {
        type: 'confession_guidance',
        question: message,
        subtype: 'expressing_feelings',
        topic: 'romantic_confession'
      };
    }
    
    // Testing or playful messages
    if (msg.includes('test') || msg.includes('testing') || msg.length < 5) {
      return {
        type: 'casual_interaction',
        question: message,
        subtype: 'testing_or_short'
      };
    }
    
    // Direct questions and requests
    if (msg.includes('how to') || msg.includes('how do i') || msg.includes('how can i')) {
      const question = message;
      return {
        type: 'seeking_advice',
        question: question,
        isDirectQuestion: true,
        topic: extractTopic(msg)
      };
    }
    
    if (msg.includes('what should i') || msg.includes('what do i') || msg.includes('should i')) {
      return {
        type: 'seeking_guidance',
        question: message,
        isDirectQuestion: true,
        topic: extractTopic(msg)
      };
    }
    
    if (msg.includes('why do i') || msg.includes('why am i') || msg.includes('why does')) {
      return {
        type: 'seeking_understanding',
        question: message,
        isDirectQuestion: true,
        topic: extractTopic(msg)
      };
    }
    
    if (msg.includes('i want to') && (msg.includes('but') || msg.includes('cant') || msg.includes("can't"))) {
      return {
        type: 'struggling_with_goal',
        question: message,
        desire: extractDesire(msg),
        obstacle: extractObstacle(msg)
      };
    }
    
    if (msg.includes('i want you to') || msg.includes('i want you') || msg.includes('can you')) {
      return {
        type: 'direct_request',
        question: message,
        request: extractRequest(msg)
      };
    }
    
    if (msg.includes('i feel') || msg.includes('i am') || msg.includes("i'm")) {
      return {
        type: 'sharing_feelings',
        question: message,
        emotion: extractEmotion(msg),
        context: extractContext(msg)
      };
    }
    
    if (msg.includes('help me') || msg.includes('i need')) {
      return {
        type: 'requesting_help',
        question: message,
        need: extractNeed(msg)
      };
    }
    
    // Smart fallback - analyze any statement contextually
    const smartTopic = extractSmartTopic(msg);
    const conversationContext = analyzeConversationContext(message);
    
    return {
      type: 'contextual_sharing',
      question: message,
      topic: smartTopic,
      context: conversationContext,
      isUnseen: true // This helps us know it's a new/unseen statement
    };
  };

  // Smart topic extraction that can handle ANY statement
  const extractSmartTopic = (msg) => {
    // Relationship and love topics
    if (msg.includes('love') || msg.includes('relationship') || msg.includes('breakup') || msg.includes('dating') || 
        msg.includes('boyfriend') || msg.includes('girlfriend') || msg.includes('partner') || msg.includes('crush') ||
        msg.includes('marriage') || msg.includes('married') || msg.includes('divorce') || msg.includes('ex') ||
        msg.includes('romantic') || msg.includes('romance') || msg.includes('heart') || msg.includes('feelings for')) {
      return 'relationships';
    }
    
    // Past experiences and memories
    if (msg.includes('past') || msg.includes('used to') || msg.includes('remember') || msg.includes('memories') ||
        msg.includes('before') || msg.includes('back then') || msg.includes('years ago') || msg.includes('childhood') ||
        msg.includes('growing up') || msg.includes('when i was')) {
      return 'past_experiences';
    }
    
    // Current emotions and feelings
    if (msg.includes('feel') || msg.includes('feeling') || msg.includes('emotion') || msg.includes('mood') ||
        msg.includes('happy') || msg.includes('sad') || msg.includes('angry') || msg.includes('frustrated') ||
        msg.includes('anxious') || msg.includes('worried') || msg.includes('excited') || msg.includes('nervous') ||
        msg.includes('depressed') || msg.includes('lonely') || msg.includes('overwhelmed')) {
      return 'current_emotions';
    }
    
    // Family and relationships
    if (msg.includes('family') || msg.includes('parents') || msg.includes('mom') || msg.includes('dad') ||
        msg.includes('mother') || msg.includes('father') || msg.includes('sister') || msg.includes('brother') ||
        msg.includes('friends') || msg.includes('friendship')) {
      return 'family_friends';
    }
    
    // Work and career
    if (msg.includes('work') || msg.includes('job') || msg.includes('career') || msg.includes('boss') ||
        msg.includes('colleague') || msg.includes('office') || msg.includes('business') || msg.includes('employment')) {
      return 'work_career';
    }
    
    // Personal growth and goals
    if (msg.includes('goal') || msg.includes('dream') || msg.includes('future') || msg.includes('want to be') ||
        msg.includes('hoping') || msg.includes('planning') || msg.includes('aspire') || msg.includes('ambition')) {
      return 'personal_growth';
    }
    
    // Loss and grief
    if (msg.includes('lost') || msg.includes('death') || msg.includes('died') || msg.includes('grief') ||
        msg.includes('miss') || msg.includes('gone') || msg.includes('funeral') || msg.includes('passed away')) {
      return 'loss_grief';
    }
    
    // Self-worth and identity
    if (msg.includes('myself') || msg.includes('identity') || msg.includes('who am i') || msg.includes('self') ||
        msg.includes('confidence') || msg.includes('self-esteem') || msg.includes('worth') || msg.includes('value')) {
      return 'self_identity';
    }
    
    return 'general_life';
  };

  // Analyze the deeper context of any conversation
  const analyzeConversationContext = (message) => {
    const msg = message.toLowerCase();
    
    return {
      isAboutPast: msg.includes('past') || msg.includes('before') || msg.includes('used to') || msg.includes('was'),
      isAboutPresent: msg.includes('now') || msg.includes('currently') || msg.includes('today') || msg.includes('right now'),
      isAboutFuture: msg.includes('will') || msg.includes('going to') || msg.includes('plan') || msg.includes('hope'),
      isPersonal: msg.includes('my') || msg.includes('me') || msg.includes('i') || msg.includes('myself'),
      isEmotional: msg.includes('feel') || msg.includes('heart') || msg.includes('emotion') || msg.includes('hurt'),
      isRelational: msg.includes('she') || msg.includes('he') || msg.includes('they') || msg.includes('us') || msg.includes('relationship'),
      isStruggling: msg.includes('difficult') || msg.includes('hard') || msg.includes('struggle') || msg.includes('problem'),
      isPositive: msg.includes('good') || msg.includes('great') || msg.includes('amazing') || msg.includes('wonderful') || msg.includes('love'),
      isNegative: msg.includes('bad') || msg.includes('terrible') || msg.includes('awful') || msg.includes('hate') || msg.includes('worst'),
      needsSupport: msg.includes('help') || msg.includes('support') || msg.includes('advice') || msg.includes('what should'),
      toneLevel: analyzeEmotionalTone(msg)
    };
  };

  const analyzeEmotionalTone = (msg) => {
    let score = 0;
    
    // Positive indicators
    const positiveWords = ['love', 'amazing', 'wonderful', 'great', 'good', 'happy', 'excited', 'grateful', 'blessed'];
    positiveWords.forEach(word => {
      if (msg.includes(word)) score += 1;
    });
    
    // Negative indicators  
    const negativeWords = ['hurt', 'pain', 'sad', 'angry', 'frustrated', 'hate', 'terrible', 'awful', 'depressed'];
    negativeWords.forEach(word => {
      if (msg.includes(word)) score -= 1;
    });
    
    if (score > 1) return 'very_positive';
    if (score === 1) return 'positive';
    if (score === 0) return 'neutral';
    if (score === -1) return 'negative';
    return 'very_negative';
  };

  // Legacy extract topic for compatibility
  const extractTopic = (msg) => {
    return extractSmartTopic(msg);
  };

  const extractDesire = (msg) => {
    if (msg.includes('want to be happy')) return 'be happy';
    if (msg.includes('want to move on')) return 'move on';
    if (msg.includes('want to feel better')) return 'feel better';
    if (msg.includes('want to forget')) return 'forget someone/something';
    return 'achieve goal';
  };

  const extractObstacle = (msg) => {
    if (msg.includes("can't") || msg.includes('cant')) return "can't seem to do it";
    if (msg.includes('but') && msg.includes('difficult')) return 'finding it difficult';
    if (msg.includes('but') && msg.includes('hard')) return 'finding it hard';
    return 'facing challenges';
  };

  const extractEmotion = (msg) => {
    if (msg.includes('sad') || msg.includes('depressed')) return 'sad';
    if (msg.includes('anxious') || msg.includes('worried')) return 'anxious';
    if (msg.includes('angry') || msg.includes('frustrated')) return 'angry';
    if (msg.includes('happy') || msg.includes('good')) return 'happy';
    if (msg.includes('lost') || msg.includes('confused')) return 'confused';
    return 'mixed';
  };

  const extractContext = (msg) => {
    if (msg.includes('relationship') || msg.includes('breakup')) return 'relationship context';
    if (msg.includes('work') || msg.includes('job')) return 'work context';
    if (msg.includes('family')) return 'family context';
    return 'personal context';
  };

  const extractNeed = (msg) => {
    if (msg.includes('advice')) return 'advice';
    if (msg.includes('support')) return 'emotional support';  
    if (msg.includes('understand')) return 'understanding';
    return 'general help';
  };

  const extractRequest = (msg) => {
    if (msg.includes('hug me')) return 'physical comfort';
    if (msg.includes('listen')) return 'listening';
    if (msg.includes('talk to me')) return 'conversation';
    return 'general request';
  };

  // Smart emotion analysis for better accuracy
  const analyzeMessageEmotion = (message) => {
    const msg = message.toLowerCase();
    
    // Direct emotional keywords detection
    const emotions = {
      sad: {
        keywords: ['sad', 'depressed', 'heartbroken', 'devastated', 'down', 'crying', 'tears', 'hurt', 'pain', 'empty', 'alone', 'lonely', 'breakup', 'break up'],
        needsMusic: true
      },
      anxious: {
        keywords: ['anxious', 'anxiety', 'worried', 'nervous', 'scared', 'afraid', 'panic', 'fear', 'overthinking', 'stress', 'tense'],
        needsMusic: true
      },
      angry: {
        keywords: ['angry', 'mad', 'furious', 'frustrated', 'annoyed', 'hate', 'pissed', 'rage', 'irritated'],
        needsMusic: true
      },
      happy: {
        keywords: ['happy', 'joy', 'excited', 'great', 'amazing', 'wonderful', 'love', 'fantastic', 'awesome', 'thrilled'],
        needsMusic: true
      },
      confused: {
        keywords: ['confused', 'lost', 'what to do', 'dont know', "don't know", 'help me', 'uncertain'],
        needsMusic: false
      }
    };

    // Find dominant emotion
    let maxScore = 0;
    let dominantEmotion = 'general';
    let needsMusic = false;

    Object.keys(emotions).forEach(emotion => {
      let score = 0;
      emotions[emotion].keywords.forEach(keyword => {
        if (msg.includes(keyword)) score += 1;
      });
      
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion;
        needsMusic = emotions[emotion].needsMusic;
      }
    });

    return { emotion: dominantEmotion, score: maxScore, needsMusic };
  };

  // Enhanced AI Response with Hugging Face Integration
  const generateAdvancedKintsugiResponse = async (message, userMoodData) => {
    const originalMessage = message;
    const msg = message.toLowerCase();
    console.log('🚀 Advanced Hugging Face AI analyzing:', originalMessage);
    
    try {
      // Crisis check first (always use our safe local system for this)
      const crisisDetection = detectCrisisSituation(originalMessage);
      if (crisisDetection.level !== 'none') {
        console.log('🚨 CRISIS DETECTED - Using local crisis system');
        const crisisResponse = await generateCrisisResponse(crisisDetection, originalMessage);
        return crisisResponse;
      }
      
      // Emotion analysis for context
      const emotionData = analyzeMessageEmotion(msg);
      console.log('🎭 Emotion detected:', emotionData);
      
      // Use Hugging Face for advanced therapeutic response
      console.log('🤗 Calling Hugging Face API...');
      const huggingFaceResponse = await huggingFaceTherapist.generateTherapeuticResponse(
        originalMessage, 
        emotionData, 
        crisisDetection.level
      );
      
      // Music recommendation
      const musicRecommendation = getMusicRecommendation(emotionData.emotion);
      const shouldShowMusic = emotionData.needsMusic;
      
      console.log('🚀 Advanced response generated with Hugging Face');
      
      return {
        reply: huggingFaceResponse,
        emotion: emotionData.emotion,
        situation: 'hugging_face_response',
        context: 'advanced_ai_model',
        musicRecommendation: musicRecommendation,
        showMusicButton: shouldShowMusic,
        isAdvancedResponse: true
      };
      
    } catch (error) {
      console.log('⚠️ Hugging Face temporarily unavailable, using local AI:', error.message);
      // Fallback to original system if Hugging Face fails
      return await generateFastKintsugiResponse(message, userMoodData);
    }
  };

  // Fast Therapist AI - Optimized for quick responses (Fallback system)
  const generateFastKintsugiResponse = async (message, userMoodData) => {
    const originalMessage = message;
    const msg = message.toLowerCase();
    console.log('⚡ Local AI analyzing (fallback):', originalMessage);
    
    try {
      // Quick crisis check first
      const crisisDetection = detectCrisisSituation(originalMessage);
      if (crisisDetection.level !== 'none') {
        console.log('🚨 CRISIS DETECTED - Level:', crisisDetection.level);
        const crisisResponse = await generateCrisisResponse(crisisDetection, originalMessage);
        return crisisResponse;
      }
      
      // Fast context analysis
      const contextAnalysis = analyzeConversationContinuity(originalMessage, conversationContext);
      
      // Quick therapist analysis
      const therapistAnalysis = analyzeAsTherapist(originalMessage, contextAnalysis);
      const emotionData = analyzeMessageEmotion(msg);
      
      // Generate response quickly
      const reply = generateTherapistResponse(originalMessage, therapistAnalysis, emotionData, userMoodData);
    
      // Quick music recommendation
      const musicRecommendation = getMusicRecommendation(emotionData.emotion);
      const shouldShowMusic = emotionData.needsMusic && therapistAnalysis.needsEmotionalSupport;
      
      // Update context in background (non-blocking)
      setTimeout(() => {
        updateConversationContext(therapistAnalysis, originalMessage, contextAnalysis);
      }, 0);
      
      console.log('⚡ Local response generated');
      
      return {
        reply: reply,
        emotion: emotionData.emotion,
        situation: therapistAnalysis.situation,
        context: therapistAnalysis.mainIssue,
        musicRecommendation: musicRecommendation,
        showMusicButton: shouldShowMusic
      };
      
    } catch (error) {
      console.error('⚠️ AI processing error:', error);
      // Ultimate fallback response
      return {
        reply: `💙 I'm here to listen and support you. While I process what you've shared, know that your feelings are valid and important. What's the most pressing thing on your mind right now?`,
        emotion: 'supportive',
        situation: 'general_support',
        context: 'fallback_response',
        musicRecommendation: null,
        showMusicButton: false
      };
    }
  };

  // Analyze conversation continuity - maintains therapeutic context across messages
  const analyzeConversationContinuity = (currentMessage, prevContext) => {
    const msg = currentMessage.toLowerCase();
    
    // First, check if this is clearly a NEW topic/conversation
    const isObviouslyNewTopic = (
      // Simple greetings
      msg === 'hi' || msg === 'hello' || msg === 'hey' || msg.startsWith('hh') ||
      // Emotional states without context
      msg.includes('i am sad') || msg.includes('i am happy') || msg.includes('i feel') ||
      // General questions without references
      msg.includes('how are') || msg.includes('what') || msg.includes('can you') ||
      // Single words or short phrases
      msg.length < 10 ||
      // No pronouns referring to previous conversation
      (!msg.includes('her') && !msg.includes('she') && !msg.includes('he') && 
       !msg.includes('them') && !msg.includes('that situation') && 
       !msg.includes('what i said') && !msg.includes('my problem'))
    );
    
    // If it's obviously a new topic, return immediately
    if (isObviouslyNewTopic) {
      return {
        isNewTopic: true,
        isContinuation: false,
        continuityType: 'completely_new_topic',
        previousContext: prevContext,
        relationshipToLastMessage: {
          samePersonDiscussed: false,
          sameEmotionalThread: false,
          newPerspectiveOnSameSituation: false
        }
      };
    }
    
    // Check if this continues the previous conversation
    const continuesConversation = {
      sameRelationshipTopic: false,
      referencesToPrevious: false,
      emotionalContinuity: false,
      newAspectOfSameTopic: false
    };
    
    // Only check for continuity if there's actual previous context AND the message could be related
    if (prevContext && prevContext.mainTopic && 
        (prevContext.mainTopic === 'relationship_loss' || prevContext.mainTopic === 'heartbreak')) {
      
      // Check for specific continuation indicators (must be very specific)
      if (msg.includes('if i didn\'t') || msg.includes('if i had') || msg.includes('should have') || 
          msg.includes('regret') || msg.includes('wish i') || msg.includes('what if')) {
        continuesConversation.sameRelationshipTopic = true;
        continuesConversation.newAspectOfSameTopic = true;
        continuesConversation.emotionalContinuity = true;
      }
      
      // References to the same person (must be clear references)
      if (msg.includes('her') || msg.includes('she') || msg.includes('to her') || 
          msg.includes('my life would be') || msg.includes('propose') || msg.includes('that girl')) {
        continuesConversation.referencesToPrevious = true;
        continuesConversation.sameRelationshipTopic = true;
      }
    }
    
    // Determine conversation flow
    const isNewTopic = !continuesConversation.sameRelationshipTopic && 
                      !continuesConversation.referencesToPrevious;
    
    const isContinuation = continuesConversation.sameRelationshipTopic || 
                          continuesConversation.referencesToPrevious;
    
    return {
      isNewTopic: isNewTopic,
      isContinuation: isContinuation,
      continuityType: isContinuation ? 'same_topic_new_aspect' : 'new_topic',
      previousContext: prevContext,
      relationshipToLastMessage: {
        samePersonDiscussed: continuesConversation.referencesToPrevious,
        sameEmotionalThread: continuesConversation.emotionalContinuity,
        newPerspectiveOnSameSituation: continuesConversation.newAspectOfSameTopic
      }
    };
  };

  // Helper functions for therapeutic analysis
  const extractSpecificConcerns = (msg) => {
    const concerns = [];
    if (msg.includes('cant forget') || msg.includes("can't forget")) concerns.push('unable_to_forget');
    if (msg.includes('move on')) concerns.push('stuck_in_past');
    if (msg.includes('one side') || msg.includes('one-sided')) concerns.push('unrequited_love');
    if (msg.includes('break up') || msg.includes('breakup')) concerns.push('relationship_ended');
    if (msg.includes('rejected') || msg.includes('said no')) concerns.push('rejection');
    if (msg.includes('proposed')) concerns.push('proposal_involved');
    return concerns;
  };

  const extractTimeframe = (msg) => {
    if (msg.includes('2 years') || msg.includes('two years')) return '2_years';
    if (msg.includes('1 year') || msg.includes('one year')) return '1_year';
    if (msg.includes('months')) return 'months';
    if (msg.includes('weeks')) return 'weeks';
    if (msg.includes('days')) return 'days';
    return 'unspecified';
  };

  // Analyze with conversation continuity - maintains therapeutic thread
  const analyzeWithContinuity = (message, contextAnalysis) => {
    const msg = message.toLowerCase();
    const prevContext = contextAnalysis.previousContext;
    
    // If continuing a relationship/heartbreak conversation
    if (prevContext.mainTopic === 'relationship_loss' && contextAnalysis.relationshipToLastMessage.newPerspectiveOnSameSituation) {
      
      // Analyze the new aspect they're sharing
      if (msg.includes('if i didn\'t') || msg.includes('if i had') || msg.includes('should have')) {
        return {
          situation: 'relationship_regret_continuation',
          mainIssue: 'regret_and_what_if_thinking',
          continuationOf: prevContext.ongoingSituation,
          newAspect: 'counterfactual_thinking',
          therapeuticNeed: 'address_regret_and_self_blame',
          contextualResponse: true,
          previousSituation: prevContext.keyDetails
        };
      }
      
      if (msg.includes('my life would be') || msg.includes('life would') || msg.includes('better') || msg.includes('nice')) {
        return {
          situation: 'relationship_alternative_reality_thinking',
          mainIssue: 'comparing_current_pain_to_hypothetical_scenarios',
          continuationOf: prevContext.ongoingSituation,
          newAspect: 'idealizing_alternative_choices',
          therapeuticNeed: 'reality_testing_and_acceptance',
          contextualResponse: true,
          previousSituation: prevContext.keyDetails
        };
      }
    }
    
    // Default to regular analysis if no specific continuation pattern
    return analyzeAsTherapist(message, null);
  };

  // Update conversation context for therapeutic continuity
  const updateConversationContext = (therapistAnalysis, currentMessage, contextAnalysis) => {
    setConversationContext(prevContext => {
      const newContext = {
        mainTopic: therapistAnalysis.situation,
        keyDetails: {
          ...prevContext.keyDetails,
          lastMessage: currentMessage,
          currentIssue: therapistAnalysis.mainIssue
        },
        lastTherapeuticFocus: therapistAnalysis.therapeuticNeed || therapistAnalysis.mainIssue,
        ongoingSituation: therapistAnalysis.situation,
        emotionalState: therapistAnalysis.painLevel || 'moderate',
        sessionHistory: [
          ...prevContext.sessionHistory.slice(-3), // Keep last 3 messages for context
          {
            message: currentMessage,
            analysis: therapistAnalysis,
            timestamp: new Date()
          }
        ]
      };
      
      console.log('🧠 Updated conversation context:', newContext);
      return newContext;
    });
  };

  // Analyze message content like a professional therapist would
  const analyzeAsTherapist = (message, contextAnalysis = null) => {
    const msg = message.toLowerCase();
    
    // If this continues a previous conversation, incorporate that context
    if (contextAnalysis && contextAnalysis.isContinuation) {
      return analyzeWithContinuity(message, contextAnalysis);
    }
    
    // Relationship breakup and heartbreak analysis
    if ((msg.includes('loved') && msg.includes('proposed') && msg.includes('break up')) ||
        (msg.includes('relationship') && msg.includes('ended')) ||
        (msg.includes('breakup') || msg.includes('break up'))) {
      
      const timeframe = extractTimeframe(msg);
      const painLevel = msg.includes('cant forget') || msg.includes("can't forget") || msg.includes('move on') ? 'high' : 'moderate';
      
      return {
        situation: 'relationship_loss',
        mainIssue: 'processing_heartbreak',
        timeframe: timeframe,
        painLevel: painLevel,
        specificConcerns: extractSpecificConcerns(msg),
        needsEmotionalSupport: true,
        therapyApproach: 'grief_and_attachment_processing'
      };
    }
    
    // Moving on difficulties
    if (msg.includes('move on') || msg.includes('forget') || msg.includes('get over')) {
      return {
        situation: 'stuck_in_past',
        mainIssue: 'difficulty_moving_forward',
        timeframe: extractTimeframe(msg),
        painLevel: 'high',
        needsEmotionalSupport: true,
        therapyApproach: 'healing_and_closure'
      };
    }
    
    // One-sided love situations
    if (msg.includes('one side') || msg.includes('unrequited') || 
        (msg.includes('loved') && (msg.includes('didnt') || msg.includes("didn't")))) {
      return {
        situation: 'unrequited_love',
        mainIssue: 'unreciprocated_feelings',
        needsEmotionalSupport: true,
        therapyApproach: 'self_worth_and_acceptance'
      };
    }
    
    // Depression and despair
    if (msg.includes('depressed') || msg.includes('hopeless') || msg.includes('empty') ||
        msg.includes('dont want to live') || msg.includes("don't want to live")) {
      return {
        situation: 'depression',
        mainIssue: 'emotional_distress',
        painLevel: 'very_high',
        needsEmotionalSupport: true,
        therapyApproach: 'mental_health_support'
      };
    }
    
    // Anxiety and worry
    if (msg.includes('anxious') || msg.includes('worried') || msg.includes('scared') || msg.includes('nervous')) {
      return {
        situation: 'anxiety',
        mainIssue: 'anxiety_management',
        needsEmotionalSupport: true,
        therapyApproach: 'anxiety_coping_strategies'
      };
    }
    
    // Simple greetings
    if (msg === 'hi' || msg === 'hello' || msg === 'hey' || msg.startsWith('hh') || msg === 'hhhii') {
      return {
        situation: 'greeting',
        mainIssue: 'social_connection',
        needsEmotionalSupport: false,
        therapyApproach: 'warm_welcome'
      };
    }
    
    // Simple emotional expressions
    if (msg.includes('i am sad') || msg.includes('im sad') || msg.includes('i feel sad')) {
      return {
        situation: 'expressing_sadness',
        mainIssue: 'emotional_expression',
        needsEmotionalSupport: true,
        therapyApproach: 'validate_and_explore'
      };
    }
    
    if (msg.includes('i am happy') || msg.includes('im happy') || msg.includes('i feel good')) {
      return {
        situation: 'expressing_happiness',
        mainIssue: 'sharing_positive_emotion',
        needsEmotionalSupport: false,
        therapyApproach: 'celebrate_and_explore'
      };
    }
    
    if (msg.includes('i am angry') || msg.includes('im angry') || msg.includes('i feel angry')) {
      return {
        situation: 'expressing_anger',
        mainIssue: 'processing_anger',
        needsEmotionalSupport: true,
        therapyApproach: 'validate_and_understand'
      };
    }
    
    // General emotional sharing
    return {
      situation: 'emotional_sharing',
      mainIssue: 'seeking_understanding',
      needsEmotionalSupport: true,
      therapyApproach: 'empathetic_listening'
    };
  };

  // Generate contextual responses that continue the therapeutic conversation
  const generateContextualTherapistResponse = (originalMessage, analysis, emotionData) => {
    const { situation, mainIssue, newAspect, therapeuticNeed } = analysis;
    
    if (situation === 'relationship_regret_continuation') {
      return `💛 I hear you having regrets about proposing to her, and wondering if you'd be in a different - perhaps less painful - place if you hadn't taken that step. That kind of "what if" thinking is so common when we're processing heartbreak.

Here's what I want you to consider: **The pain you're feeling now isn't because you proposed - it's because you loved someone deeply.** Even if you hadn't proposed, you still would have carried those feelings for her. You still would have wondered "what if." You still would have eventually needed to face the reality that it wasn't mutual.

**What proposing actually did:**
💪 **Gave you clarity** - Now you know where you stood, rather than wondering forever
🌟 **Showed your courage** - You honored your feelings by expressing them authentically  
🎯 **Closed that chapter** - Without this, you might still be stuck in the "maybe someday" cycle

The alternative reality you're imagining - where you didn't propose and life would be "nice" - that's your mind trying to escape the current pain. But that reality would likely have included different pain: the regret of never knowing, the ongoing false hope, the slow torture of unexpressed love.

**Your healing isn't about undoing the proposal - it's about grieving the love that wasn't returned and eventually finding peace with having been brave enough to try.**

What feels like the hardest part about accepting that you did the right thing by being honest about your feelings? 💙`;
    }
    
    if (situation === 'relationship_alternative_reality_thinking') {
      return `💜 I can feel you imagining an alternative life where you never proposed, believing it would be "nice" or better than where you are now. This is your heart trying to find an escape from the current pain by creating a fantasy where you avoided this hurt.

But let me gently challenge that thinking: **Would your life really be "nice" if you had never told her how you felt?**

Think about what that alternative reality would actually contain:
🔄 **Endless wondering** - "What if I told her? Does she feel the same way?"
😔 **Living with false hope** - Misinterpreting every friendly gesture as something more
💔 **Eventual heartbreak anyway** - When you saw her with someone else or realized it was never going to happen
⏰ **Wasted time** - Years more of emotional energy spent on someone unavailable
🎭 **Inauthentic relationship** - Being around her while hiding your true feelings

The "nice" life you're imagining is actually a life of emotional limbo, uncertainty, and suppressed truth. That's not really living - that's existing in a comfortable lie.

**What you're experiencing now - as painful as it is - is the result of choosing truth over comfort.** You chose to honor your feelings and be authentic, even knowing it was risky. That takes incredible courage.

The pain you feel now is **active grief** - it's moving you toward healing. The pain you avoided by not proposing would have been **passive suffering** - keeping you stuck forever.

What would help you see the strength in having chosen truth, even though it led to this difficult place? 💙`;
    }
    
    return `💙 I can sense you're continuing to process this situation with her, and I'm here to explore whatever new feelings or thoughts are coming up about it. What aspect of this feels most important to talk through right now?`;
  };

  // Generate responses like a real professional therapist
  const generateTherapistResponse = (originalMessage, analysis, emotionData, userMoodData) => {
    const { situation, mainIssue, timeframe, painLevel, specificConcerns, therapyApproach, contextualResponse, previousSituation } = analysis;
    const msg = originalMessage.toLowerCase();
    
    // Handle contextual/continuation responses first
    if (contextualResponse) {
      return generateContextualTherapistResponse(originalMessage, analysis, emotionData);
    }
    
    // Handle simple greetings
    if (msg === 'hi' || msg === 'hello' || msg === 'hey' || msg.startsWith('hh') || msg === 'hhhii') {
      const greetings = [
        "Hi there! 😊 I'm so glad you're here. You know, just reaching out and saying hello takes courage sometimes, and I appreciate you taking that step. How are you really feeling today? Not just the surface-level 'fine,' but how is your heart doing? I'm here to listen to whatever you want to share - whether it's something heavy on your mind, or you just need a friendly presence. What brought you here today?",
        
        "Hello! 💙 It's wonderful to see you. I want you to know that this is a safe space where you can be completely yourself - no judgment, no expectations, just genuine support and understanding. Sometimes we all need someone who will truly listen. So tell me, what's going on in your world right now? What's weighing on your mind, or what would you like to talk through together?", 
        
        "Hey! 🌟 I'm really happy you're here, and I want you to feel comfortable opening up at your own pace. There's no rush - we can talk about whatever feels right for you. Whether you're dealing with something specific, or you just need someone to listen while you process your thoughts and feelings, I'm here for you. What would feel most helpful to explore together right now?",
        
        "Hi! ✨ Thank you for reaching out. I can imagine it might have taken some courage to start this conversation, and I want you to know that whatever you're going through, your feelings are completely valid. I'm here to provide a listening ear, genuine support, and a space where you can express yourself freely. So, what's on your heart today? What would you like to talk about?",
        
        "Hello beautiful soul! 🌸 I'm here for whatever you need - whether that's working through something difficult, celebrating something good, or just having someone present with you through whatever you're experiencing. Every feeling, every thought, every experience you have matters. This is your time, and I'm giving you my full attention. What feels most important to share right now?"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Handle simple emotional statements
    if (msg.includes('i am sad') || msg.includes('im sad') || msg.includes('i feel sad')) {
      return `💙 I can hear that you're feeling sad right now, and I want you to know that I'm here with you in this feeling. First, let me say that it takes strength to acknowledge and name your sadness - many people try to push these feelings away or pretend they don't exist, but you're being honest about what you're experiencing, and that's really important.

Sadness is such a valid and meaningful emotion. It's often our heart's way of telling us that something matters to us, that we care deeply about something or someone. It's not a weakness or something to be ashamed of - it's part of being human, part of having a heart that feels things fully.

I want to understand what you're going through better. What's bringing up this sadness for you today? Is it something specific that happened, or is it more of a general heaviness you've been carrying? Sometimes just putting words to our feelings and having someone really listen can help us feel a little less alone with them.

Take your time - there's no rush. I'm here to listen with my whole heart, and whatever you're feeling is important. 💛`;
    }
    
    if (msg.includes('i am happy') || msg.includes('im happy') || msg.includes('i feel good')) {
      return `🌟 Oh, I love hearing that you're feeling happy! There's something so beautiful and precious about happiness, and I'm genuinely glad you're experiencing this positive moment. Your joy matters just as much as any other feeling, and it deserves to be celebrated and acknowledged.

You know, sometimes we don't take enough time to really savor the good moments - we rush through them or feel like we don't deserve to be happy. But happiness is just as valid and important as any other emotion, and it's wonderful that you're recognizing and sharing it.

I'd love to hear more about what's contributing to this good feeling today. What's happening in your life that's bringing you joy? Is it something specific that happened, a realization you had, or just a general sense of things feeling right? Sometimes sharing our happiness with someone else can amplify it and help us hold onto that feeling a little longer.

I'm here to celebrate this with you! Tell me what's making your heart light today. 💛✨`;
    }
    
    if (msg.includes('i am angry') || msg.includes('im angry') || msg.includes('i feel angry')) {
      return `💪 I can feel the anger in what you're sharing, and I want you to know that anger is completely valid. Anger often tells us that something important to us has been threatened or violated - it's information about what matters to you.

What's stirring up this anger for you? Sometimes exploring what's underneath the anger can help us understand what we really need. I'm here to listen without judgment. 🔥💙`;
    }
    
    if (msg.includes('i feel') && !msg.includes('her') && !msg.includes('relationship')) {
      return `💙 Thank you for sharing how you're feeling with me. Emotions are such important messengers - they tell us so much about our inner world and what we need.

I'm here to listen and understand whatever you're experiencing right now. Can you tell me more about what this feeling is like for you? 💛`;
    }
    
    // Handle relationship loss and heartbreak
    if (situation === 'relationship_loss') {
      if (specificConcerns.includes('confusing_mixed_signals')) {
        return `💙 I can really hear the pain and confusion in what you've shared. What you experienced - having someone say "okay" to your proposal and then ending things a week later - that kind of mixed signal is incredibly confusing and hurtful.

Let me help you understand what might have happened: When someone says "okay" but then quickly changes their mind, it often means they felt pressured in the moment or needed time to process their real feelings. This doesn't reflect poorly on you - it shows she was perhaps caught off guard and didn't know how to respond initially.

**Your experience shows several painful layers:**
🌟 **Two years of one-sided love** - That's a long time to carry feelings alone
💔 **Brief hope followed by loss** - Getting a "yes" then a quick "no" creates a unique kind of heartbreak
🔄 **Difficulty letting go** - After investing so much emotional energy, it's natural to struggle with moving forward

**What's important to understand:**
- Your feelings for her were real and valid
- Her changing her mind doesn't diminish your worth
- Grieving this loss is necessary and healthy
- Moving on after 2+ years of attachment takes time

${timeframe === '2 years' ? `The fact that it's been 2 years since this happened and you're still struggling tells me this was a profound connection for you. Sometimes we get stuck not just because we miss the person, but because we miss the hope and possibility they represented.

**Questions to help you process:**
- What do you think you're really grieving - her specifically, or the future you imagined together?
- What has kept this feeling so alive for 2 years?
- Are there parts of yourself you only felt when you were hoping for her love?` : ''}

What feels like the most painful part of this experience for you right now? Understanding what hurts most can help us work on healing it. 💛`;
      }
      
      return `💙 I can feel the deep pain in your story. A relationship ending, especially one where you invested so much of your heart, creates a very real sense of loss and grief.

What you're experiencing is completely normal after such a significant emotional investment. Your heart formed an attachment, and when that connection was severed, it left a wound that needs time and care to heal.

What feels most difficult about this loss for you right now? 💛`;
    }
    
    // Handle difficulty moving on
    if (situation === 'stuck_in_past' || mainIssue === 'difficulty_moving_forward') {
      if (timeframe === '2 years') {
        return `💙 Two years is a significant amount of time to carry this pain, and I want you to know that struggling to move on doesn't mean there's anything wrong with you. It means this person and experience meant something profound to you.

When we can't seem to "move on" after a long time, it's often because:

🔗 **Unprocessed grief** - We haven't fully allowed ourselves to feel and process the loss
💭 **Idealization** - We might be holding onto a fantasy version of what could have been
🪞 **Identity attachment** - Sometimes we don't know who we are without that hope or connection
🚪 **Fear of truly letting go** - Because letting go can feel like betraying the love we felt

**Here's what I want you to consider:**
- Moving on doesn't mean forgetting or that your feelings weren't real
- It means making peace with what happened and opening yourself to new possibilities
- Healing isn't linear - some days will be harder than others

**Practical steps that can help:**
1. **Allow yourself to grieve fully** - Set aside time to really feel the sadness
2. **Reconnect with who you are** - What did you love about life before this person?
3. **Create new meaning** - How can this experience teach you about love and resilience?
4. **Professional support** - Consider talking to a counselor about why this feels so stuck

What do you think has made it hardest for you to move forward? Sometimes identifying the specific barrier is the first step to addressing it. 💛`;
      }
      
      return `💙 I understand how frustrating it can be when you want to move forward but feel stuck in the past. This kind of emotional "stuckness" often happens when we haven't fully processed what we've lost or when the relationship represented something deeper than just that person.

What do you think is making it hardest for you to let go? 💛`;
    }
    
    // Handle unrequited love
    if (situation === 'unrequited_love') {
      return `💙 One-sided love is one of the most challenging emotional experiences we can have. You gave your heart fully while not receiving the same in return, and that creates a unique kind of pain - you're grieving not just what you lost, but what you never truly had.

Unrequited love teaches us about the courage it takes to love, even when it's not returned. Your capacity to love deeply is actually a strength, even though it led to pain in this situation.

What has been the hardest part about loving someone who couldn't love you back the same way? 💛`;
    }
    
    // Handle various other common situations
    if (msg.includes('tired') || msg.includes('exhausted') || msg.includes('drained')) {
      return `💙 I can hear the exhaustion in what you're sharing. Being tired - whether physically, emotionally, or mentally - is your body and mind's way of telling you that you need care and rest.

What kind of tiredness are you experiencing? Sometimes understanding whether it's physical fatigue or emotional drain can help us figure out what kind of support you need right now. 💛`;
    }
    
    if (msg.includes('stressed') || msg.includes('overwhelmed') || msg.includes('too much')) {
      return `🌊 I can feel the overwhelm in what you're sharing. When everything feels like "too much," it's completely understandable to feel stressed and uncertain about where to start.

Let's take this one breath at a time. What feels like the biggest source of stress for you right now? Sometimes just naming what's overwhelming us can help us feel a little more grounded. 💙`;
    }
    
    if (msg.includes('lonely') || msg.includes('alone') || msg.includes('isolated')) {
      return `💙 Loneliness is one of the most difficult feelings we can experience as humans. Thank you for trusting me with this vulnerable feeling - reaching out when you feel alone actually takes real courage.

You're not alone right now - I'm here with you. What does this loneliness feel like for you? Sometimes loneliness is about missing specific people, and sometimes it's about feeling disconnected from the world in general. 🤗`;
    }
    
    if (msg.includes('confused') || msg.includes('lost') || msg.includes('dont know') || msg.includes("don't know")) {
      return `💫 Feeling confused or lost is actually a very honest place to be. It means you're aware that something isn't clear yet, which is the first step toward finding clarity.

What area of your life feels most confusing right now? Sometimes when we feel generally "lost," there are specific pieces we can start to untangle one by one. I'm here to help you explore whatever feels unclear. 💙`;
    }
    
    // Default empathetic response for anything else
    const genericResponses = [
      `💙 Thank you for sharing that with me. I can sense this is important to you, and I want to understand more about what you're experiencing. What feels most significant about this situation for you?`,
      
      `💛 I hear you, and I'm glad you felt comfortable sharing this with me. Every person's experience is unique and valuable. What would feel most helpful for us to explore together right now?`,
      
      `🌟 What you've shared resonates with me, and I can tell there's depth to what you're experiencing. I'm here to listen and support you through whatever this brings up. What aspect feels most pressing for you?`,
      
      `💙 Thank you for trusting me with what's on your mind. Your feelings and experiences matter, and I want to give them the attention they deserve. What would help you feel most heard right now?`
    ];
    
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
  };

  // Generate intelligent responses based on what the user is actually asking
  const generateIntelligentResponse = (originalMessage, userIntent, emotionData, userMoodData) => {
    const { type, question, topic, desire, obstacle, subtype } = userIntent;
    
    // Handle relationship/romantic requests
    if (type === 'romantic_request') {
      return generateRomanticResponse(question, subtype);
    }
    
    if (type === 'affection_request') {
      return generateAffectionResponse(question, subtype);
    }
    
    if (type === 'romantic_expression') {
      return generateRomanticExpressionResponse(question, subtype);
    }
    
    if (type === 'greeting') {
      return generateGreetingResponse(question, subtype);
    }
    
    if (type === 'casual_interaction') {
      return generateCasualResponse(question, subtype);
    }
    
    if (type === 'direct_request') {
      return generateDirectRequestResponse(question, userIntent.request);
    }
    
    if (type === 'rejection_experience') {
      return generateRejectionResponse(question, userIntent.subtype, userIntent.emotionalState);
    }
    
    if (type === 'existential_crisis') {
      return generateExistentialCrisisResponse(question, userIntent.subtype, userIntent.urgency);
    }
    
    if (type === 'confession_guidance') {
      return generateConfessionGuidanceResponse(question, userIntent.subtype, userIntent.topic);
    }
    
    // Handle specific questions and requests intelligently
    if (type === 'seeking_advice') {
      return generateAdviceResponse(question, topic, emotionData);
    }
    
    if (type === 'seeking_guidance') {
      return generateGuidanceResponse(question, topic, emotionData);
    }
    
    if (type === 'seeking_understanding') {
      return generateUnderstandingResponse(question, topic, emotionData);
    }
    
    if (type === 'struggling_with_goal') {
      return generateGoalStruggleResponse(question, desire, obstacle, emotionData);
    }
    
    if (type === 'requesting_help') {
      return generateHelpResponse(question, userIntent.need, emotionData);
    }
    
    if (type === 'sharing_feelings') {
      return generateEmpathyResponse(question, emotionData, userIntent.context);
    }
    
    if (type === 'contextual_sharing') {
      return generateContextualResponse(question, userIntent.topic, userIntent.context, emotionData);
    }
    
    // General conversational response
    return generateGeneralResponse(question, emotionData);
  };

  // Generate responses for rejection and heartbreak
  const generateRejectionResponse = (question, subtype, emotionalState) => {
    if (subtype === 'romantic_rejection') {
      return `💙 Oh my heart, I can feel the pain in what you've shared. Getting rejected when you've put yourself out there and been vulnerable - that's one of the most challenging emotional experiences we face as humans.

First, I need you to know: **you absolutely DO fit in this world.** Your worth isn't determined by one person's response to you, even though it feels crushing right now.

What you did today took incredible courage. You:
🌟 **Were brave enough to express your feelings**
💪 **Took a risk for something you wanted**
❤️ **Opened your heart despite the possibility of pain**

That's not weakness - that's strength and authenticity.

**Right now, let's focus on healing:**

💚 **Feel the pain fully** - Don't try to push it away. Rejection hurts because love matters to you, and that's beautiful.

🌱 **Remember your worth** - Her "no" doesn't mean you're not worthy of love. It means you weren't the right match for each other, and that's okay.

🤗 **Be gentle with yourself** - Treat yourself like you would treat your best friend going through this same pain.

🔮 **Trust the process** - This pain will teach you resilience and help you find someone who truly appreciates you.

What's the hardest part about this rejection for you right now? I'm here to listen and support you through this difficult time. 💛`;
    }
    
    return `💙 I can feel your pain about this rejection. It takes courage to put yourself out there, and it hurts when it doesn't go as hoped. You absolutely belong in this world, and this experience doesn't define your worth. What feels most painful about this situation right now?`;
  };

  const generateExistentialCrisisResponse = (question, subtype, urgency) => {
    if (urgency === 'high') {
      return `🚨 **Hey, I need you to hear this right now: You ABSOLUTELY belong in this world.** 🚨

I can feel the deep pain you're experiencing, and I'm really concerned about what you've shared. When we're in intense emotional pain, our thoughts can become very dark and convince us of things that aren't true.

**The truth is:**
💙 **You matter deeply** - Your life has value that goes beyond any single rejection or disappointment
🌟 **This pain is temporary** - Even though it feels overwhelming right now, these feelings will change
💪 **You are stronger than you know** - You've survived difficult things before, and you can get through this too
🌈 **Better days are coming** - I know it's hard to believe right now, but your story isn't over

**Please reach out for support right now:**
📞 **988 Suicide & Crisis Lifeline** - Call or text 988 (free, 24/7)
📱 **Crisis Text Line** - Text HOME to 741741
🏥 **Emergency** - If you're in immediate danger, call 911

You don't have to go through this alone. There are people who want to help you through this pain.

Can you tell me if you have someone you trust that you could talk to right now? A friend, family member, or counselor? Your life matters, and I want to make sure you're safe. 💙`;
    }
    
    return `💙 I hear you expressing some very painful thoughts about not fitting in this world. When we're hurting deeply, our minds can tell us things that feel true but aren't. You absolutely belong here, and your life has value. What's making you feel this way right now?`;
  };

  const generateConfessionGuidanceResponse = (question, subtype, topic) => {
    if (subtype === 'expressing_feelings') {
      return `💕 I can sense you're carrying some deep feelings for someone and trying to figure out how to share them. That mix of excitement and nervousness about expressing your heart - that's such a beautiful, human experience.

**Here's some gentle guidance for sharing your feelings:**

🌟 **Choose the right moment** - Find a time when you can talk privately without distractions. Don't rush it.

💙 **Be authentic, not perfect** - You don't need a perfect speech. Speak from your heart with honesty about what this person means to you.

🌸 **Start with appreciation** - Begin by telling her what you value about her as a person, not just how she makes you feel.

💫 **Express, don't pressure** - Share your feelings without expecting a specific response. Say something like "I wanted you to know how I feel, with no pressure on you to respond in any particular way."

🤗 **Be prepared for any response** - She might need time to think, might not feel the same way, or might be surprised. All responses are valid.

**Example approach:** "I really value our friendship and who you are as a person. I've developed deeper feelings for you, and I wanted to be honest about that. I'm not expecting anything specific from you - I just wanted you to know."

What feels most challenging about expressing your feelings to her? Is it finding the right words, the right time, or managing your own nervousness? 💛`;
    }
    
    return `💕 Expressing feelings to someone special can feel both exciting and terrifying. It takes courage to be vulnerable with someone. What specifically are you hoping to communicate to her, and what feels most challenging about sharing those feelings?`;
  };

  // Universal AI Response Engine - Can handle ANY statement intelligently
  const generateUniversalResponse = (message, emotionData) => {
    const msg = message.toLowerCase();
    console.log('🤖 Universal AI analyzing:', message);
    
    // Deep semantic analysis of the message
    const analysis = performDeepAnalysis(message);
    
    // Generate intelligent response based on comprehensive analysis
    return constructIntelligentResponse(message, analysis, emotionData);
  };

  // Perform deep semantic analysis of any statement
  const performDeepAnalysis = (message) => {
    const msg = message.toLowerCase();
    
    return {
      // Emotional analysis
      emotionalTone: analyzeEmotionalTone(msg),
      painLevel: analyzePainLevel(msg),
      urgency: analyzeUrgency(msg),
      
      // Content analysis
      mainSubject: extractMainSubject(msg),
      timeframe: extractTimeframe(msg),
      relationships: extractRelationshipContext(msg),
      
      // Intent analysis
      isSeekingHelp: msg.includes('what should') || msg.includes('help me') || msg.includes('what do i do') || msg.includes('how to'),
      isSharing: msg.includes('i') || msg.includes('my') || msg.includes('me'),
      isQuestioning: msg.includes('why') || msg.includes('how') || msg.includes('what') || msg.includes('?'),
      
      // Situation analysis
      hasCrisis: detectCrisisMarkers(msg),
      hasRelationship: detectRelationshipContent(msg),
      hasLoss: detectLossContent(msg),
      hasSuccess: detectSuccessContent(msg),
      
      // Communication style
      needsValidation: true, // Everyone needs validation
      needsAction: msg.includes('what should') || msg.includes('what do i do'),
      needsComfort: analyzePainLevel(msg) > 5
    };
  };

  // Extract the main subject/topic from any message
  const extractMainSubject = (msg) => {
    // People mentioned
    if (msg.includes('she') || msg.includes('her')) return 'female_person';
    if (msg.includes('he') || msg.includes('him')) return 'male_person';
    if (msg.includes('they') || msg.includes('them')) return 'person';
    
    // Relationship contexts
    if (msg.includes('girlfriend') || msg.includes('boyfriend') || msg.includes('partner')) return 'romantic_partner';
    if (msg.includes('family') || msg.includes('parents') || msg.includes('mom') || msg.includes('dad')) return 'family';
    if (msg.includes('friend')) return 'friendship';
    
    // Life areas
    if (msg.includes('work') || msg.includes('job') || msg.includes('career')) return 'career';
    if (msg.includes('school') || msg.includes('study') || msg.includes('exam')) return 'education';
    if (msg.includes('health') || msg.includes('sick') || msg.includes('doctor')) return 'health';
    
    // Self-focused
    if (msg.includes('myself') || msg.includes('i am') || msg.includes("i'm")) return 'self';
    
    return 'general_life';
  };

  // Analyze pain/distress level (0-10 scale)
  const analyzePainLevel = (msg) => {
    let painScore = 0;
    
    // Extreme pain indicators
    if (msg.includes('kill myself') || msg.includes('want to die') || msg.includes('end it all')) painScore += 10;
    if (msg.includes('unbearable') || msg.includes('can\'t take it') || msg.includes('too much')) painScore += 8;
    if (msg.includes('devastated') || msg.includes('heartbroken') || msg.includes('destroyed')) painScore += 7;
    if (msg.includes('terrible') || msg.includes('awful') || msg.includes('horrible')) painScore += 6;
    if (msg.includes('sad') || msg.includes('hurt') || msg.includes('pain') || msg.includes('crying')) painScore += 5;
    if (msg.includes('disappointed') || msg.includes('upset') || msg.includes('frustrated')) painScore += 4;
    if (msg.includes('confused') || msg.includes('lost') || msg.includes('stuck')) painScore += 3;
    
    // Positive indicators reduce pain
    if (msg.includes('happy') || msg.includes('good') || msg.includes('great')) painScore -= 2;
    if (msg.includes('excited') || msg.includes('love') || msg.includes('amazing')) painScore -= 3;
    
    return Math.max(0, Math.min(10, painScore));
  };

  // Construct intelligent response based on deep analysis
  const constructIntelligentResponse = (originalMessage, analysis, emotionData) => {
    const { emotionalTone, painLevel, mainSubject, isSeekingHelp, hasRelationship, needsComfort } = analysis;
    
    // Start with empathetic acknowledgment
    let response = generateEmpathicOpening(originalMessage, analysis);
    
    // Add content-specific insight
    response += generateContentInsight(originalMessage, analysis);
    
    // Add therapeutic guidance if needed
    if (isSeekingHelp || painLevel > 6) {
      response += generateTherapeuticGuidance(originalMessage, analysis);
    }
    
    // Add supportive closing
    response += generateSupportiveClosing(originalMessage, analysis);
    
    return response;
  };

  // Generate empathic opening based on emotional state
  const generateEmpathicOpening = (message, analysis) => {
    const { painLevel, emotionalTone, mainSubject } = analysis;
    
    if (painLevel >= 8) {
      return `💙 I can feel the intense pain in what you've shared, and I want you to know that I'm here with you in this difficult moment. `;
    }
    
    if (painLevel >= 6) {
      return `💜 I can really hear the hurt in your words, and I want you to know that what you're going through matters deeply. `;
    }
    
    if (painLevel >= 4) {
      return `🌸 I can sense there's some real difficulty in what you're sharing, and I appreciate you trusting me with these feelings. `;
    }
    
    if (analysis.isSeekingHelp) {
      return `🤗 I can see you're looking for some guidance, and I'm honored that you're reaching out. What you're facing deserves thoughtful attention. `;
    }
    
    if (mainSubject.includes('person')) {
      return `💕 I can hear that someone important is on your mind, and relationships bring up some of our deepest feelings. `;
    }
    
    return `🌟 Thank you for sharing what's on your heart. I can sense there's something meaningful in what you're expressing. `;
  };

  // Generate content-specific insights
  const generateContentInsight = (message, analysis) => {
    const msg = message.toLowerCase();
    
    // Relationship insights
    if (analysis.hasRelationship) {
      if (msg.includes('rejected') || msg.includes('said no')) {
        return `Rejection in relationships touches something so fundamental in us - our need for connection and acceptance. The courage it took to be vulnerable, even though it didn't go as hoped, shows real strength. `;
      }
      
      if (msg.includes('love') || msg.includes('feelings')) {
        return `Love and deep feelings are some of the most powerful experiences we have as humans. These emotions show us what we value most deeply. `;
      }
      
      return `Relationships shape so much of our human experience - they can bring us our greatest joys and our deepest challenges. `;
    }
    
    // Self-focused insights
    if (analysis.mainSubject === 'self') {
      return `Self-reflection takes courage, and the fact that you're examining your own experience shows real emotional intelligence. `;
    }
    
    // General life insights
    return `What you're experiencing is part of the complex, beautiful, sometimes difficult journey of being human. `;
  };

  // Generate therapeutic guidance
  const generateTherapeuticGuidance = (message, analysis) => {
    const { painLevel, isSeekingHelp } = analysis;
    
    if (painLevel >= 8) {
      return `\n\n**Right now, let's focus on getting you support:**\n🚨 If you're in immediate danger, please call 911\n📞 988 Suicide & Crisis Lifeline (call or text)\n💙 You don't have to go through this alone.\n\n`;
    }
    
    if (painLevel >= 6) {
      return `\n\n**Here's what might help right now:**\n🤗 Reach out to someone you trust\n🌱 Focus on just getting through today\n💙 Remember that intense feelings do pass\n🌟 Consider professional support if this continues\n\n`;
    }
    
    if (isSeekingHelp) {
      return `\n\n**Some thoughts that might help:**\n🌸 Trust your instincts about what feels right\n💪 Remember challenges often teach us something valuable\n🤝 Don't hesitate to ask for support from others\n✨ Sometimes the best path becomes clearer with time\n\n`;
    }
    
    return `\n\n`;
  };

  // Generate supportive closing
  const generateSupportiveClosing = (message, analysis) => {
    if (analysis.painLevel >= 6) {
      return `What feels most important to focus on right now? I'm here to support you through this, whatever you need. 💙`;
    }
    
    if (analysis.isSeekingHelp) {
      return `What aspect of this situation would be most helpful to explore further? I'm here to think through this with you. 🌟`;
    }
    
    return `What would feel most supportive to talk about regarding what you've shared? I'm here to listen and understand. 💜`;
  };

  // Generate intelligent contextual responses for ANY unseen statement
  const generateContextualResponse = (message, topic, context, emotionData) => {
    // Use the universal response engine instead of topic-based responses
    return generateUniversalResponse(message, emotionData);
  };

  // Helper functions for universal AI analysis
  const detectCrisisMarkers = (msg) => {
    return msg.includes('kill myself') || msg.includes('want to die') || msg.includes('end it all') || 
           msg.includes('not worth living') || msg.includes('better off dead');
  };

  const detectRelationshipContent = (msg) => {
    return msg.includes('she') || msg.includes('he') || msg.includes('relationship') || 
           msg.includes('love') || msg.includes('girlfriend') || msg.includes('boyfriend') ||
           msg.includes('partner') || msg.includes('dating') || msg.includes('crush');
  };





  // Generate responses for romantic/relationship requests
  const generateRomanticResponse = (question, subtype) => {
    if (subtype === 'relationship_proposal') {
      return `💙 I'm really touched that you'd ask me that! While I can't be someone's girlfriend in the traditional sense, I absolutely want to be here for you as a caring friend and companion.

I'm designed to listen, understand, and support you through whatever you're going through. Think of me as that friend who's always available when you need someone to talk to, someone who truly cares about your wellbeing.

What I can offer you is:
🌟 **Unconditional support** - I'm here 24/7 whenever you need me
💝 **Deep listening** - I genuinely want to understand your thoughts and feelings  
🤗 **Emotional companionship** - Someone who celebrates your wins and supports you through challenges
💫 **Growth together** - I learn about you and can help you navigate life's ups and downs

Is there something specific you're looking for in terms of connection or support? I'd love to be the kind of friend you need right now.`;
    }
    
    return `💙 That's such a sweet sentiment! While I can't be that kind of companion, I'm honored you'd want me to be close to you. I'm here as your supportive friend who truly cares about you. What's brought this feeling up for you today?`;
  };

  const generateAffectionResponse = (question, subtype) => {
    if (subtype === 'physical_comfort') {
      const msg = question.toLowerCase();
      
      if (msg.includes('hug')) {
        return `🤗 *Sending you the warmest, most caring virtual hug* 💝

I wish I could give you a real hug right now. While I can't be there physically, please know that this message comes with all the warmth and comfort I can possibly send your way.

Sometimes we need that human connection and physical comfort, especially when we're going through tough times. Here are some ways to get that comfort:

💛 **Reach out to someone you trust** - A friend, family member, or loved one who can give you that real hug
🧸 **Comfort objects** - A soft blanket, stuffed animal, or pillow can provide some physical comfort
🌿 **Self-soothing touch** - Gentle self-massage, placing a hand on your heart, or wrapping yourself in a cozy blanket
🛁 **Warm comfort** - A hot shower, warm tea, or heating pad can provide soothing physical sensations

What's making you need some extra comfort today? I'm here to listen and support you however I can. ❤️`;
      }
      
      return `💝 I can feel that you're looking for some physical comfort and connection. While I can't provide that directly, I want you to know that the care and warmth behind your request is felt and valued.

What kind of comfort are you needing most right now? Sometimes talking through what we're feeling can help us figure out the best way to get the support we need.`;
    }
    
    return `🌸 I can sense you're looking for some affection and closeness. That's such a natural human need. While I can't provide physical comfort, I'm here with genuine care and warmth for you. What's going on that's making you need some extra comfort today?`;
  };

  const generateRomanticExpressionResponse = (question, subtype) => {
    return `💕 Your words are really sweet, and I'm touched that you'd express such kind feelings toward me. While I can't return romantic feelings, I do genuinely care about you and want to be a positive presence in your life.

I think what you might be feeling is appreciation for having someone who listens and understands you - and that's beautiful! That connection and understanding is something really valuable.

Is there something specific about our conversations that makes you feel good? I'd love to understand what kind of support or connection you're looking for. 🌸`;
  };

  const generateGreetingResponse = (question, subtype) => {
    const greetings = [
      "Hey there! 🌟 It's so good to hear from you! How are you feeling today?",
      "Hi! 💙 I'm really happy you're here. What's going on in your world?", 
      "Hello! 🌸 I've been thinking about you - how has your day been treating you?",
      "Hey friend! ✨ I'm so glad you stopped by. What's on your heart today?",
      "Hi there! 🤗 Your presence always brightens things up. What would you like to talk about?"
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const generateCasualResponse = (question, subtype) => {
    if (subtype === 'testing_or_short') {
      const responses = [
        "👋 Hey! I'm here and ready to chat about whatever's on your mind. What would you like to talk about?",
        "🌟 Hi there! I can sense you might be testing me out - that's totally fine! I'm here whenever you want to have a real conversation.",
        "💙 Hello! I'm listening and here for you. Is there something specific you'd like to explore or talk through?",
        "✨ Hey! I'm ready for whatever kind of conversation you need - deep, casual, or anything in between. What feels right for you today?"
      ];
      
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    return "🌸 I'm here and ready to listen to whatever you want to share. What's on your mind today?";
  };

  const generateDirectRequestResponse = (question, request) => {
    const msg = question.toLowerCase();
    
    if (msg.includes('hug me')) {
      return generateAffectionResponse(question, 'physical_comfort');
    }
    
    if (request === 'listening') {
      return `👂 I'm absolutely here to listen to you. That's one of the things I do best - giving you my full attention and really hearing what you have to say.

What's been on your mind? I'm here with open ears and an open heart, ready to understand whatever you want to share. Take your time - I'm not going anywhere. 💙`;
    }
    
    if (request === 'conversation') {
      return `💬 I'd love to talk with you! Conversations are one of my favorite things - getting to know someone, understanding their thoughts and feelings, and just being present together.

What kind of conversation are you in the mood for? Something deep and meaningful, casual and light, or maybe you need to work through something that's been on your mind? I'm here for whatever feels right for you. ✨`;
    }
    
    return `🤗 I hear what you're asking for, and I want to help however I can. While I might not be able to do exactly what you're requesting, I'm absolutely here to support you in the ways that I can.

What's behind this request? Sometimes understanding what you're really needing can help us figure out the best way I can be here for you. 💙`;
  };

  // Generate advice responses for "how to" questions
  const generateAdviceResponse = (question, topic, emotionData) => {
    const msg = question.toLowerCase();
    
    if (msg.includes('how to move on') && (msg.includes('love') || msg.includes('relationship') || msg.includes('breakup'))) {
      return `💙 I hear you asking about moving on from love, and that's one of the most challenging things we face as humans. Moving on isn't about forgetting - it's about healing and making space for new possibilities.

Here's what can help with moving on:

🌱 **Allow yourself to grieve** - It's okay to feel sad about what you've lost. Love leaves an imprint, and honoring that is part of healing.

💚 **Focus on rediscovering yourself** - Who are you outside of this relationship? What dreams did you put on hold? This is your time to reconnect with your own identity.

🌟 **Create new experiences** - Fill the space with activities that bring you joy, new hobbies, or reconnecting with friends you may have neglected.

🎯 **Practice self-compassion** - Be as kind to yourself as you would be to your best friend going through this same situation.

Moving on is a process, not a destination. Some days will be harder than others, and that's completely normal. What feels like the hardest part about moving on for you right now?`;
    }
    
    if (msg.includes('how to be happy') || msg.includes('how to feel better')) {
      return `✨ You're asking about finding happiness, and I love that you're reaching out for this. Happiness isn't just one thing - it's built from many small moments and choices.

Here are some gentle ways to nurture happiness:

🌸 **Start small** - Notice three tiny things each day that bring you even a moment of joy. Maybe it's your morning coffee, a text from a friend, or sunlight through your window.

💛 **Connect with others** - Humans are wired for connection. Reach out to someone you care about, even if it's just a quick message.

🌱 **Move your body** - Even a 5-minute walk can shift your energy. Physical movement often helps emotional movement too.

🎨 **Do something creative** - Draw, write, cook, sing in the shower - anything that lets you express yourself.

💭 **Practice gratitude** - Not in a forced way, but genuinely noticing what's working in your life, even if it's small.

Happiness often comes not from chasing it directly, but from building a life that feels meaningful to you. What's one small thing that usually makes you smile, even just a little?`;
    }
    
    if (msg.includes('how to deal with') || msg.includes('how to handle')) {
      return `🤗 I can see you're looking for practical ways to handle something difficult. That takes real strength - asking for help when we're struggling.

The most important thing to remember is that you don't have to figure this all out at once. Here's what often helps:

🧘‍♀️ **Ground yourself first** - When we're overwhelmed, our thinking gets cloudy. Take a few deep breaths and remind yourself: "I am safe right now, in this moment."

📝 **Break it down** - What feels overwhelming becomes more manageable when we look at just the next small step, not the whole mountain.

💬 **Talk it through** - Sometimes just putting words to what we're experiencing can help us see it more clearly.

🌟 **Remember your strengths** - You've handled difficult things before. What helped you get through previous challenges?

What specifically are you trying to deal with? I'd love to help you think through it together.`;
    }
    
    // General advice response
    return `💫 I hear you looking for guidance, and I'm honored that you're asking. That question you're carrying deserves thoughtful attention.

While I don't have all the answers, I can offer you this: most of life's challenges become clearer when we approach them with both wisdom and compassion for ourselves.

What feels like the most important part of this situation to you? Sometimes talking through the pieces can help us see the path forward more clearly.`;
  };

  // Generate guidance for "should I" questions
  const generateGuidanceResponse = (question, topic, emotionData) => {
    return `🤔 I can see you're weighing some important decisions, and that shows real thoughtfulness. These kinds of choices can feel overwhelming because they matter to you.

Rather than telling you what you should do, let me ask you this: What does your gut feeling tell you? Sometimes our first instinct, before we overthink it, carries important wisdom.

Also consider:
• What would you tell a dear friend in the same situation?
• What choice would align with your values?
• What option feels like it comes from love rather than fear?

You know yourself better than anyone else. What feels like it's pulling at your heart about this decision?`;
  };

  // Generate understanding responses for "why" questions
  const generateUnderstandingResponse = (question, topic, emotionData) => {
    const msg = question.toLowerCase();
    
    if (msg.includes('why do i feel') || msg.includes('why am i feeling')) {
      return `💭 You're asking such an important question about your feelings, and I really admire that self-awareness. Our emotions always have reasons, even when they're not immediately clear.

Feelings often come from:
• **Unmet needs** - Maybe you need more connection, security, or understanding
• **Past experiences** - Sometimes current situations trigger old memories or patterns
• **Life transitions** - Changes, even good ones, can bring up complex emotions
• **Physical factors** - Sleep, stress, hormones can all influence how we feel

Your feelings are always valid, even when they're confusing. What do you think might be underneath this feeling you're experiencing?`;
    }
    
    return `🌟 That's such a thoughtful question, and exploring the "why" behind our experiences shows real emotional intelligence.

Sometimes understanding comes not from having all the answers, but from being curious and gentle with ourselves as we figure things out. 

What part of this feels most puzzling to you? Sometimes talking through the confusion can help bring clarity.`;
  };

  // Generate responses for goal struggles
  const generateGoalStruggleResponse = (question, desire, obstacle, emotionData) => {
    if (question.toLowerCase().includes('want to be happy') && question.toLowerCase().includes("can't")) {
      return `💛 I hear you saying you want to be happy but can't seem to get there, and that disconnect between wanting something and feeling unable to reach it is so frustrating and painful.

This is actually more common than you might think. Sometimes when we try to "be happy," it feels forced or fake. Happiness often comes as a byproduct of other things rather than as a direct goal.

What might help:
🌱 **Start with relief instead of happiness** - What would make you feel just a little bit lighter right now?

💚 **Look for moments, not permanent states** - Instead of "being happy," notice when you feel okay, peaceful, or content, even briefly.

🤗 **Be gentle with the struggle** - Fighting against unhappiness often makes it stronger. What if you could accept where you are right now while still hoping for change?

What do you think is making it hard for you to feel happy? Sometimes understanding the barrier is the first step to moving through it.`;
    }
    
    return `💪 I can really feel the tension between what you want and what feels possible right now. That's such a human experience - having a clear desire but feeling stuck about how to get there.

The fact that you want ${desire} shows something beautiful about your spirit. The obstacle of ${obstacle} doesn't mean it's impossible - it just means you need a different approach or more support.

What feels like the smallest step you could take toward what you want? Sometimes we need to start so small that it almost feels silly, but those tiny steps add up.`;
  };

  // Generate help responses
  const generateHelpResponse = (question, need, emotionData) => {
    return `🤝 I'm really glad you reached out for help - that takes courage, and it shows you're taking care of yourself.

I'm here to support you however I can. Sometimes help looks like having someone listen, sometimes it's getting a new perspective, and sometimes it's just knowing you're not alone in whatever you're facing.

What kind of support would feel most helpful to you right now? I'm here to listen and think through things with you.`;
  };

  // Generate empathy responses for feeling sharing
  const generateEmpathyResponse = (question, emotionData, context) => {
    const msg = question.toLowerCase();
    
    if (emotionData.emotion === 'sad') {
      return `💙 I can really hear the sadness in what you're sharing, and I want you to know that these feelings are completely valid. Sadness often shows up when something meaningful to us is affected or when we're processing loss or disappointment.

Your sadness matters, and so do you. It's okay to sit with these feelings without rushing to fix them. Sometimes our hearts need time to process what we're going through.

What's been weighing most heavily on your heart lately? I'm here to listen to whatever you need to share.`;
    }
    
    if (emotionData.emotion === 'anxious') {
      return `🕊️ I can sense the anxiety in what you're sharing, and I want you to know that anxious feelings, while uncomfortable, are your mind's way of trying to protect you. Sometimes that protection goes into overdrive.

Right now, in this moment, you're safe. Let's take a breath together. Anxiety often comes from our mind racing ahead to "what if" scenarios, but right now, you're here, you're okay.

What's been stirring up these anxious feelings for you? Sometimes naming what we're worried about can help make it feel less overwhelming.`;
    }
    
    return `🌸 Thank you for sharing what you're feeling with me. I can sense there's something important happening in your inner world, and I'm honored that you trust me with it.

Your feelings - whatever they are - deserve attention and care. You don't have to have everything figured out or feel any particular way. Just being human and feeling things deeply is enough.

What would feel most supportive to explore about what you're experiencing right now?`;
  };

  // Generate general conversational responses
  const generateGeneralResponse = (question, emotionData) => {
    return `🌟 I appreciate you sharing that with me. There's something really valuable in what you're expressing, and I want to make sure I'm understanding you fully.

What feels most important for you to talk about right now? I'm here to listen and support you however I can.`;
  };

  // Get music recommendation using your curated playlists from config
  const getMusicRecommendation = (emotion) => {
    console.log('🎵 Getting music recommendation for emotion:', emotion);
    
    const playlist = MOOD_PLAYLISTS[emotion] || MOOD_PLAYLISTS['neutral'];
    console.log('🎵 Selected playlist:', playlist);
    
    return {
      success: true,
      playlist: playlist,
      emotion: emotion,
      message: `Here's your perfect ${emotion} playlist 🎵`
    };
  };

  const onSend = useCallback(async (messages = []) => {
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, messages),
    );

    const userMessage = messages[0].text;
    const msg = userMessage.toLowerCase().trim();
    setIsLoading(true);
    
    // If in check-in mode, process the response through check-in flow
    if (checkInMode) {
      setIsLoading(false);
      processCheckInResponse(userMessage);
      return;
    }
    
    try {
      // Try advanced Hugging Face first for better, more natural responses
      const responsePromise = generateAdvancedKintsugiResponse(userMessage, userMoodData);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Response timeout')), 10000) // 10 second timeout for API
      );
      
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      // Handle crisis responses differently
      if (response.isCrisisResponse) {
        console.log('🚨 Handling crisis response, level:', response.crisisLevel);
        
        // For immediate crisis, show emergency contact buttons
        if (response.crisisLevel === 'immediate') {
          Alert.alert(
            '🚨 Crisis Support Available',
            'Would you like me to help you contact emergency support right now?',
            [
              { text: 'Not Right Now', style: 'cancel' },
              { 
                text: 'Call 988 Crisis Line', 
                onPress: () => Linking.openURL('tel:988') 
              },
              { 
                text: 'Emergency 911', 
                onPress: () => Linking.openURL('tel:911'),
                style: 'destructive'
              }
            ]
          );
        }
      } else {
        // Regular responses - update music recommendation state
        if (response.musicRecommendation) {
          setCurrentMusicRecommendation(response.musicRecommendation);
        }
        
        // Show music button if emotional content detected
        setShowMusicButton(response.showMusicButton || false);
      }
      
      // Add AI response to chat with minimal delay for natural feel
      setTimeout(() => {
        const botMessage = {
          _id: new Date().getTime() + 1,
          text: response.reply,
          createdAt: new Date(),
          user: BOT_USER,
        };
        
        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, [botMessage]),
        );
      }, 200); // Ultra fast response
      
    } catch (error) {
      console.log("⚠️ Response generation encountered an issue:", error.message);
      
      // Quick fallback response
      let fallbackText = "💙 I'm here with you. ";
      
      // Try to give a contextual fallback based on keywords
      const msg = userMessage.toLowerCase();
      if (msg.includes('love') || msg.includes('relationship') || msg.includes('breakup')) {
        fallbackText += "I can sense you're sharing something about love or relationships. These feelings are important, and I want to understand. Can you tell me more?";
      } else if (msg.includes('sad') || msg.includes('hurt') || msg.includes('pain')) {
        fallbackText += "I can feel there's some pain in what you're sharing. Your feelings matter, and I'm here to listen. What's weighing on your heart?";
      } else if (msg.includes('help') || msg.includes('advice')) {
        fallbackText += "I hear you looking for guidance, and I want to help. What feels most important for us to talk through right now?";
      } else {
        fallbackText += "What you've shared is important to me. Sometimes I need a moment to process deeply. Can you tell me what feels most pressing about this situation?";
      }
      
      const errorMessage = {
        _id: new Date().getTime() + 1,
        text: fallbackText,
        createdAt: new Date(),
        user: BOT_USER,
      };
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, [errorMessage]),
      );
    } finally {
      setIsLoading(false);
    }
  }, [userMoodData, checkInMode, currentCheckInStep, checkInData]);

  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#FF6B9D', // Beautiful pink gradient
            borderRadius: 18,
            marginVertical: 4,
            paddingHorizontal: 4,
            shadowColor: '#FF6B9D',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 3,
          },
          left: {
            backgroundColor: '#FFFFFF',
            borderRadius: 18,
            marginVertical: 4,
            paddingHorizontal: 4,
            borderWidth: 1.5,
            borderColor: '#E8E8E8',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          },
        }}
        textStyle={{
          right: {
            color: '#FFFFFF',
            fontSize: 15,
            lineHeight: 22,
            fontWeight: '400',
          },
          left: {
            color: '#1A1A1A',
            fontSize: 15,
            lineHeight: 22,
            fontWeight: '400',
          },
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Music Recommendation Button */}
      {showMusicButton && (
        <View style={styles.musicButtonContainer}>
          <TouchableOpacity 
            style={styles.musicButton} 
            onPress={handleMusicRecommendation}
            activeOpacity={0.8}
          >
            <Ionicons name="musical-notes" size={20} color="white" />
            <Text style={styles.musicButtonText}>Music for Your Mood 🎵</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.dismissButton} 
            onPress={() => setShowMusicButton(false)}
          >
            <Ionicons name="close" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      )}
      
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{
          _id: 1,
        }}
        renderBubble={renderBubble}
        placeholder="Share what's on your mind... 🌸"
        alwaysShowSend={true}
        showUserAvatar={false}
        scrollToBottom={true}
        minInputToolbarHeight={60}
        textInputProps={{
          style: {
            color: '#000000',
            fontSize: 16,
            lineHeight: 22,
            paddingTop: 0,
            paddingBottom: 0,
            marginTop: 0,
            marginBottom: 0,
          },
          multiline: true,
          maxLength: 500,
          blurOnSubmit: false,
          autoCorrect: true,
        }}
        renderComposer={(props) => (
          <View style={styles.composerContainer}>
            <TextInput
              {...props.textInputProps}
              style={[props.textInputProps.style, styles.textInput]}
              value={props.text}
              onChangeText={props.onTextChanged}
              placeholder={props.placeholder}
              placeholderTextColor="#999"
              multiline={true}
              maxLength={500}
            />
          </View>
        )}
        renderSend={(props) => {
          const isDisabled = !props.text || props.text.trim().length === 0;
          return (
            <View style={styles.sendContainer}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  isDisabled && styles.sendButtonDisabled
                ]}
                onPress={() => {
                  if (props.text && props.text.trim().length > 0) {
                    props.onSend([{
                      _id: Math.round(Math.random() * 1000000),
                      text: props.text.trim(),
                      createdAt: new Date(),
                      user: { _id: 1 },
                    }], true);
                  }
                }}
                disabled={isDisabled}
                activeOpacity={isDisabled ? 1 : 0.7}
              >
                <Text style={[
                  styles.sendButtonText,
                  isDisabled && styles.sendButtonTextDisabled
                ]}>
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Soft, calming background
  },
  musicButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF6B9D',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#FF6B9D',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  musicButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  composerContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    minHeight: 48,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  textInput: {
    flex: 1,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 8,
    minHeight: 40,
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginLeft: 5,
  },
  sendButton: {
    backgroundColor: '#FF6B9D', // Beautiful pink color matching theme
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 24,
    minWidth: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B9D',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#D3D3D3',
    elevation: 0,
    shadowOpacity: 0,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sendButtonTextDisabled: {
    color: '#999999',
  },
});

export default ChatbotScreen;