/**
 * Script Parser — Converts raw text into structured SceneContext[] using Gemini.
 */

import { GoogleGenAI } from '@google/genai';
import type { SceneContext } from '../crew_debate/types.js';

const GEMINI_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are a screenplay analyst. Extract scenes from the given text and output a JSON array of scene objects.

Each scene must have:
- slug: Scene heading (e.g. "EXT. CITY STREET — NIGHT" or "INT. DIVE BAR — NIGHT")
- body: Action/description text for the scene
- characters: Array of character names appearing in the scene
- location: Short location name (e.g. "Downtown", "Dive Bar")
- timeOfDay: Time of day (e.g. "Night", "Day", "Dawn", "Dusk")

Output ONLY valid JSON. No markdown, no explanation. Format: [{"slug":"...","body":"...","characters":[],"location":"...","timeOfDay":"..."}]`;

export async function parseScriptToScenes(rawScript: string): Promise<SceneContext[]> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY ?? process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `${SYSTEM_PROMPT}\n\nParse this text into scenes:\n\n${rawScript}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return fallbackScene(rawScript);
    }

    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) {
      return fallbackScene(rawScript);
    }

    const scenes: SceneContext[] = parsed
      .filter(
        (s): s is Record<string, unknown> =>
          s != null && typeof s === 'object' && typeof s.slug === 'string' && typeof s.body === 'string'
      )
      .map((s) => ({
        slug: String(s.slug ?? 'SCENE'),
        body: String(s.body ?? ''),
        characters: Array.isArray(s.characters) ? s.characters.map(String) : [],
        location: String(s.location ?? 'Unknown'),
        timeOfDay: String(s.timeOfDay ?? 'Day'),
      }));

    return scenes.length > 0 ? scenes : fallbackScene(rawScript);
  } catch (err) {
    console.error('[ScriptParser] Parse error:', err);
    return fallbackScene(rawScript);
  }
}

function fallbackScene(rawScript: string): SceneContext[] {
  return [
    {
      slug: 'SCENE 1',
      body: rawScript.trim() || 'No content provided.',
      characters: [],
      location: 'Unknown',
      timeOfDay: 'Day',
    },
  ];
}
