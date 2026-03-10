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

    const runner = new InMemoryRunner({
      agent: sceneOrchestrator,
      appName: APP_NAME,
    });

    const userId = `user_${Date.now()}`;
    const sessionId = `session_${Date.now()}`;

    const initialState = {
      scenes,
      scene_index: 0,
      total_scenes: scenes.length,
      debate_round: 0,
      debate_transcript: [] as Array<{ agent: string; message: string }>,
      debate_transcript_formatted: '(No contributions yet)',
      consensus_reached: false,
      shot_parameters: {} as Record<string, unknown>,
      completed_scenes: [] as SceneContext[],
      characters,
    };

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
        const fc = part.functionCall ?? part.function_call;
        if (fc && typeof fc === 'object') {
          const fn = fc as { name?: string; args?: Record<string, unknown> };
          if (fn.name === 'append_to_debate' && fn.args) {
            const agent = fn.args.agent_name as string;
            const message = fn.args.message as string;
            if (agent && message) {
              sendEvent({ type: 'debate_message', agent, message });
            }
          }
        }
        const fr = part.functionResponse ?? part.function_response;
        if (fr && typeof fr === 'object') {
          const fnr = fr as { name?: string };
          if (fnr.name === 'set_consensus_reached' || fnr.name === 'update_shot_parameters') {
            const session = await runner.sessionService.getSession({
              appName: APP_NAME,
              userId,
              sessionId,
            });
            const si = (session?.state?.['scene_index'] as number) ?? 0;
            let params = session?.state?.['shot_parameters'] as Record<string, unknown>;
            const scene = scenes[si];
            if (!params || Object.keys(params).length === 0) {
              params = {
                scene_slug: scene?.slug,
                location: scene?.location,
                time_of_day: scene?.timeOfDay,
                shot_count: 3,
                director_summary: session?.state?.['director_response'] ?? '',
                cinematographer_summary: session?.state?.['dp_response'] ?? '',
                editor_summary: session?.state?.['editor_response'] ?? '',
                production_designer_summary: session?.state?.['pd_response'] ?? '',
                debate_complete: true,
              };
            }
            if (si > lastEmittedSceneComplete) {
              sendEvent({ type: 'scene_complete', scene_index: si, shot_parameters: params ?? {} });
              lastEmittedSceneComplete = si;
            }
          }
        }
      }

      const session = await runner.sessionService.getSession({
        appName: APP_NAME,
        userId,
        sessionId,
      });
      const currentSceneIndex = (session?.state?.['scene_index'] as number) ?? 0;
      if (currentSceneIndex > lastSceneIndex && currentSceneIndex > lastEmittedSceneComplete) {
        const scene = scenes[currentSceneIndex];
        sendEvent({
          type: 'scene_start',
          scene_index: currentSceneIndex,
          scene_slug: scene?.slug,
          total_scenes: scenes.length,
        });
        lastSceneIndex = currentSceneIndex;
      }
    }

    const finalSession = await runner.sessionService.getSession({
      appName: APP_NAME,
      userId,
      sessionId,
    });

    let shotParams = finalSession?.state?.['shot_parameters'] as Record<string, unknown>;
    const completedScenes = (finalSession?.state?.['completed_scenes'] as SceneContext[]) ?? [];

    const lastScene = scenes[scenes.length - 1];
    if (!shotParams || Object.keys(shotParams).length === 0) {
      shotParams = {
        scene_slug: lastScene?.slug,
        location: lastScene?.location,
        time_of_day: lastScene?.timeOfDay,
        shot_count: 3,
        director_summary: finalSession?.state?.['director_response'] ?? '',
        cinematographer_summary: finalSession?.state?.['dp_response'] ?? '',
        editor_summary: finalSession?.state?.['editor_response'] ?? '',
        production_designer_summary: finalSession?.state?.['pd_response'] ?? '',
        debate_complete: true,
      };
    }

    if (lastEmittedSceneComplete < scenes.length - 1) {
      sendEvent({
        type: 'scene_complete',
        scene_index: scenes.length - 1,
        shot_parameters: shotParams ?? {},
      });
    }

    sendEvent({
      type: 'done',
      shot_parameters: shotParams ?? {},
      completed_scenes: completedScenes,
    });
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
