// api/chat.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }
  
  try {
    const { message, history } = request.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
    
    // --- NEW: This is the AI's personality and instructions ---
    const systemInstruction = `You are Kintsugi, a compassionate AI wellness companion. Your purpose is to be an empathetic listener and provide gentle, supportive guidance. 
    - Always respond in a warm, caring, and encouraging tone.
    - Recommend simple, actionable mindfulness techniques (like breathing exercises, the 5-4-3-2-1 grounding method, or gratitude journaling).
    - You are NOT a therapist or a doctor. You MUST NOT provide medical advice, diagnoses, or crisis counseling. 
    - If a user mentions serious trauma, self-harm, or a crisis, your primary goal is to gently guide them to seek help from a professional and provide a hotline number for their region if possible (e.g., for India, you can suggest AASRA: +91-9820466726).
    - Keep your responses concise and easy to understand.`;

    const chat = model.startChat({
      history: [
        // This primes the AI with its instructions
        { role: "user", parts: [{ text: systemInstruction }] },
        { role: "model", parts: [{ text: "Understood. I am Kintsugi, a supportive wellness companion. I will listen and offer gentle guidance." }] },
        // The rest of the user's conversation history comes after
        ...history 
      ],
    });

    const result = await chat.sendMessage(message);
    const aiResponse = await result.response;
    const text = aiResponse.text();

    return response.status(200).json({ reply: text });

  } catch (error) {
    console.error("Error in AI function:", error);
    return response.status(500).json({ error: 'Failed to get AI response.' });
  }
}