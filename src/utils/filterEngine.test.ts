import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { calculateHistogram, applyColorFilter } from './filterEngine';

// Mock helpers
vi.mock('./helpers', () => ({
  createImageElement: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
  dataUrlToBlob: vi.fn().mockReturnValue(new Blob(['fake'], { type: 'image/png' }))
}));

describe('filterEngine', () => {
  beforeEach(() => {
    // Mock canvas context
    const mockCtx = {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({
        data: new Uint8ClampedArray(100 * 100 * 4).fill(128) // Gray image
      }),
      putImageData: vi.fn(),
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

  it('calculates histogram successfully', async () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const hist = await calculateHistogram(file);
    
    expect(hist.r).toHaveLength(256);
    expect(hist.g).toHaveLength(256);
    expect(hist.b).toHaveLength(256);
    expect(hist.luma).toHaveLength(256);
  });

  it('applies color filter successfully', async () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const result = await applyColorFilter(file, 'sepia');
    
    expect(result).toBeInstanceOf(Blob);
  });

  it('returns original file for none filter', async () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const result = await applyColorFilter(file, 'none');
    
    expect(result).toBe(file);
  });
});
