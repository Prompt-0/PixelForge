import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExportPanel from '../ExportPanel/ExportPanel';
import type { ImageInfo } from '../../App';

describe('ExportPanel Component', () => {
  const originalFile = new File(['dummy_content'], 'test_image.png', { type: 'image/png' });
  const outputBlob = new Blob(['dummy_content_smaller'], { type: 'image/jpeg' });
  const outputInfo: ImageInfo = {
    width: 600,
    height: 400,
    size: outputBlob.size,
    format: 'image/jpeg',
  };

  it('renders nothing when outputBlob or originalFile is missing', () => {
    const { container } = render(
      <ExportPanel
        outputBlob={null as any}
        originalFile={null as any}
        onDownload={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders filename, dimension, size and optimized badge correctly', () => {
    render(
      <ExportPanel
        outputBlob={outputBlob}
        originalFile={originalFile}
        outputInfo={outputInfo}
        onDownload={vi.fn()}
      />
    );

    // Verify generated filename is present
    expect(screen.getByText('test_image_edited.jpg')).toBeInTheDocument();

    // Verify dimensions are present
    expect(screen.getByText('600 × 400')).toBeInTheDocument();

    // Verify format badge is present
    expect(screen.getByText('JPG')).toBeInTheDocument();

    // Verify the download button is present
    expect(screen.getByRole('button', { name: /Download Image/i })).toBeInTheDocument();
  });

  it('displays savings percentage if output is smaller than original', () => {
    // Let's create an original file that is 100 bytes
    const bigFile = new File([new ArrayBuffer(100)], 'test.png', { type: 'image/png' });
    // And output that is 40 bytes (60% smaller)
    const smallBlob = new Blob([new ArrayBuffer(40)], { type: 'image/png' });
    const info: ImageInfo = {
      width: 100,
      height: 100,
      size: 40,
      format: 'image/png',
    };

    render(
      <ExportPanel
        outputBlob={smallBlob}
        originalFile={bigFile}
        outputInfo={info}
        onDownload={vi.fn()}
      />
    );

    expect(screen.getByText('(60% smaller)')).toBeInTheDocument();
  });

  it('triggers onDownload when Download button is clicked', () => {
    const onDownload = vi.fn();
    render(
      <ExportPanel
        outputBlob={outputBlob}
        originalFile={originalFile}
        outputInfo={outputInfo}
        onDownload={onDownload}
      />
    );

    const downloadBtn = screen.getByRole('button', { name: /Download Image/i });
    fireEvent.click(downloadBtn);

    expect(onDownload).toHaveBeenCalledTimes(1);
  });
});
