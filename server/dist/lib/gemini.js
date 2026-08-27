import { GoogleGenAI } from '@google/genai';
import { ENV } from '../config/env.js';
let aiClient = null;
if (ENV.GEMINI_API_KEY) {
    try {
        aiClient = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
        console.log(`✅ Google Gen AI Client initialized with model: ${ENV.GEMINI_MODEL}`);
    }
    catch (error) {
        console.error('❌ Failed to initialize Google Gen AI Client:', error);
    }
}
const SYSTEM_INSTRUCTION = `You are AskFlow AI, an intelligent, helpful, and concise AI assistant built with modern full-stack technology. 
You provide accurate, well-structured, and markdown-formatted answers. 
When writing code, always specify the language for syntax highlighting.
Be friendly, insightful, and clear.`;
/**
 * Generate AI response using Google Gemini API (@google/genai)
 */
export async function generateGeminiResponse(history, currentPrompt) {
    // If Gemini API is configured, use the official @google/genai client
    if (aiClient && ENV.GEMINI_API_KEY) {
        try {
            // Build contents array for multi-turn conversation
            const contents = [];
            // Map prior messages into Gemini contents format
            for (const msg of history) {
                contents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }],
                });
            }
            // Append current user prompt
            contents.push({
                role: 'user',
                parts: [{ text: currentPrompt }],
            });
            const response = await aiClient.models.generateContent({
                model: ENV.GEMINI_MODEL,
                contents: contents,
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    temperature: 0.7,
                },
            });
            const text = response.text;
            if (text && text.trim().length > 0) {
                return text;
            }
            return 'I processed your request, but received an empty response. Please try rephrasing.';
        }
        catch (error) {
            console.error('❌ Error calling Gemini API via @google/genai:', error);
            // If error is related to quota or API key, provide informative error
            if (error?.status === 403 || error?.message?.includes('API key')) {
                throw new Error('Invalid or missing Google Gemini API Key. Please verify your GEMINI_API_KEY in server/.env');
            }
            throw new Error(`Gemini API error: ${error?.message || 'Failed to generate response'}`);
        }
    }
    // Graceful fallback simulation when GEMINI_API_KEY is not yet configured
    console.log('⚡ Generating simulated response (GEMINI_API_KEY not configured)');
    return simulateAiResponse(currentPrompt);
}
/**
 * Fallback response simulator for instant exploration before adding API keys
 */
function simulateAiResponse(prompt) {
    const lower = prompt.toLowerCase();
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        return `👋 **Hello! Welcome to AskFlow AI.**

I am your AI assistant powered by Google Gemini. How can I help you today?

Here are some things we can do:
- 💡 Brainstorm ideas and write creative content
- 💻 Generate code snippets and debug technical problems
- 📊 Analyze data and explain complex concepts
- 📝 Draft emails, documentation, or summaries

Feel free to ask me anything!`;
    }
    if (lower.includes('react') || lower.includes('tailwind') || lower.includes('node') || lower.includes('code')) {
        return `### 🚀 AskFlow AI Technical Insights

Here is a quick example of a clean, responsive component in **React + Tailwind CSS**:

\`\`\`tsx
import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export const ActionButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => {
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={() => {
        setLoading(true);
        onClick();
      }}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 transition-all duration-200 active:scale-95"
    >
      <Sparkles className="w-4 h-4 animate-spin" />
      <span>{label}</span>
    </button>
  );
};
\`\`\`

> **Tip:** You have configured AskFlow AI with Node.js Express backend and Supabase PostgreSQL with full Row Level Security (RLS)!`;
    }
    return `### 💡 AskFlow AI Response

Thank you for your message: *"**${prompt}**"*

AskFlow AI is fully connected through your **Node.js + Express** backend, storing conversations securely in **Supabase PostgreSQL** with Row Level Security.

To connect real-time responses from Google's latest Gemini models (like \`gemini-2.5-flash\`):
1. Obtain a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. Add \`GEMINI_API_KEY=your_key_here\` to your \`server/.env\` file.
3. Restart the server.

Is there anything else you'd like to explore?`;
}
