import { Router } from 'express';
import { InMemoryRunner, StreamingMode } from '@google/adk';
import type { RunConfig } from '@google/adk';
import { createUserContent } from '@google/genai';
import { createStoryboard, startDebate, completeStoryboard, createArtboard, getStoryboardSceneIds } from '../db/index.js';
import { parseScriptToScenes } from '../pipeline/script_parser.js';
import type { SceneContext } from '../crew_debate/types.js';
// import { rootAgent } from '../crew_debate/manager.js';
import { debateRootAgent } from '../crew_debate/scene_orchestrator.js';

export const debateRouter = Router();

const APP_NAME = 'crew_debate';
const CREW_AGENTS = new Set(['Director', 'Cinematographer', 'Editor', 'ProductionDesigner']);

/** Map update tool names to agent display names for streaming */
const TOOL_TO_AGENT: Record<string, string> = {
  update_director_parameters: 'Director',
  update_cinematographer_parameters: 'Cinematographer',
  update_editor_parameters: 'Editor',
  update_production_designer_parameters: 'ProductionDesigner',
};

function formatParamsForDisplay(args: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(args)) {
    if (key === 'approved') continue;
    const val = value != null ? String(value) : '';
    if (val) lines.push(`• ${key}: ${val}`);
  }
  return lines.length > 0 ? lines.join('\n') : '(parameters set)';
}

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

  // Ensure we have a storyboard in DB for persistence — create one if missing or mismatched
  let effectiveStoryboardId = storyboardId ?? null;
  let dbSceneIds: number[] = [];

  if (effectiveStoryboardId) {
    const existingSceneIds = await getStoryboardSceneIds(effectiveStoryboardId);
    // If scene count doesn't match, the storyboard is stale (e.g. from a previous generation).
    // Create a new storyboard so artboards are linked to the scenes we're actually debating.
    if (existingSceneIds.length !== scenes.length) {
      console.log(
        `[Debate] Storyboard #${effectiveStoryboardId} has ${existingSceneIds.length} scenes but debate has ${scenes.length} — creating new storyboard`,
      );
      const script = scenes.map((s) => `${s.slug}\n${s.body}`).join('\n\n');
      const characters = Array.from(
        new Set(scenes.flatMap((s) => s.characters).filter(Boolean)),
      ).map((name) => ({ name: String(name), description: 'Character from screenplay' }));
      const storyboard = await createStoryboard(
        'Shot design from crew debate',
        script,
        characters,
        scenes,
      );
      effectiveStoryboardId = storyboard.id;
      dbSceneIds = storyboard.scenes.map((s) => s.id);
      console.log(`[Debate] Created Storyboard #${effectiveStoryboardId} with ${dbSceneIds.length} scenes for persistence`);
    } else {
      dbSceneIds = existingSceneIds;
      await startDebate(effectiveStoryboardId);
      console.log(`[Debate] Using Storyboard #${effectiveStoryboardId} with ${dbSceneIds.length} scenes`);
    }
  } else {
    // No storyboardId: create one from scenes so we can persist artboards
    const script = scenes.map((s) => `${s.slug}\n${s.body}`).join('\n\n');
    const characters = Array.from(
      new Set(scenes.flatMap((s) => s.characters).filter(Boolean)),
    ).map((name) => ({ name: String(name), description: 'Character from screenplay' }));
    const storyboard = await createStoryboard(
      'Shot design from crew debate',
      script,
      characters,
      scenes,
    );
    effectiveStoryboardId = storyboard.id;
    dbSceneIds = storyboard.scenes.map((s) => s.id);
    console.log(`[Debate] Created Storyboard #${effectiveStoryboardId} with ${dbSceneIds.length} scenes for persistence`);
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
      agent: debateRootAgent,
      appName: APP_NAME,
    });

    const userId = `user_${Date.now()}`;
    const sessionId = `session_${Date.now()}`;

    const initialState = {
      scenes,
      director_parameters: JSON.stringify({
        story_beat_action: '',
        emotional_tone: '',
        coverage_pacing: '',
        character_blocking: '',
        dialogue_subtext: '',
        directorial_intent: '',
        approved: false,
      }),
      cinematographer_parameters: JSON.stringify({
        focal_length_mm: '',
        aperture_fstop: '',
        camera_angle_tilt: '',
        lighting_contrast_ratio: '',
        color_temperature_kelvin: '',
        exposure_iso: '',
        approved: false,
      }),
      production_designer_parameters: JSON.stringify({
        z_axis_clutter: '',
        volumetrics_atmosphere: '',
        location_set_geometry: '',
        color_palette: '',
        texture_materiality: '',
        practical_lights: '',
        approved: false,
      }),
      editor_parameters: JSON.stringify({
        aspect_ratio: '',
        eye_lines_180_rule: '',
        match_cuts: '',
        character_motion_arrows: '',
        camera_motion_arrows: '',
        duration_timing: '',
        approved: false,
      }),
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

    sendEvent({ type: 'storyboard_id', storyboardId: effectiveStoryboardId });
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
      newMessage: createUserContent('Begin the crew debate for shot design'),
      runConfig,
    })) {
      const parts = event.content?.parts ?? [];
      const author = event.author as string;
      const isPartial = (event as { partial?: boolean }).partial ?? false;

      for (const p of parts) {
        const part = p as Record<string, unknown>;

        // Stream text output (Round 1 discussion, or any agent speech)
        const text = part.text as string | undefined;
        if (text && CREW_AGENTS.has(author)) {
          sendEvent({ type: 'debate_chunk', agent: author, chunk: text, done: !isPartial, scene_index: lastSceneIndex });
        }

        // Stream function calls (Round 2 parameter setting) — emit as readable message
        const fc = (part.functionCall ?? part.function_call) as
          | { name?: string; args?: Record<string, unknown>; arguments?: Record<string, unknown> }
          | undefined;
        if (fc?.name) {
          const agentName = TOOL_TO_AGENT[fc.name];
          const args = fc.args ?? fc.arguments ?? {};
          if (agentName && CREW_AGENTS.has(agentName)) {
            const formatted = `Set parameters:\n${formatParamsForDisplay(args)}`;
            sendEvent({ type: 'debate_chunk', agent: agentName, chunk: formatted, done: true, scene_index: lastSceneIndex });
          }
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

        // Persist artboard to DB (always — we have effectiveStoryboardId and dbSceneIds)
        const sceneId = dbSceneIds[lastComplete];
        if (sceneId) {
          try {
            const params = sceneParams ?? {};
            const toObj = (v: unknown): object => {
              if (!v) return {};
              if (typeof v === 'object' && !Array.isArray(v)) return v as object;
              if (typeof v === 'string') { try { return JSON.parse(v) as object; } catch { return {}; } }
              return {};
            };
            const directorParams = { ...toObj(params['director_parameters']), scene_number: lastComplete + 1 };
            await createArtboard(sceneId, {
              directorParams,
              cinematographerParams: toObj(params['cinematographer_parameters']),
              productionDesignerParams: toObj(params['production_designer_parameters']),
              editorParams: toObj(params['editor_parameters']),
            });
            console.log(`[Debate] Persisted artboard for scene ${lastComplete} (sceneId=${sceneId})`);
          } catch (dbErr) {
            console.error(`[Debate] Failed to persist artboard for scene ${lastComplete}:`, dbErr);
          }
        } else {
          console.warn(`[Debate] No DB scene ID for index ${lastComplete} — skipping artboard persist`);
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

      const sceneId = dbSceneIds[finalLastComplete];
      if (sceneId) {
        try {
          const params = sceneParams ?? {};
          const toObj = (v: unknown): object => {
            if (!v) return {};
            if (typeof v === 'object' && !Array.isArray(v)) return v as object;
            if (typeof v === 'string') { try { return JSON.parse(v) as object; } catch { return {}; } }
            return {};
          };
          const directorParams = { ...toObj(params['director_parameters']), scene_number: finalLastComplete + 1 };
          await createArtboard(sceneId, {
            directorParams,
            cinematographerParams: toObj(params['cinematographer_parameters']),
            productionDesignerParams: toObj(params['production_designer_parameters']),
            editorParams: toObj(params['editor_parameters']),
          });
          console.log(`[Debate] Persisted final artboard for scene ${finalLastComplete} (sceneId=${sceneId})`);
        } catch (dbErr) {
          console.error(`[Debate] Failed to persist final artboard:`, dbErr);
        }
      }
    }

    if (effectiveStoryboardId) {
      await completeStoryboard(effectiveStoryboardId);
      console.log(`[Debate] Marked Storyboard #${effectiveStoryboardId} as COMPLETE`);
    }

    sendEvent({ type: 'done' });
  } catch (err) {
    console.error('[Debate] Error:', err);
    sendEvent({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
  } finally {
    res.end();
  }
});
