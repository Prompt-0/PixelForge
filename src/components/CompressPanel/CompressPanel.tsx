import React, { useState, useEffect } from 'react';
import { Minimize2, FileDown, Scissors } from 'lucide-react';
import type { CompressOptions } from '../../utils/imageCompressor';
import { formatFileSize } from '../../utils/helpers';
import './CompressPanel.css';

interface CompressPanelProps {
  originalSize: number;
  onCompress: (options: CompressOptions) => void;
  estimatedSize?: number;
  livePreviewEnabled?: boolean;
  onChange?: (options: CompressOptions) => void;
}

const CompressPanel: React.FC<CompressPanelProps> = ({
  originalSize,
  onCompress,
  estimatedSize,
  livePreviewEnabled = true,
  onChange
}) => {
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp' | 'image/png'>('image/webp');
  const [mode, setMode] = useState<'quality' | 'target'>('quality');
  const [quality, setQuality] = useState(80);
  const [targetSizeKB, setTargetSizeKB] = useState(Math.round(originalSize / 1024 / 2));
  const [stripMetadata, setStripMetadata] = useState(true);
  const [maxWidth, setMaxWidth] = useState<string>('');
  const [maxHeight, setMaxHeight] = useState<string>('');

  useEffect(() => {
    if (livePreviewEnabled && onChange) {
      onChange({
        format,
        stripMetadata,
        maxWidth: maxWidth ? parseInt(maxWidth, 10) : undefined,
        maxHeight: maxHeight ? parseInt(maxHeight, 10) : undefined,
        ...(mode === 'quality' ? { quality: quality / 100 } : { targetSizeKB })
      });
    }
  }, [format, mode, quality, targetSizeKB, stripMetadata, maxWidth, maxHeight, livePreviewEnabled, onChange]);

  const handleApply = () => {
    onCompress({
      format,
      stripMetadata,
      maxWidth: maxWidth ? parseInt(maxWidth, 10) : undefined,
      maxHeight: maxHeight ? parseInt(maxHeight, 10) : undefined,
      ...(mode === 'quality' ? { quality: quality / 100 } : { targetSizeKB })
    });
  };

  return (
    <div className="panel compress-panel">
      <div className="panel__header">
        <Minimize2 size={18} />
        <span className="panel__title">Compress Image</span>
      </div>

      <div className="panel__section">
        <label className="panel__label">Output Format</label>
        <div className="format-grid">
          {['image/jpeg', 'image/webp', 'image/png'].map((fmt) => (
            <button
              key={fmt}
              className={`format-btn ${format === fmt ? 'active' : ''}`}
              onClick={() => setFormat(fmt as any)}
            >
              {fmt.split('/')[1].toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="panel__section">
        <div className="mode-toggle">
          <button className={`mode-btn ${mode === 'quality' ? 'active' : ''}`} onClick={() => setMode('quality')}>Quality Slider</button>
          <button className={`mode-btn ${mode === 'target' ? 'active' : ''}`} onClick={() => setMode('target')}>Target Size</button>
        </div>
      </div>

      {mode === 'quality' ? (
        <div className="panel__section">
          <div className="slider-header">
            <label className="panel__label">Quality</label>
            <span className="slider-value">{quality}%</span>
          </div>
          <input
            type="range"
            className="range-slider"
            min="1"
            max="100"
            value={quality}
            onChange={(e) => setQuality(parseInt(e.target.value))}
            disabled={format === 'image/png'}
          />
          {format === 'image/png' && <span className="helper-text">PNG is lossless (quality setting ignored)</span>}
        </div>
      ) : (
        <div className="panel__section">
          <label className="panel__label">Target Size (KB)</label>
          <input
            type="number"
            className="input"
            min="1"
            max={Math.round(originalSize / 1024)}
            value={targetSizeKB}
            onChange={(e) => setTargetSizeKB(parseInt(e.target.value) || 1)}
            disabled={format === 'image/png'}
          />
          {format === 'image/png' && <span className="helper-text">PNG cannot hit a target size automatically</span>}
        </div>
      )}

      <div className="panel__section">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="panel__label">Max Width (px)</label>
            <input
              type="number"
              className="input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="e.g. 1920"
              value={maxWidth}
              onChange={(e) => setMaxWidth(e.target.value)}
            />
          </div>
          <div>
            <label className="panel__label">Max Height (px)</label>
            <input
              type="number"
              className="input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="e.g. 1080"
              value={maxHeight}
              onChange={(e) => setMaxHeight(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="panel__section">
        <label className="checkbox-wrapper">
          <input
            type="checkbox"
            checked={stripMetadata}
            onChange={(e) => setStripMetadata(e.target.checked)}
          />
          Strip EXIF Metadata (Saves space)
        </label>
      </div>

      <div className="panel__section comparison-bar">
        <div className="comparison-stat">
          <span className="stat-label">Original</span>
          <span className="stat-value">{formatFileSize(originalSize)}</span>
        </div>
        <FileDown className="comparison-icon" />
        <div className="comparison-stat">
          <span className="stat-label">Estimated Output</span>
          <span className="stat-value highlight">{estimatedSize ? formatFileSize(estimatedSize) : '---'}</span>
        </div>
      </div>

      <button className="btn btn-primary panel__action-btn" onClick={handleApply}>
        <Scissors size={16} /> Compress
      </button>
    </div>
  );
};

export default CompressPanel;
