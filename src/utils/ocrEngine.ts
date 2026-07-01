/**
 * OCR (Optical Character Recognition) engine powered by tesseract.js.
 * Provides text extraction from images with support for multiple languages,
 * region-based recognition, and confidence scores.
 */

import { createWorker, type Worker as TesseractWorker } from 'tesseract.js';

/** Result from OCR text recognition. */
export interface OcrResult {
  /** Full extracted text. */
  text: string;
  /** Overall confidence score (0–100). */
  confidence: number;
  /** Individual text blocks with position information. */
  blocks: OcrBlock[];
}

/** A single recognized text block with bounding box. */
export interface OcrBlock {
  /** Text content of this block. */
  text: string;
  /** Confidence score for this block (0–100). */
  confidence: number;
  /** Bounding box coordinates. */
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

/** Available language option for OCR. */
export interface OcrLanguage {
  /** Tesseract language code. */
  code: string;
  /** Human-readable language name. */
  name: string;
}

// Module-level worker instance
let worker: TesseractWorker | null = null;
let currentLang: string = '';

/**
 * Initializes (or re-initializes) the OCR engine with the specified language.
 * If the engine is already initialized with the same language, this is a no-op.
 * If initialized with a different language, the old worker is terminated first.
 *
 * @param lang - Tesseract language code (e.g., 'eng', 'spa'). Defaults to 'eng'.
 * @throws Error if the worker fails to initialize
 */
export async function initOcrEngine(lang: string = 'eng'): Promise<void> {
  try {
    // Already initialized with same language
    if (worker && currentLang === lang) {
      return;
    }

    // Terminate existing worker if language changed
    if (worker) {
      await terminateOcrEngine();
    }

    worker = await createWorker(lang);
    currentLang = lang;
  } catch (error) {
    worker = null;
    currentLang = '';
    throw new Error(
      `Failed to initialize OCR engine: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Recognizes text in an image, optionally within a specific region.
 *
 * @param imageSource - The image as a data URL string or Blob
 * @param region - Optional rectangle to restrict recognition area
 * @returns A promise resolving to the OCR result with text, confidence, and blocks
 * @throws Error if the OCR engine is not initialized or recognition fails
 */
export async function recognizeText(
  imageSource: string | Blob,
  region?: { x: number; y: number; width: number; height: number }
): Promise<OcrResult> {
  try {
    if (!worker) {
      // Auto-initialize with English if not already done
      await initOcrEngine('eng');
    }

    const recognizeOptions: any = {};
    if (region) {
      recognizeOptions.rectangle = {
        left: region.x,
        top: region.y,
        width: region.width,
        height: region.height,
      };
    }

    // Convert Blob to a URL if needed
    let source: string | Blob = imageSource;
    if (imageSource instanceof Blob && !(imageSource instanceof File)) {
      source = URL.createObjectURL(imageSource);
    }

    const result = await worker!.recognize(
      source as any,
      recognizeOptions
    );

    // Clean up object URL if we created one
    if (typeof source === 'string' && source.startsWith('blob:')) {
      URL.revokeObjectURL(source);
    }

    const data = result.data;

    // Build block-level results from paragraphs
    const blocks: OcrBlock[] = [];
    if (data.blocks) {
      for (const block of data.blocks) {
        blocks.push({
          text: block.text,
          confidence: block.confidence,
          bbox: {
            x0: block.bbox.x0,
            y0: block.bbox.y0,
            x1: block.bbox.x1,
            y1: block.bbox.y1,
          },
        });
      }
    }

    return {
      text: data.text,
      confidence: data.confidence,
      blocks,
    };
  } catch (error) {
    throw new Error(
      `OCR recognition failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Returns a list of commonly available OCR languages.
 *
 * @returns An array of language options with codes and human-readable names
 */
export function getAvailableLanguages(): OcrLanguage[] {
  return [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'kor', name: 'Korean' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
    { code: 'ara', name: 'Arabic' },
    { code: 'hin', name: 'Hindi' },
  ];
}

/**
 * Terminates the OCR engine and releases resources.
 * Safe to call multiple times or when no engine is initialized.
 */
export async function terminateOcrEngine(): Promise<void> {
  try {
    if (worker) {
      await worker.terminate();
      worker = null;
      currentLang = '';
    }
  } catch (error) {
    // Force cleanup even on error
    worker = null;
    currentLang = '';
    throw new Error(
      `Failed to terminate OCR engine: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
