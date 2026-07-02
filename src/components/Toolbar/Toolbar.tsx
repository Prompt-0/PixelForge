import { 
  Crop, Minimize2, RefreshCw, Sliders, 
  FileText, ScanText, Layers, Image as ImageIcon, Trash2, Shield, PenTool, Wand2, Stamp, Palette
} from 'lucide-react';
import './Toolbar.css';

interface ToolbarProps {
  activeTab: string;
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

  return (
    <header className="toolbar glass-panel-solid">
      <div className="toolbar__brand">
        <div className="brand-logo">
          <ImageIcon size={20} className="text-accent" />
        </div>
        <span className="brand-name">PixelForge</span>
      </div>

      <nav className="toolbar__nav">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              disabled={!tabsEnabled}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="toolbar__actions">
        <div className="mode-toggle-group">
          <button 
            className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
            onClick={() => onModeChange('single')}
          >
            <ImageIcon size={14} /> Single Image
          </button>
          <button 
            className={`mode-btn ${mode === 'batch' ? 'active' : ''}`}
            onClick={() => onModeChange('batch')}
          >
            <Layers size={14} /> Batch Processing
          </button>
        </div>

        {hasImage && (
          <>
            <div className="toolbar__divider" />
            <button className="btn btn-ghost btn-sm close-btn" onClick={onClear} title="Clear Workspace" aria-label="Clear Workspace">
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Toolbar;
