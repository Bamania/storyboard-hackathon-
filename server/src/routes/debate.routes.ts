import { Router } from 'express';
import { InMemoryRunner, StreamingMode } from '@google/adk';
import type { RunConfig } from '@google/adk';
import { createUserContent } from '@google/genai';
import { startDebate, completeStoryboard, createArtboard } from '../db/index.js';
import { sceneOrchestrator } from '../crew_debate/scene_orchestrator.js';
import { parseScriptToScenes } from '../pipeline/script_parser.js';
import type { SceneContext } from '../crew_debate/types.js';

export const debateRouter = Router();

const APP_NAME = 'crew_debate';
const CREW_AGENTS = new Set(['Director', 'Cinematographer', 'Editor', 'ProductionDesigner']);

debateRouter.post('/', async (req, res) => {
  const script = req.body?.script as string | undefined;
  const scenesInput = req.body?.scenes as SceneContext[] | undefined;
  const storyboardId = req.body?.storyboardId as number | undefined;

  let scenes: SceneContext[];
  if (Array.isArray(scenesInput) && scenesInput.length > 0) {
    scenes = scenesInput;
  } else if (typeof script === 'string' && script.trim()) {
    scenes = await parseScriptToScenes(script.trim());
  } else {
    res.status(400).json({ error: 'Missing or invalid script or scenes' });
    return;
  }

  // Look up DB scene IDs so we can link artboards to the correct scene rows
  let dbSceneIds: number[] = [];
  if (storyboardId) {
    dbSceneIds = await startDebate(storyboardId);
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
    const runner = new InMemoryRunner({
      agent: sceneOrchestrator,
      appName: APP_NAME,
    });

    const userId = `user_${Date.now()}`;
    const sessionId = `session_${Date.now()}`;

    const initialState = {
      scenes,
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
      current_scene_slug: '',
      current_scene_body: '',
      current_scene_characters: '',
      current_scene_location: '',
      current_scene_time: '',
      scene_index: 0,
      debate_round: 0,
      last_scene_complete_index: -1,
      last_scene_parameters: null,
      approved: false,
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
      }

      // Poll session state after every event to detect scene transitions
      const session = await runner.sessionService.getSession({
        appName: APP_NAME,
        userId,
        sessionId,
      });

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

      const lastComplete = (session?.state?.['last_scene_complete_index'] as number) ?? -1;
      if (lastComplete >= 0 && lastComplete > lastEmittedSceneComplete) {
        const sceneParams = session?.state?.['last_scene_parameters'] as Record<string, unknown>;
        sendEvent({ type: 'scene_complete', scene_index: lastComplete, shot_parameters: sceneParams ?? {} });
        lastEmittedSceneComplete = lastComplete;

        // Persist artboard to DB
        if (storyboardId && dbSceneIds[lastComplete]) {
          try {
            await createArtboard(dbSceneIds[lastComplete], {
              directorParams: (sceneParams?.['director_parameters'] as object) ?? {},
              cinematographerParams: (sceneParams?.['cinematographer_parameters'] as object) ?? {},
              productionDesignerParams: (sceneParams?.['production_designer_parameters'] as object) ?? {},
              editorParams: (sceneParams?.['editor_parameters'] as object) ?? {},
            });
          } catch (dbErr) {
            console.error(`[Debate] Failed to persist artboard for scene ${lastComplete}:`, dbErr);
          }
        }
      }
    }

    const finalSession = await runner.sessionService.getSession({
      appName: APP_NAME,
      userId,
      sessionId,
    });

    const finalLastComplete = (finalSession?.state?.['last_scene_complete_index'] as number) ?? -1;
    if (finalLastComplete >= 0 && finalLastComplete > lastEmittedSceneComplete) {
      const sceneParams = finalSession?.state?.['last_scene_parameters'] as Record<string, unknown>;
      sendEvent({ type: 'scene_complete', scene_index: finalLastComplete, shot_parameters: sceneParams ?? {} });

      if (storyboardId && dbSceneIds[finalLastComplete]) {
        try {
          await createArtboard(dbSceneIds[finalLastComplete], {
            directorParams: (sceneParams?.['director_parameters'] as object) ?? {},
            cinematographerParams: (sceneParams?.['cinematographer_parameters'] as object) ?? {},
            productionDesignerParams: (sceneParams?.['production_designer_parameters'] as object) ?? {},
            editorParams: (sceneParams?.['editor_parameters'] as object) ?? {},
          });
        } catch (dbErr) {
          console.error(`[Debate] Failed to persist final artboard:`, dbErr);
        }
      }
    }

    if (storyboardId) {
      await completeStoryboard(storyboardId);
    }

    sendEvent({ type: 'done' });
  } catch (err) {
    console.error('[Debate] Error:', err);
    sendEvent({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
  } finally {
    res.end();
  }
});
