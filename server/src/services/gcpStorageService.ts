import { Storage } from '@google-cloud/storage';

// Initialize with Application Default Credentials (ADC)
// ADC will automatically detect from: gcloud CLI, environment variables, or Workload Identity
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'datoms-interns-mar-2026',
});

const BUCKET_NAME = 'storyboard_frames';
const bucket = storage.bucket(BUCKET_NAME);

// Pre-signed URL expiration: 1 hour (3600 seconds) - NO LONGER USED
// const PRESIGNED_URL_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Upload image bytes to GCP Cloud Storage and return a public URL
 * @param imageBytes Base64 image data
 * @param fileName Unique filename for the image (e.g., "scene-1-1234567890.png")
 * @returns Public GCP URL to the image
 */
export async function uploadImageToGCP(imageBytes: string, fileName: string): Promise<string> {
  try {
    const file = bucket.file(fileName);

    // Convert base64 to buffer
    const buffer = Buffer.from(imageBytes, 'base64');

    // Upload to GCP
    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000', // Public, cache for 1 year
      },
    });

    // Return the direct public GCP URL
    // Note: No need to call makePublic() - bucket has Uniform Access Control (UBLA) enabled
    // and is set to public at the bucket level, so files are automatically public
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;
    console.log(`[GCP] ✓ Uploaded to ${publicUrl}`);

    return publicUrl;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[GCP] Upload failed for ${fileName}: ${message}`);
    throw new Error(`GCP upload failed: ${message}`);
  }
}

/**
 * Generate a unique filename for a scene image
 * @param sceneNumber The scene number
 * @returns Unique filename with timestamp
 */
export function generateImageFileName(sceneNumber: number): string {
  const timestamp = Date.now();
  return `scene-${sceneNumber}-${timestamp}.png`;
}
