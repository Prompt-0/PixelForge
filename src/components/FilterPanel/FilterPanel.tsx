import React, { useEffect, useRef } from 'react';
import { Palette, BarChart2 } from 'lucide-react';
import type { HistogramData, FilterType } from '../../utils/filterEngine';
import './FilterPanel.css';

interface FilterPanelProps {
  histogramData: HistogramData | null;
  activeFilter: FilterType;
  onApplyFilter: (filter: FilterType) => void;
  isProcessing: boolean;
}

const filters: { id: FilterType; label: string }[] = [
  { id: 'none', label: 'Original' },
  { id: 'grayscale', label: 'Grayscale' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'invert', label: 'Invert' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
  { id: 'dramatic', label: 'Dramatic' },
];

const FilterPanel: React.FC<FilterPanelProps> = ({
  histogramData,
  activeFilter,
  onApplyFilter,
  isProcessing
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw histogram
  useEffect(() => {
    if (!histogramData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const drawChannel = (data: number[], color: string) => {
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * canvas.width;
        const y = canvas.height - (data[i] * canvas.height);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.fillStyle = color;
      ctx.fill();
    };

    ctx.globalCompositeOperation = 'screen';
    drawChannel(histogramData.r, 'rgba(255, 0, 0, 0.5)');
    drawChannel(histogramData.g, 'rgba(0, 255, 0, 0.5)');
    drawChannel(histogramData.b, 'rgba(0, 0, 255, 0.5)');
    
    ctx.globalCompositeOperation = 'source-over';
    // Draw luma line
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * canvas.width;
      const y = canvas.height - (histogramData.luma[i] * canvas.height);
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();

  }, [histogramData]);

  return (
    <div className="tool-panel">
      <div className="panel-header">
        <h3>Color & Filters</h3>
        <p>Analyze color distribution and apply artistic filters.</p>
      </div>

      <div className="tool-group">
        <label><BarChart2 size={16} style={{ display: 'inline', marginRight: 6 }} /> Histogram (RGB & Luma)</label>
        <div className="histogram-container">
          {histogramData ? (
            <canvas ref={canvasRef} width={280} height={120} className="histogram-canvas" />
          ) : (
            <div className="empty-state">
              <BarChart2 size={32} className="text-muted" />
              <p>Awaiting image data...</p>
            </div>
          )}
        </div>
      </div>

      <div className="tool-group">
        <label><Palette size={16} style={{ display: 'inline', marginRight: 6 }} /> Presets</label>
        <div className="filters-grid">
          {filters.map(filter => (
            <button
              key={filter.id}
              className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
              onClick={() => onApplyFilter(filter.id)}
              disabled={isProcessing}
              aria-pressed={activeFilter === filter.id}
              aria-label={`Apply ${filter.label} filter`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
