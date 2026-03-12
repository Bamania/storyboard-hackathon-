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

import { BaseAgent, InvocationContext, type Event } from '@google/adk';
import type { SceneContext } from './types.js';
import {
  directorAgent,
  cinematographerAgent,
  editorAgent,
  productionDesignerAgent,
} from './agents.js';

const ROUNDS = 2;

const CREW_ORDER = [
  directorAgent,
  cinematographerAgent,
  editorAgent,
  productionDesignerAgent,
] as const;

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
  constructor(name: string) {
    super({
      name,
      description:
        'Runs 2-round crew debate (Director → Cine → Editor → PD) for every scene. ' +
        'Each agent fills its own 6 parameters; all share read access to the full state.',
      subAgents: [...CREW_ORDER],
    });
  }

  async *runLiveImpl(ctx: InvocationContext): AsyncGenerator<Event, void, undefined> {
    yield* this.runAsyncImpl(ctx);
  }

  async *runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event, void, undefined> {
    const scenes = ctx.session.state['scenes'] as SceneContext[] | undefined;
    if (!scenes?.length) {
      console.error('[SceneOrchestrator] No scenes found in session state. Aborting.');
      return;
    }

    for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {

      const scene = scenes[sceneIndex];
      if (!scene) continue;
      console.log(`\n[SceneOrchestrator] === Scene ${sceneIndex + 1}/${scenes.length}: ${scene.slug} ===`);
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

      // Reset all 24 parameters to empty strings for this scene
      ctx.session.state['director_parameters'] = emptyDirectorParams();
      ctx.session.state['cinematographer_parameters'] = emptyCinematographerParams();
      ctx.session.state['production_designer_parameters'] = emptyProductionDesignerParams();
      ctx.session.state['editor_parameters'] = emptyEditorParams();

      // 2 rounds: Round 1 = initial proposals; Round 2 = cross-informed revisions
      for (let round = 1; round <= ROUNDS; round++) {

        ctx.session.state['debate_round'] = round;
        console.log(`[SceneOrchestrator] Round ${round}/${ROUNDS}`);

        for (const agent of CREW_ORDER) {

          console.log(`[SceneOrchestrator]   → ${agent.name}`);
          // if(ctx.session.state["approved"]) {
          //   break ;
          // }
          for await (const event of agent.runAsync(ctx)) {
            yield event;
          }
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

export const sceneOrchestrator = new SceneOrchestratorAgent('SceneOrchestrator');



