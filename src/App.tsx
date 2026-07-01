import { useState, useCallback, useRef, useEffect } from 'react';
import './App.css';
import Toolbar from './components/Toolbar/Toolbar';
import UploadZone from './components/UploadZone/UploadZone';
import ImagePreview from './components/ImagePreview/ImagePreview';
import AdjustmentPanel from './components/AdjustmentPanel/AdjustmentPanel';
import MetadataEditor from './components/MetadataEditor/MetadataEditor';
import OcrPanel from './components/OcrPanel/OcrPanel';
import ResizePanel from './components/ResizePanel/ResizePanel';
import CompressPanel from './components/CompressPanel/CompressPanel';
import ConvertPanel from './components/ConvertPanel/ConvertPanel';
import ExportPanel from './components/ExportPanel/ExportPanel';
import BatchProcessor from './components/BatchProcessor/BatchProcessor';

import { fileToDataUrl, formatFileSize, generateOutputFilename, downloadBlob } from './utils/helpers';
import { getImageDimensions, resizeImage, rotateImage, flipImage, type ResizeOptions } from './utils/imageResizer';
import { compressImage, type CompressOptions } from './utils/imageCompressor';
import { convertImage, loadHeicImage, isHeicFile, getFileFormat, type ConvertOptions } from './utils/imageConverter';
import { readMetadata, stripMetadata, updateMetadata, metadataToJson, type MetadataResult } from './utils/metadataHandler';
import { initOcrEngine, recognizeText, terminateOcrEngine, type OcrResult } from './utils/ocrEngine';
import { applyAdjustments, getDefaultAdjustments, buildFilterString, type AdjustmentOptions } from './utils/imageAdjustments';

export type TabId = 'resize' | 'compress' | 'convert' | 'adjust' | 'metadata' | 'ocr';
export type AppMode = 'single' | 'batch';

export interface ImageInfo {
  width: number;
  height: number;
  size: number;
  format: string;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  id: number;
}

