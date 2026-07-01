import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyAnnotations, type DrawAction } from '../annotationEngine';

vi.mock('../helpers', () => ({
  createImageElement: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
  fileToDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,mock')
}));

const mockGetContext = vi.fn();
HTMLCanvasElement.prototype.getContext = mockGetContext as any;
HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation((cb) => cb(new Blob(['mock'])));

describe('annotationEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetContext.mockReturnValue({
      drawImage: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      strokeRect: vi.fn(),
      ellipse: vi.fn(),
      fillText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      getImageData: vi.fn().mockReturnValue({ width: 10, height: 10, data: new Uint8ClampedArray(400) }),
      putImageData: vi.fn()
    });
  });

  it('applies freehand annotations correctly', async () => {
    const file = new File(['mock'], 'test.png', { type: 'image/png' });
    const actions: DrawAction[] = [{
      id: '1',
      tool: 'freehand',
      color: '#ff0000',
      size: 5,
      points: [{ x: 0, y: 0 }, { x: 10, y: 10 }]
    }];
    
    const result = await applyAnnotations(file, actions);
    expect(result).toBeInstanceOf(Blob);
  });
  
  it('applies shapes correctly', async () => {
    const file = new File(['mock'], 'test.png', { type: 'image/png' });
    const actions: DrawAction[] = [
      {
        id: '2',
        tool: 'rect',
        color: '#00ff00',
        size: 2,
        points: [],
        rect: { x: 10, y: 10, w: 20, h: 20 }
      },
      {
        id: '3',
        tool: 'ellipse',
        color: '#0000ff',
        size: 2,
        points: [],
        rect: { x: 40, y: 40, w: 10, h: 10 }
      }
    ];
    
    const result = await applyAnnotations(file, actions);
    expect(result).toBeInstanceOf(Blob);
  });
});
