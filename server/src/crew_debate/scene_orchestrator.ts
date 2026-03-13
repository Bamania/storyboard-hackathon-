/**
 * SceneOrchestratorAgent — iterates over all scenes from session state.
 *
 * For each scene:
 *   1. Set scene context (slug, body, characters, location, time) in state.
 *   2. Reset all 24 parameters to empty strings.
 *   3. Run 2 rounds of: Director → Cinematographer → Editor → ProductionDesigner.
 *      - Round 1: initial proposals based on the scene.
 *      - Round 2: revisions after seeing each other's Round 1 output.
 *   4. Write last_scene_complete_index + last_scene_parameters to state so
 *      the SSE layer in index.ts can emit a scene_complete event.
 *
 * Each agent reads the full shared state via instruction template vars but
 * may only write to its own parameter block via its dedicated tool.
 */

import { BaseAgent, InvocationContext, type Event, SequentialAgent, LlmAgent } from '@google/adk';
import type { SceneContext } from './types.js';
import {
  directorAgent,
  cinematographerAgent,
  editorAgent,
  productionDesignerAgent,
  approvalCheckerAgent,
} from './agents.js';

const ROUNDS = 2;

const CREW_ORDER = [
  directorAgent,
  cinematographerAgent,
  editorAgent,
  productionDesignerAgent,
  approvalCheckerAgent,
] as const;

// Create a SequentialAgent to orchestrate the crew in order with proper context passing
const crewDebateSequence = new SequentialAgent({
  name: 'CrewDebateSequence',
  description: 'Runs all crew members in sequence with shared state access',
  subAgents: [...CREW_ORDER],
});


const emptyDirectorParams = () => ({
  story_beat_action: '',
  emotional_tone: '',
  coverage_pacing: '',
  character_blocking: '',
  dialogue_subtext: '',
  directorial_intent: '',
});

const emptyCinematographerParams = () => ({
  focal_length_mm: '',
  aperture_fstop: '',
  camera_angle_tilt: '',
  lighting_contrast_ratio: '',
  color_temperature_kelvin: '',
  exposure_iso: '',
});

const emptyProductionDesignerParams = () => ({
  z_axis_clutter: '',
  volumetrics_atmosphere: '',
  location_set_geometry: '',
  color_palette: '',
  texture_materiality: '',
  practical_lights: '',
});

const emptyEditorParams = () => ({
  aspect_ratio: '',
  eye_lines_180_rule: '',
  match_cuts: '',
  character_motion_arrows: '',
  camera_motion_arrows: '',
  duration_timing: '',
});

export class SceneOrchestratorAgent extends BaseAgent {
  constructor(name: string, subAgents: BaseAgent[] = []) {
    super({
      name,
      description:
        'Runs 2-round crew debate (Director → Cine → Editor → PD) for every scene. ' +
        'Each agent fills its own 6 parameters; all share read access to the full state.',
      subAgents,
    });
  }

  async *runLiveImpl(ctx: InvocationContext): AsyncGenerator<Event, void, undefined> {
    yield* this.runAsyncImpl(ctx);
  }

