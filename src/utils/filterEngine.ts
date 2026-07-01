import { createImageElement, dataUrlToBlob } from './helpers';

export interface HistogramData {
  r: number[];
  g: number[];
  b: number[];
  luma: number[];
}

export type FilterType = 'none' | 'grayscale' | 'sepia' | 'invert' | 'vintage' | 'warm' | 'cool' | 'dramatic';

export const calculateHistogram = async (file: File): Promise<HistogramData> => {
  const img = await createImageElement(file);
  const canvas = document.createElement('canvas');
  // Scale down for faster calculation
  const scale = Math.min(1, 400 / Math.max(img.width, img.height));
  canvas.width = Math.floor(img.width * scale);
  canvas.height = Math.floor(img.height * scale);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Failed to get 2D context');
  
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);
  const luma = new Array(256).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    const rVal = data[i];
    const gVal = data[i + 1];
    const bVal = data[i + 2];
    
    r[rVal]++;
    g[gVal]++;
    b[bVal]++;
    
    // Rec. 709 luma
    const lumaVal = Math.round(rVal * 0.2126 + gVal * 0.7152 + bVal * 0.0722);
    luma[lumaVal]++;
  }

  // Normalize
  let maxVal = 0;
  for (let i = 0; i < 256; i++) {
    maxVal = Math.max(maxVal, r[i], g[i], b[i], luma[i]);
  }

  if (maxVal > 0) {
    for (let i = 0; i < 256; i++) {
      r[i] = r[i] / maxVal;
      g[i] = g[i] / maxVal;
      b[i] = b[i] / maxVal;
      luma[i] = luma[i] / maxVal;
    }
  }

  return { r, g, b, luma };
};

export const applyColorFilter = async (file: File, filter: FilterType): Promise<Blob> => {
  if (filter === 'none') return file;

  const img = await createImageElement(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Failed to get 2D context');

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (filter === 'grayscale') {
      const v = r * 0.299 + g * 0.587 + b * 0.114;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    } else if (filter === 'sepia') {
      data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
      data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
      data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
    } else if (filter === 'invert') {
      data[i] = 255 - r;
      data[i + 1] = 255 - g;
      data[i + 2] = 255 - b;
    } else if (filter === 'vintage') {
      data[i] = Math.min(255, (r * 0.9) + (g * 0.5) + (b * 0.1));
      data[i + 1] = Math.min(255, (r * 0.3) + (g * 0.8) + (b * 0.1));
      data[i + 2] = Math.min(255, (r * 0.2) + (g * 0.3) + (b * 0.7));
    } else if (filter === 'warm') {
      data[i] = Math.min(255, r * 1.2);
      data[i + 1] = Math.min(255, g * 1.1);
      data[i + 2] = Math.min(255, b * 0.9);
    } else if (filter === 'cool') {
      data[i] = Math.min(255, r * 0.9);
      data[i + 1] = Math.min(255, g * 1.1);
      data[i + 2] = Math.min(255, b * 1.2);
    } else if (filter === 'dramatic') {
      data[i] = r > 128 ? Math.min(255, r * 1.2) : Math.max(0, r * 0.8);
      data[i + 1] = g > 128 ? Math.min(255, g * 1.2) : Math.max(0, g * 0.8);
      data[i + 2] = b > 128 ? Math.min(255, b * 1.2) : Math.max(0, b * 0.8);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return dataUrlToBlob(canvas.toDataURL(file.type || 'image/png', 0.95));
};
