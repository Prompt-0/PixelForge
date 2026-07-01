/**
 * Image compression utilities.
 * Supports target-size-based compression using binary search on quality,
 * direct quality setting, and optional dimension reduction.
 */

import { createImageElement } from './helpers';

/** Options for compressing an image. */
export interface CompressOptions {
  /**
   * Target file size in KB. When specified, uses binary search on quality
   * to find the best quality that stays at or under this size.
   */
  targetSizeKB?: number;
  /** Direct quality setting (0–1). Ignored if targetSizeKB is set. */
  quality?: number;
  /** Output format. PNG is lossless; quality is ignored for PNG. */
  format: 'image/jpeg' | 'image/webp' | 'image/png';
  /** Optional max width — image will be scaled down if wider. */
  maxWidth?: number;
  /** Optional max height — image will be scaled down if taller. */
  maxHeight?: number;
  /** If true, metadata is stripped by re-drawing on a fresh canvas. Defaults to false. */
  stripMetadata?: boolean;
}

/**
 * Compresses an image according to the given options.
 *
 * When `targetSizeKB` is provided, the function runs a binary search
 * (up to 15 iterations) to find the highest quality that keeps the
 * output at or below the target size.
 *
 * @param file - The image file to compress
 * @param options - Compression configuration
 * @returns A promise resolving to the compressed image Blob
 * @throws Error if the image cannot be loaded or compressed
 */
export async function compressImage(
  file: File,
  options: CompressOptions
): Promise<Blob> {
  try {
    const img = await createImageElement(file);

    const { maxWidth, maxHeight, format } = options;

    // Calculate dimensions respecting maxWidth/maxHeight with aspect ratio
    let width = img.naturalWidth;
    let height = img.naturalHeight;

    if (maxWidth && width > maxWidth) {
      height = Math.round(height * (maxWidth / width));
      width = maxWidth;
    }
    if (maxHeight && height > maxHeight) {
      width = Math.round(width * (maxHeight / height));
      height = maxHeight;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, width, height);

    // For PNG (lossless), quality is irrelevant
    if (format === 'image/png') {
      return await canvasToBlob(canvas, format);
    }

    // Target-size binary search
    if (options.targetSizeKB != null) {
      return await binarySearchCompress(
        canvas,
        format,
        options.targetSizeKB
      );
    }

    // Direct quality
    const quality = options.quality ?? 0.8;
    return await canvasToBlob(canvas, format, quality);
  } catch (error) {
    throw new Error(
      `Failed to compress image: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Estimates the compressed size of an image at a given quality and format.
 * Useful for preview UIs showing expected output size.
 *
 * @param file - The image file to estimate for
 * @param quality - Quality setting (0–1)
 * @param format - The output MIME format
 * @returns A promise resolving to the estimated size in bytes
 * @throws Error if the image cannot be loaded
 */
export async function estimateCompressedSize(
  file: File,
  quality: number,
  format: string
): Promise<number> {
  try {
    const img = await createImageElement(file);

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const blob = await canvasToBlob(canvas, format, quality);
    return blob.size;
  } catch (error) {
    throw new Error(
      `Failed to estimate compressed size: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ─── Internal Helpers ────────────────────────────────────────────────

/**
 * Binary search on quality to get closest to targetSizeKB without exceeding it.
 * Iterates a maximum of 15 times.
 */
async function binarySearchCompress(
  canvas: HTMLCanvasElement,
  format: string,
  targetSizeKB: number
): Promise<Blob> {
  const targetBytes = targetSizeKB * 1024;
  let low = 0.0;
  let high = 1.0;
  let bestBlob: Blob | null = null;
  const maxIterations = 15;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    const blob = await canvasToBlob(canvas, format, mid);

    if (blob.size <= targetBytes) {
      // Under target — keep as best candidate and try higher quality
      bestBlob = blob;
      low = mid + 0.001;
    } else {
      // Over target — try lower quality
      high = mid - 0.001;
    }

    // Close enough (within 2% of target)
    if (bestBlob && Math.abs(blob.size - targetBytes) / targetBytes < 0.02) {
      if (blob.size <= targetBytes) {
        bestBlob = blob;
      }
      break;
    }
  }

  // If no quality produced an under-target result, return lowest quality
  if (!bestBlob) {
    bestBlob = await canvasToBlob(canvas, format, 0.01);
  }

  return bestBlob;
}

/**
 * Converts a canvas to a Blob.
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob returned null'));
        }
      },
      type,
      quality
    );
  });
}
