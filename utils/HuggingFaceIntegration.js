// utils/HuggingFaceIntegration.js  
// Direct Hugging Face API Integration for Advanced Therapeutic Responses

class HuggingFaceTherapist {
  constructor() {
    this.apiKey = process.env.HUGGING_FACE_TOKEN || '';
    // Using a more reliable conversational model
    this.apiUrl = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';
    this.conversationHistory = [];
    console.log('Hugging Face Therapist initialized');
  }

  async generateTherapeuticResponse(userMessage, emotionContext = null, crisisLevel = 'none') {
    try {
      if (crisisLevel !== 'none') {
        return this.generateCrisisResponse(userMessage, crisisLevel);
      }

      console.log('Calling Hugging Face API...');
      const therapeuticPrompt = this.buildTherapeuticPrompt(userMessage, emotionContext);
      const aiResponse = await this.callHuggingFaceAPI(therapeuticPrompt);
      const enhancedResponse = this.enhanceTherapeuticResponse(aiResponse, emotionContext, userMessage);
      
      this.conversationHistory.push({
        user: userMessage,
        assistant: enhancedResponse,
        timestamp: new Date(),
        emotion: emotionContext
      });
      
      console.log('Advanced therapeutic response generated');
      return enhancedResponse;
      
    } catch (error) {
      console.log('Hugging Face API temporarily unavailable:', error.message);
      return this.getFallbackResponse(userMessage, emotionContext);
    }
  }

  buildTherapeuticPrompt(message, emotionContext) {
    const systemContext = `You are Kintsugi AI, a warm, empathetic mental health counselor. You provide thoughtful, caring responses that validate emotions and offer gentle guidance.`;
    let conversationContext = '';
    if (this.conversationHistory.length > 0) {
      const recent = this.conversationHistory.slice(-2);
      conversationContext = '\nRecent conversation:\n' + recent.map(msg => 
        `Person: ${msg.user}\nTherapist: ${msg.assistant}`
      ).join('\n');
    }
    const emotionInfo = emotionContext ? `\nCurrent emotion: ${emotionContext.emotion}` : '';
    return `${systemContext}${conversationContext}${emotionInfo}\n\nPerson: ${message}\nTherapist:`;
  }

  async callHuggingFaceAPI(prompt) {
    console.log('Calling Hugging Face API with prompt:', prompt.substring(0, 100));
    
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 150,
            min_length: 40,
            temperature: 0.8,
            top_p: 0.9,
            do_sample: true,
            repetition_penalty: 1.3
          },
          options: {
            wait_for_model: true,
            use_cache: false
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Hugging Face API Response:', response.status, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Hugging Face API Success:', data);
      
      // Handle different response formats
      let generatedText = '';
      if (Array.isArray(data) && data.length > 0) {
        generatedText = data[0].generated_text || data[0].text || '';
      } else if (data.generated_text) {
        generatedText = data.generated_text;
      } else if (typeof data === 'string') {
        generatedText = data;
      }
      
