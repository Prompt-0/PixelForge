import React from 'react';
import { Download, FileImage, HardDrive } from 'lucide-react';
import type { ImageInfo } from '../../App';
import { formatFileSize, generateOutputFilename } from '../../utils/helpers';
import './ExportPanel.css';

interface ExportPanelProps {
  outputBlob: Blob;
  originalFile: File;
  outputInfo?: ImageInfo;
  onDownload: () => void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ outputBlob, originalFile, outputInfo, onDownload }) => {
  if (!outputBlob || !originalFile) return null;

  const originalSize = originalFile.size;
  const newSize = outputInfo?.size ?? outputBlob.size;
  const savedSpace = originalSize - newSize;
  const isOptimized = savedSpace > 0;

  const ext = outputInfo?.format.split('/')[1] || outputBlob.type.split('/')[1] || 'png';
  const displayExt = ext === 'jpeg' ? 'jpg' : ext;
  const outputFilename = generateOutputFilename(originalFile.name, 'edited', displayExt);

  const width = outputInfo?.width;
  const height = outputInfo?.height;

  return (
    <div className="export-panel glass-panel">
      <div className="export-panel__info">
        <div className="export-panel__filename" style={{ marginBottom: '4px', fontWeight: 500, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
          <span style={{ color: 'var(--text-muted)' }}>File: </span>
          <span style={{ color: 'var(--text-primary)' }} title={outputFilename}>{outputFilename}</span>
        </div>
        
        <div className="export-info-group">
          <FileImage size={14} className="text-muted" />
          {width && height ? (
            <span className="export-dim">{width} × {height}</span>
          ) : (
            <span className="export-dim">--- × ---</span>
          )}
          <span className="badge badge-neutral">{displayExt.toUpperCase()}</span>
        </div>
        
        <div className="export-info-group">
          <HardDrive size={14} className="text-muted" />
          <span className="export-size">{formatFileSize(newSize)}</span>
          {isOptimized && (
            <span className="export-savings">
              ({((savedSpace / originalSize) * 100).toFixed(0)}% smaller)
            </span>
          )}
        </div>
      </div>
      
      <button className="btn btn-primary export-btn" onClick={onDownload}>
        <Download size={18} />
        Download Image
      </button>
    </div>
  );
};

export default ExportPanel;
