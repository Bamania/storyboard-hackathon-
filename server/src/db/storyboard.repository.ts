import { prisma } from './prisma.js';
import type { SceneContext } from '../crew_debate/types.js';

interface CharacterInput {
  name: string;
  description: string;
  color?: string | undefined;
}

/** Create a Storyboard with nested CastMembers and Scenes. */
export async function createStoryboard(
  prompt: string,
  script: string,
  characters: CharacterInput[],
  scenes: SceneContext[],
) {
  const storyboard = await prisma.storyboard.create({
    data: {
      title: prompt.slice(0, 120),
      prompt,
      script,
      status: 'DRAFT',
      cast: {
        create: characters.map((c) => ({
          name: c.name,
          description: c.description,
          color: c.color ?? null,
        })),
      },
      scenes: {
        create: scenes.map((s, i) => ({
          position: i,
          slug: s.slug,
          body: s.body,
          characters: s.characters,
          location: s.location,
          timeOfDay: s.timeOfDay,
        })),
      },
    },
  });

  // Re-fetch with relations so callers get the full object
  return prisma.storyboard.findUniqueOrThrow({
    where: { id: storyboard.id },
    include: { cast: true, scenes: { orderBy: { position: 'asc' } } },
  });
}

/** Get ordered scene IDs for a storyboard (without changing status). */
export async function getStoryboardSceneIds(storyboardId: number) {
  const scenes = await prisma.scene.findMany({
    where: { storyboardId },
    orderBy: { position: 'asc' },
    select: { id: true },
  });
  return scenes.map((s) => s.id);
}

/** Set storyboard status to DEBATING and return ordered scene IDs. */
export async function startDebate(storyboardId: number) {
  await prisma.storyboard.update({
    where: { id: storyboardId },
    data: { status: 'DEBATING' },
  });
  return getStoryboardSceneIds(storyboardId);
}

/** Mark storyboard as COMPLETE. */
export async function completeStoryboard(storyboardId: number) {
  await prisma.storyboard.update({
    where: { id: storyboardId },
    data: { status: 'COMPLETE' },
  });
}

/** List all storyboards (summary). */
export async function listStoryboards() {
  return prisma.storyboard.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, status: true, createdAt: true },
  });
}

/** Get a single storyboard with all relations. */
export async function getStoryboard(id: number) {
  return prisma.storyboard.findUnique({
    where: { id },
    include: {
      cast: true,
      scenes: {
        orderBy: { position: 'asc' },
        include: { artboards: { orderBy: { position: 'asc' } } },
      },
    },
  });
}