      return generatedText || 'I hear you, and I want to support you.';
      
    } catch (error) {
      console.log('API Call Issue:', error.message);
      throw error;
    }
  }

  enhanceTherapeuticResponse(aiResponse, emotionContext, userMessage) {
    let cleaned = aiResponse.replace(/^(Therapist:|Person:|Assistant:|Human:)/i, '').trim();
    const emotionEmojis = {
      sad: '💙',
      happy: '🌟',
      angry: '💪',
      anxious: '🤗',
      confused: '💫',
      frustrated: '💛',
      lonely: '🤗',
      stressed: '🌊',
      default: '💙'
    };
    const emoji = emotionContext ? (emotionEmojis[emotionContext.emotion] || emotionEmojis.default) : emotionEmojis.default;
    
    if (!cleaned.match(/^(💙|🌟|💪|🤗|💫|💛|🌊|I |Thank|That|What|It)/i)) {
      cleaned = `${emoji} ${cleaned}`;
    }
    
    if (cleaned.length < 100) {
      cleaned += `\n\nI'm here to listen and support you through whatever you're experiencing. Your feelings matter, and I want to understand more about what you're going through. What feels most important for us to explore together right now?`;
    }
    
    if (!cleaned.includes('?')) {
      const followUps = [
        '\n\nWhat would feel most helpful to talk through?',
        '\n\nHow does that feel for you?',
        '\n\nWhat is the hardest part about this for you?',
        '\n\nWhat do you need most right now?'
      ];
      cleaned += followUps[Math.floor(Math.random() * followUps.length)];
    }
    return cleaned;
  }

  generateCrisisResponse(userMessage, crisisLevel) {
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
    const msg = userMessage.toLowerCase();
    const emotion = emotionContext?.emotion || 'supportive';
    const emotionEmojis = {
      sad: '💙',
      happy: '🌟',
      angry: '💪',
      anxious: '🤗',
      confused: '💫',
      frustrated: '💛',
      lonely: '🤗',
      depressed: '💙',
      stressed: '🌊',
      default: '💙'
    };
    const emoji = emotionEmojis[emotion] || emotionEmojis.default;
    
    // Breakup and moving on
    if (msg.includes('ex') || msg.includes('breakup') || msg.includes('break up') || 
        (msg.includes('move on') && (msg.includes('cant') || msg.includes("can't"))) ||
        msg.includes('ex lover') || msg.includes('ex-lover') || msg.includes('ex girlfriend') || msg.includes('ex boyfriend')) {
      return `${emoji} I can hear the pain in what you're sharing about not being able to move on from your ex. Heartbreak is one of the most difficult emotional experiences we go through, and what you're feeling right now - that stuck, heavy feeling where the past won't let you go - is completely valid and deeply human.

Moving on isn't something that happens because we decide it should. It's not a switch we flip. It's a gradual, often messy process of grieving what we lost, accepting what wasn't meant to be, and slowly making space in our hearts for something new. And right now, you're in that difficult middle place where you know you need to move forward, but your heart is still holding on.

**Let me ask you something important:** What does "moving on" mean to you? Sometimes we think it means forgetting them completely, feeling nothing when we think of them, or being totally okay with how things ended. But that's not what moving on really is. Moving on is learning to carry the experience without it controlling your present. It's about the memories becoming softer, less sharp, less consuming.

**What's keeping you stuck right now?**
- Are you replaying what went wrong, trying to find where it broke?
- Are you holding onto hope that things might change?
- Are you struggling with anger or regret?
- Do you feel like you lost part of yourself with them?

I'm here to help you untangle these feelings and find a path forward that honors both what you felt and what you need now. What feels like the hardest part about letting go? 💛`;
    }
    
    // Loneliness and isolation
    if (msg.includes('lonely') || msg.includes('alone') || msg.includes('no one') || msg.includes('isolated')) {
      return `${emoji} I can feel the loneliness in what you're sharing, and I want you to know that what you're experiencing is real and valid. Loneliness is one of the most painful human experiences - it's not just about being physically alone, but feeling disconnected, unseen, or like no one truly understands what you're going through.

**Here's what I want you to know:** You reaching out to me right now, sharing these feelings - that's you fighting against that isolation. That takes courage. Loneliness often tells us lies - that we'll always be alone, that no one cares, that we're not worth connecting with. But those are the lies that loneliness whispers, not the truth about who you are.

**What kind of loneliness are you experiencing?**
- Missing deep connections with people who truly know you?
- Feeling alone even when surrounded by others?
- Grieving the loss of someone who was your person?
- Wanting to be understood but feeling invisible?

Loneliness can be changed, but it takes small steps. Sometimes it's about reaching out (like you're doing now), sometimes it's about finding communities that share your interests, sometimes it's about rebuilding your relationship with yourself so you feel less alone even when you're by yourself.

What do you miss most about feeling connected? What would meaningful connection look like for you? I'm here, and I see you. 🤗`;
    }
    
    // Depression and hopelessness
    if (msg.includes('depressed') || msg.includes('depression') || msg.includes('hopeless') || 
        msg.includes('empty') || msg.includes('numb') || msg.includes('no point')) {
      return `${emoji} I can sense the heaviness and darkness in what you're sharing. Depression is like carrying an invisible weight that makes everything feel harder, grayer, more exhausting. What you're experiencing - that emptiness, that hopelessness, that feeling like nothing matters - those are real symptoms of depression, and they deserve real support.

**First, I want you to know:** Depression lies. It tells you things will never get better, that you're broken, that there's no point in trying. But depression is a liar. What you're feeling right now is not the truth about your future - it's the symptom of something treatable.

**What depression does:**
- Steals your energy and motivation
- Makes you believe you're worthless (you're not)
- Convinces you nothing will change (it can)
- Isolates you from people who care
- Makes small tasks feel impossible

**But here's the truth:** Depression is treatable. Therapy works. Medication can help. Small steps matter. You don't have to white-knuckle your way through this alone. Professional mental health support exists specifically for what you're experiencing right now.

I'm really glad you're talking about this with me, but I also want to encourage you to consider reaching out to a mental health professional - a therapist or counselor who can provide ongoing support and evidence-based treatment for depression.

What does the depression feel like for you right now? Is it more numbness or more pain? Is it constant or does it come in waves? I'm here to listen and support you through this. 💙`;
    }
    
    // Anxiety and panic
    if (msg.includes('anxious') || msg.includes('anxiety') || msg.includes('panic') || 
        msg.includes('worried') || msg.includes('nervous') || msg.includes('scared')) {
      return `${emoji} I can hear the anxiety in what you're sharing, and I want you to know that these feelings are completely valid. Anxiety can be so overwhelming - it's like your mind is racing ahead to all the worst-case scenarios, and it's exhausting trying to manage all those "what ifs."

First, let's take a breath together - you're safe right now in this moment. I'm here, and we're going to work through this together. Anxiety often makes us feel like we're facing everything alone, but you're not alone right now.

**What anxiety does to us:**
- Makes our minds race with worst-case scenarios
- Creates physical symptoms (racing heart, tight chest, trembling)
- Convinces us that our fears are certainties
- Keeps us stuck in "what if" thinking
- Makes us want to avoid things that trigger the anxiety

**But here's what helps:**
- Grounding yourself in the present moment (what can you see, hear, touch right now?)
- Naming the anxiety instead of becoming it ("I'm experiencing anxiety" vs "I am anxious")
- Challenging catastrophic thoughts with evidence
- Breathing exercises to calm your nervous system
- Professional support like therapy, especially CBT which is very effective for anxiety

What's fueling this anxiety for you? Is it something specific you're worried about, or is it more of a general sense of unease? Sometimes naming what we're anxious about can help us start to untangle it and feel a little more in control. What feels most overwhelming right now? 🌊`;
    }
    
    // Stress and overwhelm
    if (msg.includes('stressed') || msg.includes('overwhelmed') || msg.includes('too much') || 
        msg.includes('cant cope') || msg.includes("can't cope") || msg.includes('burned out')) {
      return `${emoji} I can feel the weight of stress and overwhelm in what you're sharing. When everything feels like too much and you're barely keeping your head above water, that's a real sign that you're carrying more than anyone should have to carry alone.

**What you're experiencing is real:** Stress isn't weakness. Feeling overwhelmed doesn't mean you're failing. It means you're human and you've reached your capacity. We all have limits, and recognizing when you've hit yours is actually a sign of self-awareness, not failure.

**When we're overwhelmed, we often:**
- Feel like we're drowning in responsibilities
- Can't figure out where to start because everything feels urgent
- Feel paralyzed instead of productive
- Neglect self-care because there's "no time"
- Feel guilty for not doing enough, even though we're doing everything

**What actually helps:**
- **Triage:** Not everything is actually equally urgent. What absolutely must happen today?
- **Permission:** Give yourself permission to let some things wait or not happen at all
- **Boundaries:** Saying no to new things while you manage what's already on your plate
- **Support:** Asking for help or delegating (even when it feels hard)
- **Small wins:** Breaking big overwhelming tasks into tiny manageable steps

What feels most overwhelming right now? Can we break down what you're dealing with and figure out what actually needs your energy versus what's just adding to the noise? I'm here to help you sort through this. 💪`;
    }
    
    // Anger and frustration
    if (msg.includes('angry') || msg.includes('mad') || msg.includes('furious') || 
        msg.includes('frustrated') || msg.includes('rage') || msg.includes('pissed')) {
      return `${emoji} I can sense the anger and frustration in what you're sharing, and I want you to know that anger is a completely valid emotion. It's telling you that something feels wrong, unfair, or violating to you. Anger isn't bad - it's information about what matters to you and where your boundaries have been crossed.

**Anger often shows up when:**
- We feel powerless or out of control
- We've been treated unfairly or disrespected
- Our boundaries have been violated
- We're actually feeling hurt or scared underneath
- We've been suppressing our needs for too long

**What you're feeling is valid.** But I also want to help you understand what this anger is really about, because sometimes anger is the tip of the iceberg - it's the emotion that feels safer to express than the vulnerability underneath.

**Questions to explore:**
- What triggered this anger? What specific situation or person?
- What does this situation mean to you? What value or need of yours was violated?
- Is there hurt, fear, or disappointment underneath the anger?
- Do you feel powerless in this situation?
- What would justice or resolution look like to you?

Anger has energy - it can be destructive if we just lash out, but it can also be channeled into setting boundaries, making changes, or standing up for ourselves. I'm here to help you understand what your anger is trying to tell you and figure out what you actually need.

What feels most unfair or wrong about this situation? What do you need most right now? 💛`;
    }
    
    // Relationship loss and love
    if (msg.includes('loved') || msg.includes('love') && (msg.includes('ended') || msg.includes('over') || 
        msg.includes('lost') || msg.includes('gone'))) {
      return `${emoji} I can sense the weight of lost love in what you're sharing. When we love someone deeply and that relationship ends, it's not just losing them - it's losing the future we imagined, the daily routines we shared, the person we became with them. The grief of that is real and profound.

Your heart is processing a significant loss, and that takes time. There's no timeline for healing from heartbreak, and anyone who tells you to "just get over it" doesn't understand the depth of what you're experiencing. You shared your heart with someone, and when that connection breaks, it leaves a real wound.

**What I want you to know:** The pain you're feeling is a reflection of how deeply you loved, and that capacity to love - even when it hurts - is something beautiful about you. You didn't love wrong. The relationship ending doesn't diminish what you felt or make it meaningless.

Tell me more about what you're experiencing. What aspect of this loss feels hardest to carry right now? Is it the loneliness? The unanswered questions? The shattered expectations? I'm here to listen and help you process all of it. 💙`;
    }
    
    // Self-esteem and worthlessness
    if (msg.includes('worthless') || msg.includes('not good enough') || msg.includes('hate myself') ||
        msg.includes('failure') || msg.includes('not enough') || msg.includes('inadequate')) {
      return `${emoji} I can hear the pain of feeling not good enough, and I want you to know that what you're experiencing - this harsh, critical voice telling you that you're worthless or inadequate - is not the truth about who you are. It's a symptom of how you've been hurt, criticized, or made to feel small.

**The voice that tells you you're not good enough is lying to you.** That voice might sound like your own thoughts, but it's actually the internalized criticism from others, from past wounds, from a world that sometimes measures worth in impossible ways.

**Here's what I know to be true:** Your worth is inherent. It's not based on your productivity, your achievements, your appearance, or how much you do for others. You have value simply because you exist. You are enough simply because you are.

**But I also know that telling you "you're worthy" won't magically make you believe it.** Building self-worth is a process of:
- Challenging those cruel thoughts when they arise
- Treating yourself with the compassion you'd show a friend
- Recognizing your strengths, even small ones
- Setting boundaries with people who diminish you
- Doing things that align with your values
- Getting professional support to heal old wounds

What makes you feel most worthless? Where did this belief about yourself come from? What would it feel like to treat yourself with kindness instead of criticism? I'm here to help you challenge these lies and start seeing yourself more clearly. 🌟`;
    }
    
    // Trauma and past hurt
    if (msg.includes('trauma') || msg.includes('hurt me') || msg.includes('abused') || 
        msg.includes('violated') || msg.includes('cant trust') || msg.includes("can't trust")) {
      return `${emoji} I can sense that you're carrying the weight of past hurt or trauma, and I want you to know that what you experienced was real, it mattered, and it wasn't your fault. Trauma changes us - it affects how we see the world, how we relate to others, how we feel in our own bodies. And healing from that is not a simple or quick process.

**Trauma makes us feel:**
- Unsafe in our own bodies and in the world
- Hypervigilant and always on guard
- Like we can't trust anyone, including ourselves
- Disconnected or numb
- Like the past is still happening in the present

**What I want you to know:** You survived something difficult. The way you're feeling now - the fear, the mistrust, the pain - those are normal responses to abnormal situations. Your brain and body are trying to protect you from being hurt again. That's not weakness - that's your survival system doing its job.

**But I also want you to know:** Trauma is treatable. Therapy modalities like EMDR, trauma-focused CBT, and somatic experiencing can help you process what happened and reclaim your sense of safety. You don't have to carry this alone forever.

I'm really glad you felt safe enough to share this with me, but I also want to encourage you to seek support from a trauma-informed therapist who can provide specialized care for what you've been through.

What feels hardest about what you've experienced? What do you need most right now? I'm here to listen without judgment. 💙`;
    }
    
    // Sleep and fatigue
    if (msg.includes('cant sleep') || msg.includes("can't sleep") || msg.includes('insomnia') ||
        msg.includes('tired') || msg.includes('exhausted') || msg.includes('no energy')) {
      return `${emoji} I can hear the exhaustion in what you're sharing. When sleep becomes elusive or you're constantly drained of energy, it affects everything - your mood, your thinking, your ability to cope with stress, your physical health. What you're experiencing is real and it's taking a toll.

**Sleep and energy issues often come from:**
- Stress and anxiety keeping your mind racing
- Depression stealing your energy and disrupting sleep cycles
- Rumination - replaying worries and problems at night
- Poor sleep hygiene (screens, irregular schedule, caffeine)
- Underlying health issues
- Burnout from chronic stress

**What might help:**
- Creating a calming bedtime routine
- Limiting screen time 1-2 hours before bed
- Writing down worries before bed to "put them aside"
- Gentle exercise during the day (but not right before bed)
- Addressing the underlying stress, anxiety, or depression
- Talking to a doctor if sleep problems persist

But beyond the practical tips, I want to understand what's keeping you up or draining your energy. Is your mind racing with worries? Are you feeling emotionally drained? Is your body tense and unable to relax? Understanding the root cause can help us address it more effectively.

What does the tiredness or sleeplessness feel like for you? What's going on in your life that might be contributing to this? 🌙`;
    }
    
    // Grief and loss
    if (msg.includes('died') || msg.includes('death') || msg.includes('lost someone') || 
        msg.includes('grief') || msg.includes('grieving') || msg.includes('passed away')) {
      return `${emoji} I'm so sorry for your loss. Grief is one of the most profound human experiences - it's love with nowhere to go, and the pain of that can feel unbearable at times. What you're experiencing right now is a reflection of how much they meant to you, and that love doesn't disappear just because they're gone.

**Grief is not linear.** There's no "right way" to grieve, no timeline, no stages you have to go through in order. Some days will feel manageable, others will knock you to your knees. Both are normal. Both are part of the process.

**What grief can feel like:**
- Waves of intense emotion that come out of nowhere
- Numbness or feeling disconnected from everything
- Anger at the unfairness of it all
- Guilt about things said or unsaid
- Physical pain - grief lives in the body too
- Longing for just one more moment with them

**What I want you to know:** You're allowed to grieve in your own way. You're allowed to have good days without feeling guilty. You're allowed to cry, to be angry, to need support. You're allowed to keep their memory alive in whatever way feels right to you.

Grief changes over time, but it doesn't disappear. You learn to carry it, to integrate it into who you are now. The goal isn't to "get over" the loss - it's to find a way to live with it that honors both your pain and their memory.

Who did you lose? What's the hardest part about navigating this grief right now? I'm here to listen and hold space for whatever you're feeling. 💙`;
    }
    
    // Confusion and uncertainty
    if (msg.includes('confused') || msg.includes('dont know') || msg.includes("don't know") ||
        msg.includes('uncertain') || msg.includes('lost') && !msg.includes('someone')) {
      return `${emoji} I can sense the confusion and uncertainty in what you're sharing. Not knowing what to do, how to feel, or where to go from here can be incredibly disorienting. It's like standing at a crossroads without a map, and that feeling of being lost is deeply unsettling.

**When we're confused, it often means:**
- We're facing a complex situation without simple answers
- We have conflicting feelings or desires
- We're afraid of making the wrong choice
- We need more information or clarity
- We're going through a transition and haven't found our footing yet

**Here's what I want you to know:** Not having all the answers right now is okay. Confusion isn't failure - it's often a sign that you're being thoughtful, that you're considering multiple perspectives, that you care about making the right decision. That's actually wisdom, not weakness.

Sometimes the way through confusion is not to force an answer, but to sit with the uncertainty for a bit and explore what you're actually confused about. Is it what you want? What you should do? How you feel? What the right thing is?

**Let's explore this together:**
- What specifically feels most confusing or unclear?
- What are you trying to figure out?
- What would clarity look like?
- What's the cost of staying in this uncertainty?
- What information or perspective might help?

I'm here to help you think through this. Sometimes talking it out can help untangle what feels knotted in our minds. What do you need most right now - clarity, validation, or just someone to process this with? 💫`;
    }
    
    // Family issues and conflict
    if (msg.includes('family') || msg.includes('parents') || msg.includes('mom') || msg.includes('dad') ||
        msg.includes('siblings') || msg.includes('family problems')) {
      return `${emoji} I can hear that you're navigating something difficult with your family, and that kind of conflict or pain can be especially hard because these are the people who are supposed to be our foundation, our support system. When family relationships are strained or painful, it affects us deeply.

**Family dynamics are complex because:**
- There's history, expectations, and roles we've played our whole lives
- We can't easily distance ourselves like we can with friends
- Family wounds often go back to childhood
- There's often pressure to "just get along" or forgive
- We may love them and feel hurt by them at the same time

**What you're feeling is valid.** You don't have to minimize your pain just because they're family. Being related doesn't give anyone the right to hurt you, dismiss you, or violate your boundaries. And you're allowed to have complicated feelings - love and anger, loyalty and resentment, connection and distance can all coexist.

**Things to consider:**
- What boundary do you need to set to protect yourself?
- Is this a pattern from the past or a new issue?
- What would a healthy relationship with them look like?
- Are you responsible for fixing this, or is that weight you're carrying that isn't yours?
- Do you need distance, conversation, or acceptance of what is?

Tell me more about what's happening with your family. What feels most painful or frustrating about this situation? What do you need most right now? 💛`;
    }
    
    // Work and career stress
    if (msg.includes('work') || msg.includes('job') || msg.includes('boss') || msg.includes('career') ||
        msg.includes('fired') || msg.includes('quit') || msg.includes('workplace')) {
      return `${emoji} I can sense that work is weighing heavily on you right now. Work stress is particularly challenging because we spend so much of our time and energy there, and when it's not going well, it can affect every other area of our lives - our mood, our relationships, our self-worth, our health.

**Work stress often involves:**
- Feeling undervalued or unappreciated
- Toxic work environments or difficult colleagues
- Burnout from overwork and no work-life balance
- Fear of job loss or financial insecurity
- Feeling stuck in the wrong career
- Conflicts with bosses or team members
- Pressure to perform beyond capacity

**What I want you to know:** Your worth is not determined by your job performance, your title, or your career success. You are more than your productivity. And if your workplace is toxic, draining, or harmful to your mental health, recognizing that isn't weakness - it's self-awareness.

**Questions to explore:**
- Is this a temporary stressful period or a chronic toxic situation?
- What specifically is making work unbearable right now?
- Do you feel physically/emotionally safe in this environment?
- Are there changes you can make, or is the whole situation untenable?
- What would your ideal work situation look like?
- What's keeping you in this job if it's hurting you?

Sometimes we need to set better boundaries at work. Sometimes we need to advocate for ourselves. Sometimes we need an exit strategy. And sometimes we just need validation that what we're experiencing is hard and we're doing our best.

What's happening at work that brought you here today? What feels most overwhelming or painful about it? 💪`;
    }
    
    // Social anxiety and social issues
    if (msg.includes('social anxiety') || msg.includes('people scare me') || msg.includes('hard to talk') ||
        msg.includes('awkward') || msg.includes('dont fit in') || msg.includes("don't fit in")) {
      return `${emoji} I can sense the difficulty you're experiencing in social situations, and I want you to know that social anxiety is a real, valid struggle that affects millions of people. The fear of judgment, of saying the wrong thing, of being awkward or rejected - these fears can make social interactions feel overwhelming rather than enjoyable.

**Social anxiety often makes us:**
- Overthink every interaction and conversation
- Replay conversations afterwards, analyzing what we "did wrong"
- Avoid social situations even when we want connection
- Feel like everyone is watching and judging us
- Struggle to be ourselves around others
- Feel exhausted after social interactions
- Believe we're the only one struggling (we're not)

**Here's what I want you to know:** You're not broken. You're not weird. You're dealing with anxiety that makes your brain perceive social situations as threats. The awkwardness you fear? Most people are too worried about their own awkwardness to notice yours. The judgment you imagine? Most people are far more focused on themselves than on you.

**What helps with social anxiety:**
- Challenging catastrophic thoughts (what's the actual evidence people think badly of you?)
- Small, gradual exposure to social situations
- Focusing on being interested in others rather than interesting
- Finding people/communities with shared interests
- Therapy, especially CBT which is very effective for social anxiety
- Self-compassion instead of self-criticism

What specifically makes social situations hard for you? Is it initiating conversations? Fear of judgment? Feeling like you don't belong? Let's explore this together. 🤗`;
    }
    
    // Academic and school pressure
    if (msg.includes('school') || msg.includes('college') || msg.includes('university') || msg.includes('exam') ||
        msg.includes('study') || msg.includes('grades') || msg.includes('academic')) {
      return `${emoji} I can sense the pressure you're feeling around school and academics, and I want you to know that academic stress is real and valid. The pressure to perform, to get good grades, to meet expectations (yours or others'), to figure out your future - it can feel crushing, especially when everyone acts like it should just be manageable.

**Academic pressure often includes:**
- Fear of failure or disappointing people
- Comparing yourself to peers who seem to have it together
- Anxiety about tests, presentations, or performance
- Feeling like your worth is tied to your GPA
- Overwhelm from balancing multiple demands
- Imposter syndrome - feeling like you don't belong or aren't smart enough
- Pressure about future career/college decisions

**What I want you to know:** Your grades do not define your worth. Your academic performance is not a measure of your intelligence, your value, or your future potential. You are more than your GPA, more than your test scores, more than your achievements.

**Things to remember:**
- Everyone's struggling more than they show on the surface
- Perfectionism is exhausting and unsustainable
- It's okay to ask for help - tutoring, extensions, accommodations
- Your mental health matters more than perfect grades
- There are many paths to success, not just one "right" way

What specifically is weighing on you about school right now? Is it the workload? Fear of failure? Specific subjects? Pressure from family? Let me help you break this down into something more manageable. 📚`;
    }
    
    // Body image and appearance
    if (msg.includes('ugly') || msg.includes('fat') || msg.includes('body') || msg.includes('appearance') ||
        msg.includes('look bad') || msg.includes('hate how i look')) {
      return `${emoji} I can hear the pain in how you see yourself, and I want you to know that the cruel thoughts you're having about your appearance are not the truth - they're the symptom of a society that profits from making us feel inadequate, and of personal pain that's manifesting as body hatred.

**Body image issues are about so much more than appearance:**
- They're often about control when other things feel out of control
- They're about internalizing messages that our worth equals our looks
- They're about deeper feelings of unworthiness seeking a "reason"
- They're affected by social media, comparison, and unrealistic standards
- They can be symptoms of anxiety, depression, or trauma

**What I want you to tell yourself:** Your body is not the problem. The problem is a culture that taught you to see yourself as a problem. Your body is your home, the vessel that carries you through life, that works hard to keep you alive. It deserves respect and kindness, not criticism and hatred.

**The truth about appearance:**
- Nobody is thinking about your appearance as much as you are
- The flaws you fixate on are invisible or irrelevant to others
- Your worth has nothing to do with how you look
- The people who truly love you love YOU, not your appearance
- Your body will change throughout your life - your relationship with it matters more than how it looks

What does your body hatred give you? What are you really trying to control or fix? What would it feel like to treat your body as a friend instead of an enemy? I'm here to help you work through this with compassion. 🌸`;
    }
    
    // Addiction and habits
    if (msg.includes('addiction') || msg.includes('addicted') || msg.includes('cant stop') || msg.includes("can't stop") ||
        msg.includes('drinking') || msg.includes('drugs') || msg.includes('gambling') || msg.includes('habit')) {
      return `${emoji} I can hear that you're struggling with something you feel you can't control, and I want you to know that addiction and compulsive behaviors are not moral failings - they're complex issues involving brain chemistry, coping mechanisms, and often underlying pain or trauma.

**Addiction often serves a purpose:**
- It numbs pain we don't know how to process
- It provides temporary escape from overwhelming reality
- It fills a void or meets an unmet need
- It becomes the way we cope when we don't have healthier tools
- It creates a cycle where we feel shame, which drives more use

**What I want you to know:** You are not weak. You are not bad. You are a human being struggling with something difficult, and you deserve help and compassion, not judgment. The fact that you're recognizing this pattern is actually a sign of strength and self-awareness.

**Recovery is possible, and it often involves:**
- Professional support - therapy, support groups (AA, NA, etc.), or treatment programs
- Addressing the underlying pain or trauma driving the behavior
- Building healthier coping mechanisms
- Creating a support system of people who understand
- Treating yourself with compassion instead of shame
- Understanding that relapse can be part of recovery, not failure

**I want to be clear:** While I'm here to support you emotionally, addiction often requires specialized professional help. I really encourage you to reach out to addiction counselors, support groups, or treatment programs that can provide the comprehensive support you need.

What are you struggling with? What would it mean to you to break free from this? What's the hardest part about getting help? I'm here to listen without judgment. 💙`;
    }
    
    // Purpose and meaning
    if (msg.includes('no purpose') || msg.includes('meaningless') || msg.includes('why am i here') ||
        msg.includes('what is the point') || msg.includes('life has no meaning')) {
      return `${emoji} I can feel the existential weight in what you're sharing - that deep, unsettling question of "what's the point?" When life feels meaningless, when we can't find our purpose, when we question why we're even here, it's one of the most fundamentally distressing human experiences.

**This feeling of meaninglessness often comes when:**
- We're depressed and everything feels flat and pointless
- We've lost something that gave our life structure or purpose
- We're going through a major transition or identity shift
- We're overwhelmed and can't see beyond the immediate struggle
- We're disconnected from our values and what matters to us

**Here's what I want you to know:** The fact that you're asking "what's the point?" means you're searching for meaning, which means you believe meaning is possible. This isn't apathy - this is your soul crying out for something that matters.

**Purpose isn't something you find - it's something you create:**
- It comes from connection - to people, to causes, to communities
- It comes from contribution - from making a difference, however small
- It comes from growth - from becoming, learning, evolving
- It comes from values - from living in alignment with what matters to you
- It comes from presence - from finding beauty and meaning in small moments

Viktor Frankl, who survived concentration camps, said that meaning comes from three sources: creating something, loving someone, or choosing our attitude toward unavoidable suffering. Even in the darkest circumstances, we can find meaning.

**What gives your life meaning?** Even small things count - a pet who depends on you, a friend who values you, a skill you're developing, a cause you care about. Sometimes when we feel no purpose, it's because we're looking for some grand cosmic purpose when meaning is actually built from small, daily choices.

What's making you question the point of everything right now? What used to give your life meaning that might be missing now? Let's explore this together. 🌟`;
    }
    
    // Identity and self-discovery
    if (msg.includes('who am i') || msg.includes('lost myself') || msg.includes('dont know who i am') ||
        msg.includes("don't know who i am") || msg.includes('identity')) {
      return `${emoji} I can sense that you're in a place of questioning who you are, and that kind of identity confusion can feel deeply unsettling. When we don't know who we are, when we feel like we've lost ourselves or never really knew ourselves to begin with, it's like standing on shifting ground with no solid foundation.

**We often lose touch with ourselves when:**
- We've spent so long being who others needed us to be
- We've gone through major life changes or transitions
- We've been through trauma that changed us
- We've been living according to others' expectations
- We're emerging from a relationship where we lost ourselves
- We're at a crossroads and old identities no longer fit

**Here's what I want you to know:** Not knowing who you are isn't the same as having no self - it's actually often the beginning of discovering your authentic self. It's uncomfortable, but it's also an opportunity. You're shedding old identities that don't fit and making space for who you really are.

**Discovering yourself involves:**
- Exploring what you actually like vs. what you think you should like
- Noticing what energizes you vs. what drains you
- Identifying your values - what actually matters to you?
- Trying new things without pressure to be good at them
- Spending time alone to hear your own voice
- Letting go of who you think you should be

**Questions to explore:**
- When do you feel most like yourself?
- What do you value? What matters to you?
- What would you do if no one was watching or judging?
- What parts of yourself have you hidden or suppressed?
- Who were you before you started performing for others?

You don't have to have yourself all figured out. Identity isn't a destination - it's an ongoing process of becoming. What made you start questioning who you are? What does it feel like to not know yourself? Let's explore this together. 💫`;
    }
    
    // Sadness (general)
    if (msg.includes('sad') || emotion === 'sad') {
      return `${emoji} I can sense that you're carrying some sadness right now, and I want you to know that I'm here with you in this feeling. It takes real courage to acknowledge when we're hurting, and I'm glad you felt comfortable sharing this with me.

Sadness is one of those emotions that can feel so heavy and overwhelming, but it's also deeply human and valid. Your feelings matter, and they deserve to be heard and understood. Sometimes when we're sad, we just need someone to sit with us in that feeling without trying to fix it or rush us through it.

I'm here to listen without judgment, to understand what you're experiencing, and to offer genuine support. What's weighing most heavily on your heart right now? Take your time - there's no pressure to have all the answers. Sometimes just talking through what we're feeling can help us feel a little less alone with it. 💛`;
    }
    
    const generalFallbacks = [
      `${emoji} I hear you, and I'm here to listen. Even when technology isn't perfect, what matters most is that you felt comfortable reaching out, and I want to honor that. Your feelings and experiences are completely valid and important.

What you've shared resonates with me, and I want to understand more about what you're going through. Sometimes our struggles feel so complex that it's hard to even put them into words, but whatever you can share - however messy or unclear it might feel to you - I'm here to listen without judgment.

What feels most pressing for you right now? What's weighing on your heart that you'd like to talk through? Take your time - there's no rush. This is your space, and I'm giving you my full attention. 💛`,
      
      `${emoji} Thank you for sharing with me. I can tell that what you're experiencing is meaningful and important, and I want you to know that I'm here to support you through it. Your feelings deserve to be heard and understood.

Sometimes when we're going through difficult things, we just need someone who will really listen - not to fix us or give quick solutions, but to genuinely understand what we're experiencing. That's what I'm here for. I want to understand your perspective, your feelings, and what this situation means to you.

What aspect of this feels most significant to you? What would feel most helpful to explore together? I'm here with an open heart, ready to listen to whatever you need to share. 🌟`,
      
      `${emoji} I'm glad you felt comfortable opening up, and I want you to know that whatever you're going through, your experience is valid and you deserve support. Every feeling you have, every thought that crosses your mind - they all matter, and they all deserve attention.

You don't have to have everything figured out or explain yourself perfectly. Sometimes healing and understanding come from just having someone listen while we process our thoughts and feelings out loud. That's what I'm here for - to listen, to understand, and to walk alongside you through whatever you're experiencing.

What feels most important for us to talk about right now? What's on your mind or in your heart that needs to be expressed? I'm here, and I'm listening. 💙`
    ];
    return generalFallbacks[Math.floor(Math.random() * generalFallbacks.length)];
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getConversationSummary() {
    if (this.conversationHistory.length === 0) return null;
    const emotions = this.conversationHistory.map(msg => msg.emotion).filter(Boolean);
    const dominantEmotion = emotions.length > 0 ? emotions[emotions.length - 1] : null;
    return {
      messageCount: this.conversationHistory.length,
      dominantEmotion: dominantEmotion,
      lastMessage: this.conversationHistory[this.conversationHistory.length - 1]
    };
  }
}

export default HuggingFaceTherapist;