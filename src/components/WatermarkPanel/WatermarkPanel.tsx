import React from 'react';
import { Type, Image as ImageIcon, LayoutTemplate } from 'lucide-react';
import type { WatermarkOptions, WatermarkPosition } from '../../utils/watermarkEngine';
import './WatermarkPanel.css';

interface WatermarkPanelProps {
  options: WatermarkOptions;
  onChange: (options: WatermarkOptions) => void;
  onApply: () => void;
  isProcessing: boolean;
}

const WatermarkPanel: React.FC<WatermarkPanelProps> = ({
  options,
  onChange,
  onApply,
  isProcessing
}) => {
  const handleTypeChange = (type: 'text' | 'image') => {
    onChange({ ...options, type });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange({ ...options, imageFile: file, type: 'image' });
    }
  };

  return (
    <div className="tool-panel">
      <div className="panel-header">
        <h3>Watermarking</h3>
        <p>Add text or image watermarks to protect your work.</p>
      </div>

      <div className="tool-group">
        <label>Watermark Type</label>
        <div className="segmented-control">
          <button
            className={`seg-btn ${options.type === 'text' ? 'active' : ''}`}
            onClick={() => handleTypeChange('text')}
          >
            <Type size={16} /> Text
          </button>
          <button
            className={`seg-btn ${options.type === 'image' ? 'active' : ''}`}
            onClick={() => handleTypeChange('image')}
          >
            <ImageIcon size={16} /> Image
          </button>
        </div>
      </div>

      {options.type === 'text' ? (
        <>
          <div className="tool-group">
            <label>Text Content</label>
            <input
              type="text"
              value={options.text || ''}
              onChange={(e) => onChange({ ...options, text: e.target.value })}
              placeholder="e.g. © 2026 MyBrand"
              className="text-input"
            />
          </div>
          <div className="tool-group">
            <label>Color</label>
            <div className="color-picker-wrap">
              <input
                type="color"
                value={options.color || '#ffffff'}
                onChange={(e) => onChange({ ...options, color: e.target.value })}
                className="color-input"
              />
              <span className="color-hex">{(options.color || '#ffffff').toUpperCase()}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="tool-group">
          <label>Image Logo</label>
          <div className="upload-btn-wrapper">
            <button className="btn-secondary">
              {options.imageFile ? options.imageFile.name : 'Upload Logo (.png, .svg)'}
            </button>
            <input 
              type="file" 
              accept="image/png, image/svg+xml, image/jpeg" 
              onChange={handleImageUpload} 
            />
          </div>
        </div>
      )}

      <div className="tool-group">
        <label><LayoutTemplate size={14} style={{ display: 'inline', marginRight: 4 }} /> Position</label>
        <select 
          value={options.position}
          onChange={(e) => onChange({ ...options, position: e.target.value as WatermarkPosition })}
          className="select-input"
        >
          <option value="center">Center</option>
          <option value="top-left">Top Left</option>
          <option value="top-right">Top Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-right">Bottom Right</option>
          <option value="tiled">Tiled (Repeated)</option>
        </select>
      </div>

      <div className="tool-group">
        <label>Opacity: {Math.round(options.opacity * 100)}%</label>
        <input 
          type="range" 
          min="0.1" 
          max="1.0" 
          step="0.05"
          value={options.opacity}
          onChange={(e) => onChange({ ...options, opacity: parseFloat(e.target.value) })}
          className="slider"
        />
      </div>

      <div className="tool-group">
        <label>Scale: {options.scale.toFixed(1)}x</label>
        <input 
          type="range" 
          min="0.1" 
          max="3.0" 
          step="0.1"
          value={options.scale}
          onChange={(e) => onChange({ ...options, scale: parseFloat(e.target.value) })}
          className="slider"
        />
      </div>

      <div className="tool-group">
        <label>Rotation: {options.rotation}°</label>
        <input 
          type="range" 
          min="-180" 
          max="180" 
          step="5"
          value={options.rotation}
          onChange={(e) => onChange({ ...options, rotation: parseInt(e.target.value, 10) })}
          className="slider"
        />
      </div>

      <button 
        className="btn-primary apply-btn"
        onClick={onApply}
        disabled={isProcessing || (options.type === 'text' && !options.text) || (options.type === 'image' && !options.imageFile)}
      >
        {isProcessing ? 'Applying...' : 'Apply Watermark'}
      </button>
    </div>
  );
};

export default WatermarkPanel;