function App() {
  // Mode & navigation
  const [mode, setMode] = useState<AppMode>('single');
  const [activeTab, setActiveTab] = useState<TabId>('resize');

  // File state
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null);

  // Processed state
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null);
  const [processedInfo, setProcessedInfo] = useState<ImageInfo | null>(null);

  // Tool-specific state
  const [adjustments, setAdjustments] = useState<AdjustmentOptions>(getDefaultAdjustments());
  const [metadata, setMetadata] = useState<MetadataResult | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const liveFilterString = buildFilterString(adjustments);

  // Live preview & source tracking state
  const [livePreviewEnabled, setLivePreviewEnabled] = useState(true);
  const [processedSourceTool, setProcessedSourceTool] = useState<string | null>(null);
  const [compressOptions, setCompressOptions] = useState<CompressOptions | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Load file
  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setIsProcessing(true);
    setProcessedBlob(null);
    setProcessedDataUrl(null);
    setProcessedInfo(null);
    setMetadata(null);
    setOcrResult(null);
    setAdjustments(getDefaultAdjustments());
    setProcessedSourceTool(null);
    setCompressOptions(null);

    try {
      let workingFile = file;

      // Check for HEIC and convert
      if (await isHeicFile(file)) {
        showToast('Converting HEIC image...', 'info');
        const converted = await loadHeicImage(file);
        workingFile = new File([converted], file.name.replace(/\.heic$/i, '.png'), { type: 'image/png' });
      }

      const dataUrl = await fileToDataUrl(workingFile);
      const dims = await getImageDimensions(workingFile);
      const format = await getFileFormat(workingFile);

      setOriginalFile(workingFile);
      setOriginalDataUrl(dataUrl);
      setOriginalInfo({
        width: dims.width,
        height: dims.height,
        size: workingFile.size,
        format: format,
      });

      // Auto-read metadata
      try {
        const meta = await readMetadata(workingFile);
        setMetadata(meta);
      } catch {
        // Some formats may not have metadata
      }

      showToast(`Loaded: ${workingFile.name} (${formatFileSize(workingFile.size)})`, 'success');
    } catch (err) {
      showToast(`Failed to load image: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [showToast]);

  // Helper to update processed result
  const updateProcessedResult = useCallback(async (blob: Blob, sourceTool?: string) => {
    const dataUrl = await fileToDataUrl(new File([blob], 'processed'));
    const dims = await getImageDimensions(new File([blob], 'processed'));
    setProcessedBlob(blob);
    setProcessedDataUrl(dataUrl);
    setProcessedInfo({
      width: dims.width,
      height: dims.height,
      size: blob.size,
      format: blob.type || 'image/png',
    });
    if (sourceTool !== undefined) {
      setProcessedSourceTool(sourceTool);
    }
  }, []);

  // Resize handler
  const handleResize = useCallback(async (options: ResizeOptions) => {
    if (!originalFile) return;
    setIsProcessing(true);
    try {
      const result = await resizeImage(originalFile, options);
      await updateProcessedResult(result, 'resize');
      showToast('Image resized successfully!', 'success');
    } catch (err) {
      showToast(`Resize failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, updateProcessedResult, showToast]);

  // Rotate handler
  const handleRotate = useCallback(async (degrees: number) => {
    if (!originalFile) return;
    setIsProcessing(true);
    try {
      const result = await rotateImage(originalFile, degrees);
      await updateProcessedResult(result, 'rotate');
      showToast(`Image rotated ${degrees}°`, 'success');
    } catch (err) {
      showToast(`Rotation failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, updateProcessedResult, showToast]);

  // Flip handler
  const handleFlip = useCallback(async (direction: 'horizontal' | 'vertical') => {
    if (!originalFile) return;
    setIsProcessing(true);
    try {
      const result = await flipImage(originalFile, direction);
      await updateProcessedResult(result, 'flip');
      showToast(`Image flipped ${direction}ly`, 'success');
    } catch (err) {
      showToast(`Flip failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, updateProcessedResult, showToast]);

  // Compress handler
  const handleCompress = useCallback(async (options: CompressOptions) => {
    if (!originalFile) return;
    setIsProcessing(true);
    try {
      const result = await compressImage(originalFile, options);
      await updateProcessedResult(result, 'compress');
      const ratio = ((1 - result.size / originalFile.size) * 100).toFixed(1);
      showToast(`Compressed: ${formatFileSize(originalFile.size)} → ${formatFileSize(result.size)} (${ratio}% reduction)`, 'success');
    } catch (err) {
      showToast(`Compression failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, updateProcessedResult, showToast]);

  // Convert handler
  const handleConvert = useCallback(async (options: ConvertOptions) => {
    if (!originalFile) return;
    setIsProcessing(true);
    try {
      const result = await convertImage(originalFile, options);
      await updateProcessedResult(result, 'convert');
      showToast(`Converted to ${options.targetFormat.split('/')[1].toUpperCase()}`, 'success');
    } catch (err) {
      showToast(`Conversion failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, updateProcessedResult, showToast]);

  // Adjustments handler
  const handleAdjustmentsChange = useCallback((newAdjustments: AdjustmentOptions) => {
    setAdjustments(newAdjustments);
    setProcessedSourceTool(prev => prev === 'adjust' ? null : prev);
  }, []);

  const handleApplyAdjustments = useCallback(async () => {
    if (!originalFile) return;
    setIsProcessing(true);
    try {
      const result = await applyAdjustments(originalFile, adjustments);
      await updateProcessedResult(result, 'adjust');
      showToast('Adjustments applied!', 'success');
    } catch (err) {
      showToast(`Adjustments failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, adjustments, updateProcessedResult, showToast]);

  // Debounced compress handler
  const handleCompressChange = useCallback((options: CompressOptions) => {
    setCompressOptions(options);
  }, []);

  // Live adjustments preview effect
  useEffect(() => {
    if (!livePreviewEnabled || !originalFile || activeTab !== 'adjust') {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await applyAdjustments(originalFile, adjustments);
        await updateProcessedResult(result, 'adjust');
      } catch (err) {
        console.error('Failed to apply adjustments in real-time:', err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [originalFile, adjustments, livePreviewEnabled, activeTab, updateProcessedResult]);

  // Live compression preview effect
  useEffect(() => {
    if (!livePreviewEnabled || !originalFile || !compressOptions || activeTab !== 'compress') {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await compressImage(originalFile, compressOptions);
        await updateProcessedResult(result, 'compress');
      } catch (err) {
        console.error('Failed to compress in real-time:', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [originalFile, compressOptions, livePreviewEnabled, activeTab, updateProcessedResult]);

  // Metadata handlers
  const handleStripFields = useCallback(async (fields: string[]) => {
    if (!originalFile) return;
    setIsProcessing(true);
    try {
      const result = await stripMetadata(originalFile, fields.length > 0 ? fields : undefined);
      await updateProcessedResult(result, 'metadata');
      // Re-read metadata from result
      try {
        const newMeta = await readMetadata(new File([result], originalFile.name));
        setMetadata(newMeta);
      } catch {
        setMetadata(null);
      }
      showToast(fields.length > 0 ? `Stripped ${fields.length} metadata fields` : 'All metadata stripped', 'success');
    } catch (err) {
      showToast(`Metadata strip failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, updateProcessedResult, showToast]);

  const handleUpdateFields = useCallback(async (updates: Record<string, any>) => {
    if (!originalFile) return;
    setIsProcessing(true);
    try {
      const result = await updateMetadata(originalFile, updates);
      await updateProcessedResult(result, 'metadata');
      // Re-read metadata
      try {
        const newMeta = await readMetadata(new File([result], originalFile.name));
        setMetadata(newMeta);
      } catch {
        // ignore
      }
      showToast('Metadata updated!', 'success');
    } catch (err) {
      showToast(`Metadata update failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, updateProcessedResult, showToast]);

  const handleExportJson = useCallback(() => {
    if (!metadata) return;
    const json = metadataToJson(metadata);
    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, generateOutputFilename(originalFile?.name || 'image', 'metadata', '.json'));
    showToast('Metadata exported as JSON', 'success');
  }, [metadata, originalFile, showToast]);

  // OCR handlers
  const handleOcrExtract = useCallback(async (lang: string) => {
    if (!originalDataUrl) return;
    setIsProcessing(true);
    setOcrResult(null);
    try {
      await initOcrEngine(lang);
      const result = await recognizeText(originalDataUrl);
      setOcrResult(result);
      showToast(`Text extracted (${result.confidence.toFixed(1)}% confidence)`, 'success');
    } catch (err) {
      showToast(`OCR failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalDataUrl, showToast]);

  // Cleanup OCR engine on unmount
  useEffect(() => {
    return () => {
      terminateOcrEngine().catch(() => {});
    };
  }, []);

  // Download handler
  const handleDownload = useCallback(() => {
    if (!processedBlob || !originalFile) return;
    const ext = processedBlob.type ? processedBlob.type.split('/')[1] : 'png';
    const filename = generateOutputFilename(originalFile.name, 'edited', `.${ext === 'jpeg' ? 'jpg' : ext}`);
    downloadBlob(processedBlob, filename);
    showToast('Image downloaded!', 'success');
  }, [processedBlob, originalFile, showToast]);

  // Reset/clear
  const handleClear = useCallback(() => {
    setOriginalFile(null);
    setOriginalDataUrl(null);
    setOriginalInfo(null);
    setProcessedBlob(null);
    setProcessedDataUrl(null);
    setProcessedInfo(null);
    setMetadata(null);
    setOcrResult(null);
    setAdjustments(getDefaultAdjustments());
    setProcessedSourceTool(null);
    setCompressOptions(null);
  }, []);

  // Render side panel based on active tab
  const renderToolPanel = () => {
    if (!originalFile || !originalInfo) return null;

    switch (activeTab) {
      case 'resize':
        return (
          <ResizePanel
            originalWidth={originalInfo.width}
            originalHeight={originalInfo.height}
            onResize={handleResize}
            onRotate={handleRotate}
            onFlip={handleFlip}
          />
        );
      case 'compress':
        return (
          <CompressPanel
            originalSize={originalInfo.size}
            onCompress={handleCompress}
            livePreviewEnabled={livePreviewEnabled}
            onChange={handleCompressChange}
            estimatedSize={processedSourceTool === 'compress' ? processedInfo?.size : undefined}
          />
        );
      case 'convert':
        return (
          <ConvertPanel
            currentFormat={originalInfo.format}
            onConvert={handleConvert}
          />
        );
      case 'adjust':
        return (
          <AdjustmentPanel
            adjustments={adjustments}
            onChange={handleAdjustmentsChange}
            onApply={handleApplyAdjustments}
          />
        );
      case 'metadata':
        return (
          <MetadataEditor
            metadata={metadata}
            onStripFields={handleStripFields}
            onUpdateFields={handleUpdateFields}
            onExportJson={handleExportJson}
          />
        );
      case 'ocr':
        return (
          <OcrPanel
            imageSrc={originalDataUrl}
            isProcessing={isProcessing}
            result={ocrResult}
            onExtract={handleOcrExtract}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <Toolbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabId)}
        mode={mode}
        onModeChange={setMode}
        hasImage={!!originalFile}
        onClear={handleClear}
      />

      <main className="app-main">
        {mode === 'batch' ? (
          <BatchProcessor />
        ) : !originalFile ? (
          <div className="app-upload-container">
            <UploadZone onFileSelect={handleFileSelect} />
          </div>
        ) : (
          <div className="app-workspace">
            <div className="app-canvas-area">
              <ImagePreview
                originalSrc={originalDataUrl!}
                processedSrc={processedDataUrl || undefined}
                originalInfo={originalInfo!}
                processedInfo={processedInfo || undefined}
                liveFilter={
                  activeTab === 'adjust' && processedSourceTool !== 'adjust'
                    ? liveFilterString
                    : undefined
                }
              />
              {processedBlob && originalFile && (
                <ExportPanel
                  outputBlob={processedBlob}
                  originalFile={originalFile}
                  outputInfo={processedInfo || undefined}
                  onDownload={handleDownload}
                />
              )}
            </div>
            <aside className="app-side-panel">
              {isProcessing && (
                <div className="processing-overlay">
                  <div className="spinner spinner-lg" />
                  <span>Processing...</span>
                </div>
              )}
              <div className="live-preview-toggle-container">
                <label className="live-preview-toggle-label checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={livePreviewEnabled}
                    onChange={(e) => setLivePreviewEnabled(e.target.checked)}
                  />
                  Live Preview
                </label>
              </div>
              {renderToolPanel()}
            </aside>
          </div>
        )}
      </main>

      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
