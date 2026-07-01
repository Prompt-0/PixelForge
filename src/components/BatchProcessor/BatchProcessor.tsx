import React, { useState } from 'react';
import { Layers, FileArchive, Settings } from 'lucide-react';
import JSZip from 'jszip';
import UploadZone from '../UploadZone/UploadZone';
import { formatFileSize, generateOutputFilename } from '../../utils/helpers';
import { resizeImage } from '../../utils/imageResizer';
import { compressImage } from '../../utils/imageCompressor';
import { convertImage } from '../../utils/imageConverter';
import { stripMetadata } from '../../utils/metadataHandler';
import './BatchProcessor.css';

interface BatchFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  processedBlob?: Blob;
  error?: string;
}

type BatchOperation = 'resize' | 'compress' | 'convert' | 'strip';

const BatchProcessor: React.FC = () => {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Operation Settings
  const [operation, setOperation] = useState<BatchOperation>('compress');

  // Resize settings
  const [resizeWidth, setResizeWidth] = useState<string>('800');
  const [resizeHeight, setResizeHeight] = useState<string>('600');
  const [resizeMode, setResizeMode] = useState<'contain' | 'cover' | 'stretch' | 'exact'>('contain');
  const [resizeMaintainRatio, setResizeMaintainRatio] = useState<boolean>(true);

  // Compress settings
  const [compressFormat, setCompressFormat] = useState<'image/jpeg' | 'image/webp' | 'image/png'>('image/webp');
  const [compressQuality, setCompressQuality] = useState<number>(80);
  const [compressTargetSize, setCompressTargetSize] = useState<string>('');
  const [compressStrip, setCompressStrip] = useState<boolean>(true);
  const [compressMaxWidth, setCompressMaxWidth] = useState<string>('');
  const [compressMaxHeight, setCompressMaxHeight] = useState<string>('');

  // Convert settings
  const [convertFormat, setConvertFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | 'image/bmp'>('image/png');
  const [convertQuality, setConvertQuality] = useState<number>(90);
  const [convertStrip, setConvertStrip] = useState<boolean>(true);

  const handleFilesSelect = (newFiles: File[]) => {
    const batchFiles: BatchFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...batchFiles]);
  };

  const processBatch = async () => {
    setIsProcessing(true);
    setProgress(0);
    
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.status === 'done') {
        setProgress(((i + 1) / files.length) * 100);
        continue;
      }
      
      setFiles(prev => prev.map(item => item.id === f.id ? { ...item, status: 'processing' } : item));
      
      try {
        let result: Blob;
        if (operation === 'resize') {
          result = await resizeImage(f.file, {
            width: resizeWidth ? parseInt(resizeWidth, 10) : undefined,
            height: resizeHeight ? parseInt(resizeHeight, 10) : undefined,
            maintainAspectRatio: resizeMaintainRatio,
            resizeMode: resizeMode,
          });
        } else if (operation === 'compress') {
          result = await compressImage(f.file, {
            format: compressFormat,
            stripMetadata: compressStrip,
            maxWidth: compressMaxWidth ? parseInt(compressMaxWidth, 10) : undefined,
            maxHeight: compressMaxHeight ? parseInt(compressMaxHeight, 10) : undefined,
            ...(compressTargetSize ? { targetSizeKB: parseInt(compressTargetSize, 10) } : { quality: compressQuality / 100 })
          });
        } else if (operation === 'convert') {
          result = await convertImage(f.file, {
            targetFormat: convertFormat,
            quality: convertQuality / 100,
            stripMetadata: convertStrip,
          });
        } else {
          result = await stripMetadata(f.file);
        }
        
        setFiles(prev => prev.map(item => item.id === f.id ? { 
          ...item, 
          status: 'done',
          processedBlob: result
        } : item));
      } catch (err) {
        setFiles(prev => prev.map(item => item.id === f.id ? { 
          ...item, 
          status: 'error',
          error: (err as Error).message
        } : item));
      }
      
      setProgress(((i + 1) / files.length) * 100);
    }
    
    setIsProcessing(false);
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    const doneFiles = files.filter(f => f.status === 'done' && f.processedBlob);
    
    doneFiles.forEach(f => {
      const ext = f.processedBlob!.type ? f.processedBlob!.type.split('/')[1] : 'png';
      const displayExt = ext === 'jpeg' ? 'jpg' : ext;
      const newName = generateOutputFilename(f.file.name, 'processed', displayExt);
      zip.file(newName, f.processedBlob!);
    });
    
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pixelforge_batch.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="batch-processor">
      {files.length === 0 ? (
        <div className="batch-empty">
          <UploadZone onFileSelect={handleFilesSelect} multiple={true} />
        </div>
      ) : (
        <div className="batch-workspace">
          <div className="batch-main glass-panel-solid">
            <div className="batch-header">
              <h2>Batch Processing ({files.length} files)</h2>
              <div className="batch-actions">
                <button className="btn btn-secondary" onClick={() => setFiles([])}>Clear All</button>
                <button 
                  className="btn btn-primary" 
                  onClick={processBatch}
                  disabled={isProcessing || files.every(f => f.status === 'done')}
                >
                  <Layers size={16} /> Process Queue
                </button>
                {files.some(f => f.status === 'done') && (
                  <button className="btn btn-success" onClick={downloadZip}>
                    <FileArchive size={16} /> Download all as ZIP
                  </button>
                )}
              </div>
            </div>
            
            {(isProcessing || progress > 0) && (
              <div className="batch-progress-container">
                <div className="progress-bar progress-bar-striped">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <span>{Math.round(progress)}% Complete</span>
              </div>
            )}

            <div className="file-list">
              {files.map(f => (
                <div key={f.id} className={`file-item status-${f.status}`}>
                  <div className="file-info">
                    <span className="file-name truncate">{f.file.name}</span>
                    <span className="file-size">{formatFileSize(f.file.size)}</span>
                    {f.error && <span className="file-error-text" style={{ color: 'var(--error)', fontSize: '0.75rem', display: 'block' }}>{f.error}</span>}
                  </div>
                  <div className="file-status">
                    {f.status === 'pending' && <span className="badge badge-neutral">Pending</span>}
                    {f.status === 'processing' && <span className="badge badge-primary">Processing...</span>}
                    {f.status === 'done' && <span className="badge badge-success">Done</span>}
                    {f.status === 'error' && <span className="badge badge-danger">Error</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <aside className="batch-sidebar glass-panel-solid">
            <div className="sidebar-header">
              <Settings size={18} />
              <h3>Batch Settings</h3>
            </div>
            <div className="sidebar-content">
              <div className="panel__section">
                <label className="panel__label">Operation</label>
                <select 
                  className="input" 
                  value={operation} 
                  onChange={(e) => setOperation(e.target.value as BatchOperation)}
                  style={{ width: '100%', marginBottom: '16px' }}
                >
                  <option value="compress">Compress</option>
                  <option value="resize">Resize</option>
                  <option value="convert">Convert Format</option>
                  <option value="strip">Strip Metadata</option>
                </select>
              </div>

              {operation === 'resize' && (
                <div className="operation-settings">
                  <div className="panel__section">
                    <label className="panel__label">Width (px)</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={resizeWidth} 
                      onChange={(e) => setResizeWidth(e.target.value)} 
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="panel__section">
                    <label className="panel__label">Height (px)</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={resizeHeight} 
                      onChange={(e) => setResizeHeight(e.target.value)} 
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="panel__section">
                    <label className="panel__label">Resize Mode</label>
                    <select 
                      className="input" 
                      value={resizeMode} 
                      onChange={(e) => setResizeMode(e.target.value as any)}
                      style={{ width: '100%' }}
                    >
                      <option value="contain">Contain</option>
                      <option value="cover">Cover</option>
                      <option value="stretch">Stretch</option>
                      <option value="exact">Exact</option>
                    </select>
                  </div>
                  <div className="panel__section">
                    <label className="checkbox-wrapper">
                      <input 
                        type="checkbox" 
                        checked={resizeMaintainRatio} 
                        onChange={(e) => setResizeMaintainRatio(e.target.checked)} 
                      />
                      Maintain Aspect Ratio
                    </label>
                  </div>
                </div>
              )}

              {operation === 'compress' && (
                <div className="operation-settings">
                  <div className="panel__section">
                    <label className="panel__label">Format</label>
                    <select 
                      className="input" 
                      value={compressFormat} 
                      onChange={(e) => setCompressFormat(e.target.value as any)}
                      style={{ width: '100%' }}
                    >
                      <option value="image/webp">WebP</option>
                      <option value="image/jpeg">JPEG</option>
                      <option value="image/png">PNG</option>
                    </select>
                  </div>
                  <div className="panel__section">
                    <label className="panel__label">Target Size (KB) [Optional]</label>
                    <input 
                      type="number" 
                      className="input" 
                      placeholder="e.g. 200" 
                      value={compressTargetSize} 
                      onChange={(e) => setCompressTargetSize(e.target.value)} 
                      disabled={compressFormat === 'image/png'}
                      style={{ width: '100%' }}
                    />
                  </div>
                  {(!compressTargetSize || compressFormat === 'image/png') && (
                    <div className="panel__section">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label className="panel__label">Quality</label>
                        <span style={{ fontSize: '0.875rem' }}>{compressQuality}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={compressQuality} 
                        onChange={(e) => setCompressQuality(parseInt(e.target.value))} 
                        disabled={compressFormat === 'image/png'}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                  <div className="panel__section">
                    <label className="panel__label">Max Width (px) [Optional]</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={compressMaxWidth} 
                      onChange={(e) => setCompressMaxWidth(e.target.value)} 
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="panel__section">
                    <label className="panel__label">Max Height (px) [Optional]</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={compressMaxHeight} 
                      onChange={(e) => setCompressMaxHeight(e.target.value)} 
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="panel__section">
                    <label className="checkbox-wrapper">
                      <input 
                        type="checkbox" 
                        checked={compressStrip} 
                        onChange={(e) => setCompressStrip(e.target.checked)} 
                      />
                      Strip Metadata
                    </label>
                  </div>
                </div>
              )}

              {operation === 'convert' && (
                <div className="operation-settings">
                  <div className="panel__section">
                    <label className="panel__label">Target Format</label>
                    <select 
                      className="input" 
                      value={convertFormat} 
                      onChange={(e) => setConvertFormat(e.target.value as any)}
                      style={{ width: '100%' }}
                    >
                      <option value="image/png">PNG</option>
                      <option value="image/jpeg">JPEG</option>
                      <option value="image/webp">WebP</option>
                      <option value="image/avif">AVIF</option>
                      <option value="image/bmp">BMP</option>
                    </select>
                  </div>
                  {['image/jpeg', 'image/webp', 'image/avif'].includes(convertFormat) && (
                    <div className="panel__section">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label className="panel__label">Quality</label>
                        <span style={{ fontSize: '0.875rem' }}>{convertQuality}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={convertQuality} 
                        onChange={(e) => setConvertQuality(parseInt(e.target.value))} 
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                  <div className="panel__section">
                    <label className="checkbox-wrapper">
                      <input 
                        type="checkbox" 
                        checked={convertStrip} 
                        onChange={(e) => setConvertStrip(e.target.checked)} 
                      />
                      Strip Metadata
                    </label>
                  </div>
                </div>
              )}

              {operation === 'strip' && (
                <div className="operation-settings">
                  <p className="text-muted text-sm">No configuration required. All metadata will be stripped from the images.</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default BatchProcessor;
