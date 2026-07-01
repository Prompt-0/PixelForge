import { env, pipeline, RawImage } from '@xenova/transformers';
import { createImageElement, dataUrlToBlob } from './helpers';

// Disable local models, fetch from Hugging Face Hub (default)
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface Point {
  x: number;
  y: number;
}

let aiPipeline: any = null;

/**
 * AI-powered background removal using RMBG-1.4 (runs entirely client-side).
 */
export const removeBackgroundAI = async (
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<Blob> => {
  if (!aiPipeline) {
    onProgress?.(0, 'Loading AI Model (this may take a minute on first run)...');
    // Load the image segmentation pipeline
    aiPipeline = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
      progress_callback: (p: any) => {
        if (p.status === 'downloading' && p.progress) {
          onProgress?.(p.progress, `Downloading model: ${Math.round(p.progress)}%`);
        } else if (p.status === 'ready') {
          onProgress?.(100, 'Model loaded successfully.');
        }
      }
    });
  }

  onProgress?.(100, 'Processing image...');

  // Convert File to Object URL and read via RawImage
  const url = URL.createObjectURL(file);
  const rawImage = await RawImage.fromURL(url);
  URL.revokeObjectURL(url);

  // Run the model (returns an array of PIL-like images for alpha masks)
  const result = await aiPipeline(rawImage);
  
  // The output is a mask. We need to apply this mask to the original image.
  // In briaai/RMBG-1.4 with Transformers.js, the pipeline can often output the RGBA image directly if we are lucky,
  // but standard image-segmentation returns { mask: RawImage, label: 'background' } or similar.
  // Actually, for RMBG-1.4 it often returns an alpha mask array.
  
  // Let's check the result type. Usually it's an array for segmentation.
  // Just in case, the safest way with RMBG-1.4 is to use the rawImage and the mask.
  const maskImage = Array.isArray(result) ? result[0].mask : result.mask || result;

  const canvas = document.createElement('canvas');
  canvas.width = rawImage.width;
  canvas.height = rawImage.height;
  const ctx = canvas.getContext('2d')!;

  // Draw original image
  const imgData = new ImageData(
    new Uint8ClampedArray(rawImage.data),
    rawImage.width,
    rawImage.height
  );
  
  // If rawImage is RGB (3 channels), we need to convert it to RGBA
  if (rawImage.channels === 3) {
    const rgbaData = new Uint8ClampedArray(rawImage.width * rawImage.height * 4);
    for (let i = 0; i < rawImage.width * rawImage.height; i++) {
      rgbaData[i * 4] = rawImage.data[i * 3];
      rgbaData[i * 4 + 1] = rawImage.data[i * 3 + 1];
      rgbaData[i * 4 + 2] = rawImage.data[i * 3 + 2];
      rgbaData[i * 4 + 3] = 255;
    }
    const finalImgData = new ImageData(rgbaData, rawImage.width, rawImage.height);
    ctx.putImageData(finalImgData, 0, 0);
  } else {
    ctx.putImageData(imgData, 0, 0);
  }

  // Apply the mask as global composite operation
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = maskImage.width;
  maskCanvas.height = maskImage.height;
  const maskCtx = maskCanvas.getContext('2d')!;
  
  // The mask is grayscale, 1 channel
  const maskData = new ImageData(
    new Uint8ClampedArray(maskImage.data.length * 4),
    maskImage.width,
    maskImage.height
  );
  for (let i = 0; i < maskImage.data.length; i++) {
    const val = maskImage.data[i];
    maskData.data[i * 4] = val;
    maskData.data[i * 4 + 1] = val;
    maskData.data[i * 4 + 2] = val;
    maskData.data[i * 4 + 3] = val;
  }
  maskCtx.putImageData(maskData, 0, 0);

  // Draw mask using destination-in to keep only the foreground
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);

  return dataUrlToBlob(canvas.toDataURL('image/png', 1.0));
};

/**
 * Magic Wand selection: Deletes contiguous pixels of similar color based on a tolerance.
 */
export const magicWandSelection = async (
  file: File,
  startPoint: Point,
  tolerance: number
): Promise<Blob> => {
  const img = await createImageElement(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Make sure start point is within bounds
  const startX = Math.floor(startPoint.x);
  const startY = Math.floor(startPoint.y);
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
    return file; // No op
  }

  const startIndex = (startY * width + startX) * 4;
  const targetR = data[startIndex];
  const targetG = data[startIndex + 1];
  const targetB = data[startIndex + 2];
  const targetA = data[startIndex + 3];

  const colorMatch = (i: number) => {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Distance calculation
    const distance = Math.sqrt(
      Math.pow(r - targetR, 2) + 
      Math.pow(g - targetG, 2) + 
      Math.pow(b - targetB, 2) +
      Math.pow(a - targetA, 2)
    );
    // Tolerance is 0-100, max distance is sqrt(255^2 * 4) ≈ 510
    const maxDist = 510 * (tolerance / 100);
    return distance <= maxDist;
  };

  // Stack-based flood fill
  const stack: Point[] = [{ x: startX, y: startY }];
  const visited = new Uint8Array(width * height);
  visited[startY * width + startX] = 1;

  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    const i = (y * width + x) * 4;
    
    // Set pixel to transparent
    data[i + 3] = 0;

    // Check neighbors
    const neighbors = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 }
    ];

    for (const n of neighbors) {
      if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
        const idx = n.y * width + n.x;
        if (!visited[idx]) {
          visited[idx] = 1;
          if (colorMatch(idx * 4)) {
            stack.push(n);
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return dataUrlToBlob(canvas.toDataURL('image/png', 1.0));
};
