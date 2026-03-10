/**
 * Scene Orchestrator — Runs crew agents directly for streaming, then finalizes.
 * Crew agents (Director, Cinematographer, Editor, Production Designer) run in
 * sequence and their events stream to the client. A coordinator then finalizes
 * params and consensus.
 */

import { BaseAgent, LlmAgent, InvocationContext, type Event } from '@google/adk';
import type { SceneContext } from './types.js';
import {
  directorAgent,
  cinematographerAgent,
  editorAgent,
  productionDesignerAgent,
} from './agents.js';
import { setConsensusReachedTool, updateShotParametersTool } from './tools.js';

const GEMINI_MODEL = 'gemini-2.5-flash';

const CREW_AGENTS = [
  { agent: directorAgent, outputKey: 'director_response', name: 'Director' },
  { agent: cinematographerAgent, outputKey: 'dp_response', name: 'Cinematographer' },
  { agent: editorAgent, outputKey: 'editor_response', name: 'Editor' },
  { agent: productionDesignerAgent, outputKey: 'pd_response', name: 'ProductionDesigner' },
] as const;

/** Minimal coordinator that extracts agreed shot parameters from the debate. */
const finalizeCoordinator = new LlmAgent({
  name: 'FinalizeCoordinator',
  model: GEMINI_MODEL,
  description: 'Extracts shot parameters from the debate and finalizes.',
  instruction: `The crew has debated. Here is the transcript:

{debate_transcript_formatted}

Scene: {current_scene_slug}
Location: {current_scene_location}
Time: {current_scene_time}

You MUST call update_shot_parameters with ALL agreed parameters from the debate. Extract every technical detail:
- shot_count (from Director)
- focal_length, camera_angle, shot_size (from Cinematographer)
- movement, pacing (from Editor)
- key_light, light_quality, era, set_condition (from Production Designer)
- scene_slug, location, time_of_day from the scene

Fill in every parameter you can infer from the debate. Do NOT call with empty args. Then call set_consensus_reached.`,
  tools: [updateShotParametersTool, setConsensusReachedTool],
  includeContents: 'none',
});

export class SceneOrchestratorAgent extends BaseAgent {
  constructor(name: string) {
    super({
      name,
      description: 'Orchestrates shot design debate. Runs crew agents in sequence for streaming, then finalizes.',
      subAgents: [finalizeCoordinator],
    });
  }

  async* runLiveImpl(ctx: InvocationContext): AsyncGenerator<Event, void, undefined> {
    yield* this.runAsyncImpl(ctx);
  }

  async* runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event, void, undefined> {
    const scenes = ctx.session.state['scenes'] as SceneContext[];
    if (!scenes?.length) {
      console.error('[SceneOrchestrator] No scenes in state. Aborting.');
      return;
    }

    const totalScenes = scenes.length;
    let sceneIndex = (ctx.session.state['scene_index'] as number) ?? 0;

    while (sceneIndex < totalScenes) {
      const scene = scenes[sceneIndex];

      ctx.session.state['current_scene'] = scene;
      ctx.session.state['scene_index'] = sceneIndex;
      ctx.session.state['total_scenes'] = totalScenes;
      ctx.session.state['current_scene_slug'] = scene?.slug;
      ctx.session.state['current_scene_body'] = scene?.body;
      ctx.session.state['current_scene_characters'] = scene?.characters?.join(', ') ?? '';
      ctx.session.state['current_scene_location'] = scene?.location ?? '';
      ctx.session.state['current_scene_time'] = scene?.timeOfDay ?? '';
      ctx.session.state['consensus_reached'] = false;
      ctx.session.state['debate_round'] = 0;
      ctx.session.state['debate_transcript'] = ctx.session.state['debate_transcript'] ?? [];
      ctx.session.state['debate_transcript_formatted'] =
        (ctx.session.state['debate_transcript'] as Array<{ agent: string; message: string }>)
          ?.map((t) => `[${t.agent}]: ${t.message}`)
          .join('\n\n') ?? '(No contributions yet)';

      ctx.session.state['director_response'] = '(Call Director first)';
      ctx.session.state['dp_response'] = '(Waiting)';
      ctx.session.state['editor_response'] = '(Waiting)';
      ctx.session.state['pd_response'] = '(Waiting)';

      console.log(`\n[SceneOrchestrator] === Scene ${sceneIndex + 1}/${totalScenes}: ${scene?.slug} ===`);

      // Run each crew agent directly — their events stream to the client
      for (const { agent, outputKey, name } of CREW_AGENTS) {
        for await (const event of agent.runAsync(ctx)) {
          yield event;
        }
        const response = (ctx.session.state[outputKey] as string) ?? '';
        if (response) {
          const transcript = (ctx.session.state['debate_transcript'] as Array<{ agent: string; message: string }>) ?? [];
          transcript.push({ agent: name, message: response });
          ctx.session.state['debate_transcript'] = transcript;
          ctx.session.state['debate_transcript_formatted'] = transcript
            .map((t) => `[${t.agent}]: ${t.message}`)
            .join('\n\n');
          if (name === 'ProductionDesigner') {
            ctx.session.state['debate_round'] = ((ctx.session.state['debate_round'] as number) ?? 0) + 1;
          }
        }
      }

      // Update formatted transcript for finalize coordinator
      const transcript = ctx.session.state['debate_transcript'] as Array<{ agent: string; message: string }>;
      ctx.session.state['debate_transcript_formatted'] =
        transcript?.map((t) => `[${t.agent}]: ${t.message}`).join('\n\n') ?? '(No contributions yet)';

      // Run finalize coordinator (no crew tools — only params + consensus)
      for await (const event of finalizeCoordinator.runAsync(ctx)) {
        yield event;
      }

      const consensus = ctx.session.state['consensus_reached'];
      const hasAllResponses =
        ctx.session.state['director_response'] &&
        ctx.session.state['dp_response'] &&
        ctx.session.state['editor_response'] &&
        ctx.session.state['pd_response'];

      if (consensus || hasAllResponses) {
        if (!consensus) {
          ctx.session.state['consensus_reached'] = true;
        }
        let params = ctx.session.state['shot_parameters'] as Record<string, unknown>;
        if (!params || Object.keys(params).length === 0) {
          params = {
            scene_slug: scene?.slug,
            location: scene?.location,
            time_of_day: scene?.timeOfDay,
            shot_count: 3,
            director_summary: (ctx.session.state['director_response'] as string) ?? '',
            cinematographer_summary: (ctx.session.state['dp_response'] as string) ?? '',
            editor_summary: (ctx.session.state['editor_response'] as string) ?? '',
            production_designer_summary: (ctx.session.state['pd_response'] as string) ?? '',
            debate_complete: true,
          };
          ctx.session.state['shot_parameters'] = params;
        }
        console.log(`[SceneOrchestrator] Consensus reached for scene ${sceneIndex + 1}`);
        const completed = (ctx.session.state['completed_scenes'] as SceneContext[]) ?? [];
        completed.push(scene ?? ({} as SceneContext));
        ctx.session.state['completed_scenes'] = completed;
      }

      ctx.session.state['debate_transcript'] = [];
      ctx.session.state['debate_transcript_formatted'] = '(No contributions yet)';
      ctx.session.state['debate_round'] = 0;
      sceneIndex++;
    }

    console.log('[SceneOrchestrator] All scenes complete.');
  }
}

export const sceneOrchestrator = new SceneOrchestratorAgent('SceneOrchestrator');
