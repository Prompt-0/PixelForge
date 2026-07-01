import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConvertPanel from '../ConvertPanel/ConvertPanel';

describe('ConvertPanel Component', () => {
  it('renders initial state correctly with current format', () => {
    const { container } = render(
      <ConvertPanel
        currentFormat="image/png"
        onConvert={vi.fn()}
      />
    );

    expect(screen.getByText('Convert Format')).toBeInTheDocument();
    expect(container.querySelector('.current-format-badge .value')).toHaveTextContent('PNG'); // Badge
    // When current is PNG, target should default to JPEG (lossy, shows quality)
    expect(screen.getByText('JPEG')).toHaveClass('active');
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByLabelText('Strip EXIF Metadata')).not.toBeChecked();
  });

  it('hides quality slider for lossless formats', () => {
    render(
      <ConvertPanel
        currentFormat="image/jpeg"
        onConvert={vi.fn()}
      />
    );

    // Target defaults to PNG (lossless) when current is JPEG
    expect(screen.getByRole('button', { name: 'PNG' })).toHaveClass('active');
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });

  it('toggles format and enables quality slider accordingly', () => {
    render(
      <ConvertPanel
        currentFormat="image/jpeg"
        onConvert={vi.fn()}
      />
    );

    expect(screen.queryByRole('slider')).not.toBeInTheDocument();

    const webpBtn = screen.getByText('WebP');
    fireEvent.click(webpBtn);

    expect(webpBtn).toHaveClass('active');
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('triggers onConvert with correct parameters', () => {
    const onConvert = vi.fn();
    render(
      <ConvertPanel
        currentFormat="image/png"
        onConvert={onConvert}
      />
    );

    // Change target format to BMP
    const bmpBtn = screen.getByText('BMP');
    fireEvent.click(bmpBtn);

    const stripCheckbox = screen.getByLabelText('Strip EXIF Metadata');
    fireEvent.click(stripCheckbox);

    const convertBtn = screen.getByRole('button', { name: /Convert/i });
    fireEvent.click(convertBtn);

    expect(onConvert).toHaveBeenCalledWith({
      targetFormat: 'image/bmp',
      stripMetadata: true,
    });
  });
});
