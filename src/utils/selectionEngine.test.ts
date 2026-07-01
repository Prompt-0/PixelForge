import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { magicWandSelection } from './selectionEngine';

vi.mock('./helpers', () => ({
  createImageElement: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
  dataUrlToBlob: vi.fn().mockReturnValue(new Blob(['fake'], { type: 'image/png' }))
}));

// Mock @xenova/transformers
vi.mock('@xenova/transformers', () => ({
  env: {
    allowLocalModels: false,
    useBrowserCache: true
  },
  pipeline: vi.fn().mockResolvedValue(vi.fn().mockResolvedValue({ mask: { data: new Uint8Array(100*100), width: 100, height: 100 } })),
  RawImage: {
    fromURL: vi.fn().mockResolvedValue({ data: new Uint8ClampedArray(100*100*4), width: 100, height: 100, channels: 4 })
  }
}));

describe('selectionEngine', () => {
  beforeEach(() => {
    const mockCtx = {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({
        data: new Uint8ClampedArray(100 * 100 * 4).fill(255)
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

  it('runs magic wand selection successfully', async () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const result = await magicWandSelection(file, { x: 50, y: 50 }, 10);
    
    expect(result).toBeInstanceOf(Blob);
  });
});
