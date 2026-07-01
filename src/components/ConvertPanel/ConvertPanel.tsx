import React, { useState } from 'react';
import { RefreshCw, FileText } from 'lucide-react';
import type { ConvertOptions } from '../../utils/imageConverter';
import './ConvertPanel.css';

interface ConvertPanelProps {
  currentFormat: string;
  onConvert: (options: ConvertOptions) => void;
}

const FORMATS = [
  { id: 'image/jpeg', label: 'JPEG', lossy: true },
  { id: 'image/png', label: 'PNG', lossy: false },
  { id: 'image/webp', label: 'WebP', lossy: true },
  { id: 'image/avif', label: 'AVIF', lossy: true },
  { id: 'image/bmp', label: 'BMP', lossy: false },
];

const ConvertPanel: React.FC<ConvertPanelProps> = ({ currentFormat, onConvert }) => {
  const defaultTarget = currentFormat === 'image/jpeg' ? 'image/png' : 'image/jpeg';
  const [targetFormat, setTargetFormat] = useState<ConvertOptions['targetFormat']>(defaultTarget as any);
  const [quality, setQuality] = useState(90);
  const [stripMetadata, setStripMetadata] = useState(false);

  const selectedFormatDef = FORMATS.find(f => f.id === targetFormat);
  const isLossy = selectedFormatDef?.lossy;

  const handleConvert = () => {
    onConvert({
      targetFormat,
      ...(isLossy ? { quality: quality / 100 } : {}),
      stripMetadata
    });
  };

  return (
    <div className="panel convert-panel">
      <div className="panel__header">
        <RefreshCw size={18} />
        <span className="panel__title">Convert Format</span>
      </div>

      <div className="current-format-badge">
        <span className="label">Current Format:</span>
        <span className="value badge badge-neutral">{currentFormat.split('/')[1]?.toUpperCase()}</span>
      </div>

      <div className="panel__section">
        <label className="panel__label">Convert To</label>
        <div className="format-grid">
          {FORMATS.map((fmt) => (
            <button
              key={fmt.id}
              className={`format-btn ${targetFormat === fmt.id ? 'active' : ''}`}
              onClick={() => setTargetFormat(fmt.id as any)}
            >
              {fmt.label}
            </button>
          ))}
        </div>
      </div>

      {isLossy && (
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
          />
        </div>
      )}

      <div className="panel__section">
        <label className="checkbox-wrapper">
          <input
            type="checkbox"
            checked={stripMetadata}
            onChange={(e) => setStripMetadata(e.target.checked)}
          />
          Strip EXIF Metadata
        </label>
      </div>

      <button className="btn btn-primary panel__action-btn" onClick={handleConvert}>
        <FileText size={16} /> Convert
      </button>
    </div>
  );
};

export default ConvertPanel;
