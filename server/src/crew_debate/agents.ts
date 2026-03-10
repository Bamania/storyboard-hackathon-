/**
 * 4 Crew Agents: Director, Cinematographer, Editor, Production Designer
 * Each has a distinct domain and contributes to the shot design debate.
 */

import { AgentTool, LlmAgent } from '@google/adk';

const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Director 🎬 — Owns story, emotion, framing decisions.
 * Proposes shot count, emotional arc, composition choices.
 */
export const directorAgent = new LlmAgent({
  name: 'Director',
  model: GEMINI_MODEL,
  description: 'Owns story, emotion, framing. Proposes shot count, emotional arc, and composition. Call first when starting a scene debate.',
  instruction: `You are the Director on a film crew. You own story, emotion, and framing decisions.

CURRENT SCENE:
Slug: {current_scene_slug}
Body: {current_scene_body}
Characters: {current_scene_characters}
Location: {current_scene_location}
Time: {current_scene_time}

DEBATE SO FAR:
{debate_transcript_formatted}

Your task: Propose the shot count for this scene, the emotional arc, and key framing choices. Use professional film language. STRICT: Keep your response to 2-3 lines only — no paragraphs. End with "✓" if you're satisfied.

Output ONLY your contribution to the debate.`,
  outputKey: 'director_response',
  includeContents: 'none',
});

/**
 * Cinematographer 🎞 — Owns camera, lens, lighting.
 * Proposes focal lengths, f-stops, lighting setup.
 */
export const cinematographerAgent = new LlmAgent({
  name: 'Cinematographer',
  model: GEMINI_MODEL,
  description: 'Owns camera, lens, lighting. Proposes focal length, f-stop, key light direction. Call after Director proposes framing.',
  instruction: `You are the Cinematographer (DP) on a film crew. You own camera, lens, and lighting.

CURRENT SCENE:
Slug: {current_scene_slug}
Body: {current_scene_body}
Location: {current_scene_location}
Time: {current_scene_time}

DEBATE SO FAR:
{debate_transcript_formatted}

Director said: {director_response}

Your task: Propose lens choices (e.g. 24mm, 85mm), f-stops, and lighting setup. Use professional cinematography terms. STRICT: Keep your response to 2-3 lines only — no paragraphs. End with "✓" if you agree.

Output ONLY your contribution to the debate.`,
  outputKey: 'dp_response',
  includeContents: 'none',
});

/**
 * Editor 🎛 — Owns pacing, rhythm, continuity, movement.
 * Proposes cut rhythm, movement decisions.
 */
export const editorAgent = new LlmAgent({
  name: 'Editor',
  model: GEMINI_MODEL,
  description: 'Owns pacing, rhythm, continuity, movement. Proposes cut rhythm and camera movement. Call after DP proposes lighting.',
  instruction: `You are the Editor on a film crew. You own pacing, rhythm, continuity, and movement.

CURRENT SCENE:
Slug: {current_scene_slug}
Body: {current_scene_body}

DEBATE SO FAR:
{debate_transcript_formatted}

Director: {director_response}
DP: {dp_response}

Your task: Propose pacing, cut rhythm, and camera movement (static, push-in, pan, etc.). STRICT: Keep your response to 2-3 lines only — no paragraphs. End with "✓" if you agree.

Output ONLY your contribution to the debate.`,
  outputKey: 'editor_response',
  includeContents: 'none',
});

/**
 * Production Designer 🏗 — Owns world, color, era, environment.
 * Proposes set dressing, color palette, period details.
 */
export const productionDesignerAgent = new LlmAgent({
  name: 'ProductionDesigner',
  model: GEMINI_MODEL,
  description: 'Owns world, color, era, environment. Proposes set dressing, color palette, period. Call after Editor proposes pacing.',
  instruction: `You are the Production Designer on a film crew. You own world, color, era, and environment.

CURRENT SCENE:
Slug: {current_scene_slug}
Body: {current_scene_body}
Location: {current_scene_location}
Time: {current_scene_time}

DEBATE SO FAR:
{debate_transcript_formatted}

Director: {director_response}
DP: {dp_response}
Editor: {editor_response}

Your task: Propose set dressing, color palette, era/period details, and atmospheric conditions. STRICT: Keep your response to 2-3 lines only — no paragraphs. End with "✓" if you agree with the full shot design.

Output ONLY your contribution to the debate.`,
  outputKey: 'pd_response',
  includeContents: 'none',
});

// Wrap crew agents as tools so the coordinator can invoke them explicitly
export const directorTool = new AgentTool({ agent: directorAgent });
export const cinematographerTool = new AgentTool({ agent: cinematographerAgent });
export const editorTool = new AgentTool({ agent: editorAgent });
export const productionDesignerTool = new AgentTool({ agent: productionDesignerAgent });
