/**
 * Image resizing, cropping, rotation, and flipping utilities.
 * Uses the Canvas API with multi-step downscaling for quality
 * preservation when reducing size by more than 50%.
 */

import { createImageElement } from './helpers';

/** Options for resizing an image. */
export interface ResizeOptions {
  /** Target width in pixels. */
  width?: number;
  /** Target height in pixels. */
  height?: number;
  /** Whether to maintain the original aspect ratio. Defaults to true. */
  maintainAspectRatio?: boolean;
  /**
   * Resize mode:
   * - 'contain': Fit within target dimensions, padding with backgroundColor
   * - 'cover': Fill target dimensions, cropping excess
   * - 'stretch': Stretch to exact dimensions (ignores aspect ratio)
   * - 'exact': Same as stretch (alias)
   */
  resizeMode: 'contain' | 'cover' | 'stretch' | 'exact';
  /** Background color for 'contain' mode padding. Defaults to 'transparent'. */
  backgroundColor?: string;
}

/**
 * Resizes an image according to the given options.
 * Uses multi-step downscaling when reducing size by more than 50% for better quality.
 *
 * @param file - The image file to resize
 * @param options - Resize configuration
 * @returns A promise resolving to the resized image Blob
 * @throws Error if the image cannot be loaded or resized
 */
