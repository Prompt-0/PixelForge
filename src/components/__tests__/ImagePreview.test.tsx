import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ImagePreview, { type ImageInfo } from '../ImagePreview/ImagePreview';

describe('ImagePreview Component', () => {
  const originalInfo: ImageInfo = {
    width: 800,
    height: 600,
    size: 204800, // 200 KB
    format: 'png',
  };

  const processedInfo: ImageInfo = {
    width: 400,
    height: 300,
    size: 51200, // 50 KB
    format: 'jpeg',
  };

  it('renders single image mode correctly', () => {
    render(
      <ImagePreview
        originalSrc="original.png"
        originalInfo={originalInfo}
      />
    );

    // Verify original image exists
    const img = screen.getByAltText('Original');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'original.png');

    // Verify original info badge details
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('800 × 600')).toBeInTheDocument();
    expect(screen.getByText('200.0 KB')).toBeInTheDocument();
    expect(screen.getByText('PNG')).toBeInTheDocument();

    // Verify processed details do NOT exist
    expect(screen.queryByText('Processed')).not.toBeInTheDocument();
  });

  it('renders comparison mode correctly', () => {
    render(
      <ImagePreview
        originalSrc="original.png"
        processedSrc="processed.jpg"
        originalInfo={originalInfo}
        processedInfo={processedInfo}
      />
    );

    // Verify both original and processed images exist
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'original.png');
    expect(images[1]).toHaveAttribute('src', 'processed.jpg');

    // Verify processed badge details
    expect(screen.getByText('Processed')).toBeInTheDocument();
    expect(screen.getByText('400 × 300')).toBeInTheDocument();
    expect(screen.getByText('50.0 KB')).toBeInTheDocument();
    expect(screen.getByText('JPEG')).toBeInTheDocument();

    // Verify slider is present (it has text "◀" and "▶")
    expect(screen.getByText('◀')).toBeInTheDocument();
  });

  it('handles zoom interaction correctly', () => {
    render(
      <ImagePreview
        originalSrc="original.png"
        originalInfo={originalInfo}
      />
    );

    // Initial zoom is 100%
    expect(screen.getByText('100%')).toBeInTheDocument();

    // Click zoom in
    const zoomInBtn = screen.getByTitle('Zoom in');
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('125%')).toBeInTheDocument();

    // Click zoom out
    const zoomOutBtn = screen.getByTitle('Zoom out');
    fireEvent.click(zoomOutBtn);
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('75%')).toBeInTheDocument();

    // Click Fit to view
    const fitBtn = screen.getByTitle('Fit to view');
    fireEvent.click(fitBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('handles slider drag interaction', () => {
    const { container } = render(
      <ImagePreview
        originalSrc="original.png"
        processedSrc="processed.jpg"
        originalInfo={originalInfo}
        processedInfo={processedInfo}
      />
    );

    const slider = container.querySelector('.image-preview__slider');
    expect(slider).toBeInTheDocument();

    const mainContainer = container.querySelector('.image-preview');
    if (mainContainer) {
      vi.spyOn(mainContainer, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        width: 1000,
        right: 1000,
        top: 0,
        bottom: 0,
        height: 600,
        x: 0,
        y: 0,
        toJSON: () => {},
      });
    }

    // Trigger mousedown on slider
    fireEvent.mouseDown(slider!);

    // Trigger mousemove on window
    const mouseMoveEvent = new MouseEvent('mousemove', { clientX: 250 });
    window.dispatchEvent(mouseMoveEvent);

    // Clean up
    const mouseUpEvent = new MouseEvent('mouseup');
    window.dispatchEvent(mouseUpEvent);
  });
});
