import React from 'react';
import { Pen, Square, Circle, Eraser, RotateCcw, Trash2 } from 'lucide-react';
import { type AnnotationTool } from '../../utils/annotationEngine';
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
          >
            <Pen size={18} />
          </button>
          <button 
            className={`icon-btn ${currentTool === 'rect' ? 'active' : ''}`}
            onClick={() => setCurrentTool('rect')}
            title="Rectangle"
          >
            <Square size={18} />
          </button>
          <button 
            className={`icon-btn ${currentTool === 'ellipse' ? 'active' : ''}`}
            onClick={() => setCurrentTool('ellipse')}
            title="Ellipse"
          >
            <Circle size={18} />
          </button>
          <button 
            className={`icon-btn ${currentTool === 'blur' ? 'active' : ''}`}
            onClick={() => setCurrentTool('blur')}
            title="Redaction Blur"
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
            />
            <span className="color-hex">{color.toUpperCase()}</span>
          </div>
        </div>
      )}

      <div className="tool-group">
        <label>Brush Size: {brushSize}px</label>
        <input 
          type="range" 
          min="1" 
          max="50" 
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="slider"
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

      <button 
        className="btn-primary apply-btn"
        onClick={onApply}
        disabled={!hasActions || isProcessing}
      >
        {isProcessing ? 'Applying...' : 'Apply Drawing'}
      </button>
    </div>
  );
};

export default DrawPanel;