  async *runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event, void, undefined> {
    const scenes = ctx.session.state['scenes'] as SceneContext[] | undefined;


    console.log("scenes from the fe",scenes)
    if (!scenes?.length) {
      console.error('[SceneOrchestrator] No scenes found in session state. Aborting.');
      return;
    }

    for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {

      const scene = scenes[sceneIndex];
      if (!scene) continue;
      // console.log(`\n[SceneOrchestrator] === Scene ${sceneIndex + 1}/${scenes.length}: ${scene.slug} ===`);
      // console.log(`\n InvocationContext Object -->`,ctx.session.state.director_parameters);
      // console.log(`\n InvocationContext Object -->`,ctx.session.state.cinematographer_parameters);
      // console.log(`\n InvocationContext Object -->`,ctx.session.state.production_designer_parameters);
      // console.log(`\n InvocationContext Object -->`,ctx.session.state.editor_parameters);
          
      ctx.session.state['current_scene_slug'] = scene.slug;
      ctx.session.state['current_scene_body'] = scene.body;
      ctx.session.state['current_scene_characters'] = scene.characters.join(', ');
      ctx.session.state['current_scene_location'] = scene.location;
      ctx.session.state['current_scene_time'] = scene.timeOfDay;
      ctx.session.state['scene_index'] = sceneIndex;
      ctx.session.state['approved'] = false;
      ctx.session.state['director_approved'] = false;
      ctx.session.state['cinematographer_approved'] = false;
      ctx.session.state['editor_approved'] = false;
      ctx.session.state['production_designer_approved'] = false;

      // Reset all 24 parameters to empty strings for this scene (JSON stored to avoid [object Object] serialization issues in instruction injection)
      ctx.session.state['director_parameters'] = JSON.stringify(emptyDirectorParams(), null, 2);
      ctx.session.state['cinematographer_parameters'] = JSON.stringify(emptyCinematographerParams(), null, 2);
      ctx.session.state['production_designer_parameters'] = JSON.stringify(emptyProductionDesignerParams(), null, 2);
      ctx.session.state['editor_parameters'] = JSON.stringify(emptyEditorParams(), null, 2);
      
      // 2 rounds: Round 1 = initial proposals; Round 2 = cross-informed revisions
      for (let round = 1; round <= ROUNDS; round++) {

        ctx.session.state['debate_round'] = round;
        // console.log(`[SceneOrchestrator] Round ${round}/${ROUNDS}`);

        // Use the SequentialAgent to orchestrate crew — it properly handles state injection into subagent instructions
        for await (const event of crewDebateSequence.runAsync(ctx)) {
          yield event;
        }

        if (ctx.session.state['approved']) {
          console.log(`[SceneOrchestrator] Scene ${sceneIndex + 1} approved in round ${round}. Exiting debate loop early.`);
          break;
        }
      }

      // Signal scene completion — index.ts polls this to emit scene_complete SSE
      ctx.session.state['last_scene_complete_index'] = sceneIndex;
      ctx.session.state['last_scene_parameters'] = {
        scene_slug: scene.slug,
        scene_index: sceneIndex,
        director_parameters: ctx.session.state['director_parameters'],
        cinematographer_parameters: ctx.session.state['cinematographer_parameters'],
        production_designer_parameters: ctx.session.state['production_designer_parameters'],
        editor_parameters: ctx.session.state['editor_parameters'],
      };

      console.log(`[SceneOrchestrator] Scene ${sceneIndex + 1} — Final 24 Parameters:`);
      console.log("ctx session state",ctx.session.state)
      console.log(JSON.stringify(ctx.session.state['last_scene_parameters'], null, 2));
      console.log(`[SceneOrchestrator] Scene ${sceneIndex + 1} parameters written.`);
    }


    console.log('[SceneOrchestrator] All scenes processed.');
  }
}

const sceneOrchestrator = new SceneOrchestratorAgent('SceneOrchestrator', [crewDebateSequence]);

/**
 * ADK's InstructionsLlmRequestProcessor only injects instruction templates (e.g. {current_scene_slug})
 * when agent.rootAgent is an LlmAgent. Without an LlmAgent root, crew agents never receive
 * their instructions or scene data — they only get identity + user message and ask for details.
 * This root LlmAgent exists solely to satisfy that check; it immediately transfers to SceneOrchestrator.
 */
export const debateRootAgent = new LlmAgent({
  name: 'DebateRoot',
  model: 'gemini-2.5-flash',
  description: 'Coordinates the crew debate. Transfers to SceneOrchestrator to run the debate.',
  instruction:
    "When the user says to begin the crew debate (or similar), immediately call transfer_to_agent with agent_name='SceneOrchestrator'. Do not generate any other text.",
  subAgents: [sceneOrchestrator],
  disallowTransferToParent: true,
  disallowTransferToPeers: true,
});

export { sceneOrchestrator };



