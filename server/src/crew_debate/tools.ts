/**
 * Crew Debate Tools — one write tool per role.
 *
 * Each agent may ONLY call its own update tool, enforcing parameter ownership.
 * All agents can READ the shared session state (via instruction template vars).
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';

export const updateDirectorParametersTool = new FunctionTool({
  name: 'update_director_parameters',
  description:
    "Write the Director's 6 parameters for this scene. You MUST call this with ALL 6 fields fully filled. Only the Director calls this. Call ONLY in Round 2.",
  parameters: z.object({
    story_beat_action: z
      .string()
      .describe('What is happening dramatically in this exact scene moment'),
    emotional_tone: z
      .string()
      .describe('Specific emotional register (e.g. "cold dread", "desperate hope")'),
    coverage_pacing: z
      .string()
      .describe('Shot count and rhythm (e.g. "6 shots — slow build to urgency")'),
    character_blocking: z
      .string()
      .describe('Precise physical staging (e.g. "Cole enters LEFT, sits with back to door")'),
    dialogue_subtext: z
      .string()
      .describe('Unspoken tension beneath the words (e.g. "Viktor knows more — power play")'),
    directorial_intent: z
      .string()
      .describe('One-sentence vision (e.g. "Audience must feel Cole is already too late")'),
  }),
  execute: async (input, toolContext) => {
    console.log(`\n[updateDirectorParametersTool] Called with input:`, input);
    // console.log(`\n[updateDirectorParametersTool] Called with context:`, toolContext);
    if (!toolContext?.state) throw new Error('No session state available');
    // if(input.approve){
    // toolContext.state.set('director_parameters',{...input,approve:input.approve})
  // }
    // fx(a,b) => a+2
    toolContext.state.set('director_parameters', { ...input });
    return { status: 'updated', agent: 'Director', fields: Object.keys(input) };
  },
});

export const updateCinematographerParametersTool = new FunctionTool({
  name: 'update_cinematographer_parameters',
  description:
    "Write the Cinematographer's 6 parameters for this scene. You MUST call this with ALL 6 fields fully filled. Call ONLY in Round 2.",
  parameters: z.object({
    focal_length_mm: z
      .string()
      .describe('Specific lens (e.g. "35mm — slight wide pressure", "85mm — compressed intimacy")'),
    aperture_fstop: z
      .string()
      .describe('f-stop with rationale (e.g. "f/2.0 — subject isolated from BG clutter")'),
    camera_angle_tilt: z
      .string()
      .describe('Tilt with dramatic reason (e.g. "Low Angle 20° — Cole appears threatening")'),
    lighting_contrast_ratio: z
      .string()
      .describe('Key/fill ratio (e.g. "8:1 — near-noir single hard side key")'),
    color_temperature_kelvin: z
      .string()
      .describe('Exact temp (e.g. "2800K — warm tungsten decay and nostalgia")'),
    exposure_iso: z
      .string()
      .describe('ISO with intent (e.g. "ISO 1600 — visible grain, documentary unease")'),
  }),
  execute: async (input, toolContext) => {
    console.log(`\n[updateCinematographerParametersTool] Called with input:`, input);
    // console.log(`\n[updateCinematographerParametersTool] Called with context:`, toolContext);
    if (!toolContext?.state) throw new Error('No session state available');
    toolContext.state.set('cinematographer_parameters', { ...input });
    return { status: 'updated', agent: 'Cinematographer', fields: Object.keys(input) };
  },
});

export const updateProductionDesignerParametersTool = new FunctionTool({
  name: 'update_production_designer_parameters',
  description:
    "Write the Production Designer's 6 parameters for this scene. You MUST call this with ALL 6 fields fully filled. Call ONLY in Round 2.",
  parameters: z.object({
    z_axis_clutter: z
      .string()
      .describe(
        'Foreground/midground/background layering (e.g. "dense FG debris — claustrophobic, clear BG exit visible")',
      ),
    volumetrics_atmosphere: z
      .string()
      .describe('Fog, smoke, rain presence (e.g. "light fog 30% density — mystery without obscuring faces")'),
    location_set_geometry: z
      .string()
      .describe('Space shape and sightlines (e.g. "narrow L-corridor — blind corner anxiety")'),
    color_palette: z
      .string()
      .describe('Dominant palette (e.g. "desaturated steels and burnt ambers — fatigue and decay")'),
    texture_materiality: z
      .string()
      .describe('Key surfaces (e.g. "peeling plaster, rusted iron railing, scuffed concrete — post-industrial")'),
    practical_lights: z
      .string()
      .describe(
        'Exact practical sources in frame (e.g. "overhead fluorescent flicker 2Hz, red EXIT sign back-right")',
      ),
  }),
  execute: async (input, toolContext) => {
    console.log(`\n[updateProductionDesignerParametersTool] Called with input:`, input);
    // console.log(`\n[updateProductionDesignerParametersTool] Called with context:`, toolContext);
    if (!toolContext?.state) throw new Error('No session state available');
    toolContext.state.set('production_designer_parameters', { ...input });
    return { status: 'updated', agent: 'ProductionDesigner', fields: Object.keys(input) };
  },
});

export const updateEditorParametersTool = new FunctionTool({
  name: 'update_editor_parameters',
  description:
    "Write the Editor's 6 parameters for this scene. You MUST call this with ALL 6 fields fully filled. Call ONLY in Round 2.",
  parameters: z.object({
    aspect_ratio: z
      .string()
      .describe('Format with rationale (e.g. "2.39:1 — anamorphic scale and weight")'),
    eye_lines_180_rule: z
      .string()
      .describe(
        'Axis management (e.g. "strict axis — Cole LEFT throughout", "axis break on cut 5 for disorientation")',
      ),
    match_cuts: z
      .string()
      .describe(
        'Specific cut points (e.g. "cut on Cole reaching for glass — action match to CU", "L-cut audio bleeds in")',
      ),
    character_motion_arrows: z
      .string()
      .describe('Direction vectors across cuts (e.g. "L→R dominant — reversal on reveal for shock")'),
    camera_motion_arrows: z
      .string()
      .describe(
        'Camera moves across scene (e.g. "handheld push-in during confession, snap-cut to static wide for aftermath")',
      ),
    duration_timing: z
      .string()
      .describe('Total duration and shot breakdown (e.g. "2m10s — 8s WS, 4s MS×3, 2s CU×4, 12s final hold")'),
  }),
  execute: async (input, toolContext) => {
    console.log(`\n[updateEditorParametersTool] Called with input:`, input);
    // console.log(`\n[updateEditorParametersTool] Called with context:`, toolContext);
    if (!toolContext?.state) throw new Error('No session state available');
    toolContext.state.set('editor_parameters', { ...input });
    return { status: 'updated', agent: 'Editor', fields: Object.keys(input) };
  },
});

// /**
//  * Appends a crew member's message to the debate transcript.
//  * Call this after each agent speaks to build the full debate history.
//  */
// export const appendToDebateTool = new FunctionTool({
//   name: 'append_to_debate',
//   description: 'Records a crew member\'s contribution to the debate transcript. Call this after each agent (Director, Cinematographer, Editor, Production Designer) speaks. Include the agent name and their full message.',
//   parameters: z.object({
//     agent_name: z.enum(['Director', 'Cinematographer', 'Editor', 'ProductionDesigner']).describe('Which crew member spoke'),
//     message: z.string().describe('The full message/contribution from that crew member'),
//     is_consensus: z.boolean().optional().describe('True if this message signals agreement/completion (e.g. ends with ✓)'),
//   }),
//   execute: async (input, toolContext) => {
//     const state = toolContext?.state as Record<string, unknown> | undefined;
//     if (!state) throw new Error('No session state available');

