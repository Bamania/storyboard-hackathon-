/**
 * 4 Crew Agents — each owns its 6 parameters and reads the full shared state.
 *
 * Round 1: initial proposals from scene info.
 * Round 2: revisions informed by all other agents' Round 1 values.
 *
 * Write isolation: each agent has ONLY its own update tool.
 * Read access: all 4 param blocks are visible via session state template vars.
 */

import { LlmAgent } from '@google/adk';
import {
  updateDirectorParametersTool,
  updateCinematographerParametersTool,
  updateProductionDesignerParametersTool,
  updateEditorParametersTool,
  exitLoopTool,
} from './tools.js';
import {
  DIRECTOR_INSTRUCTION,
  CINEMATOGRAPHER_INSTRUCTION,
  EDITOR_INSTRUCTION,
  PRODUCTION_DESIGNER_INSTRUCTION,
  APPROVAL_CHECKER_INSTRUCTION,
} from './instructions.js';

const GEMINI_MODEL = 'gemini-2.5-flash';

export const directorAgent = new LlmAgent({
  name: 'Director',
  model: GEMINI_MODEL,
  description:
    'Fills the 6 director parameters (story beat, tone, pacing, blocking, subtext, intent) for the current scene.',
  instruction: DIRECTOR_INSTRUCTION,
  tools: [updateDirectorParametersTool],
  includeContents: 'none',
  outputKey: 'director_parameters',
});

export const cinematographerAgent = new LlmAgent({
  name: 'Cinematographer',
  model: GEMINI_MODEL,
  description:
    'Fills the 6 cinematographer parameters (lens, aperture, angle, contrast, color temp, ISO) for the current scene.',
  instruction: CINEMATOGRAPHER_INSTRUCTION,
  tools: [updateCinematographerParametersTool],
  includeContents: 'none',
  outputKey: 'cinematographer_parameters',
});

export const editorAgent = new LlmAgent({
  name: 'Editor',
  model: GEMINI_MODEL,
  description:
    'Fills the 6 editor parameters (aspect ratio, 180-rule, match cuts, motion arrows, camera motion, timing) for the current scene.',
  instruction: EDITOR_INSTRUCTION,
  tools: [updateEditorParametersTool],
  includeContents: 'none',
  outputKey: 'editor_parameters',
});

export const productionDesignerAgent = new LlmAgent({
  name: 'ProductionDesigner',
  model: GEMINI_MODEL,
  description:
    'Fills the 6 production design parameters (z-axis, volumetrics, geometry, palette, texture, practicals) for the current scene.',
  instruction: PRODUCTION_DESIGNER_INSTRUCTION,
  tools: [updateProductionDesignerParametersTool],
  includeContents: 'none',
  outputKey: 'production_designer_parameters',
});

export const approvalCheckerAgent = new LlmAgent({
  name: 'ApprovalChecker',
  model: GEMINI_MODEL,
  description:
    'Checks if all crew approvals are true and triggers ExitLoop when scene is fully approved.',
  instruction: APPROVAL_CHECKER_INSTRUCTION,
  tools: [exitLoopTool],
  includeContents: 'none',
});


