import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateHistogram, applyColorFilter } from '../filterEngine';

vi.mock('../helpers', () => ({
  createImageElement: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
  dataUrlToBlob: vi.fn().mockReturnValue(new Blob(['mock']))
}));

const mockGetContext = vi.fn();
HTMLCanvasElement.prototype.getContext = mockGetContext as any;
HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mock') as any;

describe('filterEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetContext.mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({
        data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]) // Mock RGB pixels
      }),
      putImageData: vi.fn(),
    });
  });

  it('calculates histogram correctly', async () => {
    const file = new File(['mock'], 'test.png', { type: 'image/png' });
    const hist = await calculateHistogram(file);
    
    expect(hist.r).toBeDefined();
    expect(hist.g).toBeDefined();
    expect(hist.b).toBeDefined();
    expect(hist.luma).toBeDefined();
  });
  
  it('returns original file if filter is none', async () => {
    const file = new File(['mock'], 'test.png', { type: 'image/png' });
    const result = await applyColorFilter(file, 'none');
    expect(result).toBe(file);
  });
  
  it('applies color filter', async () => {
    const file = new File(['mock'], 'test.png', { type: 'image/png' });
    const result = await applyColorFilter(file, 'sepia');
    expect(result).toBeInstanceOf(Blob);
  });
});
