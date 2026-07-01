import { createImageElement, fileToDataUrl } from './helpers';

export interface ScanReport {
  isSafe: boolean;
  threats: string[];
}

/**
 * Encodes a secret message into the Least Significant Bits (LSB) of an image using Canvas.
 * Supports basic LSB steganography on the RGB channels (skipping Alpha).
 */
export async function encodeSteganography(file: File, message: string): Promise<Blob> {
  const dataUrl = await fileToDataUrl(file);
  const img = await createImageElement(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Prefix message with a terminator so we know when to stop decoding
  const fullMessage = message + '\0';
  
  // Convert message to binary string
  let binaryMessage = '';
  for (let i = 0; i < fullMessage.length; i++) {
    const charCode = fullMessage.charCodeAt(i);
    if (charCode > 255) throw new Error('Only ASCII characters are supported for now');
    binaryMessage += charCode.toString(2).padStart(8, '0');
  }

  // Ensure message fits in image
  // Each pixel has 3 usable channels (RGB). We skip A.
  const maxBits = (data.length / 4) * 3;
  if (binaryMessage.length > maxBits) {
    throw new Error('Message is too long for this image');
  }

  let bitIndex = 0;
  for (let i = 0; i < data.length; i++) {
    // Skip the alpha channel (every 4th byte)
    if ((i + 1) % 4 === 0) continue;
    
    if (bitIndex < binaryMessage.length) {
      const bit = parseInt(binaryMessage[bitIndex], 10);
      // Clear LSB and set to our bit
      data[i] = (data[i] & 254) | bit;
      bitIndex++;
    } else {
      break;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  
  // Must return as PNG to preserve exact pixel values (lossless)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/png');
  });
}

/**
 * Decodes a hidden message from the Least Significant Bits (LSB) of an image.
 */
export async function decodeSteganography(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const img = await createImageElement(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  let binaryMessage = '';
  let decodedMessage = '';

  for (let i = 0; i < data.length; i++) {
    // Skip the alpha channel
    if ((i + 1) % 4 === 0) continue;

    const lsb = data[i] & 1;
    binaryMessage += lsb.toString();

    if (binaryMessage.length === 8) {
      const charCode = parseInt(binaryMessage, 2);
      if (charCode === 0) { // Null terminator found
        return decodedMessage;
      }
      decodedMessage += String.fromCharCode(charCode);
      binaryMessage = '';
    }
  }

  throw new Error('No hidden message found or image is corrupted');
}

/**
 * Scans the raw ArrayBuffer for malicious payloads or polyglot signatures.
 */
export async function scanForPayloads(file: File): Promise<ScanReport> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8View = new Uint8Array(arrayBuffer);
  const textDecoder = new TextDecoder('utf-8');
  // Decode the entire buffer to a string for basic heuristic signature scanning
  // Warning: This can be memory intensive for huge files, but usually fine for web images
  const fileContent = textDecoder.decode(uint8View);

  const threats: string[] = [];

  // 1. Check for PHP payloads often embedded in EXIF
  if (fileContent.includes('<?php') || fileContent.includes('system(') || fileContent.includes('eval(')) {
    threats.push('Suspicious PHP code detected inside image data');
  }

  // 2. Check for embedded Javascript/HTML (SVG XSS or polyglots)
  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
  if (!isSvg) {
    if (fileContent.includes('<script') || fileContent.includes('javascript:')) {
      threats.push('Suspicious HTML/Javascript tags detected in a raster image format');
    }
  }

  // 3. Check for Zip/Jar headers inside a non-zip file (Polyglot)
  // PK\x03\x04 is the magic number for ZIP
  if (fileContent.includes('PK\x03\x04') && !file.type.includes('zip')) {
    threats.push('Suspicious ZIP/JAR archive header found embedded in image data');
  }

  return {
    isSafe: threats.length === 0,
    threats
  };
}

/**
 * Performs Error Level Analysis (ELA).
 * Resaves the image at a known JPEG quality (e.g., 90%) and compares pixel-by-pixel
 * the difference between the original and the resaved version. Areas of recent manipulation
 * will typically stand out as having different error levels than the background.
 */
export async function generateErrorLevelAnalysis(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const originalImg = await createImageElement(dataUrl);

  const width = originalImg.width;
  const height = originalImg.height;

  // 1. Draw original to canvas to get original pixels
  const originalCanvas = document.createElement('canvas');
  originalCanvas.width = width;
  originalCanvas.height = height;
  const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
  if (!originalCtx) throw new Error('Could not get canvas context');
  originalCtx.drawImage(originalImg, 0, 0);
  
  // 2. Export original canvas as a 90% quality JPEG
  const compressedDataUrl = originalCanvas.toDataURL('image/jpeg', 0.90);
  const compressedImg = await createImageElement(compressedDataUrl);

  // 3. Draw compressed image to a new canvas to get its pixels
  const compressedCanvas = document.createElement('canvas');
  compressedCanvas.width = width;
  compressedCanvas.height = height;
  const compressedCtx = compressedCanvas.getContext('2d', { willReadFrequently: true });
  if (!compressedCtx) throw new Error('Could not get canvas context');
  compressedCtx.drawImage(compressedImg, 0, 0);

  const originalData = originalCtx.getImageData(0, 0, width, height).data;
  const compressedData = compressedCtx.getImageData(0, 0, width, height).data;

  // 4. Create an output canvas for the ELA result
  const elaCanvas = document.createElement('canvas');
  elaCanvas.width = width;
  elaCanvas.height = height;
  const elaCtx = elaCanvas.getContext('2d');
  if (!elaCtx) throw new Error('Could not get canvas context');
  
  const elaImageData = elaCtx.createImageData(width, height);
  const elaData = elaImageData.data;

  const scaleMultiplier = 15; // Amplify differences so they are visually apparent

  for (let i = 0; i < originalData.length; i += 4) {
    // Calculate absolute difference for R, G, B
    const rDiff = Math.abs(originalData[i] - compressedData[i]);
    const gDiff = Math.abs(originalData[i + 1] - compressedData[i + 1]);
    const bDiff = Math.abs(originalData[i + 2] - compressedData[i + 2]);

    // Apply multiplier and clamp to 255
    elaData[i] = Math.min(255, rDiff * scaleMultiplier);
    elaData[i + 1] = Math.min(255, gDiff * scaleMultiplier);
    elaData[i + 2] = Math.min(255, bDiff * scaleMultiplier);
    elaData[i + 3] = 255; // Alpha opaque
  }

  elaCtx.putImageData(elaImageData, 0, 0);
  return elaCanvas.toDataURL('image/png');
}

/**
 * Aggressive metadata stripper.
 * Simply drawing the image to a canvas and exporting it to PNG effectively strips
 * all embedded EXIF, IPTC, XMP, ICC profiles, and file-level payloads.
 */
export async function deepScrub(file: File): Promise<Blob> {
  const dataUrl = await fileToDataUrl(file);
  const img = await createImageElement(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(img, 0, 0);
  
  return new Promise((resolve, reject) => {
    // Exporting as PNG ensures lossless scrubbing of raster data
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create deep scrub blob'));
    }, 'image/png');
  });
}
