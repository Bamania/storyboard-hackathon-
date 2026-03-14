/**
 * Types for the Crew Debate (Shot Generation) system.
 * 4 AI agents: Director, Cinematographer, Editor, Production Designer
 * Each agent owns 6 parameters → 24 total per scene.
 */

export interface SceneContext {
  slug: string;
  body: string;
  characters: string[];
  location: string;
  timeOfDay: string;
}

/** The 6 parameters owned exclusively by the Director. */
export interface DirectorParameters {
  story_beat_action: string;
  emotional_tone: string;
  coverage_pacing: string;
  character_blocking: string;
  dialogue_subtext: string;
  directorial_intent: string;
}

/** The 6 parameters owned exclusively by the Cinematographer. */
export interface CinematographerParameters {
  focal_length_mm: string;
  aperture_fstop: string;
  camera_angle_tilt: string;
  lighting_contrast_ratio: string;
  color_temperature_kelvin: string;
  exposure_iso: string;
}

/** The 6 parameters owned exclusively by the Production Designer. */
export interface ProductionDesignerParameters {
  z_axis_clutter: string;
  volumetrics_atmosphere: string;
  location_set_geometry: string;
  color_palette: string;
  texture_materiality: string;
  practical_lights: string;
}

/** The 6 parameters owned exclusively by the Editor. */
export interface EditorParameters {
  aspect_ratio: string;
  eye_lines_180_rule: string;
  match_cuts: string;
  character_motion_arrows: string;
  camera_motion_arrows: string;
  duration_timing: string;
}

/** The complete 24-parameter output for a single scene. */
export interface SceneParameters {
  scene_slug: string;
  scene_index: number;
  director_parameters: DirectorParameters;
  cinematographer_parameters: CinematographerParameters;
  production_designer_parameters: ProductionDesignerParameters;
  editor_parameters: EditorParameters;
}
