import { 
  Crop, Minimize2, RefreshCw, Sliders, 
  FileText, ScanText, Layers, Image as ImageIcon, Trash2, Shield, PenTool, Wand2, Stamp, Palette
} from 'lucide-react';
import './Toolbar.css';

interface ToolbarProps {
  activeTab: string | null;
  onTabChange: (tab: string) => void;
  mode: 'single' | 'batch';
  onModeChange: (mode: 'single' | 'batch') => void;
  hasImage: boolean;
  onClear: () => void;
}

const TABS = [
  { id: 'resize', label: 'Resize', icon: Crop },
  { id: 'compress', label: 'Compress', icon: Minimize2 },
  { id: 'convert', label: 'Convert', icon: RefreshCw },
  { id: 'adjust', label: 'Adjust', icon: Sliders },
  { id: 'select', label: 'Select', icon: Wand2 },
  { id: 'metadata', label: 'Metadata', icon: FileText },
  { id: 'ocr', label: 'OCR', icon: ScanText },
  { id: 'draw', label: 'Draw', icon: PenTool },
  { id: 'water', label: 'Watermark', icon: Stamp },
  { id: 'filter', label: 'Filter', icon: Palette },
  { id: 'cyber', label: 'Cyber', icon: Shield },
];

const Toolbar: React.FC<ToolbarProps> = ({ 
  activeTab, 
  onTabChange, 
  mode, 
  onModeChange, 
  hasImage, 
  onClear 
}) => {
  const tabsEnabled = mode === 'single' && hasImage;

  const renderGroup = (title: string, tabIds: string[]) => {
    return (
      <div className="toolbar-group">
        <span className="toolbar-group-title">{title}</span>
        <div className="toolbar-group-tabs">
          {TABS.filter(t => tabIds.includes(t.id)).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                className={`tab-btn ${tabsEnabled && activeTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
                disabled={!tabsEnabled}
                title={tab.label}
                aria-label={tab.label}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <header className="toolbar glass-panel-solid">
      <div className="toolbar__brand">
        <div className="brand-logo">
          <ImageIcon size={20} className="text-accent" />
        </div>
        <span className="brand-name">PixelForge</span>
      </div>

      {mode === 'single' ? (
        <nav className="toolbar__nav">
          {renderGroup('Transform', ['resize', 'compress', 'convert'])}
          {renderGroup('Enhance', ['adjust', 'filter', 'draw', 'select', 'water'])}
          {renderGroup('Advanced', ['ocr', 'metadata', 'cyber'])}
        </nav>
      ) : (
        <div className="batch-mode-indicator">
          <Layers className="text-accent" size={20} />
          <span>Batch Processing Mode</span>
        </div>
      )}

      <div className="toolbar__actions">
        <div className="mode-toggle-group">
          <button 
            className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
            onClick={() => onModeChange('single')}
            aria-label="Single Image Mode"
            aria-pressed={mode === 'single'}
          >
            <ImageIcon size={14} aria-hidden="true" /> Single Image
          </button>
          <button 
            className={`mode-btn ${mode === 'batch' ? 'active' : ''}`}
            onClick={() => onModeChange('batch')}
            aria-label="Batch Processing Mode"
            aria-pressed={mode === 'batch'}
          >
            <Layers size={14} aria-hidden="true" /> Batch Processing
          </button>
        </div>

        <div className="toolbar__divider" style={{ opacity: mode === 'single' ? 1 : 0, pointerEvents: 'none' }} />
        <button 
          className="btn btn-ghost btn-sm close-btn" 
          onClick={onClear} 
          disabled={!hasImage || mode !== 'single'}
          title="Clear Workspace" 
          aria-label="Clear Workspace"
          style={{ display: mode === 'single' && hasImage ? 'flex' : 'none' }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </header>
  );
};

export default Toolbar;
