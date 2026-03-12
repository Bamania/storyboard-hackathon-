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
