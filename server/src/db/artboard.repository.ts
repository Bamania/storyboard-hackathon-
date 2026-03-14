import { prisma } from './prisma.js';

interface CrewParams {
  directorParams?: object;
  cinematographerParams?: object;
  productionDesignerParams?: object;
  editorParams?: object;
}

/** Create an Artboard linked to a scene with the 24 crew debate params. */
export async function createArtboard(sceneId: number, params: CrewParams) {
  return prisma.artboard.create({
    data: {
      sceneId,
      position: 0,
      status: 'PARAMS_READY',
      directorParams: params.directorParams ?? {},
      cinematographerParams: params.cinematographerParams ?? {},
      productionDesignerParams: params.productionDesignerParams ?? {},
      editorParams: params.editorParams ?? {},
    },
  });
}

/** Update an Artboard with generated image and metadata. */
export async function updateArtboard(
  id: number,
  data: {
    shotDescription?: string;
    imageUrl?: string;
    status?: 'PARAMS_READY' | 'GENERATING' | 'DONE' | 'FAILED';
    generationDurationMs?: number;
    errorMessage?: string;
  }
) {
  return prisma.artboard.update({
    where: { id },
    data,
  });
}

/** Get an Artboard with its scene. */
export async function getArtboardWithScene(id: number) {
  return prisma.artboard.findUnique({
    where: { id },
    include: { scene: true },
  });
}
