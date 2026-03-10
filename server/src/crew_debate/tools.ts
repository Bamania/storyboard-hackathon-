/**
 * Coordinator tools for state management during crew debate.
 * These tools give the LLM coordinator maximum control over the debate flow.
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';

/**
 * Appends a crew member's message to the debate transcript.
 * Call this after each agent speaks to build the full debate history.
 */
export const appendToDebateTool = new FunctionTool({
  name: 'append_to_debate',
  description: 'Records a crew member\'s contribution to the debate transcript. Call this after each agent (Director, Cinematographer, Editor, Production Designer) speaks. Include the agent name and their full message.',
  parameters: z.object({
    agent_name: z.enum(['Director', 'Cinematographer', 'Editor', 'ProductionDesigner']).describe('Which crew member spoke'),
    message: z.string().describe('The full message/contribution from that crew member'),
    is_consensus: z.boolean().optional().describe('True if this message signals agreement/completion (e.g. ends with ✓)'),
  }),
  execute: async (input, toolContext) => {
    const state = toolContext?.state as Record<string, unknown> | undefined;
    if (!state) throw new Error('No session state available');

    const transcript = (state['debate_transcript'] as Array<{ agent: string; message: string; timestamp: number; isConsensus?: boolean }>) || [];
    transcript.push({
      agent: input.agent_name,
      message: input.message,
      timestamp: Date.now(),
      isConsensus: input.is_consensus ?? false,
    });
    state['debate_transcript'] = transcript;

    // When ProductionDesigner speaks, a full round is complete (Dir → DP → Ed → PD)
    if (input.agent_name === 'ProductionDesigner') {
      const round = ((state['debate_round'] as number) ?? 0) + 1;
      state['debate_round'] = round;
    }

    // Format for coordinator instruction
    const formatted = transcript
      .map((t) => `[${t.agent}]: ${t.message}`)
      .join('\n\n');
    state['debate_transcript_formatted'] = formatted || '(No contributions yet)';

    return { status: 'recorded', agent: input.agent_name };
  },
});

/**
 * Signals that the crew has reached consensus for the current scene.
 * Call when all 4 agents agree and no further debate is needed.
 */
export const setConsensusReachedTool = new FunctionTool({
  name: 'set_consensus_reached',
  description: 'Call when all four crew members have agreed on the shot design for this scene. Signals the debate for this scene is complete. Only call when Director, DP, Editor, and Production Designer have all spoken and reached agreement.',
  parameters: z.object({
    reason: z.string().optional().describe('Brief reason why consensus was reached'),
  }),
  execute: async (input, toolContext) => {
    const state = toolContext?.state as Record<string, unknown> | undefined;
    if (!state) throw new Error('No session state available');

    state['consensus_reached'] = true;

    return { status: 'consensus_reached', reason: input.reason };
  },
});

/**
 * Updates the accumulated shot parameters from the debate.
 * The coordinator extracts agreed parameters and stores them here.
 */
export const updateShotParametersTool = new FunctionTool({
  name: 'update_shot_parameters',
  description: 'Stores the agreed shot parameters from the debate. Call when the crew has agreed on technical specs (focal length, lighting, etc.). Parameters use the spec values: focal_length (16-200mm), camera_angle, shot_size, key_light, light_quality, era, set_condition, movement, aspect_ratio.',
  parameters: z.object({
    shot_count: z.number().optional().describe('Number of shots for this scene'),
    scene_slug: z.string().optional().describe('Scene heading e.g. EXT. LAKE — DAY'),
    location: z.string().optional().describe('Location from scene'),
    time_of_day: z.string().optional().describe('Day, Night, Dawn, Dusk, etc.'),
    focal_length: z.string().optional().describe('e.g. 24mm, 85mm'),
    camera_angle: z.string().optional().describe('Bird\'s Eye, High, Eye Level, Low, Worm\'s Eye'),
    shot_size: z.string().optional().describe('ECU, CU, MCU, MS, MWS, Wide, EWS'),
    key_light: z.string().optional().describe('Front, Side 45°, Side 90°, Back, Top, Under'),
    light_quality: z.string().optional().describe('Soft, Medium-Soft, Medium-Hard, Hard'),
    era: z.string().optional().describe('1920s, 1940s Noir, Contemporary, etc.'),
    set_condition: z.string().optional().describe('Clean, Wet Streets, Dusty, Foggy, etc.'),
    movement: z.string().optional().describe('Static, Slow Push, Pan, Tracking, Crane, etc.'),
    aspect_ratio: z.string().optional().describe('1.33:1, 1.85:1, 2.39:1, 16:9'),
    director_summary: z.string().optional().describe('Director\'s agreed vision'),
    cinematographer_summary: z.string().optional().describe('DP\'s agreed technical choices'),
    editor_summary: z.string().optional().describe('Editor\'s agreed pacing/movement'),
    production_designer_summary: z.string().optional().describe('PD\'s agreed look/atmosphere'),
  }),
  execute: async (input, toolContext) => {
    const state = toolContext?.state as Record<string, unknown> | undefined;
    if (!state) throw new Error('No session state available');

    const params = (state['shot_parameters'] as Record<string, unknown>) || {};
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) params[key] = value;
    });
    state['shot_parameters'] = params;

    return { status: 'updated', parameters: Object.keys(input) };
  },
});

/**
 * Advances to the next scene. Call when current scene debate is complete.
 */
export const advanceToNextSceneTool = new FunctionTool({
  name: 'advance_to_next_scene',
  description: 'Call when the current scene debate is complete and you need to move to the next scene. Resets debate_transcript and consensus_reached for the new scene.',
  parameters: z.object({}),
  execute: async (_input, toolContext) => {
    const state = toolContext?.state as Record<string, unknown> | undefined;
    if (!state) throw new Error('No session state available');

    // Archive current scene to completed_scenes
    const completed = (state['completed_scenes'] as Array<unknown>) || [];
    const current = state['current_scene'];
    if (current) completed.push(current);
    state['completed_scenes'] = completed;

    // Reset for next scene
    state['debate_transcript'] = [];
    state['consensus_reached'] = false;
    state['scene_index'] = ((state['scene_index'] as number) ?? 0) + 1;

    return { status: 'advanced', scene_index: state['scene_index'] };
  },
});

export const coordinatorTools = [
  appendToDebateTool,
  setConsensusReachedTool,
  updateShotParametersTool,
  advanceToNextSceneTool,
];
