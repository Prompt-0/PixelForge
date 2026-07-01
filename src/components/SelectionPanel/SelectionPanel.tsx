import React from 'react';
import { Wand2, User, Loader2 } from 'lucide-react';
import './SelectionPanel.css';

interface SelectionPanelProps {
  onRemoveBackgroundAI: () => void;
  magicWandTolerance: number;
  setMagicWandTolerance: (t: number) => void;
  magicWandModeActive: boolean;
  setMagicWandModeActive: (active: boolean) => void;
  isProcessing: boolean;
  aiProgress: number;
  aiStatus: string;
}

const SelectionPanel: React.FC<SelectionPanelProps> = ({
  onRemoveBackgroundAI,
  magicWandTolerance,
  setMagicWandTolerance,
  magicWandModeActive,
  setMagicWandModeActive,
  isProcessing,
  aiProgress,
  aiStatus
}) => {
  return (
    <div className="tool-panel">
      <div className="panel-header">
        <h3>Advanced Selection</h3>
        <p>Remove backgrounds using Magic Wand or Local AI.</p>
      </div>

      <div className="tool-group">
        <label>Local AI Background Removal</label>
        <p className="help-text">
          Uses an in-browser Machine Learning model. The first run will download a ~40MB model file.
        </p>
        <button 
          className="btn-primary" 
          onClick={onRemoveBackgroundAI}
          disabled={isProcessing}
        >
          {isProcessing && aiProgress > 0 && aiProgress < 100 ? (
            <><Loader2 size={16} className="spinner" /> Processing...</>
          ) : (
            <><User size={16} /> Auto Remove Background</>
          )}
        </button>
        {isProcessing && aiStatus && (
          <div className="ai-status">
            <p>{aiStatus}</p>
            {aiProgress > 0 && aiProgress < 100 && (
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${aiProgress}%` }}></div>
              </div>
            )}
          </div>
        )}
      </div>

      <hr className="divider" />

      <div className="tool-group">
        <label>Magic Wand Tool</label>
        <p className="help-text">Click on the image to flood-erase a specific color.</p>
        
        <button 
          className={`btn-secondary ${magicWandModeActive ? 'active' : ''}`}
          onClick={() => setMagicWandModeActive(!magicWandModeActive)}
          disabled={isProcessing}
        >
          <Wand2 size={16} /> {magicWandModeActive ? 'Click Image to Erase' : 'Activate Magic Wand'}
        </button>
      </div>

      <div className="tool-group">
        <label>Tolerance: {magicWandTolerance}</label>
        <input 
          type="range" 
          min="1" 
          max="100" 
          value={magicWandTolerance}
          onChange={(e) => setMagicWandTolerance(Number(e.target.value))}
          className="slider"
        />
      </div>
    </div>
  );
};

export default SelectionPanel;
