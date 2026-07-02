import React from 'react';
import './Slider.css';

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const Slider: React.FC<SliderProps> = ({ min, max, step = 1, value, onChange, className = '', disabled = false, ariaLabel }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    if (val < min) val = min;
    if (val > max) val = max;
    onChange(val);
  };

  return (
    <div className={`unified-slider-container ${className}`}>
      <input
        type="range"
        data-testid="slider-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="range-slider"
        disabled={disabled}
        aria-label={ariaLabel}
      />
      <input
        type="number"
        data-testid="slider-number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleInputChange}
        className="input input-sm slider-number-input"
        disabled={disabled}
      />
    </div>
  );
};

export default Slider;
