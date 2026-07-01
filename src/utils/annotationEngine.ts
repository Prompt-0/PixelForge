import { createImageElement, fileToDataUrl } from './helpers';

export type AnnotationTool = 'freehand' | 'rectangle' | 'ellipse' | 'text' | 'blur';

export interface AnnotationPoint {
  x: number;
  y: number;
}

export interface AnnotationAction {
  id: string;
  tool: AnnotationTool;
  color: string;
  size: number;
  points: AnnotationPoint[]; // For freehand
  rect?: { x: number, y: number, w: number, h: number }; // For shapes and blur
  text?: string; // For text
}

export class AnnotationEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private actions: AnnotationAction[] = [];
  private undoStack: AnnotationAction[] = [];
  
  // Current drawing state
  private isDrawing = false;
  private currentAction: AnnotationAction | null = null;
  private startPoint: AnnotationPoint | null = null;
  
  // Active settings
  public currentTool: AnnotationTool = 'freehand';
  public currentColor: string = '#ff0000';
  public currentSize: number = 5;

  private onUpdate: () => void;

  constructor(canvas: HTMLCanvasElement, onUpdate: () => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error("Could not get canvas context");
    this.ctx = ctx;
    this.onUpdate = onUpdate;
  }

  public setDimensions(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.render();
  }

  // Pointer Events
  public startDrawing(x: number, y: number) {
    this.isDrawing = true;
    this.startPoint = { x, y };
    
    this.currentAction = {
      id: Math.random().toString(36).substring(2, 9),
      tool: this.currentTool,
      color: this.currentColor,
      size: this.currentSize,
      points: [{ x, y }]
    };
  }

  public draw(x: number, y: number) {
    if (!this.isDrawing || !this.currentAction || !this.startPoint) return;

    if (this.currentTool === 'freehand') {
      this.currentAction.points.push({ x, y });
    } else {
      const w = x - this.startPoint.x;
      const h = y - this.startPoint.y;
      this.currentAction.rect = { x: this.startPoint.x, y: this.startPoint.y, w, h };
    }
    this.render();
  }

  public stopDrawing(textInput?: string) {
    if (!this.isDrawing || !this.currentAction) return;
    this.isDrawing = false;

    if (this.currentTool === 'text') {
       if (textInput && textInput.trim().length > 0) {
         this.currentAction.text = textInput;
       } else {
         this.currentAction = null;
         this.render();
         return;
       }
    }

    // Don't save if it's an empty action (like a click with no drag for shapes)
    if (this.currentTool !== 'text' && this.currentTool !== 'freehand' && (!this.currentAction.rect || (this.currentAction.rect.w === 0 && this.currentAction.rect.h === 0))) {
        this.currentAction = null;
        this.render();
        return;
    }

    this.actions.push(this.currentAction);
    this.undoStack = [];
    this.currentAction = null;
    this.startPoint = null;
    this.render();
    this.onUpdate();
  }

  public cancelCurrentDrawing() {
    this.isDrawing = false;
    this.currentAction = null;
    this.startPoint = null;
    this.render();
  }

  public render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const allActions = [...this.actions];
    if (this.currentAction) {
      allActions.push(this.currentAction);
    }

    allActions.forEach(action => {
      this.ctx.save();
      this.ctx.strokeStyle = action.color;
      this.ctx.fillStyle = action.color;
      this.ctx.lineWidth = action.size;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      if (action.tool === 'freehand' && action.points.length > 0) {
        this.ctx.beginPath();
        this.ctx.moveTo(action.points[0].x, action.points[0].y);
        for (let i = 1; i < action.points.length; i++) {
          this.ctx.lineTo(action.points[i].x, action.points[i].y);
        }
        this.ctx.stroke();
      } 
      else if (action.rect) {
        const { x, y, w, h } = action.rect;
        if (action.tool === 'rectangle') {
          this.ctx.strokeRect(x, y, w, h);
        } else if (action.tool === 'ellipse') {
          this.ctx.beginPath();
          this.ctx.ellipse(x + w/2, y + h/2, Math.abs(w/2), Math.abs(h/2), 0, 0, 2 * Math.PI);
          this.ctx.stroke();
        } else if (action.tool === 'blur') {
          // On the overlay layer, blur is just represented as a solid semi-transparent block for preview
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          this.ctx.fillRect(x, y, w, h);
        } else if (action.tool === 'text' && action.text) {
          this.ctx.font = `${action.size * 4}px Arial`;
          this.ctx.fillText(action.text, x, y + action.size * 4);
        }
      }
      this.ctx.restore();
    });
  }

  public undo() {
    const action = this.actions.pop();
    if (action) {
      this.undoStack.push(action);
      this.render();
      this.onUpdate();
    }
  }

  public redo() {
    const action = this.undoStack.pop();
    if (action) {
      this.actions.push(action);
      this.render();
      this.onUpdate();
    }
  }

  public clear() {
    this.actions = [];
    this.undoStack = [];
    this.render();
    this.onUpdate();
  }
  
  public getActions() {
    return this.actions;
  }
  
  public hasUndo() { return this.actions.length > 0; }
  public hasRedo() { return this.undoStack.length > 0; }
}

