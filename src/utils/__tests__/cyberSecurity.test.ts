import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  encodeSteganography,
  decodeSteganography,
  scanForPayloads,
  generateErrorLevelAnalysis,
  deepScrub
} from '../cyberSecurity';

// Mock helpers so we don't actually need the DOM / real File readers in node test environment
vi.mock('../helpers', () => {
  return {
    fileToDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,mock'),
    dataUrlToBlob: vi.fn().mockReturnValue(new Blob(['mock'])),
    createImageElement: vi.fn().mockImplementation(() => {
      return Promise.resolve({
        width: 10,
        height: 10
      });
    })
  };
});

describe('cyberSecurity Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scanForPayloads', () => {
    it('detects PHP payloads', async () => {
      const file = new File(['Some text <?php eval(); ?> more text'], 'test.jpg', { type: 'image/jpeg' });
      const result = await scanForPayloads(file);
      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('Suspicious PHP code detected inside image data');
    });

    it('detects embedded JS in non-SVG', async () => {
      const file = new File(['header <script>alert(1)</script> footer'], 'test.jpg', { type: 'image/jpeg' });
      const result = await scanForPayloads(file);
      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('Suspicious HTML/Javascript tags detected in a raster image format');
    });

    it('ignores embedded JS in SVG', async () => {
      const file = new File(['<svg><script>alert(1)</script></svg>'], 'test.svg', { type: 'image/svg+xml' });
      const result = await scanForPayloads(file);
      // SVG might have scripts natively, so we only check the zip/polyglot rules for SVG if we didn't mock others
      expect(result.threats).not.toContain('Suspicious HTML/Javascript tags detected in a raster image format');
    });

    it('detects ZIP polyglots in non-zip file', async () => {
      const file = new File(['header PK\x03\x04 footer'], 'test.jpg', { type: 'image/jpeg' });
      const result = await scanForPayloads(file);
      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('Suspicious ZIP/JAR archive header found embedded in image data');
    });

    it('passes a clean file', async () => {
      const file = new File(['normal image binary data'], 'test.jpg', { type: 'image/jpeg' });
      const result = await scanForPayloads(file);
      expect(result.isSafe).toBe(true);
      expect(result.threats.length).toBe(0);
    });
  });
});
