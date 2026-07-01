import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CompressPanel from '../CompressPanel/CompressPanel';

describe('CompressPanel Component', () => {
  it('renders initial state correctly', () => {
    render(
      <CompressPanel
        originalSize={102400} // 100 KB
        onCompress={vi.fn()}
      />
    );

    expect(screen.getByText('Compress Image')).toBeInTheDocument();
    expect(screen.getByText('WEBP')).toHaveClass('active');
    expect(screen.getByText('Quality Slider')).toHaveClass('active');
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByLabelText('Strip EXIF Metadata (Saves space)')).toBeChecked();
    expect(screen.getByText('100 KB')).toBeInTheDocument(); // Original size formatted
  });

  it('toggles output formats and handles PNG disable conditions', () => {
    render(
      <CompressPanel
        originalSize={102400}
        onCompress={vi.fn()}
      />
    );

    const pngBtn = screen.getByText('PNG');
    fireEvent.click(pngBtn);

    expect(pngBtn).toHaveClass('active');
    // PNG is lossless so quality slider should be disabled
    expect(screen.getByRole('slider')).toBeDisabled();
    expect(screen.getByText('PNG is lossless (quality setting ignored)')).toBeInTheDocument();
  });

  it('switches to Target Size mode and updates inputs', () => {
    const { container } = render(
      <CompressPanel
        originalSize={102400}
        onCompress={vi.fn()}
      />
    );

    const targetModeBtn = screen.getByText('Target Size');
    fireEvent.click(targetModeBtn);

    expect(targetModeBtn).toHaveClass('active');
    
    // In target mode, the target size input is rendered
    const targetInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    expect(targetInput).toBeInTheDocument();
    
    fireEvent.change(targetInput, { target: { value: '30' } });
    expect(targetInput.value).toBe('30');
  });

  it('handles input fields for Max Width, Height, and EXIF strip', () => {
    render(
      <CompressPanel
        originalSize={102400}
        onCompress={vi.fn()}
      />
    );

    const widthInput = screen.getByPlaceholderText('e.g. 1920') as HTMLInputElement;
    const heightInput = screen.getByPlaceholderText('e.g. 1080') as HTMLInputElement;
    const stripCheckbox = screen.getByLabelText('Strip EXIF Metadata (Saves space)') as HTMLInputElement;

    fireEvent.change(widthInput, { target: { value: '800' } });
    fireEvent.change(heightInput, { target: { value: '600' } });
    fireEvent.click(stripCheckbox);

    expect(widthInput.value).toBe('800');
    expect(heightInput.value).toBe('600');
    expect(stripCheckbox).not.toBeChecked();
  });

  it('triggers onCompress with correct options when Compress button is clicked', () => {
    const onCompress = vi.fn();
    render(
      <CompressPanel
        originalSize={102400}
        onCompress={onCompress}
      />
    );

    // Set some custom options
    const widthInput = screen.getByPlaceholderText('e.g. 1920');
    fireEvent.change(widthInput, { target: { value: '1200' } });

    const compressBtn = screen.getByRole('button', { name: /Compress/i });
    fireEvent.click(compressBtn);

    expect(onCompress).toHaveBeenCalledWith({
      format: 'image/webp',
      stripMetadata: true,
      maxWidth: 1200,
      maxHeight: undefined,
      quality: 0.8,
    });
  });
});
