import { useState, useEffect } from 'react';
import { fetchStoryboardWithImages, type StoryboardWithImages } from '../services/storyboardService';

interface UseStoryboardWithImagesResult {
  storyboard: StoryboardWithImages | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage storyboard with images
 */
export function useStoryboardWithImages(storyboardId: number): UseStoryboardWithImagesResult {
  const [storyboard, setStoryboard] = useState<StoryboardWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStoryboardWithImages(storyboardId);
      setStoryboard(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch storyboard';
      setError(message);
      console.error('[useStoryboardWithImages]', message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [storyboardId]);

  return {
    storyboard,
    loading,
    error,
    refresh: fetchData,
  };
}
