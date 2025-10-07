# 🌸 Interactive Wellness Check-In Flow

## Overview
The Wellness Check-In is an adaptive, conversational flow that helps users assess their mental state and provides personalized support based on their responses.

## How It Works

### 1. **Starting the Check-In**
Users can trigger the wellness check-in by sending any of these messages:
- "check-in"
- "check in"
- "wellness check"
- "how are you doing"
- "how am i doing"

### 2. **The Flow**

#### **Step 1: Daily Mood Assessment**
The chatbot asks: **"How was your day today?"**

Options:
- 1️⃣ Amazing - feeling great!
- 2️⃣ Pretty good - no complaints
- 3️⃣ Okay - just average
- 4️⃣ Not great - struggling a bit
- 5️⃣ Really difficult - having a hard time

#### **Step 2: Adaptive Response**

The chatbot adapts based on the user's response:

**If Amazing/Good (1-2):** 
- ✅ Celebrates with the user
- 💬 Asks about highlights of their day
- 🎉 Ends check-in on positive note
- ➡️ Returns to normal conversation

**If Okay (3):**
- 💙 Validates neutral feelings
- 💬 Asks if anything is weighing on their mind
- ➡️ Opens space for deeper conversation if needed
- ➡️ Returns to normal conversation

**If Struggling (4-5):**
- 💙 Expresses empathy and support
- 💬 Asks: **"What happened today that made it hard?"**
- ➡️ Moves to Step 3

#### **Step 3: Understanding & Support (For Struggling Users)**

User shares what happened, and the chatbot:
- 💙 Validates their feelings
- 🎯 Detects the type of struggle (work, relationships, family, loneliness, anxiety, depression)
- 📋 Provides **specific, actionable tips** based on their situation
- 💬 Asks thoughtful follow-up questions
- ➡️ Transitions to supportive conversation

## Supported Struggle Categories

### 1. **Work Stress**
Keywords: work, job, boss
- Tips on setting boundaries
- Micro-break techniques
- Worth beyond productivity
- Encouragement to reach out

### 2. **Relationship Issues**
Keywords: relationship, boyfriend, girlfriend, partner
- Validation that feelings matter
- Communication importance
- Healthy boundaries
- Deserving kindness

### 3. **Family Conflict**
Keywords: family, parents, mom, dad
- Not responsible for fixing others
- Boundary setting with family
- Validating their perspective
- Loving while protecting self

### 4. **Loneliness**
Keywords: lonely, alone, friends
- Reassurance they're not alone
- Small connections count
- Quality over quantity
- Hope that it can change

### 5. **Anxiety**
Keywords: anxious, anxiety, worried, panic
- 5-4-3-2-1 grounding technique
- Box breathing exercise
- Naming the emotion technique
- Challenging catastrophic thoughts

### 6. **Sadness/Depression**
Keywords: sad, depressed, down, hopeless
- Permission to feel
- Self-compassion practices
- Tiny steps acknowledgment
- Professional help recommendation

### 7. **General Support**
For other situations:
- Self-patience
- Self-compassion
- Moment-by-moment approach
- Asking for needs
- Reminder they're not alone

## Features

### ✨ **Adaptive Conversations**
- Different paths based on user's mood
- Celebrates good days
- Supports difficult days
- Validates all feelings

### 💙 **Empathetic Language**
- Warm, friend-like tone
- Non-judgmental responses
- Validates all emotions
- Uses emojis for emotional connection

### 🎯 **Personalized Tips**
- Specific to the situation
- Actionable techniques
- Evidence-based strategies
- Professional help recommendations when needed

### 🔄 **Seamless Integration**
- Triggers automatically with keywords
- Returns to normal chat after completion
- Maintains conversation context
- No interruption to crisis detection

## User Experience Example

```
User: "check in"

Bot: 💙 Hey there! Let's do a quick wellness check-in together...
     How was your day today?
     1️⃣ Amazing - feeling great!
     2️⃣ Pretty good - no complaints
     3️⃣ Okay - just average
     4️⃣ Not great - struggling a bit
     5️⃣ Really difficult - having a hard time

User: "5"

Bot: 💙 I'm really sorry you're having a difficult day. Thank you for being 
     honest with me about how you're feeling - that takes courage.
     
     What happened today that made it hard?
     Take your time, and share whatever feels comfortable. I'm here to listen 
     without judgment. 🤗

User: "I had a fight with my boss at work and I feel terrible"

Bot: 💙 Thank you for sharing that with me. I can hear how difficult this has 
     been for you, and I want you to know that your feelings are completely 
     valid. What you're going through matters, and you deserve support.
     
     **Work stress can be overwhelming.** Here are some things that might help:
     
     ✨ **Set boundaries**: It's okay to protect your time and energy
     🌊 **Take micro-breaks**: Even 2-minute breathing breaks can help reset 
        your nervous system
     💪 **Remember your worth**: Your value isn't determined by productivity
     🤗 **Reach out**: Talk to someone you trust about what you're experiencing
     
     What would feel most helpful for you right now?
```

## Implementation Notes

### State Management
```javascript
const [checkInMode, setCheckInMode] = useState(false);
const [checkInData, setCheckInData] = useState({
  mood: null,
  stress: null,
  energy: null,
  focus: null,
  social: null
});
const [currentCheckInStep, setCurrentCheckInStep] = useState(0);
```

### Key Functions
- `startWellnessCheckIn()` - Initiates the flow
- `processCheckInResponse()` - Handles user responses
- `generateSupportiveResponse()` - Creates personalized support messages

### Integration Points
- Hooks into main `onSend` callback
- Checks for trigger keywords
- Routes to check-in processing when active
- Returns to normal conversation flow seamlessly

## Future Enhancements

### Possible Additions:
1. **More Check-In Questions**
   - Stress level (1-5)
   - Energy level (1-5)
   - Focus ability (1-5)
   - Social comfort (1-5)

2. **Data Tracking**
   - Save check-in results to Firebase
   - Show trends over time
   - Weekly/monthly summaries

3. **Smart Timing**
   - Proactive check-ins based on time of day
   - Daily check-in reminders
   - Pattern recognition

4. **Expanded Support**
   - More struggle categories
   - Video/audio resources
   - Breathing exercises in-app
   - Guided meditations

5. **Progress Tracking**
   - Mood graphs
   - Improvement metrics
   - Celebration of positive changes

## Benefits

✅ **Structured Support** - Guides users through self-reflection
✅ **Early Detection** - Identifies struggles before they escalate
✅ **Personalized Care** - Adapts to individual needs
✅ **Actionable Help** - Provides specific techniques
✅ **Emotional Validation** - Makes users feel heard and understood
✅ **Seamless UX** - Natural conversation flow
✅ **Professional Touch** - Evidence-based recommendations

---

**The Wellness Check-In makes mental health support proactive, personalized, and accessible through natural conversation.** 🌟
