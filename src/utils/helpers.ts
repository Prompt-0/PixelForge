/**
 * Shared helper functions for the Image Manipulator application.
 * Provides utilities for file conversion, image element creation,
 * downloading, and filename generation.
 */

/**
 * Converts a File object to a data URL string.
 * @param file - The file to convert
 * @returns A promise resolving to the base64 data URL
 * @throws Error if the file cannot be read
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () =>
        reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    } catch (error) {
      reject(
        new Error(
          `Failed to create FileReader: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  });
}

/**
 * Converts a data URL string to a Blob object.
 * @param dataUrl - The data URL to convert (e.g., "data:image/png;base64,...")
 * @returns The resulting Blob
 * @throws Error if the data URL format is invalid
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(',');
    if (parts.length !== 2) {
      throw new Error('Invalid data URL format');
    }

    const mimeMatch = parts[0].match(/:(.*?);/);
    if (!mimeMatch) {
      throw new Error('Could not extract MIME type from data URL');
    }

    const mime = mimeMatch[1];
    const byteString = atob(parts[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    return new Blob([arrayBuffer], { type: mime });
  } catch (error) {
    throw new Error(
      `Failed to convert data URL to Blob: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Wraps a Blob as a File object with the given filename.
 * @param blob - The Blob to convert
 * @param filename - The desired filename
 * @returns A new File object
 */
export function blobToFile(blob: Blob, filename: string): File {
  try {
    return new File([blob], filename, {
      type: blob.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    throw new Error(
      `Failed to convert Blob to File: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Formats a byte count into a human-readable file size string.
 * @param bytes - The size in bytes
 * @returns A formatted string like "1.5 MB", "256 KB", or "128 B"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unitIndex = Math.min(i, units.length - 1);

  if (unitIndex === 0) return `${bytes} B`;

  const value = bytes / Math.pow(k, unitIndex);
  return `${value.toFixed(value < 10 ? 2 : value < 100 ? 1 : 0)} ${units[unitIndex]}`;
}

/**
 * Maps a MIME type to a file extension (without dot).
 * @param format - The MIME type string (e.g., "image/jpeg")
 * @returns The corresponding file extension (e.g., "jpg")
 */
export function getFileExtension(format: string): string {
  const extensionMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/svg+xml': 'svg',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/ico': 'ico',
    'image/x-icon': 'ico',
  };

  return extensionMap[format.toLowerCase()] ?? 'bin';
}

/**
 * Creates an HTMLImageElement from a source string (data URL or URL) or a File.
 * @param source - A data URL, object URL, regular URL, or File object
 * @returns A promise resolving to a fully loaded HTMLImageElement
 * @throws Error if the image fails to load
 */
export function createImageElement(
  source: string | File
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let objectUrl: string | null = null;

    img.onload = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      resolve(img);
    };

    img.onerror = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      reject(new Error('Failed to load image'));
    };

    if (source instanceof File) {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    } else {
      img.src = source;
    }
  });
}

/**
 * Triggers a browser download for the given Blob.
 * @param blob - The Blob to download
 * @param filename - The suggested filename for the download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();

    // Clean up after a short delay to ensure download starts
    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    throw new Error(
      `Failed to trigger download: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generates an output filename based on the original name, a suffix, and an optional new extension.
 * @param originalName - The original filename (e.g., "photo.jpg")
 * @param suffix - The suffix to append (e.g., "resized", "compressed")
 * @param newExtension - Optional new extension without dot (e.g., "png"). If omitted, keeps the original.
 * @returns The generated filename (e.g., "photo_resized.png")
 */
export function generateOutputFilename(
  originalName: string,
  suffix: string,
  newExtension?: string
): string {
  try {
    const lastDotIndex = originalName.lastIndexOf('.');
    const baseName =
      lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName;
    const originalExt =
      lastDotIndex > 0 ? originalName.substring(lastDotIndex + 1) : '';
    const extension = newExtension ?? originalExt;

    const sanitizedSuffix = suffix.replace(/[^a-zA-Z0-9_-]/g, '_');

    return extension
      ? `${baseName}_${sanitizedSuffix}.${extension}`
      : `${baseName}_${sanitizedSuffix}`;
  } catch (error) {
    throw new Error(
      `Failed to generate output filename: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
