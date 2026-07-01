import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyWatermark, type WatermarkOptions } from '../watermarkEngine';

vi.mock('../helpers', () => ({
  createImageElement: vi.fn().mockResolvedValue({ width: 200, height: 200 }),
  dataUrlToBlob: vi.fn().mockReturnValue(new Blob(['mock']))
}));

const mockGetContext = vi.fn();
HTMLCanvasElement.prototype.getContext = mockGetContext as any;
HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mock') as any;

describe('watermarkEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetContext.mockReturnValue({
      drawImage: vi.fn(),
      fillText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 50 })
    });
  });

  it('applies text watermark correctly', async () => {
    const file = new File(['mock'], 'test.png', { type: 'image/png' });
    const options: WatermarkOptions = {
      type: 'text',
      text: 'Watermark',
      position: 'bottom-right',
      opacity: 0.5,
      scale: 1,
      rotation: 0
    };
    
    const result = await applyWatermark(file, options);
    expect(result).toBeInstanceOf(Blob);
  });
  
  it('applies image watermark correctly', async () => {
    const file = new File(['mock'], 'test.png', { type: 'image/png' });
    const logo = new File(['logo'], 'logo.png', { type: 'image/png' });
    const options: WatermarkOptions = {
      type: 'image',
      imageFile: logo,
      position: 'center',
      opacity: 0.8,
      scale: 0.5,
      rotation: 45
    };
    
    const result = await applyWatermark(file, options);
    expect(result).toBeInstanceOf(Blob);
  });
});
