/**
 * Image adjustment utilities for pixel-level modifications.
 *
 * Uses CSS canvas filters where possible (brightness, contrast, saturate,
 * blur, grayscale, sepia, invert, hue-rotate) and falls back to direct
 * ImageData manipulation for vignette, sharpness (unsharp mask),
 * temperature, and exposure adjustments.
 */

import { createImageElement } from './helpers';

/** Options for image adjustments. All values are optional and default to neutral. */
export interface AdjustmentOptions {
  /** Brightness adjustment (-100 to 100). 0 = no change. */
  brightness?: number;
  /** Contrast adjustment (-100 to 100). 0 = no change. */
  contrast?: number;
  /** Saturation adjustment (-100 to 100). 0 = no change. */
  saturation?: number;
  /** Exposure adjustment (-100 to 100). 0 = no change. */
  exposure?: number;
  /** Color temperature shift (-100 = cool/blue, 100 = warm/orange). 0 = no change. */
  temperature?: number;
  /** Sharpness amount (0 to 100). 0 = no sharpening. */
  sharpness?: number;
  /** Blur radius in pixels (0 to 20). 0 = no blur. */
  blur?: number;
  /** Apply grayscale effect (0 to 100). */
  grayscale?: number;
  /** Apply sepia effect (0 to 100). */
  sepia?: number;
  /** Invert all colors (0 to 100). */
  invert?: number;
  /** Hue rotation in degrees (0 to 360). 0 = no rotation. */
  hue?: number;
  /** Vignette intensity (0 to 100). 0 = no vignette. */
  vignette?: number;
}

/**
 * Applies all specified adjustments to an image file.
 *
 * Processing order:
 * 1. CSS canvas filters (brightness, contrast, saturation, blur, grayscale, sepia, invert, hue)
 * 2. Pixel-level: exposure, temperature, sharpness (unsharp mask)
 * 3. Vignette overlay
 *
 * @param file - The image file to adjust
 * @param adjustments - The adjustment settings to apply
 * @returns A promise resolving to the adjusted image Blob
 * @throws Error if the image cannot be loaded or processed
 */
