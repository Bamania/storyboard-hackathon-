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
} from './tools.js';
import {
  DIRECTOR_INSTRUCTION,
  CINEMATOGRAPHER_INSTRUCTION,
  EDITOR_INSTRUCTION,
  PRODUCTION_DESIGNER_INSTRUCTION,
} from './instructions.js';

const GEMINI_MODEL = 'gemini-2.5-flash';

export const directorAgent = new LlmAgent({
  name: 'Director',
  model: GEMINI_MODEL,
  description:
    'Round 1: Shares thoughts. Round 2: Sets final director parameters.',
  instruction: DIRECTOR_INSTRUCTION,
  tools: [updateDirectorParametersTool],
  includeContents: 'none',
  outputKey: 'director_parameters',
});

export const cinematographerAgent = new LlmAgent({
  name: 'Cinematographer',
  model: GEMINI_MODEL,
  description:
    'Round 1: Shares thoughts. Round 2: Sets final cinematographer parameters.',
  instruction: CINEMATOGRAPHER_INSTRUCTION,
  tools: [updateCinematographerParametersTool],
  includeContents: 'none',
  outputKey: 'cinematographer_parameters',
});

export const editorAgent = new LlmAgent({
  name: 'Editor',
  model: GEMINI_MODEL,
  description:
    'Round 1: Shares thoughts. Round 2: Sets final editor parameters.',
  instruction: EDITOR_INSTRUCTION,
  tools: [updateEditorParametersTool],
  includeContents: 'none',
  outputKey: 'editor_parameters',
});

export const productionDesignerAgent = new LlmAgent({
  name: 'ProductionDesigner',
  model: GEMINI_MODEL,
  description:
    'Round 1: Shares thoughts. Round 2: Sets final production designer parameters.',
  instruction: PRODUCTION_DESIGNER_INSTRUCTION,
  tools: [updateProductionDesignerParametersTool],
  includeContents: 'none',
  outputKey: 'production_designer_parameters',
});

