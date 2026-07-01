import { createImageElement, dataUrlToBlob } from './helpers';

export type WatermarkPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tiled';

export interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  imageFile?: File;
  position: WatermarkPosition;
  opacity: number;
  scale: number; // 0.1 to 2.0 (relative to original image size)
  rotation: number; // degrees
  color?: string; // for text
}

export const applyWatermark = async (
  file: File,
  options: WatermarkOptions
): Promise<Blob> => {
  const img = await createImageElement(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  // Draw original
  ctx.drawImage(img, 0, 0);

  // Set up watermark styling
  ctx.globalAlpha = options.opacity;

  const drawAtPosition = (
    drawFunc: (x: number, y: number, w: number, h: number) => void,
    w: number,
    h: number
  ) => {
    const margin = Math.min(canvas.width, canvas.height) * 0.05;
    
    if (options.position === 'tiled') {
      const tileSpacingX = w * 1.5;
      const tileSpacingY = h * 2.0;
      for (let x = -w; x < canvas.width + w; x += tileSpacingX) {
        for (let y = -h; y < canvas.height + h; y += tileSpacingY) {
          ctx.save();
          ctx.translate(x + w / 2, y + h / 2);
          ctx.rotate((options.rotation * Math.PI) / 180);
          drawFunc(-w / 2, -h / 2, w, h);
          ctx.restore();
        }
      }
      return;
    }

    let x = 0;
    let y = 0;

    switch (options.position) {
      case 'center':
        x = (canvas.width - w) / 2;
        y = (canvas.height - h) / 2;
        break;
      case 'top-left':
        x = margin;
        y = margin;
        break;
      case 'top-right':
        x = canvas.width - w - margin;
        y = margin;
        break;
      case 'bottom-left':
        x = margin;
        y = canvas.height - h - margin;
        break;
      case 'bottom-right':
        x = canvas.width - w - margin;
        y = canvas.height - h - margin;
        break;
    }

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((options.rotation * Math.PI) / 180);
    drawFunc(-w / 2, -h / 2, w, h);
    ctx.restore();
  };

  if (options.type === 'text' && options.text) {
    // Dynamic font size based on image size and scale
    const baseFontSize = Math.max(canvas.width, canvas.height) * 0.05;
    const fontSize = baseFontSize * options.scale;
    
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = options.color || 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const metrics = ctx.measureText(options.text);
    const textWidth = metrics.width;
    const textHeight = fontSize; // Approximation
    
    drawAtPosition((x, y) => {
      // Add subtle shadow for readability
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(options.text!, x, y);
    }, textWidth, textHeight);

  } else if (options.type === 'image' && options.imageFile) {
    const watermarkImg = await createImageElement(options.imageFile);
    // Scale image relative to original, but respect watermark's aspect ratio
    const baseWidth = canvas.width * 0.2; // 20% of image width by default
    const ratio = watermarkImg.height / watermarkImg.width;
    
    const finalWidth = baseWidth * options.scale;
    const finalHeight = finalWidth * ratio;

    drawAtPosition((x, y, w, h) => {
      ctx.drawImage(watermarkImg, x, y, w, h);
    }, finalWidth, finalHeight);
  }

  const dataUrl = canvas.toDataURL(file.type || 'image/png', 0.95);
  return dataUrlToBlob(dataUrl);
};
