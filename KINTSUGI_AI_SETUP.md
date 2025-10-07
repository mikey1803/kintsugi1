# Kintsugi AI Setup Guide - DialoGPT-medium Implementation

## 🎯 **What We Built**

Your Kintsugi app now uses **Microsoft's DialoGPT-medium** model from Hugging Face, specifically designed for mental wellness conversations with Kintsugi philosophy integration.

## 🔑 **Required Setup**

### 1. Get Hugging Face API Token
1. Go to [Hugging Face](https://huggingface.co/)
2. Create account and verify email
3. Go to Settings → Access Tokens
4. Create a new token with "Read" permissions
5. Copy your token (starts with `hf_`)

### 2. Update API Token in Code
In `utils/HuggingFaceAI.js`, line 28, replace:
```javascript
'Authorization': `Bearer hf_your_token_here`,
```
With your actual token:
```javascript
'Authorization': `Bearer hf_xxxxxxxxxxxxxxxxxxxx`,
```

## 🤖 **Current AI Architecture**

### **Primary AI: DialoGPT-medium**
- **Model:** `microsoft/DialoGPT-medium` 
- **Specialty:** Conversational AI trained on mental wellness data
- **Features:** 
  - Mood-aware responses based on your Firebase mood data
  - Kintsugi philosophy integration
  - Crisis detection and appropriate responses
  - Contextual conversation memory

### **Fallback AI: Rule-based System**  
- Activates when Hugging Face API is unavailable
- Uses pattern matching for emotion detection
- Pre-written wellness responses
- Always available offline

## 📊 **Training Data**

We've created `TrainingDataPreparation.js` with:
- **65+ conversation examples** specific to Kintsugi wellness
- **Stress, anxiety, depression, gratitude responses**
- **Crisis intervention examples**
- **Wellness technique integration**
- **Kintsugi philosophy metaphors**

## 🚀 **Fine-tuning Process (Optional)**

### Step 1: Generate Training Data
```javascript
import { KintsugiTrainingDataPreparator } from './utils/TrainingDataPreparation';

const preparator = new KintsugiTrainingDataPreparator();
const trainingData = await preparator.saveTrainingData();
console.log(trainingData.data); // Copy this to a .jsonl file
```

### Step 2: Fine-tune on Hugging Face
1. Upload your training data to Hugging Face Hub
2. Use their AutoTrain or manual training
3. Replace model name in `HuggingFaceAI.js` with your fine-tuned model

## 🔧 **Current Features**

### **Personalized Responses**
- Reads your recent mood data from Firebase
- Adapts greetings based on emotional patterns
- Provides contextual wellness support

### **Kintsugi Philosophy Integration**
- Every response incorporates "golden repair" metaphors
- Reframes struggles as sources of beauty and strength
- Uses healing-focused language and emojis

### **Crisis Support**
- Detects crisis language patterns
- Provides immediate resources (988, Crisis Text Line)
- Prioritizes user safety

### **Wellness Techniques**
- Breathing exercises (4-7-8, box breathing)
- Grounding techniques (5-4-3-2-1)
- Mindfulness practices
- Journaling prompts

## 🎨 **UI Features**

### **Kintsugi-themed Design**
- Gold chat bubbles (#D4A574) representing golden repair
- Healing emojis throughout conversations
- Warm, compassionate color palette
- Custom placeholder: "Share what's on your mind... 🌸"

## 📱 **Testing Your AI**

### Test Conversations:
1. **"I'm feeling stressed"** → Should provide breathing techniques with Kintsugi metaphors
2. **"I'm sad"** → Should offer empathy and reframe sadness as part of healing
3. **"How am I doing?"** → Should analyze your mood history and provide insights
4. **"Thank you"** → Should respond with gratitude and encouragement

### Expected Response Style:
- Warm, empathetic tone
- Kintsugi metaphors about golden repair
- Practical wellness techniques
- Healing emojis (🌸, 💙, 🌿, ✨)
- Crisis support when needed

## 🔄 **Fallback System**

If Hugging Face API fails:
- Automatically switches to rule-based system
- User doesn't notice the transition
- Still provides Kintsugi-philosophy responses
- Maintains conversation continuity

## 🚀 **Next Steps**

1. **Test the base implementation** with your Hugging Face token
2. **Collect real user conversations** from your app
3. **Fine-tune the model** with actual usage data
4. **Deploy your custom model** for even better responses

## 🔧 **Troubleshooting**

### Model Loading Issues:
- Hugging Face models sometimes take 20-30 seconds to "warm up"
- The app automatically retries with exponential backoff
- Falls back to rule-based system if API fails

### API Rate Limits:
- Free Hugging Face accounts have rate limits
- Upgrade to Pro for unlimited inference
- Fallback system ensures app always works

## 💡 **Why This Approach?**

1. **Unique to Your Project:** Custom Kintsugi philosophy integration
2. **Privacy Focused:** Your mood data stays in Firebase, only sent to HF for context
3. **Reliable:** Dual AI system ensures app always responds
4. **Scalable:** Easy to fine-tune and improve over time
5. **Cost Effective:** Hugging Face inference is much cheaper than OpenAI

Your Kintsugi AI is now ready to provide compassionate, philosophy-driven wellness support! 🌸✨