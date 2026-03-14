import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { getArtboardWithScene, updateArtboard } from '../db/index.js';

export const imgGenRouter = Router();

type JsonParams = Record<string, unknown> | null;

/** Assemble a cinematic image prompt from shot description + 4 crew param blocks. */
function buildImagePrompt(
  sceneSlug: string,
  sceneBody: string,
  directorParams: JsonParams,
  cinematographerParams: JsonParams,
  productionDesignerParams: JsonParams,
  editorParams: JsonParams
): string {
  const d = directorParams ?? {};
  const c = cinematographerParams ?? {};
  const p = productionDesignerParams ?? {};
  const e = editorParams ?? {};

  const parts: string[] = [
    `Cinematic film still. Scene: ${sceneSlug}.`,
    sceneBody ? `Action/description: ${String(sceneBody).slice(0, 400)}` : '',
    d.story_beat_action ? `Dramatic moment: ${d.story_beat_action}` : '',
    d.emotional_tone ? `Emotional tone: ${d.emotional_tone}` : '',
    d.character_blocking ? `Blocking: ${d.character_blocking}` : '',
    d.directorial_intent ? `Director's intent: ${d.directorial_intent}` : '',
    c.focal_length_mm ? `Lens: ${c.focal_length_mm}` : '',
    c.aperture_fstop ? `Aperture: ${c.aperture_fstop}` : '',
    c.camera_angle_tilt ? `Camera angle: ${c.camera_angle_tilt}` : '',
    c.lighting_contrast_ratio ? `Lighting: ${c.lighting_contrast_ratio}` : '',
    c.color_temperature_kelvin ? `Color temp: ${c.color_temperature_kelvin}` : '',
    c.exposure_iso ? `Exposure: ${c.exposure_iso}` : '',
    p.color_palette ? `Color palette: ${p.color_palette}` : '',
    p.texture_materiality ? `Textures: ${p.texture_materiality}` : '',
    p.volumetrics_atmosphere ? `Atmosphere: ${p.volumetrics_atmosphere}` : '',
    p.practical_lights ? `Practical lights: ${p.practical_lights}` : '',
    p.z_axis_clutter ? `Depth/composition: ${p.z_axis_clutter}` : '',
    p.location_set_geometry ? `Set geometry: ${p.location_set_geometry}` : '',
    e.aspect_ratio ? `Aspect ratio: ${e.aspect_ratio}` : '',
    e.duration_timing ? `Pacing: ${e.duration_timing}` : '',
  ];

  return parts.filter(Boolean).join('. ');
}

/**
 * POST /api/img-gen
 * Body: { artboardId: number }
 * Generates an image from the artboard's scene + crew params, updates the artboard, returns the image.
 */
imgGenRouter.post('/img-gen', async (req, res) => {
  const artboardId = req.body?.artboardId as number | undefined;
  if (artboardId == null || typeof artboardId !== 'number') {
    res.status(400).json({ error: 'artboardId (number) is required' });
    return;
  }

  const artboard = await getArtboardWithScene(artboardId);
  if (!artboard) {
    res.status(404).json({ error: 'Artboard not found' });
    return;
  }

  if (artboard.status !== 'PARAMS_READY') {
    res.status(400).json({
      error: `Artboard status is ${artboard.status}. Expected PARAMS_READY.`,
    });
    return;
  }

  const scene = artboard.scene;
  if (!scene) {
    res.status(400).json({ error: 'Artboard has no linked scene' });
    return;
  }

  const prompt = buildImagePrompt(
    scene.slug,
    scene.body,
    artboard.directorParams as JsonParams,
    artboard.cinematographerParams as JsonParams,
    artboard.productionDesignerParams as JsonParams,
    artboard.editorParams as JsonParams
  );

  const startMs = Date.now();

  try {
    await updateArtboard(artboardId, { status: 'GENERATING', shotDescription: prompt });

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY ?? '' });
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-fast-generate-001',
      prompt,
      config: { numberOfImages: 1 },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    const durationMs = Date.now() - startMs;

    if (!imageBytes) {
      await updateArtboard(artboardId, {
        status: 'FAILED',
        errorMessage: 'No image returned from API',
        generationDurationMs: durationMs,
      });
      res.status(502).json({ error: 'Image generation returned no image' });
      return;
    }

    const imageUrl = `data:image/png;base64,${imageBytes}`;
    await updateArtboard(artboardId, {
      status: 'DONE',
      imageUrl,
      shotDescription: prompt,
      generationDurationMs: durationMs,
    });

    res.json({
      artboardId,
      imageUrl,
      shotDescription: prompt,
      generationDurationMs: durationMs,
    });
  } catch (err) {
    const durationMs = Date.now() - startMs;
    const message = err instanceof Error ? err.message : 'Unknown error';
    await updateArtboard(artboardId, {
      status: 'FAILED',
      errorMessage: message,
      generationDurationMs: durationMs,
    });
    console.error('[imgGen] Error:', err);
    res.status(500).json({ error: message });
  }
});
