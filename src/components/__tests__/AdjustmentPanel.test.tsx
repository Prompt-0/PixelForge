import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdjustmentPanel from '../AdjustmentPanel/AdjustmentPanel';
import { getDefaultAdjustments } from '../../utils/imageAdjustments';

vi.mock('../../utils/imageAdjustments', () => ({
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
}));

describe('AdjustmentPanel Component', () => {
  const defaultAdjustments = getDefaultAdjustments();

  it('renders all sections and sliders with default values', () => {
    const onChange = vi.fn();
    const onApply = vi.fn();

    render(
      <AdjustmentPanel
        adjustments={defaultAdjustments}
        onChange={onChange}
        onApply={onApply}
      />
    );

    // Verify sections exist
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByText('Effects')).toBeInTheDocument();

    // Verify sliders exist
    expect(screen.getByText('Brightness')).toBeInTheDocument();
    expect(screen.getByText('Contrast')).toBeInTheDocument();
    expect(screen.getByText('Saturation')).toBeInTheDocument();
    expect(screen.getByText('Exposure')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Hue')).toBeInTheDocument();

    // Verify button exists
    expect(screen.getByRole('button', { name: /Apply Adjustments/i })).toBeInTheDocument();

    // Reset button should not be visible when adjustments are at default
    expect(screen.queryByRole('button', { name: /Reset All/i })).not.toBeInTheDocument();
  });

  it('handles slider changes correctly', () => {
    const onChange = vi.fn();
    const onApply = vi.fn();

    render(
      <AdjustmentPanel
        adjustments={defaultAdjustments}
        onChange={onChange}
        onApply={onApply}
      />
    );

    // Find Brightness slider (input range)
    const brightnessSlider = screen.getAllByRole('slider').find(
      (slider) => slider.getAttribute('min') === '-100' && slider.getAttribute('max') === '100'
    );
    expect(brightnessSlider).toBeInTheDocument();

    // Change Brightness slider value to 25
    fireEvent.change(brightnessSlider!, { target: { value: '25' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      ...defaultAdjustments,
      brightness: 25,
    });
  });

  it('shows Reset All button when there is a change, and can reset it', () => {
    const onChange = vi.fn();
    const onApply = vi.fn();

    const modifiedAdjustments = {
      ...defaultAdjustments,
      brightness: 50,
    };

    render(
      <AdjustmentPanel
        adjustments={modifiedAdjustments}
        onChange={onChange}
        onApply={onApply}
      />
    );

    const resetAllBtn = screen.getByRole('button', { name: /Reset All/i });
    expect(resetAllBtn).toBeInTheDocument();

    fireEvent.click(resetAllBtn);
    expect(onChange).toHaveBeenCalledWith(defaultAdjustments);
  });

  it('triggers onApply when Apply button is clicked', () => {
    const onChange = vi.fn();
    const onApply = vi.fn();

    render(
      <AdjustmentPanel
        adjustments={defaultAdjustments}
        onChange={onChange}
        onApply={onApply}
      />
    );

    const applyBtn = screen.getByRole('button', { name: /Apply Adjustments/i });
    fireEvent.click(applyBtn);

    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('can toggle section collapse', () => {
    const onChange = vi.fn();
    const onApply = vi.fn();

    render(
      <AdjustmentPanel
        adjustments={defaultAdjustments}
        onChange={onChange}
        onApply={onApply}
      />
    );

    const lightHeader = screen.getByText('Light');
    // Click header to toggle
    fireEvent.click(lightHeader);
    
    // We can verify class or behavior, clicking it twice brings it back
    fireEvent.click(lightHeader);
  });
});
