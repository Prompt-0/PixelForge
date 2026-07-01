import { describe, it, expect, vi, beforeEach } from 'vitest';
import { magicWandSelection } from '../selectionEngine';

vi.mock('../helpers', () => ({
  createImageElement: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
  fileToDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,mock'),
  dataUrlToBlob: vi.fn().mockReturnValue(new Blob(['mock']))
}));

const mockGetContext = vi.fn();
HTMLCanvasElement.prototype.getContext = mockGetContext as any;
HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mock') as any;

describe('selectionEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetContext.mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({ width: 10, height: 10, data: new Uint8ClampedArray(400) }),
      putImageData: vi.fn(),
      clearRect: vi.fn()
    });
  });

  it('performs magic wand selection without error', async () => {
    const file = new File(['mock'], 'test.png', { type: 'image/png' });
    const result = await magicWandSelection(file, { x: 5, y: 5 }, 30);
    expect(result).toBeInstanceOf(Blob);
  });
});