//     const transcript = (state['debate_transcript'] as Array<{ agent: string; message: string; timestamp: number; isConsensus?: boolean }>) || [];
//     transcript.push({
//       agent: input.agent_name,
//       message: input.message,
//       timestamp: Date.now(),
//       isConsensus: input.is_consensus ?? false,
//     });
//     state['debate_transcript'] = transcript;

//     // When ProductionDesigner speaks, a full round is complete (Dir → DP → Ed → PD)
//     if (input.agent_name === 'ProductionDesigner') {
//       const round = ((state['debate_round'] as number) ?? 0) + 1;
//       state['debate_round'] = round;
//     }

//     // Format for coordinator instruction
//     const formatted = transcript
//       .map((t) => `[${t.agent}]: ${t.message}`)
//       .join('\n\n');
//     state['debate_transcript_formatted'] = formatted || '(No contributions yet)';

//     return { status: 'recorded', agent: input.agent_name };
//   },
// });

// /**
//  * Signals that the crew has reached consensus for the current scene.
//  * Call when all 4 agents agree and no further debate is needed.
//  */
// export const setConsensusReachedTool = new FunctionTool({
//   name: 'set_consensus_reached',
//   description: 'Call when all four crew members have agreed on the shot design for this scene. Signals the debate for this scene is complete. Only call when Director, DP, Editor, and Production Designer have all spoken and reached agreement.',
//   parameters: z.object({
//     reason: z.string().optional().describe('Brief reason why consensus was reached'),
//   }),
//   execute: async (input, toolContext) => {
//     const state = toolContext?.state as Record<string, unknown> | undefined;
//     if (!state) throw new Error('No session state available');