export async function applyAdjustments(
  file: File,
  adjustments: AdjustmentOptions
): Promise<Blob> {
  try {
    const img = await createImageElement(file);
    const width = img.naturalWidth;
    const height = img.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Step 1: Apply CSS-based filters
    const filterString = buildFilterString(adjustments);
    if (filterString !== 'none') {
      ctx.filter = filterString;
    }
    ctx.drawImage(img, 0, 0, width, height);
    ctx.filter = 'none';

    // Step 2: Pixel-level adjustments
    const needsPixelWork =
      (adjustments.exposure != null && adjustments.exposure !== 0) ||
      (adjustments.temperature != null && adjustments.temperature !== 0) ||
      (adjustments.sharpness != null && adjustments.sharpness > 0);

    if (needsPixelWork) {
      const imageData = ctx.getImageData(0, 0, width, height);
      let { data } = imageData;

      // Exposure
      if (adjustments.exposure != null && adjustments.exposure !== 0) {
        applyExposure(data, adjustments.exposure);
      }

      // Temperature
      if (adjustments.temperature != null && adjustments.temperature !== 0) {
        applyTemperature(data, adjustments.temperature);
      }

      ctx.putImageData(imageData, 0, 0);

      // Sharpness (unsharp mask) — needs to be applied after other pixel ops
      if (adjustments.sharpness != null && adjustments.sharpness > 0) {
        const sharpened = applyUnsharpMask(
          ctx.getImageData(0, 0, width, height),
          adjustments.sharpness / 100,
          width,
          height
        );
        ctx.putImageData(sharpened, 0, 0);
      }
    }

    // Step 3: Vignette overlay
    if (adjustments.vignette != null && adjustments.vignette > 0) {
      applyVignette(ctx, width, height, adjustments.vignette);
    }

    return await canvasToBlob(canvas, file.type || 'image/png');
  } catch (error) {
    throw new Error(
      `Failed to apply adjustments: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Returns a default AdjustmentOptions object with all values at neutral/zero.
 *
 * @returns An AdjustmentOptions with all adjustments at their defaults
 */
export function getDefaultAdjustments(): AdjustmentOptions {
  return {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    temperature: 0,
    sharpness: 0,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    invert: 0,
    hue: 0,
    vignette: 0,
  };
}

/**
 * Builds a CSS filter string from the given adjustment options.
 * Useful for live preview in CSS without canvas re-rendering.
 *
 * @param adjustments - The adjustment settings
 * @returns A CSS filter string (e.g., "brightness(1.2) contrast(1.1)")
 */
export function buildFilterString(adjustments: AdjustmentOptions): string {
  const filters: string[] = [];

  // Brightness: -100..100 → 0..2 (CSS brightness)
  if (adjustments.brightness != null && adjustments.brightness !== 0) {
    const value = 1 + adjustments.brightness / 100;
    filters.push(`brightness(${value})`);
  }

  // Contrast: -100..100 → 0..2
  if (adjustments.contrast != null && adjustments.contrast !== 0) {
    const value = 1 + adjustments.contrast / 100;
    filters.push(`contrast(${value})`);
  }

  // Saturation: -100..100 → 0..2
  if (adjustments.saturation != null && adjustments.saturation !== 0) {
    const value = 1 + adjustments.saturation / 100;
    filters.push(`saturate(${value})`);
  }

  // Blur: 0..20 px
  if (adjustments.blur != null && adjustments.blur > 0) {
    filters.push(`blur(${adjustments.blur}px)`);
  }

  // Grayscale
  if (adjustments.grayscale != null && adjustments.grayscale > 0) {
    filters.push(`grayscale(${adjustments.grayscale / 100})`);
  }

  // Sepia
  if (adjustments.sepia != null && adjustments.sepia > 0) {
    filters.push(`sepia(${adjustments.sepia / 100})`);
  }

  // Invert
  if (adjustments.invert != null && adjustments.invert > 0) {
    filters.push(`invert(${adjustments.invert / 100})`);
  }

  // Hue rotation: 0..360 degrees
  if (adjustments.hue != null && adjustments.hue !== 0) {
    filters.push(`hue-rotate(${adjustments.hue}deg)`);
  }

  return filters.length > 0 ? filters.join(' ') : 'none';
}

// ─── Pixel-Level Adjustment Functions ────────────────────────────────

/**
 * Applies exposure adjustment by multiplying RGB values.
 * Exposure -100..100 maps to multiplier 0.25..4.0 (exponential).
 */
function applyExposure(data: Uint8ClampedArray, exposure: number): void {
  // Map -100..100 to a multiplier: 2^(exposure/50)
  // -100 → 2^-2 = 0.25, 0 → 1.0, 100 → 2^2 = 4.0
  const multiplier = Math.pow(2, exposure / 50);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, Math.round(data[i] * multiplier))); // R
    data[i + 1] = Math.min(255, Math.max(0, Math.round(data[i + 1] * multiplier))); // G
    data[i + 2] = Math.min(255, Math.max(0, Math.round(data[i + 2] * multiplier))); // B
    // Alpha unchanged
  }
}

/**
 * Applies color temperature by shifting red and blue channels.
 * Positive = warm (boost red, reduce blue).
 * Negative = cool (boost blue, reduce red).
 */
function applyTemperature(data: Uint8ClampedArray, temperature: number): void {
  // Map -100..100 to a shift of -50..+50 for R, inverse for B
  const shift = Math.round(temperature * 0.5);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] + shift)); // R: +shift for warm
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] - shift)); // B: -shift for warm
    // Green unchanged for natural look
  }
}

/**
 * Applies an unsharp mask (sharpening) using a 3×3 convolution kernel.
 *
 * The unsharp mask works by:
 * 1. Computing a blurred version of the image (Gaussian-like 3×3 kernel)
 * 2. Subtracting the blur from the original to get the detail
 * 3. Adding the detail back at the specified strength
 */
function applyUnsharpMask(
  imageData: ImageData,
  amount: number,
  width: number,
  height: number
): ImageData {
  const src = imageData.data;
  const output = new ImageData(
    new Uint8ClampedArray(src),
    width,
    height
  );
  const dst = output.data;

  // 3×3 Gaussian-like blur kernel
  // [1, 2, 1]
  // [2, 4, 2]
  // [1, 2, 1] / 16
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kernelSum = 16;

  // Scale the sharpening amount
  const strength = amount * 2; // 0..1 → 0..2

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        // Compute blurred value
        let blurred = 0;
        let ki = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const si = ((y + ky) * width + (x + kx)) * 4 + c;
            blurred += src[si] * kernel[ki];
            ki++;
          }
        }

        blurred /= kernelSum;

        // Unsharp mask: original + strength * (original - blurred)
        const detail = src[idx + c] - blurred;
        const sharpened = src[idx + c] + strength * detail;
        dst[idx + c] = Math.min(255, Math.max(0, Math.round(sharpened)));
      }
      // Preserve alpha
      dst[idx + 3] = src[idx + 3];
    }
  }

  return output;
}

/**
 * Draws a radial gradient vignette overlay on the canvas.
 */
function applyVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void {
  // intensity 0..100 → opacity 0..0.7
  const opacity = (intensity / 100) * 0.7;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.sqrt(centerX * centerX + centerY * centerY);

  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    radius * 0.3, // Inner radius — start of gradient
    centerX,
    centerY,
    radius // Outer radius — full vignette
  );

  gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${opacity})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

// ─── Internal Helpers ────────────────────────────────────────────────

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
