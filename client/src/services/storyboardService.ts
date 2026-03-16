/**
 * Storyboard API Service
 * Handles fetching storyboards with GCP image URLs
 */

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

export interface ArtboardWithImage {
  id: number;
  sceneId: number;
  position: number;
  status: string;
  shotDescription?: string;
  imageUrl?: string; // Public GCP URL
  generationDurationMs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SceneWithArtboards {
  id: number;
  storyboardId: number;
  position: number;
  slug: string;
  body: string;
  characters: string[];
  location: string;
  timeOfDay: string;
  artboards: ArtboardWithImage[];
}

export interface StoryboardWithImages {
  id: number;
  title: string;
  prompt: string;
  script: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  scenes: SceneWithArtboards[];
  cast: any[];
  generatedAt: string;
  note: string;
}

/**
 * Fetch storyboard with all images
 * Returns public GCP URLs for all artboard images
 */
export async function fetchStoryboardWithImages(storyboardId: number): Promise<StoryboardWithImages> {
  try {
    const response = await fetch(`${API_BASE}/api/storyboard/${storyboardId}/with-images`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch storyboard`);
    }

    const data = (await response.json()) as StoryboardWithImages;
    console.log(`[StoryboardAPI] Fetched storyboard ${storyboardId} with images`);
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[StoryboardAPI] Error:`, message);
    throw err;
  }
}
