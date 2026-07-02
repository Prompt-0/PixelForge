import React, { useState, useEffect } from 'react';
import { Link, Unlink, RotateCw, FlipHorizontal, FlipVertical, Maximize } from 'lucide-react';
import './ResizePanel.css';

export interface ResizeOptions {
  width: number;
  height: number;
  resizeMode: 'contain' | 'cover' | 'stretch' | 'exact';
}

interface ResizePanelProps {
  originalWidth: number;
  originalHeight: number;
  onResize: (options: ResizeOptions) => void;
  onRotate: (degrees: number) => void;
  onFlip: (direction: 'horizontal' | 'vertical') => void;
}

const PRESETS = [
  { label: '4K (3840×2160)', w: 3840, h: 2160 },
  { label: 'Full HD (1920×1080)', w: 1920, h: 1080 },
  { label: 'HD (1280×720)', w: 1280, h: 720 },
  { label: 'SVGA (800×600)', w: 800, h: 600 },
  { label: 'Instagram Square (1080×1080)', w: 1080, h: 1080 },
  { label: 'Instagram Portrait (1080×1350)', w: 1080, h: 1350 },
  { label: 'Facebook Post (1200×628)', w: 1200, h: 628 },
  { label: 'Twitter Header (1500×500)', w: 1500, h: 500 },
  { label: 'Custom', w: 0, h: 0 },
];

const ROTATION_PRESETS = [0, 90, 180, 270];

const RESIZE_MODES: Array<{ value: 'contain' | 'cover' | 'stretch'; label: string }> = [
  { value: 'contain', label: 'Contain' },
  { value: 'cover', label: 'Cover' },
  { value: 'stretch', label: 'Stretch' },
];

const ResizePanel: React.FC<ResizePanelProps> = ({
  originalWidth,
  originalHeight,
  onResize,
  onRotate,
  onFlip,
}) => {
  const [width, setWidth] = useState<number>(originalWidth);
  const [height, setHeight] = useState<number>(originalHeight);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [resizeMode, setResizeMode] = useState<'contain' | 'cover' | 'stretch' | 'exact'>('contain');
  const [rotation, setRotation] = useState<number>(0);

  const aspectRatio = originalWidth / originalHeight;

  useEffect(() => {
    setWidth(originalWidth);
    setHeight(originalHeight);
  }, [originalWidth, originalHeight]);

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (lockAspect && newWidth > 0) {
      setHeight(Math.round(newWidth / aspectRatio));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (lockAspect && newHeight > 0) {
      setWidth(Math.round(newHeight * aspectRatio));
    }
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = PRESETS[parseInt(e.target.value, 10)];
    if (preset && preset.w > 0 && preset.h > 0) {
      setWidth(preset.w);
      setHeight(preset.h);
    }
  };

  const handleRotationChange = (degrees: number) => {
    const clamped = Math.max(0, Math.min(360, degrees));
    setRotation(clamped);
    onRotate(clamped);
  };

  const handleApplyResize = () => {
    onResize({ width, height, resizeMode });
  };

  return (
    <div className="resize-panel">
      {/* Dimensions Section */}
      <div className="resize-panel__section">
        <div className="resize-panel__section-label">
          <Maximize size={14} />
          Dimensions
        </div>
        <div className="resize-panel__dimensions">
          <div className="resize-panel__input-group">
            <label className="resize-panel__label">Width</label>
            <input
              type="number"
              className="resize-panel__input"
              value={width}
              min={1}
              aria-label="Width in pixels"
              onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <button
            className={`resize-panel__lock-btn ${lockAspect ? 'resize-panel__lock-btn--active' : ''}`}
            onClick={() => setLockAspect(!lockAspect)}
            title={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
            aria-label={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
            aria-pressed={lockAspect}
          >
            {lockAspect ? <Link size={16} /> : <Unlink size={16} />}
          </button>
          <div className="resize-panel__input-group">
            <label className="resize-panel__label">Height</label>
            <input
              type="number"
              className="resize-panel__input"
              value={height}
              min={1}
              aria-label="Height in pixels"
              onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Preset Dimensions Section */}
      <div className="resize-panel__section">
        <div className="resize-panel__section-label">Presets</div>
        <select
          className="resize-panel__select"
          onChange={handlePresetChange}
          defaultValue=""
          aria-label="Resize Presets"
        >
          <option value="" disabled>
            Choose a preset…
          </option>
          {PRESETS.map((preset, index) => (
            <option key={preset.label} value={index}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      {/* Resize Mode Section */}
      <div className="resize-panel__section">
        <div className="resize-panel__section-label">Resize Mode</div>
        <div className="resize-panel__mode-group">
          {RESIZE_MODES.map((m) => (
            <button
              key={m.value}
              className={`resize-panel__mode-btn ${resizeMode === m.value ? 'resize-panel__mode-btn--active' : ''}`}
              onClick={() => setResizeMode(m.value)}
              aria-pressed={resizeMode === m.value}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rotation Section */}
      <div className="resize-panel__section">
        <div className="resize-panel__section-label">
          <RotateCw size={14} />
          Rotation
        </div>
        <div className="resize-panel__rotation">
          <input
            type="number"
            className="resize-panel__input resize-panel__input--rotation"
            value={rotation}
            min={0}
            max={360}
            aria-label="Rotation in degrees"
            onChange={(e) => handleRotationChange(parseInt(e.target.value, 10) || 0)}
          />
          <div className="resize-panel__rotation-presets">
            {ROTATION_PRESETS.map((deg) => (
              <button
                key={deg}
                className={`resize-panel__rotation-preset ${rotation === deg ? 'resize-panel__rotation-preset--active' : ''}`}
                onClick={() => handleRotationChange(deg)}
                aria-label={`Rotate ${deg} degrees`}
                aria-pressed={rotation === deg}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Flip Section */}
      <div className="resize-panel__section">
        <div className="resize-panel__section-label">Flip</div>
        <div className="resize-panel__flip-group">
          <button
            className="resize-panel__flip-btn"
            onClick={() => onFlip('horizontal')}
            title="Flip Horizontal"
          >
            <FlipHorizontal size={18} />
            <span>Horizontal</span>
          </button>
          <button
            className="resize-panel__flip-btn"
            onClick={() => onFlip('vertical')}
            title="Flip Vertical"
          >
            <FlipVertical size={18} />
            <span>Vertical</span>
          </button>
        </div>
      </div>

      {/* Apply Button */}
      <button className="resize-panel__apply-btn" onClick={handleApplyResize}>
        Apply Resize
      </button>
    </div>
  );
};

export default ResizePanel;
