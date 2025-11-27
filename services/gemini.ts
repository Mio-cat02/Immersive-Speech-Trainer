import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Persona, Topic, Difficulty } from '../types';
import { decodeBase64 } from '../utils/audio';

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for the logic model
const ChatResponseSchema = {
  type: Type.OBJECT,
  properties: {
    ai_response_text: {
      type: Type.STRING,
      description: "The text of what the AI persona says to the user."
    },
    ai_response_translation: {
      type: Type.STRING,
      description: "Chinese translation of the AI's response."
    },
    suggested_user_script: {
      type: Type.STRING,
      description: "Advice for the user on what to say next. Content depends on Difficulty Level."
    },
    script_translation: {
      type: Type.STRING,
      description: "Chinese translation of the suggested user script (if applicable)."
    },
    feedback: {
      type: Type.STRING,
      description: "Brief feedback on the user's previous input (if any). Correction of grammar or praise."
    }
  },
  required: ["ai_response_text", "ai_response_translation", "suggested_user_script", "script_translation"]
};

// Helper to determine difficulty instructions based on Level
const getLevelInstructions = (level: number) => {
  if (level <= 2) {
    return "User Level: Beginner (Level 1-2). Use simple CET-4 vocabulary. Speak slowly and clearly. Avoid complex idioms.";
  } else if (level <= 5) {
    return "User Level: Intermediate (Level 3-5). Use standard CET-4/6 vocabulary. Introduce compound sentences. Speak at a normal conversational pace.";
  } else {
    return "User Level: Advanced (Level 6+). Use advanced vocabulary and idioms. Speak naturally and fast. Challenge the user with complex questions.";
  }
};

const getDifficultyModeInstructions = (mode: Difficulty) => {
  switch (mode) {
    case Difficulty.LEVEL_1:
      return "Mode: L1 (Full Script). You MUST provide a complete, natural English sentence in 'suggested_user_script' for the user to read exactly.";
    case Difficulty.LEVEL_2:
      return "Mode: L2 (English Script). You MUST provide a complete, natural English sentence in 'suggested_user_script', but make it slightly more complex.";
    case Difficulty.LEVEL_3:
      return "Mode: L3 (Keywords). Do NOT provide a full sentence. In 'suggested_user_script', provide 3-4 key English vocabulary words or a sentence starter (e.g., 'I think that...') that help the user answer.";
    case Difficulty.LEVEL_4:
      return "Mode: L4 (Free Talk). In 'suggested_user_script', provide a short thematic goal or question to guide them (e.g., 'Ask about the price'), but NO actual English words to say.";
    default:
      return "Mode: Guided.";
  }
};

export const generateChatResponse = async (
  history: { role: string; text: string }[],
  userMessage: string,
  persona: Persona,
  topic: Topic,
  difficulty: Difficulty,
  userLevel: number = 1,
  relationshipLevel: number = 0,
  topicMastery: number = 0
) => {
  const modelId = "gemini-2.5-flash"; // Logic model
  
  const levelInstruction = getLevelInstructions(userLevel);
  const modeInstruction = getDifficultyModeInstructions(difficulty);

  // Dynamic persona adjustment based on relationship
  let relationshipInstruction = "";
  if (relationshipLevel < 3) {
    relationshipInstruction = "Relationship: Acquaintance. Be polite, formal, and helpful. Keep boundaries.";
  } else if (relationshipLevel < 7) {
    relationshipInstruction = "Relationship: Friend. Be casual, warm, and joke occasionally. Use contraction words (I'm, It's).";
  } else {
    relationshipInstruction = "Relationship: Close Friend / Bestie. Be very open, share personal opinions, use slang/idioms freely. Show deep empathy.";
  }

  // Mastery Logic
  let masteryInstruction = "";
  if (topicMastery >= 100) {
    masteryInstruction = "TOPIC MASTERY: 100% (MASTER MODE). The user has mastered this topic. Do NOT make it easy. Challenge them with 'What if' scenarios. Ask them to explain their reasoning in detail. Push for 'Variation Practice' (applying the concept to a new context).";
  }

  const systemInstruction = `
    You are ${persona.name}. 
    ${persona.systemPrompt}
    Current Topic: ${topic.title} - ${topic.description}.
    
    ${levelInstruction}
    ${modeInstruction}
    
    SOCIAL CONTEXT:
    ${relationshipInstruction}

    MASTERY CONTEXT:
    ${masteryInstruction}
    
    INSTRUCTIONS:
    1. Respond to the user naturally in character.
    2. Fill 'suggested_user_script' strictly based on the Mode instructions above.
    3. Keep your responses concise (under 40 words) unless in Deep Conversation mode (Relationship > 7).
  `;

  const chat = genAI.chats.create({
    model: modelId,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: ChatResponseSchema
    }
  });
  
  const fullPrompt = `
    Context History:
    ${history.map(h => `${h.role === 'user' ? 'User' : 'AI'}: ${h.text}`).join('\n')}
    
    User: ${userMessage}
    
    Respond in JSON.
  `;

  const response = await genAI.models.generateContent({
    model: modelId,
    contents: fullPrompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: ChatResponseSchema
    }
  });

  return JSON.parse(response.text);
};

export const generateSpeech = async (text: string, voiceName: string) => {
  const modelId = "gemini-2.5-flash-preview-tts";
  
  const response = await genAI.models.generateContent({
    model: modelId,
    contents: {
      parts: [{ text: text }]
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName }
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data returned");
  
  return decodeBase64(base64Audio);
};
