import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ResizePanel from '../ResizePanel/ResizePanel';

describe('ResizePanel Component', () => {
  it('renders initial width and height correctly', () => {
    const { container } = render(
      <ResizePanel
        originalWidth={800}
        originalHeight={600}
        onResize={vi.fn()}
        onRotate={vi.fn()}
        onFlip={vi.fn()}
      />
    );

    const inputs = container.querySelectorAll('.resize-panel__input');
    const widthInput = inputs[0] as HTMLInputElement;
    const heightInput = inputs[1] as HTMLInputElement;

    expect(widthInput.value).toBe('800');
    expect(heightInput.value).toBe('600');
  });

  it('updates height proportionally when width is changed and aspect ratio is locked', () => {
    const { container } = render(
      <ResizePanel
        originalWidth={800}
        originalHeight={600}
        onResize={vi.fn()}
        onRotate={vi.fn()}
        onFlip={vi.fn()}
      />
    );

    const inputs = container.querySelectorAll('.resize-panel__input');
    const widthInput = inputs[0] as HTMLInputElement;
    const heightInput = inputs[1] as HTMLInputElement;

    // Change width to 400
    fireEvent.change(widthInput, { target: { value: '400' } });

    expect(widthInput.value).toBe('400');
    // Height should be Math.round(400 / (800/600)) = 300
    expect(heightInput.value).toBe('300');
  });

  it('allows independent width and height changes when aspect ratio is unlocked', () => {
    const { container } = render(
      <ResizePanel
        originalWidth={800}
        originalHeight={600}
        onResize={vi.fn()}
        onRotate={vi.fn()}
        onFlip={vi.fn()}
      />
    );

    // Unlock aspect ratio
    const lockBtn = screen.getByTitle('Unlock aspect ratio');
    fireEvent.click(lockBtn);

    const inputs = container.querySelectorAll('.resize-panel__input');
    const widthInput = inputs[0] as HTMLInputElement;
    const heightInput = inputs[1] as HTMLInputElement;

    fireEvent.change(widthInput, { target: { value: '500' } });
    fireEvent.change(heightInput, { target: { value: '500' } });

    expect(widthInput.value).toBe('500');
    expect(heightInput.value).toBe('500');
  });

  it('updates width and height when a preset is chosen', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ResizePanel
        originalWidth={800}
        originalHeight={600}
        onResize={vi.fn()}
        onRotate={vi.fn()}
        onFlip={vi.fn()}
      />
    );

    const select = screen.getByRole('combobox');
    // Preset index 2 is HD (1280×720)
    await user.selectOptions(select, '2'); // index 2 (1280x720)

    const inputs = container.querySelectorAll('.resize-panel__input');
    const widthInput = inputs[0] as HTMLInputElement;
    const heightInput = inputs[1] as HTMLInputElement;

    expect(widthInput.value).toBe('1280');
    expect(heightInput.value).toBe('720');
  });

  it('changes resize mode correctly', () => {
    render(
      <ResizePanel
        originalWidth={800}
        originalHeight={600}
        onResize={vi.fn()}
        onRotate={vi.fn()}
        onFlip={vi.fn()}
      />
    );

    const coverBtn = screen.getByText('Cover');
    fireEvent.click(coverBtn);

    expect(coverBtn).toHaveClass('resize-panel__mode-btn--active');
  });

  it('triggers onRotate when rotation is modified', () => {
    const onRotate = vi.fn();
    render(
      <ResizePanel
        originalWidth={800}
        originalHeight={600}
        onResize={vi.fn()}
        onRotate={onRotate}
        onFlip={vi.fn()}
      />
    );

    // Click 90° preset
    const preset90 = screen.getByRole('button', { name: '90°' });
    fireEvent.click(preset90);

    expect(onRotate).toHaveBeenCalledWith(90);
  });

  it('triggers onFlip when flip buttons are clicked', () => {
    const onFlip = vi.fn();
    render(
      <ResizePanel
        originalWidth={800}
        originalHeight={600}
        onResize={vi.fn()}
        onRotate={vi.fn()}
        onFlip={onFlip}
      />
    );

    const flipHorizontal = screen.getByTitle('Flip Horizontal');
    fireEvent.click(flipHorizontal);
    expect(onFlip).toHaveBeenCalledWith('horizontal');

    const flipVertical = screen.getByTitle('Flip Vertical');
    fireEvent.click(flipVertical);
    expect(onFlip).toHaveBeenCalledWith('vertical');
  });

  it('triggers onResize with correct values when Apply Resize is clicked', () => {
    const onResize = vi.fn();
    render(
      <ResizePanel
        originalWidth={800}
        originalHeight={600}
        onResize={onResize}
        onRotate={vi.fn()}
        onFlip={vi.fn()}
      />
    );

    const applyBtn = screen.getByRole('button', { name: /Apply Resize/i });
    fireEvent.click(applyBtn);

    expect(onResize).toHaveBeenCalledWith({
      width: 800,
      height: 600,
      resizeMode: 'contain',
    });
  });
});
