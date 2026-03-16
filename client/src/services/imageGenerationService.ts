import { useQueueStore } from '../stores/queueStore';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

/**
 * Image Generation Service
 * Handles queue-based image generation with GCP Cloud Storage
 * 
 * Images are stored as public URLs on GCP
 */

interface ImageGenerationResponse {
  success: boolean;
  message?: string;
  sceneNumber?: number;
  imageUrl?: string; // Public GCP URL
  error?: string;
}

/**
 * Process the queue one-by-one, sending items to backend for image generation
 * Continues until queue is empty
 */
export const processImageGenerationQueue = async (onProgress?: (processed: number, total: number) => void): Promise<void> => {
  const queueStore = useQueueStore.getState();
  
  // Prevent multiple concurrent processes
  if (queueStore.isProcessing) {
    console.log('[imageGen] Queue processing already in-flight, skipping');
    return;
  }

  let processedCount = 0;
  const initialQueueSize = queueStore.queueItems.length;

  if (initialQueueSize === 0) {
    console.log('[imageGen] Queue is empty');
    return;
  }

  try {
    useQueueStore.getState().setIsProcessing(true);
    console.log(`[imageGen] Starting processing of ${initialQueueSize} scenes...`);

    while (useQueueStore.getState().queueItems.length > 0) {
      const currentQueue = useQueueStore.getState().queueItems;
      if (currentQueue.length === 0) break;

      const item = currentQueue[0]; // Get first item in queue

      try {
        const response = await fetch(`${API_BASE}/api/imgqueueGeneration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scene: item.scene,
            storyboardId: item.storyboardId,
            directorParams: item.directorParams,
            cinematographerParams: item.cinematographerParams,
            productionDesignerParams: item.productionDesignerParams,
            editorParams: item.editorParams,
          }),
        });

        if (!response.ok) {
          console.error(`❌ Scene ${item.scene}: HTTP ${response.status}`);
          // Optionally break on error or continue - currently continues
          continue;
        }

        const data = (await response.json()) as ImageGenerationResponse;

        if (data.success) {
          console.log(`✓ Scene ${item.scene} generated successfully → ${data.imageUrl}`);
          // Auto-pop from queue on success
          useQueueStore.getState().popQueue();
          processedCount++;
        } else {
          console.error(`❌ Scene ${item.scene}: ${data.error || data.message || 'Unknown error'}`);
        }
      } catch (err) {
        console.error(`❌ Scene ${item.scene}: ${err instanceof Error ? err.message : 'Network error'}`);
      }

      // Notify progress if callback provided
      if (onProgress) {
        onProgress(processedCount, initialQueueSize);
      }
    }

    console.log(`✓ Queue processing complete. Generated ${processedCount}/${initialQueueSize} scenes`);
  } finally {
    useQueueStore.getState().setIsProcessing(false);
  }
};

/**
 * Get current queue status
 */
export const getQueueStatus = () => {
  const store = useQueueStore.getState();
  return {
    queueLength: store.queueItems.length,
    items: store.queueItems,
  };
};

/**
 * Start processing queue (can be called from a button or effect)
 */
export const startQueueProcessing = async () => {
  const status = getQueueStatus();
  if (status.queueLength === 0) {
    console.log('Queue is empty. Nothing to process.');
    return;
  }

  console.log(`Starting image generation for ${status.queueLength} scenes...`);
  await processImageGenerationQueue((processed, total) => {
    console.log(`Progress: ${processed}/${total}`);
  });
};
