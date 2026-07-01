import { describe, it, expect } from 'vitest';
import { formatFileSize, getFileExtension } from './helpers';

describe('helpers.ts utilities', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1536)).toBe('1.50 KB');
      expect(formatFileSize(1048576)).toBe('1.00 MB');
      expect(formatFileSize(-100)).toBe('0 B');
    });
  });

  describe('getFileExtension', () => {
    it('should return correct extension for mime types', () => {
      expect(getFileExtension('image/jpeg')).toBe('jpg');
      expect(getFileExtension('image/png')).toBe('png');
      expect(getFileExtension('image/webp')).toBe('webp');
      expect(getFileExtension('image/avif')).toBe('avif');
      expect(getFileExtension('image/gif')).toBe('gif');
      expect(getFileExtension('unknown/mime')).toBe('bin');
    });

    it('should be case-insensitive', () => {
      expect(getFileExtension('IMAGE/JPEG')).toBe('jpg');
    });
  });
});
