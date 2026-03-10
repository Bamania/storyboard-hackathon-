/**
 * Types for the Crew Debate (Shot Generation) system.
 * 4 AI agents: Director, Cinematographer, Editor, Production Designer
 */

export interface DebateMessage {
  agent: 'Director' | 'Cinematographer' | 'Editor' | 'ProductionDesigner';
  message: string;
  timestamp: number;
  isConsensus?: boolean;
}

export interface SceneContext {
  slug: string;
  body: string;
  characters: string[];
  location: string;
  timeOfDay: string;
}

export interface ShotParameters {
  focal_length?: string;
  camera_angle?: string;
  shot_size?: string;
  key_light?: string;
  light_quality?: string;
  era?: string;
  set_condition?: string;
  movement?: string;
  aspect_ratio?: string;
  shot_count?: number;
  [key: string]: string | number | undefined;
}

export interface CrewDebateState {
  current_scene: SceneContext;
  scene_index: number;
  total_scenes: number;
  debate_transcript: DebateMessage[];
  shot_parameters: ShotParameters;
  consensus_reached: boolean;
  characters: Array<{ name: string; description: string; color: string }>;
  completed_scenes: SceneContext[];
  frames: FrameDefinition[];
}

export interface FrameDefinition {
  scene_ref: string;
  shot_title: string;
  description: string;
  characters: string[];
  focal_length?: string;
  aperture?: string;
  color_temp?: string;
  shot_type?: string;
}
