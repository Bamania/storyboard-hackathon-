/**
 * Core TypeScript types for Storyboard Studio.
 */

// ─── Agents ──────────────────────────────────────────
export type AgentRole = 'director' | 'cinematographer' | 'editor' | 'productionDesigner';

export interface AgentMessage {
  id: string;
  agent: AgentRole;
  content: string;
  timestamp: number;
  isConsensus?: boolean;
}

// ─── Screenplay / Scenes ────────────────────────────
export interface Dialogue {
  character: string;
  parenthetical?: string;
  line: string;
}

export interface SceneBlock {
  type: 'action' | 'dialogue';
  text?: string;         // for action blocks
  dialogue?: Dialogue;   // for dialogue blocks
}

export interface Scene {
  id: string;
  number: number;
  slugLine: string;
  body: string;
  blocks: SceneBlock[];
  characters: string[];
  location: string;
  timeOfDay: string;
}

// ─── Cast / Characters ──────────────────────────────
export interface Character {
  id: string;
  name: string;
  age: string;
  description: string;
  visualTraits: string[];
  color: string;
  isLocked: boolean;
  referenceImage?: string;
}

// ─── Frames / Storyboard ────────────────────────────
export interface Frame {
  id: string;
  sceneId: string;
  sceneNumber: number;
  frameNumber: number;
  title: string;
  description: string;
  characters: string[];
  duration: string;
  instantParams: InstantParams;
  deepParams: DeepParams;
  isRegenerating?: boolean;
}

// ─── Tier 1: Instant Parameters ─────────────────────
export interface InstantParams {
  colorTemperature: number;
  contrast: number;
  haze: number;
  colorGrade: ColorGrade;
}

export type ColorGrade = 'Neutral' | 'Cool Noir' | 'Warm Amber' | 'Bleach Bypass' | 'Teal & Orange';

// ─── Tier 2: Deep Parameters ────────────────────────
export interface DeepParams {
  focalLength: number;
  cameraAngle: CameraAngle;
  dutchAngle: number;
  cameraHeight: CameraHeight;
  shotSize: ShotSize;
  compGrid: CompGrid;
  eyeline: Eyeline;
  headroom: Headroom;
  keyLightDir: KeyLightDir;
  lightQuality: LightQuality;
  era: Era;
  setCondition: SetCondition;
  movement: Movement;
  aspectRatio: AspectRatio;
}

export type CameraAngle = "Bird's Eye" | 'High' | 'Eye Level' | 'Low' | "Worm's Eye";
export type CameraHeight = 'Ground' | 'Low' | 'Standard' | 'High' | 'Overhead';
export type ShotSize = 'ECU' | 'CU' | 'MCU' | 'MS' | 'MWS' | 'Wide' | 'EWS';
export type CompGrid = 'Center' | 'Rule of Thirds' | 'Golden Ratio' | 'Diagonal' | 'Symmetry';
export type Eyeline = 'Direct to Camera' | 'Off-frame Left' | 'Off-frame Right' | 'Down' | 'Up';
export type Headroom = 'Extreme Tight' | 'Tight' | 'Standard' | 'Loose';
export type KeyLightDir = 'Front' | 'Side 45°' | 'Side 90°' | 'Back' | 'Top' | 'Under';
export type LightQuality = 'Soft' | 'Medium-Soft' | 'Medium-Hard' | 'Hard';
export type Era = '1920s' | '1940s Noir' | '1960s' | '1980s' | 'Contemporary' | 'Near Future';
export type SetCondition = 'Clean' | 'Wet Streets' | 'Dusty' | 'Foggy' | 'Snowy' | 'Debris';
export type Movement = 'Static' | 'Slow Push' | 'Pull Back' | 'Pan Left' | 'Pan Right' | 'Tracking' | 'Crane Up' | 'Crane Down';
export type AspectRatio = '1.33:1' | '1.85:1' | '2.39:1' | '16:9' | '9:16';

// ─── Chat ────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  sender: 'user' | AgentRole;
  content: string;
  timestamp: number;
  frameId?: string;
}

// ─── Navigation ──────────────────────────────────────
export type AppStep = 0 | 1 | 2 | 3 | 4;

export interface StepInfo {
  step: AppStep;
  label: string;
  path: string;
}
