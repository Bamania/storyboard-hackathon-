/**
 * Express server — SSE debate endpoint wired to crew debate + script parser.
 */

import 'dotenv/config';

import cors from 'cors';
import express from 'express';
import { InMemoryRunner, StreamingMode } from '@google/adk';
import type { RunConfig } from '@google/adk';
import { createUserContent } from '@google/genai';
import { sceneOrchestrator } from './crew_debate/scene_orchestrator.js';
import { parseScriptToScenes } from './pipeline/script_parser.js';
import { generateScriptFromPrompt } from './pipeline/script_generation.js';
import type { SceneContext } from './crew_debate/types.js';

const APP_NAME = 'crew_debate';
const PORT = Number(process.env.PORT) || 3001;

const CREW_AGENTS = new Set(['Director', 'Cinematographer', 'Editor', 'ProductionDesigner']);

// Placeholder cast (MVP)
const PLACEHOLDER_CHARACTERS = [
  { name: 'Cole', description: 'Weary detective, 40s', color: '#C4724B' },
  { name: 'Elara', description: 'Mysterious informant', color: '#6B8CA6' },
  { name: 'Viktor', description: 'Shady businessman', color: '#C4A04B' },
];

function deriveCharactersFromScenes(scenes: SceneContext[]) {
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
    description: `Character`,
    color: colors[i % colors.length],
  }));
}

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/parse-script', async (req, res) => {
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

app.post('/api/generate-and-parse', async (req, res) => {
  const prompt = req.body?.prompt;
  if (typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'Missing or invalid prompt' });
    return;
  }
  try {
    const script = await generateScriptFromPrompt(prompt.trim());
    const scenes = await parseScriptToScenes(script);
    res.json({ script, scenes });
  } catch (err) {
    console.error('[GenerateAndParse] Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Generate/parse failed' });
  }
});

app.post('/api/debate', async (req, res) => {
  const script = req.body?.script as string | undefined;
  const scenesInput = req.body?.scenes as SceneContext[] | undefined;

  let scenes: SceneContext[];
  if (Array.isArray(scenesInput) && scenesInput.length > 0) {
    scenes = scenesInput;
  } else if (typeof script === 'string' && script.trim()) {
    scenes = await parseScriptToScenes(script.trim());
  } else {
    res.status(400).json({ error: 'Missing or invalid script or scenes' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const characters = deriveCharactersFromScenes(scenes);
    // creating a runner for the Sceneorchestration agent in here,with runner we can create the session and everything !
    const runner = new InMemoryRunner({
      agent: sceneOrchestrator,
      appName: APP_NAME,
    });

    const userId = `user_${Date.now()}`;
    const sessionId = `session_${Date.now()}`;

  const initialState = {
    // Scenes array — the orchestrator iterates over this
    scenes,
    // 24 parameters — reset per-scene by the orchestrator; seeded here as defaults
    director_parameters: {
      story_beat_action: '',
      emotional_tone: '',
      coverage_pacing: '',
      character_blocking: '',
      dialogue_subtext: '',
      directorial_intent: '',
    },
    cinematographer_parameters: {
      focal_length_mm: '',
      aperture_fstop: '',
      camera_angle_tilt: '',
      lighting_contrast_ratio: '',
      color_temperature_kelvin: '',
      exposure_iso: '',
    },
    production_designer_parameters: {
      z_axis_clutter: '',
      volumetrics_atmosphere: '',
      location_set_geometry: '',
      color_palette: '',
      texture_materiality: '',
      practical_lights: '',
    },
    editor_parameters: {
      aspect_ratio: '',
      eye_lines_180_rule: '',
      match_cuts: '',
      character_motion_arrows: '',
      camera_motion_arrows: '',
      duration_timing: '',
    },
    // Completion signals written by the orchestrator after each scene's 2 rounds
    last_scene_complete_index: -1,
    last_scene_parameters: null,
  };
  
  // session creation !
    await runner.sessionService.createSession({
      appName: APP_NAME,
      userId,
      sessionId,
      state: initialState,
    });

    sendEvent({ type: 'scene_start', scene_index: 0, scene_slug: scenes[0]?.slug, total_scenes: scenes.length });

    let lastEmittedSceneComplete = -1;
    let lastSceneIndex = 0;

    const runConfig: RunConfig = {
      streamingMode: StreamingMode.SSE,
      maxLlmCalls: 500,
      saveInputBlobsAsArtifacts: false,
      supportCfc: false,
    };

    for await (const event of runner.runAsync({
      userId,
      sessionId,
      newMessage: createUserContent('Begin the crew debate for shot design.'),
      runConfig,
    })) {
      const parts = event.content?.parts ?? [];
      const author = event.author as string;
      const isPartial = (event as { partial?: boolean }).partial ?? false;

      for (const p of parts) {
        const part = p as Record<string, unknown>;
        const text = part.text as string | undefined;
        if (text && CREW_AGENTS.has(author)) {
          sendEvent({ type: 'debate_chunk', agent: author, chunk: text, done: !isPartial });
        }
      }

      // Poll session state after every event to detect scene transitions
      const session = await runner.sessionService.getSession({
        appName: APP_NAME,
        userId,
        sessionId,
      });

      // scene_start: new scene has begun (orchestrator advanced scene_index)
      const currentSceneIndex = (session?.state?.['scene_index'] as number) ?? 0;
      if (currentSceneIndex > lastSceneIndex) {
        const scene = scenes[currentSceneIndex];
        sendEvent({
          type: 'scene_start',
          scene_index: currentSceneIndex,
          scene_slug: scene?.slug,
          total_scenes: scenes.length,
        });
        lastSceneIndex = currentSceneIndex;
      }

      // scene_complete: orchestrator finished 2 rounds for a scene
      const lastComplete = (session?.state?.['last_scene_complete_index'] as number) ?? -1;
      if (lastComplete >= 0 && lastComplete > lastEmittedSceneComplete) {
        const sceneParams = session?.state?.['last_scene_parameters'] as Record<string, unknown>;
        sendEvent({ type: 'scene_complete', scene_index: lastComplete, shot_parameters: sceneParams ?? {} });
        lastEmittedSceneComplete = lastComplete;
      }
    }

    const finalSession = await runner.sessionService.getSession({
      appName: APP_NAME,
      userId,
      sessionId,
    });

    // Emit scene_complete for the last scene if the loop exited before we could poll it
    const finalLastComplete = (finalSession?.state?.['last_scene_complete_index'] as number) ?? -1;
    if (finalLastComplete >= 0 && finalLastComplete > lastEmittedSceneComplete) {
      const sceneParams = finalSession?.state?.['last_scene_parameters'] as Record<string, unknown>;
      sendEvent({ type: 'scene_complete', scene_index: finalLastComplete, shot_parameters: sceneParams ?? {} });
    }

    sendEvent({ type: 'done' });
  } catch (err) {
    console.error('[Debate] Error:', err);
    sendEvent({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
