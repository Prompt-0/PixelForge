import React from 'react';
import { Pen, Square, Circle, Eraser, RotateCcw, Trash2 } from 'lucide-react';
import { type AnnotationTool } from '../../utils/annotationEngine';
import Slider from '../Slider/Slider';
import './DrawPanel.css';

interface DrawPanelProps {
  currentTool: AnnotationTool;
  setCurrentTool: (tool: AnnotationTool) => void;
  color: string;
  setColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onApply: () => void;
  hasActions: boolean;
  isProcessing: boolean;
}

const DrawPanel: React.FC<DrawPanelProps> = ({
  currentTool,
  setCurrentTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  onUndo,
  onClear,
  onApply,
  hasActions,
  isProcessing
}) => {
  return (
    <div className="tool-panel">
      <div className="panel-header">
        <h3>Annotation & Drawing</h3>
        <p>Draw freehand, add shapes, or use blur to redact sensitive areas.</p>
      </div>

      <div className="tool-group">
        <label>Drawing Tool</label>
        <div className="draw-tools">
          <button 
            className={`icon-btn ${currentTool === 'freehand' ? 'active' : ''}`}
            onClick={() => setCurrentTool('freehand')}
            title="Freehand Pen"
            aria-label="Freehand Pen"
            aria-pressed={currentTool === 'freehand'}
          >
            <Pen size={18} />
          </button>
          <button 
            className={`icon-btn ${currentTool === 'rectangle' ? 'active' : ''}`}
            onClick={() => setCurrentTool('rectangle')}
            title="Rectangle"
            aria-label="Rectangle"
            aria-pressed={currentTool === 'rectangle'}
          >
            <Square size={18} />
          </button>
          <button 
            className={`icon-btn ${currentTool === 'ellipse' ? 'active' : ''}`}
            onClick={() => setCurrentTool('ellipse')}
            title="Ellipse"
            aria-label="Ellipse"
            aria-pressed={currentTool === 'ellipse'}
          >
            <Circle size={18} />
          </button>
          <button 
            className={`icon-btn ${currentTool === 'blur' ? 'active' : ''}`}
            onClick={() => setCurrentTool('blur')}
            title="Redaction Blur"
            aria-label="Redaction Blur"
            aria-pressed={currentTool === 'blur'}
          >
            <Eraser size={18} />
          </button>
        </div>
      </div>

      {currentTool !== 'blur' && (
        <div className="tool-group">
          <label>Color</label>
          <div className="color-picker-wrap">
            <input 
              type="color" 
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="color-input"
              aria-label="Brush Color"
            />
            <span className="color-hex">{color.toUpperCase()}</span>
          </div>
        </div>
      )}

      <div className="tool-group">
        <label>Brush Size: {brushSize}px</label>
        <Slider 
          min={1} 
          max={50} 
          value={brushSize}
          onChange={(val) => setBrushSize(val)}
          ariaLabel="Brush Size"
        />
      </div>

      <div className="draw-actions-row">
        <button 
          className="btn-secondary" 
          onClick={onUndo}
          disabled={!hasActions || isProcessing}
        >
          <RotateCcw size={16} /> Undo
        </button>
        <button 
          className="btn-danger" 
          onClick={onClear}
          disabled={!hasActions || isProcessing}
        >
          <Trash2 size={16} /> Clear
        </button>
      </div>

      <div className="tool-group" style={{ marginTop: 'var(--space-4)' }}>
        <button 
          className="btn btn-primary"
          onClick={onApply}
          disabled={!hasActions || isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Apply Drawing'}
        </button>
      </div>
    </div>
  );
};

export default DrawPanel;