/**
 * Applies annotation actions to a base image file and returns a new Blob
 */
export async function applyAnnotations(file: File, actions: AnnotationAction[]): Promise<Blob> {
  const dataUrl = await fileToDataUrl(file);
  const img = await createImageElement(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error("Could not get canvas context");

  // Draw base image
  ctx.drawImage(img, 0, 0);

  // Apply actions
  actions.forEach(action => {
    ctx.save();
    ctx.strokeStyle = action.color;
    ctx.fillStyle = action.color;
    ctx.lineWidth = action.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (action.tool === 'freehand' && action.points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(action.points[0].x, action.points[0].y);
      for (let i = 1; i < action.points.length; i++) {
        ctx.lineTo(action.points[i].x, action.points[i].y);
      }
      ctx.stroke();
    } 
    else if (action.rect) {
      const { x, y, w, h } = action.rect;
      if (action.tool === 'rectangle') {
        ctx.strokeRect(x, y, w, h);
      } else if (action.tool === 'ellipse') {
        ctx.beginPath();
        ctx.ellipse(x + w/2, y + h/2, Math.abs(w/2), Math.abs(h/2), 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (action.tool === 'blur') {
        // True blur implementation
        const absX = Math.min(x, x + w);
        const absY = Math.min(y, y + h);
        const absW = Math.abs(w);
        const absH = Math.abs(h);
        
        // Ensure we are within canvas bounds
        if (absW > 0 && absH > 0 && absX < canvas.width && absY < canvas.height && absX + absW > 0 && absY + absH > 0) {
            const clipX = Math.max(0, absX);
            const clipY = Math.max(0, absY);
            const clipW = Math.min(canvas.width - clipX, absW);
            const clipH = Math.min(canvas.height - clipY, absH);

            const imgData = ctx.getImageData(clipX, clipY, clipW, clipH);
            const blurredData = applyBoxBlur(imgData, action.size * 2); // Blur intensity based on size
            ctx.putImageData(blurredData, clipX, clipY);
        }
      } else if (action.tool === 'text' && action.text) {
        ctx.font = `${action.size * 4}px Arial`;
        ctx.fillText(action.text, x, y + action.size * 4);
      }
    }
    ctx.restore();
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create merged annotation blob'));
    }, file.type || 'image/png');
  });
}

// Simple Box Blur implementation for Redaction
function applyBoxBlur(imageData: ImageData, radius: number): ImageData {
  const w = imageData.width;
  const h = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data.length);
  
  // To keep it simple, we'll do a simple mosaic/pixelate instead of a true gaussian blur for redaction
  const blockSize = Math.max(2, radius);
  
  for (let y = 0; y < h; y += blockSize) {
    for (let x = 0; x < w; x += blockSize) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      
      // Calculate average color of block
      for (let by = 0; by < blockSize; by++) {
        for (let bx = 0; bx < blockSize; bx++) {
          if (x + bx < w && y + by < h) {
            const idx = ((y + by) * w + (x + bx)) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            a += data[idx + 3];
            count++;
          }
        }
      }
      
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
      a = Math.floor(a / count);
      
      // Apply average color to block
      for (let by = 0; by < blockSize; by++) {
        for (let bx = 0; bx < blockSize; bx++) {
          if (x + bx < w && y + by < h) {
            const idx = ((y + by) * w + (x + bx)) * 4;
            output[idx] = r;
            output[idx + 1] = g;
            output[idx + 2] = b;
            output[idx + 3] = a;
          }
        }
      }
    }
  }
  
  return new ImageData(output, w, h);
}
