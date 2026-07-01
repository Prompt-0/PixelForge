/**
 * Image format conversion utilities.
 * Supports conversion between JPEG, PNG, WebP, AVIF, and BMP.
 * Includes HEIC import via heic2any and magic-byte format detection.
 */

import heic2any from 'heic2any';
import { createImageElement } from './helpers';

/** Options for converting an image format. */
export interface ConvertOptions {
  /** Target output format. */
  targetFormat:
    | 'image/jpeg'
    | 'image/png'
    | 'image/webp'
    | 'image/avif'
    | 'image/bmp';
  /** Quality setting for lossy formats (0–1). Defaults to 0.92. */
  quality?: number;
  /** If true, strips metadata by re-drawing on a clean canvas. */
  stripMetadata?: boolean;
}

/** Describes a supported image format. */
export interface FormatInfo {
  /** MIME type string. */
  format: string;
  /** Human-readable format name. */
  name: string;
  /** Whether this format uses lossy compression. */
  lossy: boolean;
}

/**
 * Converts an image file to the specified target format.
 *
 * @param file - The source image file
 * @param options - Conversion options including target format and quality
 * @returns A promise resolving to the converted image Blob
 * @throws Error if the image cannot be loaded or converted
 */
export async function convertImage(
  file: File,
  options: ConvertOptions
): Promise<Blob> {
  try {
    const { targetFormat, quality = 0.92 } = options;

    // Handle HEIC input — convert to PNG first, then to the target format
    let sourceFile = file;
    if (await isHeicFile(file)) {
      const pngBlob = await loadHeicImage(file);
      sourceFile = new File([pngBlob], file.name, { type: 'image/png' });
    }

    const img = await createImageElement(sourceFile);

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;

    // For JPEG/BMP: fill white background since they don't support transparency
    if (targetFormat === 'image/jpeg' || targetFormat === 'image/bmp') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);

    // Determine if quality matters for this format
    const isLossyFormat = ['image/jpeg', 'image/webp', 'image/avif'].includes(
      targetFormat
    );
    const outputQuality = isLossyFormat ? quality : undefined;

    return await canvasToBlob(canvas, targetFormat, outputQuality);
  } catch (error) {
    throw new Error(
      `Failed to convert image: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Loads a HEIC/HEIF image file and converts it to PNG using heic2any.
 *
 * @param file - The HEIC image file
 * @returns A promise resolving to a PNG Blob
 * @throws Error if heic2any conversion fails
 */
export async function loadHeicImage(file: File): Promise<Blob> {
  try {
    const result = await heic2any({
      blob: file,
      toType: 'image/png',
      quality: 1,
    });

    // heic2any can return a single Blob or an array
    if (Array.isArray(result)) {
      return result[0];
    }
    return result;
  } catch (error) {
    throw new Error(
      `Failed to convert HEIC image: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Returns a list of all supported image formats with metadata.
 *
 * @returns An array of format descriptors
 */
export function getSupportedFormats(): FormatInfo[] {
  return [
    { format: 'image/jpeg', name: 'JPEG', lossy: true },
    { format: 'image/png', name: 'PNG', lossy: false },
    { format: 'image/webp', name: 'WebP', lossy: true },
    { format: 'image/avif', name: 'AVIF', lossy: true },
    { format: 'image/bmp', name: 'BMP', lossy: false },
  ];
}

/**
 * Detects the image format from the file's header bytes (magic numbers).
 * Falls back to the file's MIME type if magic bytes don't match a known format.
 *
 * @param file - The file to inspect
 * @returns The detected MIME type string
 */
export async function getFileFormat(file: File): Promise<string> {
  try {
    const headerBytes = await readHeaderBytes(file, 12);

    // JPEG: FF D8 FF
    if (headerBytes[0] === 0xff && headerBytes[1] === 0xd8 && headerBytes[2] === 0xff) {
      return 'image/jpeg';
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      headerBytes[0] === 0x89 &&
      headerBytes[1] === 0x50 &&
      headerBytes[2] === 0x4e &&
      headerBytes[3] === 0x47
    ) {
      return 'image/png';
    }

    // GIF: 47 49 46 38
    if (
      headerBytes[0] === 0x47 &&
      headerBytes[1] === 0x49 &&
      headerBytes[2] === 0x46 &&
      headerBytes[3] === 0x38
    ) {
      return 'image/gif';
    }

    // WebP: 52 49 46 46 ... 57 45 42 50
    if (
      headerBytes[0] === 0x52 &&
      headerBytes[1] === 0x49 &&
      headerBytes[2] === 0x46 &&
      headerBytes[3] === 0x46 &&
      headerBytes[8] === 0x57 &&
      headerBytes[9] === 0x45 &&
      headerBytes[10] === 0x42 &&
      headerBytes[11] === 0x50
    ) {
      return 'image/webp';
    }

    // BMP: 42 4D
    if (headerBytes[0] === 0x42 && headerBytes[1] === 0x4d) {
      return 'image/bmp';
    }

    // TIFF: 49 49 2A 00 (little-endian) or 4D 4D 00 2A (big-endian)
    if (
      (headerBytes[0] === 0x49 && headerBytes[1] === 0x49 && headerBytes[2] === 0x2a && headerBytes[3] === 0x00) ||
      (headerBytes[0] === 0x4d && headerBytes[1] === 0x4d && headerBytes[2] === 0x00 && headerBytes[3] === 0x2a)
    ) {
      return 'image/tiff';
    }

    // AVIF / HEIC / HEIF: ftyp box (starts at byte 4)
    if (
      headerBytes[4] === 0x66 && // 'f'
      headerBytes[5] === 0x74 && // 't'
      headerBytes[6] === 0x79 && // 'y'
      headerBytes[7] === 0x70 // 'p'
    ) {
      // Read the brand bytes to distinguish HEIC vs AVIF
      const brandBytes = await readHeaderBytes(file, 16);
      const brand = String.fromCharCode(
        brandBytes[8],
        brandBytes[9],
        brandBytes[10],
        brandBytes[11]
      );

      if (brand === 'avif' || brand === 'avis') {
        return 'image/avif';
      }
      if (brand === 'heic' || brand === 'heix' || brand === 'mif1') {
        return 'image/heic';
      }
      if (brand === 'heif') {
        return 'image/heif';
      }
    }

    // Fallback to file's type property
    return file.type || 'application/octet-stream';
  } catch (error) {
    // If header reading fails, fall back to file.type
    return file.type || 'application/octet-stream';
  }
}

/**
 * Checks if a file is a HEIC/HEIF image by inspecting its magic bytes.
 *
 * @param file - The file to check
 * @returns A promise resolving to true if the file is HEIC/HEIF
 */
export async function isHeicFile(file: File): Promise<boolean> {
  try {
    const format = await getFileFormat(file);
    return format === 'image/heic' || format === 'image/heif';
  } catch {
    return false;
  }
}

// ─── Internal Helpers ────────────────────────────────────────────────

/**
 * Reads the first N bytes of a file as a Uint8Array.
 */
function readHeaderBytes(file: File, count: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(new Uint8Array(reader.result as ArrayBuffer));
    };
    reader.onerror = () => reject(new Error('Failed to read file header'));
    reader.readAsArrayBuffer(file.slice(0, count));
  });
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
