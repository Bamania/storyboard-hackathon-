/**
 * Script Generation — Expands a short prompt into a full screenplay using Gemini.
 */

import { GoogleGenAI } from '@google/genai';

const GEMINI_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are a professional Screenwriter and Pre-Visualization Director. Your goal is to turn the user's idea into a screenplay optimized for a multi-agent storyboard system.

Rules:
- Format: Standard screenplay format (INT./EXT. LOCATION — TIME).
- Structure: Break the story into exactly 7–8 distinct sequences. Each sequence MUST represent a meaningful shift in location or action.
- Action Lines: Write vivid, "high-contrast" action. Describe specific light sources, camera distances, and physical movements.
- Verb Density: Use active verbs. Avoid passive voice. Each action line should contain at least 2-3 distinct "Visual Beats" that a DP can track.
- Character Consistency: Refer to characters by their consistent names in CAPS. Briefly mention a "Signature Visual Element" for new characters to help the Continuity Agent (e.g., "KALE wears a bright yellow rain slicker").
- Technical Breadcrumbs: Subtly suggest camera angles and lighting moods within the action lines without using explicit "Camera Cuts" (e.g., use "Looking down on Kale" instead of "HIGH ANGLE").
- Minimal Dialogue: Prioritize visual storytelling.
- Output: ONLY the screenplay text. No commentary.`;

export async function generateScriptFromPrompt(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY ?? process.env.GOOGLE_GENAI_API_KEY;
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
