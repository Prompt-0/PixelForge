import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import OcrPanel, { type OcrResult } from '../OcrPanel/OcrPanel';

describe('OcrPanel Component', () => {
  const dummyResult: OcrResult = {
    text: 'Hello World\nThis is OCR text.',
    confidence: 85,
    blocks: [
      { text: 'Hello World', confidence: 90, bbox: { x0: 0, y0: 0, x1: 50, y1: 20 } },
      { text: 'This is OCR text.', confidence: 80, bbox: { x0: 0, y0: 30, x1: 100, y1: 50 } },
    ],
  };

  it('renders empty state when no image source is provided', () => {
    render(
      <OcrPanel
        imageSrc={null}
        isProcessing={false}
        result={null}
        onExtract={vi.fn()}
      />
    );

    expect(screen.getByText('Upload an image to extract text')).toBeInTheDocument();
  });

  it('renders control elements when image source is provided', () => {
    const onRegionSelect = vi.fn();
    render(
      <OcrPanel
        imageSrc="dummy.png"
        onRegionSelect={onRegionSelect}
        isProcessing={false}
        result={null}
        onExtract={vi.fn()}
      />
    );

    expect(screen.getByText('OCR Text Extraction')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Extract Text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Select Region/i })).toBeInTheDocument();
  });

  it('triggers onExtract with selected language', async () => {
    const user = userEvent.setup();
    const onExtract = vi.fn();

    render(
      <OcrPanel
        imageSrc="dummy.png"
        isProcessing={false}
        result={null}
        onExtract={onExtract}
      />
    );

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'spa'); // Select Spanish

    const extractBtn = screen.getByRole('button', { name: /Extract Text/i });
    fireEvent.click(extractBtn);

    expect(onExtract).toHaveBeenCalledWith('spa');
  });

  it('triggers onRegionSelect when Select Region is clicked', () => {
    const onRegionSelect = vi.fn();
    render(
      <OcrPanel
        imageSrc="dummy.png"
        onRegionSelect={onRegionSelect}
        isProcessing={false}
        result={null}
        onExtract={vi.fn()}
      />
    );

    const regionBtn = screen.getByRole('button', { name: /Select Region/i });
    fireEvent.click(regionBtn);

    expect(onRegionSelect).toHaveBeenCalledTimes(1);
  });

  it('renders processing state correctly', () => {
    render(
      <OcrPanel
        imageSrc="dummy.png"
        isProcessing={true}
        result={null}
        onExtract={vi.fn()}
      />
    );

    expect(screen.getByText('Extracting…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Extracting…/i })).toBeDisabled();
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('renders OCR results correctly', () => {
    render(
      <OcrPanel
        imageSrc="dummy.png"
        isProcessing={false}
        result={dummyResult}
        onExtract={vi.fn()}
      />
    );

    // Text area contains extracted text
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Hello World\nThis is OCR text.');

    // Confidence label (85% High)
    expect(screen.getByText('85% High')).toBeInTheDocument();

    // Text Blocks listing
    expect(screen.getByText('Text Blocks (2)')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('This is OCR text.')).toBeInTheDocument();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('handles copying to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <OcrPanel
        imageSrc="dummy.png"
        isProcessing={false}
        result={dummyResult}
        onExtract={vi.fn()}
      />
    );

    const copyBtn = screen.getByRole('button', { name: /Copy/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('Hello World\nThis is OCR text.');
    
    // Wait for "Copied!" state to render
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });
});
