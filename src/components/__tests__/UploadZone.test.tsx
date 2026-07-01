import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import UploadZone from '../UploadZone/UploadZone';

describe('UploadZone Component', () => {
  it('renders correctly with supported formats', () => {
    const onFileSelect = vi.fn();
    render(<UploadZone onFileSelect={onFileSelect} />);

    expect(screen.getByText(/^Drag & drop your images here$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Browse Files$/i })).toBeInTheDocument();
    
    // Check for some supported format badges
    expect(screen.getByText('JPEG')).toBeInTheDocument();
    expect(screen.getByText('PNG')).toBeInTheDocument();
    expect(screen.getByText('WebP')).toBeInTheDocument();
  });

  it('triggers file selection when Browse Files is clicked', async () => {
    const user = userEvent.setup();
    const onFileSelect = vi.fn();
    const { container } = render(<UploadZone onFileSelect={onFileSelect} />);

    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    // We can simulate change directly or upload via userEvent
    await user.upload(input, file);

    expect(onFileSelect).toHaveBeenCalledTimes(1);
    expect(onFileSelect).toHaveBeenCalledWith([file]);
  });

  it('triggers file selection on drag and drop', () => {
    const onFileSelect = vi.fn();
    const { container } = render(<UploadZone onFileSelect={onFileSelect} />);

    const file = new File(['hello'], 'hello.jpg', { type: 'image/jpeg' });
    const zone = container.querySelector('.upload-zone') as HTMLElement;

    // Drag enter
    fireEvent.dragEnter(zone);
    expect(screen.getByText(/^Drop your images here$/i)).toBeInTheDocument();

    // Drag leave
    fireEvent.dragLeave(zone);
    expect(screen.queryByText(/^Drop your images here$/i)).not.toBeInTheDocument();

    // Drop
    fireEvent.drop(zone, {
      dataTransfer: {
        files: [file],
      },
    });

    expect(onFileSelect).toHaveBeenCalledTimes(1);
    expect(onFileSelect).toHaveBeenCalledWith([file]);
  });

  it('ignores invalid file types during selection', async () => {
    const user = userEvent.setup();
    const onFileSelect = vi.fn();
    const { container } = render(<UploadZone onFileSelect={onFileSelect} />);

    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('triggers click when Enter or Space is pressed on the container', () => {
    const onFileSelect = vi.fn();
    const { container } = render(<UploadZone onFileSelect={onFileSelect} />);

    const zone = container.querySelector('.upload-zone') as HTMLElement;
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    const clickSpy = vi.spyOn(input, 'click');

    fireEvent.keyDown(zone, { key: 'Enter' });
    expect(clickSpy).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(zone, { key: ' ' });
    expect(clickSpy).toHaveBeenCalledTimes(2);

    clickSpy.mockRestore();
  });
});
