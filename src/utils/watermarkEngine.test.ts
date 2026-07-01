import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { applyWatermark } from './watermarkEngine';

vi.mock('./helpers', () => ({
  createImageElement: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
  dataUrlToBlob: vi.fn().mockReturnValue(new Blob(['fake'], { type: 'image/png' }))
}));

describe('watermarkEngine', () => {
  beforeEach(() => {
    const mockCtx = {
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 50 }),
    };
    
    const mockCanvas = {
      width: 100,
      height: 100,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,fake'),
    };
    
    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue(mockCanvas)
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('applies text watermark successfully', async () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const result = await applyWatermark(file, {
      type: 'text',
      text: 'Watermark',
      position: 'bottom-right',
      opacity: 0.5,
      scale: 1,
      rotation: 0
    });
    
    expect(result).toBeInstanceOf(Blob);
  });

  it('applies image watermark successfully', async () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const imgFile = new File([''], 'logo.png', { type: 'image/png' });
    const result = await applyWatermark(file, {
      type: 'image',
      imageFile: imgFile,
      position: 'center',
      opacity: 0.5,
      scale: 1,
      rotation: 0
    });
    
    expect(result).toBeInstanceOf(Blob);
  });
});
