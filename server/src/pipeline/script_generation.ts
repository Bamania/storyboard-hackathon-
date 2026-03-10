/**
 * Script Generation — Expands a short prompt into a full screenplay using Gemini.
 */

import { GoogleGenAI } from '@google/genai';

const GEMINI_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are a professional screenwriter. Turn the user's prompt or idea into a proper screenplay.

Rules:
- Use standard screenplay format: scene headings (INT./EXT. LOCATION — TIME), action lines, character names in caps when first introduced
- Break the story into multiple distinct sequences/scenes (at least 2–3, more if the idea supports it)
- Each sequence should have a clear location, time, and action
- Write vivid, cinematic action descriptions
- Keep dialogue minimal unless the prompt specifies dialogue
- Output ONLY the screenplay text, no meta-commentary or explanations`;

export async function generateScriptFromPrompt(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required');
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `${SYSTEM_PROMPT}\n\nUser prompt:\n\n${prompt.trim()}`,
  });

  const text = response.text?.trim();
  return text || prompt;
}
