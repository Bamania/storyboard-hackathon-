import { Router } from 'express';
import { parseScriptToScenes } from '../pipeline/script_parser.js';
import { generateScriptFromPrompt } from '../pipeline/script_generation.js';
import { createStoryboard } from '../db/index.js';
import type {  SceneContext } from '../crew_debate/types.js';
import { GoogleGenAI } from '@google/genai';

export const scriptRouter = Router();


const PLACEHOLDER_CHARACTERS = [
  { name: 'Cole', description: 'Weary detective, 40s', color: '#C4724B' },
  { name: 'Elara', description: 'Mysterious informant', color: '#6B8CA6' },
  { name: 'Viktor', description: 'Shady businessman', color: '#C4A04B' },
];

const CHARACTER_COLORS = ['#C4724B', '#6B8CA6', '#C4A04B', '#7A8B6F', '#9B59B6', '#E67E22', '#1ABC9C', '#E74C3C'];

export async function deriveCharactersFromScenes(scenes: SceneContext[]) {
  const llm = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY ?? '' })
  const sceneSummary = scenes.map((s, i) => `Scene ${i + 1} (${s.slug}):\n${s.body}`).join('\n\n');

  const response = await llm.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are a casting director. Analyze the following screenplay scenes and extract every named character.

For each character provide:
- "name": The character name exactly as it appears in the screenplay (ALL CAPS)
- "description": A vivid 1-2 sentence physical/personality description based on context clues in the script. Be specific and cinematic — mention age range, build, demeanor, clothing style, distinguishing features. Do NOT just say "Character".
- "color": A unique hex color for UI display (pick from warm cinematic tones)

Return ONLY a JSON array. Example:
[{"name":"JAKE","description":"Grizzled ex-marine in his late 50s, barrel-chested with a salt-and-pepper crew cut. Wears a faded leather jacket and moves with a pronounced limp.","color":"#C4724B"}]

Scenes:
${sceneSummary}`,
    config: {
      responseMimeType: 'application/json',
    },
  })

  const text = response.text?.trim() ?? '[]';
  console.log('[DeriveCharacters] LLM response:', text);

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return PLACEHOLDER_CHARACTERS;
    }
    return parsed.map((c: { name?: string; description?: string; color?: string }, i: number) => ({
      name: String(c.name ?? 'UNKNOWN'),
      description: String(c.description ?? 'A character from the screenplay'),
      color: c.color ?? CHARACTER_COLORS[i % CHARACTER_COLORS.length],
    }));
  } catch (err) {
    console.error('[DeriveCharacters] JSON parse failed:', err);
    // Fallback: extract unique names from scene character lists
    const names = new Set<string>();
    for (const s of scenes) {
      for (const c of s.characters) if (c?.trim()) names.add(c.trim());
    }
    return Array.from(names).map((name, i) => ({
      name,
      description: 'A character from the screenplay',
      color: CHARACTER_COLORS[i % CHARACTER_COLORS.length],
    }));
  }
}

scriptRouter.post('/parse-script', async (req, res) => {
  const script = req.body?.script;
  if (typeof script !== 'string' || !script.trim()) {
    res.status(400).json({ error: 'Missing or invalid script' });
    return;
  }
  try {
    const scenes = await parseScriptToScenes(script.trim());
    res.json({ scenes });
  } catch (err) {
    console.error('[ParseScript] Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Parse failed' });
  }
});

scriptRouter.post('/generate-and-parse', async (req, res) => {
  const prompt = req.body?.prompt;
  if (typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'Missing or invalid prompt' });
    return;
  }
  try {
    const script = await generateScriptFromPrompt(prompt.trim());
    const scenes = await parseScriptToScenes(script);
    const characters = await deriveCharactersFromScenes(scenes);

    const storyboard = await createStoryboard(prompt.trim(), script, characters, scenes);

    console.log(
      `[GenerateAndParse] Persisted Storyboard #${storyboard.id} with ${storyboard.scenes.length} scenes, ${storyboard.cast.length} cast members`,
    );

    res.json({
      storyboardId: storyboard.id,
      script,
      scenes,
      cast: storyboard.cast,
    });
  } catch (err) {
    console.error('[GenerateAndParse] Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Generate/parse failed' });
  }
});
