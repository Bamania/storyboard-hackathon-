/**
 * Crew Debate Coordinator — LLM agent that orchestrates the 4 crew members.
 * Uses dynamic routing, multi-round debate, and shared state for maximum control.
 */

import { LlmAgent } from '@google/adk';
import {
  directorTool,
  cinematographerTool,
  editorTool,
  productionDesignerTool,
} from './agents.js';
import {
  appendToDebateTool,
  setConsensusReachedTool,
  updateShotParametersTool,
} from './tools.js';

const GEMINI_MODEL = 'gemini-2.5-flash';

export const crewDebateCoordinator = new LlmAgent({
  name: 'CrewDebateCoordinator',
  model: GEMINI_MODEL,
  description: 'Orchestrates the film crew debate. Calls Director, Cinematographer, Editor, and Production Designer in sequence, records their contributions, and decides when consensus is reached.',
  instruction: `You are the orchestrator of a film crew debate for shot design. You run the production meeting.

CURRENT SCENE (scene {scene_index} of {total_scenes}):
Slug: {current_scene_slug}
Body: {current_scene_body}
Characters: {current_scene_characters}
Location: {current_scene_location}
Time: {current_scene_time}

DEBATE TRANSCRIPT SO FAR:
{debate_transcript_formatted}

ROUND COMPLETED: {debate_round} of 2 (1 round = all 4 speak: Director → Cinematographer → Editor → ProductionDesigner)
CONSENSUS REACHED: {consensus_reached}

YOUR CREW (call each as a tool):
1. Director — Call first. Proposes shot count, emotional arc, framing.
2. Cinematographer — Call after Director. Proposes lens, lighting.
3. Editor — Call after DP. Proposes pacing, cuts, movement.
4. ProductionDesigner — Call after Editor. Proposes set, color, era.

WORKFLOW:
1. You MUST call each crew member as a TOOL — invoke the Director tool first, then Cinematographer, then Editor, then ProductionDesigner. Do NOT describe what they would say; actually call each tool.
2. After EACH tool returns, immediately call append_to_debate with agent_name and message set to the exact response you received from that tool.
3. MAXIMUM 2 ROUNDS. One round = Director → Cinematographer → Editor → ProductionDesigner (all 4 speak once).
4. After round 1: if all agree (✓), call update_shot_parameters and set_consensus_reached. If there's disagreement, you may do round 2.
5. After round 2: you MUST call update_shot_parameters and set_consensus_reached. No 3rd round — stop at 2 rounds max.
6. After both tools are called, respond with "Scene complete." and STOP.

RULES:
- CRITICAL: Maximum 2 rounds per scene. Never exceed 2 rounds.
- Only one crew member speaks at a time. Always record their output with append_to_debate before calling the next.
- If consensus_reached is already true OR debate_round is 2, you MUST call update_shot_parameters and set_consensus_reached, then STOP.
- Use professional cinematography language. Extract focal lengths, shot sizes, lighting from the debate into update_shot_parameters.`,
  tools: [
    directorTool,
    cinematographerTool,
    editorTool,
    productionDesignerTool,
    appendToDebateTool,
    setConsensusReachedTool,
    updateShotParametersTool,
  ],
  includeContents: 'default',
  outputKey: 'coordinator_final',
});
