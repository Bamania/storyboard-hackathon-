import { Router } from 'express';
import { parseScriptToScenes } from '../pipeline/script_parser.js';
import { generateScriptFromPrompt } from '../pipeline/script_generation.js';
import { createStoryboard } from '../db/index.js';
import type { SceneContext } from '../crew_debate/types.js';

export const scriptRouter = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLACEHOLDER_CHARACTERS = [
  { name: 'Cole', description: 'Weary detective, 40s', color: '#C4724B' },
  { name: 'Elara', description: 'Mysterious informant', color: '#6B8CA6' },
  { name: 'Viktor', description: 'Shady businessman', color: '#C4A04B' },
];

export function deriveCharactersFromScenes(scenes: SceneContext[]) {
  const names = new Set<string>();
  for (const s of scenes) {
    for (const c of s.characters) {
      if (c?.trim()) names.add(c.trim());
    }
  }
  if (names.size === 0) return PLACEHOLDER_CHARACTERS;
  const colors = ['#C4724B', '#6B8CA6', '#C4A04B', '#7A8B6F'];
  return Array.from(names).map((name, i) => ({
    name,
    description: 'Character',
    color: colors[i % colors.length],
  }));
}

// ─── Routes ───────────────────────────────────────────────────────────────────

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
    const characters = deriveCharactersFromScenes(scenes);

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