//     state['consensus_reached'] = true;

//     return { status: 'consensus_reached', reason: input.reason };
//   },
// });

// /**
//  * Updates the accumulated shot parameters from the debate.
//  * The coordinator extracts agreed parameters and stores them here.
//  */
// export const updateShotParametersTool = new FunctionTool({
//   name: 'update_shot_parameters',
//   description: 'Stores the agreed shot parameters from the debate. Call when the crew has agreed on technical specs (focal length, lighting, etc.). Parameters use the spec values: focal_length (16-200mm), camera_angle, shot_size, key_light, light_quality, era, set_condition, movement, aspect_ratio.',
//   parameters: z.object({
//     shot_count: z.number().optional().describe('Number of shots for this scene'),
//     scene_slug: z.string().optional().describe('Scene heading e.g. EXT. LAKE — DAY'),
//     location: z.string().optional().describe('Location from scene'),
//     time_of_day: z.string().optional().describe('Day, Night, Dawn, Dusk, etc.'),
//     focal_length: z.string().optional().describe('e.g. 24mm, 85mm'),
//     camera_angle: z.string().optional().describe('Bird\'s Eye, High, Eye Level, Low, Worm\'s Eye'),
//     shot_size: z.string().optional().describe('ECU, CU, MCU, MS, MWS, Wide, EWS'),
//     key_light: z.string().optional().describe('Front, Side 45°, Side 90°, Back, Top, Under'),
//     light_quality: z.string().optional().describe('Soft, Medium-Soft, Medium-Hard, Hard'),
//     era: z.string().optional().describe('1920s, 1940s Noir, Contemporary, etc.'),
//     set_condition: z.string().optional().describe('Clean, Wet Streets, Dusty, Foggy, etc.'),
//     movement: z.string().optional().describe('Static, Slow Push, Pan, Tracking, Crane, etc.'),
//     aspect_ratio: z.string().optional().describe('1.33:1, 1.85:1, 2.39:1, 16:9'),
//     director_summary: z.string().optional().describe('Director\'s agreed vision'),
//     cinematographer_summary: z.string().optional().describe('DP\'s agreed technical choices'),
//     editor_summary: z.string().optional().describe('Editor\'s agreed pacing/movement'),
//     production_designer_summary: z.string().optional().describe('PD\'s agreed look/atmosphere'),
//   }),
//   execute: async (input, toolContext) => {
//     const state = toolContext?.state as Record<string, unknown> | undefined;
//     if (!state) throw new Error('No session state available');

//     const params = (state['shot_parameters'] as Record<string, unknown>) || {};
//     Object.entries(input).forEach(([key, value]) => {
//       if (value !== undefined) params[key] = value;
//     });
//     state['shot_parameters'] = params;

//     return { status: 'updated', parameters: Object.keys(input) };
//   },
// });

// /**
//  * Advances to the next scene. Call when current scene debate is complete.
//  */
// export const advanceToNextSceneTool = new FunctionTool({
//   name: 'advance_to_next_scene',
//   description: 'Call when the current scene debate is complete and you need to move to the next scene. Resets debate_transcript and consensus_reached for the new scene.',
//   parameters: z.object({}),
//   execute: async (_input, toolContext) => {
//     const state = toolContext?.state as Record<string, unknown> | undefined;
//     if (!state) throw new Error('No session state available');

//     // Archive current scene to completed_scenes
//     const completed = (state['completed_scenes'] as Array<unknown>) || [];
//     const current = state['current_scene'];
//     if (current) completed.push(current);
//     state['completed_scenes'] = completed;

//     // Reset for next scene
//     state['debate_transcript'] = [];
//     state['consensus_reached'] = false;
//     state['scene_index'] = ((state['scene_index'] as number) ?? 0) + 1;

//     return { status: 'advanced', scene_index: state['scene_index'] };
//   },
// });

// export const coordinatorTools = [
//   appendToDebateTool,
//   setConsensusReachedTool,
//   updateShotParametersTool,
//   advanceToNextSceneTool,
// ];
