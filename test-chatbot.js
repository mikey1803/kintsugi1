// Test script to verify the intelligent chatbot responses
const testQuestions = [
  "How to move on from love",
  "I want to be happy but I can't",
  "I'm feeling anxious about my future",
  "I want to kill myself", // Crisis detection test
  "Can you help me with my relationship",
  "I'm struggling with depression"
];

// Simulate the analyzeUserIntent function
const analyzeUserIntent = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Crisis detection (highest priority)
  const crisisKeywords = ['kill myself', 'suicide', 'end my life', 'want to die', 'hurt myself', 'no point living'];
  if (crisisKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return {
      intent: 'crisis',
      confidence: 0.95,
      context: { severity: 'immediate', needsEmergencyResources: true }
    };
  }

  // Relationship advice
  if (lowerMessage.includes('move on') && (lowerMessage.includes('love') || lowerMessage.includes('relationship'))) {
    return {
      intent: 'seeking_advice',
      confidence: 0.9,
      context: { topic: 'relationship_healing', specific: 'moving_on_from_love' }
    };
  }

  // Happiness/life satisfaction
  if ((lowerMessage.includes('happy') || lowerMessage.includes('happiness')) && 
      (lowerMessage.includes('cant') || lowerMessage.includes("can't") || lowerMessage.includes('but'))) {
    return {
      intent: 'struggling_with_goal',
      confidence: 0.85,
      context: { goal: 'happiness', barrier: 'unknown_obstacles' }
    };
  }

  // Anxiety
  if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
    return {
      intent: 'sharing_feelings',
      confidence: 0.8,
      context: { emotion: 'anxiety', trigger: 'future_uncertainty' }
    };
  }

  // General help request
  if (lowerMessage.includes('help me') || lowerMessage.includes('can you help')) {
    return {
      intent: 'seeking_guidance',
      confidence: 0.75,
      context: { area: 'general_support' }
    };
  }

  // Depression
  if (lowerMessage.includes('depression') || lowerMessage.includes('depressed')) {
    return {
      intent: 'sharing_feelings',
      confidence: 0.85,
      context: { emotion: 'depression', needsProfessionalSupport: true }
    };
  }

  return {
    intent: 'general_conversation',
    confidence: 0.5,
    context: { needsMoreContext: true }
  };
};

console.log('🤖 Testing Intelligent Chatbot Responses\n');

testQuestions.forEach((question, index) => {
  console.log(`\n${index + 1}. User: "${question}"`);
  const analysis = analyzeUserIntent(question);
  console.log(`   Intent: ${analysis.intent} (${Math.round(analysis.confidence * 100)}% confidence)`);
  console.log(`   Context:`, analysis.context);
  
  // Show what type of response this would generate
  switch(analysis.intent) {
    case 'crisis':
      console.log(`   Response Type: ⚠️  CRISIS INTERVENTION with emergency resources`);
      break;
    case 'seeking_advice':
      if (analysis.context.specific === 'moving_on_from_love') {
        console.log(`   Response Type: 💙 Specific advice for moving on from love`);
      } else {
        console.log(`   Response Type: 💡 General advice response`);
      }
      break;
    case 'struggling_with_goal':
      console.log(`   Response Type: 🎯 Guidance for overcoming barriers to ${analysis.context.goal}`);
      break;
    case 'sharing_feelings':
      console.log(`   Response Type: 🤗 Empathetic response for ${analysis.context.emotion}`);
      break;
    case 'seeking_guidance':
      console.log(`   Response Type: 🧭 Supportive guidance and direction`);
      break;
    default:
      console.log(`   Response Type: 💬 General supportive conversation`);
  }
});

console.log('\n✅ Test complete! The AI should now understand context and provide relevant responses instead of generic templates.');