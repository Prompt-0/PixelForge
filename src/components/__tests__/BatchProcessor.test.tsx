import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BatchProcessor from '../BatchProcessor/BatchProcessor';
import { resizeImage } from '../../utils/imageResizer';
import { compressImage } from '../../utils/imageCompressor';
import { convertImage } from '../../utils/imageConverter';
import { stripMetadata } from '../../utils/metadataHandler';

vi.mock('../../utils/imageResizer', () => ({
  resizeImage: vi.fn(),
}));

vi.mock('../../utils/imageCompressor', () => ({
  compressImage: vi.fn(),
}));

vi.mock('../../utils/imageConverter', () => ({
  convertImage: vi.fn(),
}));

vi.mock('../../utils/metadataHandler', () => ({
  stripMetadata: vi.fn(),
}));

describe('BatchProcessor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined') {
      window.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
      window.URL.revokeObjectURL = vi.fn();
    }
  });

  const getFileInput = (container: HTMLElement) => {
    return container.querySelector('input[type="file"]') as HTMLInputElement;
  };

  it('renders UploadZone initially when file queue is empty', () => {
    const { container } = render(<BatchProcessor />);
    
    expect(screen.getByText(/Drag & drop your images here/i)).toBeInTheDocument();
    expect(getFileInput(container)).toBeInTheDocument();
    expect(screen.queryByText(/Batch Settings/i)).not.toBeInTheDocument();
  });

  it('populates queue and shows Settings workspace when files are selected', async () => {
    const user = userEvent.setup();
    const { container } = render(<BatchProcessor />);

    const file = new File(['hello'], 'pic1.png', { type: 'image/png' });
    const input = getFileInput(container);
    await user.upload(input, file);

    expect(screen.getByText('Batch Processing (1 files)')).toBeInTheDocument();
    expect(screen.getByText('pic1.png')).toBeInTheDocument();
    expect(screen.getByText('Batch Settings')).toBeInTheDocument();
  });

  it('supports selecting operation and renders correct settings options', async () => {
    const user = userEvent.setup();
    const { container } = render(<BatchProcessor />);

    // Upload a file to enter workspace mode
    const file = new File(['hello'], 'pic1.png', { type: 'image/png' });
    await user.upload(getFileInput(container), file);

    const operationSelect = container.querySelector('select') as HTMLSelectElement;
    
    // Switch to Resize
    await user.selectOptions(operationSelect, 'resize');
    expect(screen.getByText('Width (px)')).toBeInTheDocument();
    expect(screen.getByText('Height (px)')).toBeInTheDocument();
    expect(screen.getByText('Resize Mode')).toBeInTheDocument();
    expect(screen.getByLabelText('Maintain Aspect Ratio')).toBeInTheDocument();

    // Switch to Convert
    await user.selectOptions(operationSelect, 'convert');
    expect(screen.getByText('Target Format')).toBeInTheDocument();
    expect(screen.getByLabelText('Strip Metadata')).toBeInTheDocument();

    // Switch to Strip
    await user.selectOptions(operationSelect, 'strip');
    expect(screen.getByText('No configuration required. All metadata will be stripped from the images.')).toBeInTheDocument();
  });

  it('clears file list when Clear All is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<BatchProcessor />);

    const file = new File(['hello'], 'pic1.png', { type: 'image/png' });
    await user.upload(getFileInput(container), file);

    const clearAllBtn = screen.getByRole('button', { name: /Clear All/i });
    fireEvent.click(clearAllBtn);

    expect(screen.getByText(/Drag & drop your images here/i)).toBeInTheDocument();
  });

  it('runs compression batch processing successfully and downloads ZIP', async () => {
    const user = userEvent.setup();
    vi.mocked(compressImage).mockResolvedValue(new Blob(['compressed'], { type: 'image/webp' }));

    const { container } = render(<BatchProcessor />);

    const file = new File(['hello'], 'pic1.png', { type: 'image/png' });
    await user.upload(getFileInput(container), file);

    const processBtn = screen.getByRole('button', { name: /Process Queue/i });
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
      expect(screen.getByText(/100% Complete/i)).toBeInTheDocument();
    });

    expect(compressImage).toHaveBeenCalledTimes(1);

    // Verify "Download all as ZIP" button is shown
    const downloadZipBtn = screen.getByRole('button', { name: /Download all as ZIP/i });
    expect(downloadZipBtn).toBeInTheDocument();

    // Spy on click or just trigger click to verify no errors
    fireEvent.click(downloadZipBtn);
  });

  it('runs resize batch processing successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(resizeImage).mockResolvedValue(new Blob(['resized'], { type: 'image/png' }));

    const { container } = render(<BatchProcessor />);

    const file = new File(['hello'], 'pic1.png', { type: 'image/png' });
    await user.upload(getFileInput(container), file);

    // Switch to resize operation
    const operationSelect = container.querySelector('select') as HTMLSelectElement;
    await user.selectOptions(operationSelect, 'resize');

    const processBtn = screen.getByRole('button', { name: /Process Queue/i });
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
      expect(screen.getByText(/100% Complete/i)).toBeInTheDocument();
    });

    expect(resizeImage).toHaveBeenCalledTimes(1);
  });

  it('runs convert batch processing successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(convertImage).mockResolvedValue(new Blob(['converted'], { type: 'image/jpeg' }));

    const { container } = render(<BatchProcessor />);

    const file = new File(['hello'], 'pic1.png', { type: 'image/png' });
    await user.upload(getFileInput(container), file);

    // Switch to convert operation
    const operationSelect = container.querySelector('select') as HTMLSelectElement;
    await user.selectOptions(operationSelect, 'convert');

    const processBtn = screen.getByRole('button', { name: /Process Queue/i });
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
      expect(screen.getByText(/100% Complete/i)).toBeInTheDocument();
    });

    expect(convertImage).toHaveBeenCalledTimes(1);
  });

  it('runs strip metadata batch processing successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(stripMetadata).mockResolvedValue(new Blob(['stripped'], { type: 'image/png' }));

    const { container } = render(<BatchProcessor />);

    const file = new File(['hello'], 'pic1.png', { type: 'image/png' });
    await user.upload(getFileInput(container), file);

    // Switch to strip operation
    const operationSelect = container.querySelector('select') as HTMLSelectElement;
    await user.selectOptions(operationSelect, 'strip');

    const processBtn = screen.getByRole('button', { name: /Process Queue/i });
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
      expect(screen.getByText(/100% Complete/i)).toBeInTheDocument();
    });

    expect(stripMetadata).toHaveBeenCalledTimes(1);
  });

  it('handles errors during batch processing gracefully', async () => {
    const user = userEvent.setup();
    vi.mocked(compressImage).mockRejectedValue(new Error('Compression failed'));

    const { container } = render(<BatchProcessor />);

    const file = new File(['hello'], 'pic1.png', { type: 'image/png' });
    await user.upload(getFileInput(container), file);

    const processBtn = screen.getByRole('button', { name: /Process Queue/i });
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    expect(screen.getByText('Compression failed')).toBeInTheDocument();
  });
});
