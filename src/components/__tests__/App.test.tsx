import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../../App';

// Mock external modules that perform browser operations or load packages
vi.mock('../../utils/helpers', () => ({
  fileToDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,mock'),
  formatFileSize: vi.fn().mockReturnValue('100 KB'),
  generateOutputFilename: vi.fn().mockReturnValue('edited.png'),
  downloadBlob: vi.fn(),
}));

vi.mock('../../utils/imageResizer', () => ({
  getImageDimensions: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
  resizeImage: vi.fn(),
  rotateImage: vi.fn(),
  flipImage: vi.fn(),
}));

vi.mock('../../utils/imageCompressor', () => ({
  compressImage: vi.fn(),
}));

vi.mock('../../utils/imageConverter', () => ({
  convertImage: vi.fn(),
  loadHeicImage: vi.fn(),
  isHeicFile: vi.fn().mockResolvedValue(false),
  getFileFormat: vi.fn().mockResolvedValue('PNG'),
}));

vi.mock('../../utils/metadataHandler', () => ({
  readMetadata: vi.fn().mockResolvedValue(null),
  stripMetadata: vi.fn(),
  updateMetadata: vi.fn(),
  metadataToJson: vi.fn(),
}));

vi.mock('../../utils/ocrEngine', () => ({
  initOcrEngine: vi.fn(),
  recognizeText: vi.fn(),
  terminateOcrEngine: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../utils/imageAdjustments', () => ({
  applyAdjustments: vi.fn(),
  getDefaultAdjustments: () => ({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    temperature: 0,
    sharpness: 0,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    invert: 0,
    hue: 0,
    vignette: 0,
  }),
  buildFilterString: vi.fn().mockReturnValue(''),
}));

describe('App Component Layout and Live Preview', () => {
  it('renders UploadZone initially', () => {
    render(<App />);
    expect(screen.getAllByText(/Drag & drop/i).length).toBeGreaterThan(0);
  });

  it('renders workspace with Live Preview checkbox when a file is loaded', async () => {
    render(<App />);
    
    // Simulate file select
    const file = new File(['mock'], 'test.png', { type: 'image/png' });
    const uploadInputs = document.querySelectorAll('input[type="file"]');
    // The second input belongs to the single mode UploadZone
    const uploadInput = uploadInputs[uploadInputs.length - 1] as HTMLInputElement;
    expect(uploadInput).toBeInTheDocument();

    // Trigger file selection
    fireEvent.change(uploadInput, { target: { files: [file] } });

    // Switch to Compress tab to see Live Preview
    const compressTab = await screen.findByTestId('tab-compress');
    fireEvent.click(compressTab);

    // Wait for App to render workspace (live preview checkbox)
    await waitFor(() => {
      const livePreviewCheckbox = screen.getByLabelText('Live Preview');
      expect(livePreviewCheckbox).toBeInTheDocument();
      expect(livePreviewCheckbox).toBeChecked();
    });

    const livePreviewCheckbox = screen.getByLabelText('Live Preview');
    // Unchecking it updates state
    fireEvent.click(livePreviewCheckbox);
    expect(livePreviewCheckbox).not.toBeChecked();
  });
});