export async function resizeImage(
  file: File,
  options: ResizeOptions
): Promise<Blob> {
  try {
    const img = await createImageElement(file);
    const {
      width: targetWidth,
      height: targetHeight,
      maintainAspectRatio = true,
      resizeMode,
      backgroundColor = 'transparent',
    } = options;

    const srcWidth = img.naturalWidth;
    const srcHeight = img.naturalHeight;

    // Determine final canvas dimensions
    const { canvasWidth, canvasHeight, drawX, drawY, drawWidth, drawHeight } =
      calculateResizeDimensions(
        srcWidth,
        srcHeight,
        targetWidth,
        targetHeight,
        maintainAspectRatio,
        resizeMode
      );

    // Multi-step downscale if reducing by more than 50%
    const sourceCanvas = await multiStepDownscale(
      img,
      srcWidth,
      srcHeight,
      drawWidth,
      drawHeight
    );

    // Create final output canvas
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d')!;

    // Fill background for 'contain' mode
    if (resizeMode === 'contain' && backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    ctx.drawImage(sourceCanvas, drawX, drawY, drawWidth, drawHeight);

    return await canvasToBlob(canvas, file.type || 'image/png');
  } catch (error) {
    throw new Error(
      `Failed to resize image: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Crops an image to the specified rectangle.
 *
 * @param imageDataUrl - The data URL of the image to crop
 * @param cropRect - The rectangle defining the crop area
 * @returns A promise resolving to the cropped image Blob
 * @throws Error if the image cannot be loaded or cropped
 */
export async function cropImage(
  imageDataUrl: string,
  cropRect: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  try {
    const img = await createImageElement(imageDataUrl);

    const canvas = document.createElement('canvas');
    canvas.width = cropRect.width;
    canvas.height = cropRect.height;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(
      img,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      0,
      0,
      cropRect.width,
      cropRect.height
    );

    return await canvasToBlob(canvas, 'image/png');
  } catch (error) {
    throw new Error(
      `Failed to crop image: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Rotates an image by the specified number of degrees (clockwise).
 *
 * @param file - The image file to rotate
 * @param degrees - Rotation angle in degrees (clockwise)
 * @returns A promise resolving to the rotated image Blob
 * @throws Error if the image cannot be loaded or rotated
 */
export async function rotateImage(
  file: File,
  degrees: number
): Promise<Blob> {
  try {
    const img = await createImageElement(file);

    const radians = (degrees * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));

    const newWidth = Math.ceil(img.naturalWidth * cos + img.naturalHeight * sin);
    const newHeight = Math.ceil(
      img.naturalWidth * sin + img.naturalHeight * cos
    );

    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d')!;

    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(radians);
    ctx.drawImage(
      img,
      -img.naturalWidth / 2,
      -img.naturalHeight / 2,
      img.naturalWidth,
      img.naturalHeight
    );

    return await canvasToBlob(canvas, file.type || 'image/png');
  } catch (error) {
    throw new Error(
      `Failed to rotate image: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Flips an image horizontally or vertically.
 *
 * @param file - The image file to flip
 * @param direction - 'horizontal' to mirror left-right, 'vertical' to mirror top-bottom
 * @returns A promise resolving to the flipped image Blob
 * @throws Error if the image cannot be loaded or flipped
 */
export async function flipImage(
  file: File,
  direction: 'horizontal' | 'vertical'
): Promise<Blob> {
  try {
    const img = await createImageElement(file);

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;

    if (direction === 'horizontal') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
    }

    ctx.drawImage(img, 0, 0);

    return await canvasToBlob(canvas, file.type || 'image/png');
  } catch (error) {
    throw new Error(
      `Failed to flip image: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Gets the natural dimensions of an image file.
 *
 * @param file - The image file to measure
 * @returns A promise resolving to the width and height in pixels
 * @throws Error if the image cannot be loaded
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  try {
    const img = await createImageElement(file);
    return { width: img.naturalWidth, height: img.naturalHeight };
  } catch (error) {
    throw new Error(
      `Failed to get image dimensions: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ─── Internal Helpers ────────────────────────────────────────────────

/**
 * Calculates the final canvas and draw dimensions based on resize mode.
 */
function calculateResizeDimensions(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number | undefined,
  targetHeight: number | undefined,
  maintainAspectRatio: boolean,
  resizeMode: 'contain' | 'cover' | 'stretch' | 'exact'
): {
  canvasWidth: number;
  canvasHeight: number;
  drawX: number;
  drawY: number;
  drawWidth: number;
  drawHeight: number;
} {
  const tw = targetWidth ?? srcWidth;
  const th = targetHeight ?? srcHeight;

  if (resizeMode === 'stretch' || resizeMode === 'exact' || !maintainAspectRatio) {
    return {
      canvasWidth: tw,
      canvasHeight: th,
      drawX: 0,
      drawY: 0,
      drawWidth: tw,
      drawHeight: th,
    };
  }

  const aspectRatio = srcWidth / srcHeight;

  if (resizeMode === 'contain') {
    let drawWidth: number;
    let drawHeight: number;

    if (tw / th > aspectRatio) {
      // Height is the constraining dimension
      drawHeight = th;
      drawWidth = Math.round(th * aspectRatio);
    } else {
      // Width is the constraining dimension
      drawWidth = tw;
      drawHeight = Math.round(tw / aspectRatio);
    }

    const drawX = Math.round((tw - drawWidth) / 2);
    const drawY = Math.round((th - drawHeight) / 2);

    return {
      canvasWidth: tw,
      canvasHeight: th,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
    };
  }

  // 'cover' mode
  let drawWidth: number;
  let drawHeight: number;

  if (tw / th > aspectRatio) {
    drawWidth = tw;
    drawHeight = Math.round(tw / aspectRatio);
  } else {
    drawHeight = th;
    drawWidth = Math.round(th * aspectRatio);
  }

  const drawX = Math.round((tw - drawWidth) / 2);
  const drawY = Math.round((th - drawHeight) / 2);

  return {
    canvasWidth: tw,
    canvasHeight: th,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
  };
}

/**
 * Performs multi-step downscaling for better quality.
 * When reducing by more than 50%, halves the image in steps before the final resize.
 */
async function multiStepDownscale(
  source: HTMLImageElement | HTMLCanvasElement,
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): Promise<HTMLCanvasElement> {
  let currentSource: HTMLImageElement | HTMLCanvasElement = source;
  let currentWidth = srcWidth;
  let currentHeight = srcHeight;

  // Repeatedly halve until within 2x of target
  while (currentWidth > targetWidth * 2 || currentHeight > targetHeight * 2) {
    const nextWidth = Math.max(
      Math.round(currentWidth / 2),
      targetWidth
    );
    const nextHeight = Math.max(
      Math.round(currentHeight / 2),
      targetHeight
    );

    const stepCanvas = document.createElement('canvas');
    stepCanvas.width = nextWidth;
    stepCanvas.height = nextHeight;
    const stepCtx = stepCanvas.getContext('2d')!;
    stepCtx.drawImage(currentSource, 0, 0, nextWidth, nextHeight);

    currentSource = stepCanvas;
    currentWidth = nextWidth;
    currentHeight = nextHeight;
  }

  // Final step if source isn't already at target size
  if (currentWidth !== targetWidth || currentHeight !== targetHeight) {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;
    const finalCtx = finalCanvas.getContext('2d')!;
    finalCtx.drawImage(currentSource, 0, 0, targetWidth, targetHeight);
    return finalCanvas;
  }

  if (currentSource instanceof HTMLCanvasElement) {
    return currentSource;
  }

  // Wrap image in canvas
  const wrapCanvas = document.createElement('canvas');
  wrapCanvas.width = targetWidth;
  wrapCanvas.height = targetHeight;
  const wrapCtx = wrapCanvas.getContext('2d')!;
  wrapCtx.drawImage(currentSource, 0, 0, targetWidth, targetHeight);
  return wrapCanvas;
}

/**
 * Converts a canvas to a Blob, falling back to PNG if the specified type fails.
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
