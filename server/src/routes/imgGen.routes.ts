import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { getArtboardWithScene, updateArtboard } from '../db/index.js';
import { uploadImageToGCP, generateImageFileName } from '../services/gcpStorageService.js';
import { prisma } from '../db/index.js';

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

/**
 * POST /api/imgqueueGeneration
 * Body: { scene: number, storyboardId: number, directorParams, cinematographerParams, productionDesignerParams, editorParams }
 * Generates an image from queue parameters, uploads to GCP (private), returns pre-signed URL
 * Pre-signed URL expires in 1 hour for security
 */
imgGenRouter.post('/imgqueueGeneration', async (req, res) => {
  const { scene, storyboardId, directorParams, cinematographerParams, productionDesignerParams, editorParams } = req.body;

  // Validate required fields
  if (scene == null || typeof scene !== 'number') {
    res.status(400).json({ success: false, error: 'scene (number) is required' });
    return;
  }

  if (storyboardId == null || typeof storyboardId !== 'number') {
    res.status(400).json({ success: false, error: 'storyboardId (number) is required' });
    return;
  }

  if (!directorParams || !cinematographerParams || !productionDesignerParams || !editorParams) {
    res.status(400).json({
      success: false,
      error: 'All crew parameters (director, cinematographer, productionDesigner, editor) are required',
    });
    return;
  }

  const startMs = Date.now();

  try {
    // Get the scene from database using storyboardId and scene number
    const sceneRecord = await prisma.scene.findFirst({
      where: {
        storyboardId,
        position: scene - 1, // Convert 1-indexed to 0-indexed position
      },
    });

    if (!sceneRecord) {
      res.status(404).json({
        success: false,
        error: `Scene ${scene} not found in storyboard ${storyboardId}`,
        sceneNumber: scene,
      });
      return;
    }

    // Get or create artboard for this scene
    let artboard = await prisma.artboard.findFirst({
      where: {
        sceneId: sceneRecord.id,
        position: 0,
      },
    });

    if (!artboard) {
      artboard = await prisma.artboard.create({
        data: {
          sceneId: sceneRecord.id,
          position: 0,
          status: 'PARAMS_READY',
          directorParams: directorParams as object,
          cinematographerParams: cinematographerParams as object,
          productionDesignerParams: productionDesignerParams as object,
          editorParams: editorParams as object,
        },
      });
    }

    // Build prompt from queue parameters
    const sceneSlug = sceneRecord.slug;
    const sceneBody = sceneRecord.body;

    const prompt = buildImagePrompt(
      sceneSlug,
      sceneBody,
      directorParams as JsonParams,
      cinematographerParams as JsonParams,
      productionDesignerParams as JsonParams,
      editorParams as JsonParams
    );

    console.log(`[imgQueue] Generating image for scene ${scene}`);

    // Update status to GENERATING
    await updateArtboard(artboard.id, { status: 'GENERATING', shotDescription: prompt });

    // Initialize Google GenAI and generate image
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY ?? '' });
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-fast-generate-001',
      prompt,
      config: { numberOfImages: 1 },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;

    if (!imageBytes) {
      const durationMs = Date.now() - startMs;
      console.error(`[imgQueue] Scene ${scene}: No image bytes returned`);
      await updateArtboard(artboard.id, {
        status: 'FAILED',
        errorMessage: 'Image generation returned no image',
        generationDurationMs: durationMs,
      });
      res.status(502).json({
        success: false,
        error: 'Image generation returned no image',
        sceneNumber: scene,
      });
      return;
    }

    // Upload to GCP
    const fileName = generateImageFileName(scene);
    const gcpUrl = await uploadImageToGCP(imageBytes, fileName);

    const durationMs = Date.now() - startMs;

    // Update artboard with GCP URL
    await updateArtboard(artboard.id, {
      status: 'DONE',
      imageUrl: gcpUrl,
      shotDescription: prompt,
      generationDurationMs: durationMs,
    });

    console.log(`[imgQueue] ✓ Scene ${scene} generated and uploaded in ${durationMs}ms`);

    res.json({
      success: true,
      sceneNumber: scene,
      imageUrl: gcpUrl, // Public GCP URL
      shotDescription: prompt,
      generationDurationMs: durationMs,
      message: `Image generated and uploaded to GCP for scene ${scene}`,
    });
  } catch (err) {
    const durationMs = Date.now() - startMs;
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[imgQueue] Scene error:`, message);
    
    // Try to update artboard status if we have it
    try {
      const sceneRecord = await prisma.scene.findFirst({
        where: {
          storyboardId,
          position: (scene as number) - 1,
        },
      });
      if (sceneRecord) {
        const artboard = await prisma.artboard.findFirst({
          where: { sceneId: sceneRecord.id, position: 0 },
        });
        if (artboard) {
          await updateArtboard(artboard.id, {
            status: 'FAILED',
            errorMessage: message,
            generationDurationMs: durationMs,
          });
        }
      }
    } catch (updateErr) {
      console.error('[imgQueue] Failed to update artboard status:', updateErr);
    }

    res.status(500).json({
      success: false,
      error: message,
      sceneNumber: scene,
      generationDurationMs: durationMs,
    });
  }
});


