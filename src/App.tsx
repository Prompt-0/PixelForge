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
import CyberPanel from './components/CyberPanel/CyberPanel';
import DrawPanel from './components/DrawPanel/DrawPanel';
import DrawOverlay from './components/DrawPanel/DrawOverlay';
import SelectionPanel from './components/SelectionPanel/SelectionPanel';
import SelectionOverlay from './components/SelectionPanel/SelectionOverlay';
import WatermarkPanel from './components/WatermarkPanel/WatermarkPanel';
import FilterPanel from './components/FilterPanel/FilterPanel';

import { fileToDataUrl, formatFileSize, generateOutputFilename, downloadBlob } from './utils/helpers';
import { getImageDimensions, resizeImage, rotateImage, flipImage, type ResizeOptions } from './utils/imageResizer';
import { compressImage, type CompressOptions } from './utils/imageCompressor';
import { convertImage, loadHeicImage, isHeicFile, getFileFormat, type ConvertOptions } from './utils/imageConverter';
import { readMetadata, stripMetadata, updateMetadata, metadataToJson, type MetadataResult } from './utils/metadataHandler';
import { initOcrEngine, recognizeText, terminateOcrEngine, type OcrResult } from './utils/ocrEngine';
import { applyAdjustments, getDefaultAdjustments, buildFilterString, type AdjustmentOptions } from './utils/imageAdjustments';
import { scanForPayloads, encodeSteganography, decodeSteganography, generateErrorLevelAnalysis, deepScrub, type ScanReport } from './utils/cyberSecurity';
import { applyAnnotations, type AnnotationTool, type AnnotationAction } from './utils/annotationEngine';
import { removeBackgroundAI, magicWandSelection, type Point } from './utils/selectionEngine';
import { applyWatermark, type WatermarkOptions } from './utils/watermarkEngine';
import { calculateHistogram, applyColorFilter, type HistogramData, type FilterType } from './utils/filterEngine';

export type TabId = 'resize' | 'compress' | 'convert' | 'adjust' | 'metadata' | 'ocr' | 'cyber' | 'draw' | 'select' | 'water' | 'filter';
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

  // Cyber state
  const [cyberDecodedMessage, setCyberDecodedMessage] = useState<string | null>(null);
  const [cyberScanReport, setCyberScanReport] = useState<ScanReport | null>(null);

  // Draw state
  const [drawTool, setDrawTool] = useState<AnnotationTool>('freehand');
  const [drawColor, setDrawColor] = useState<string>('#ff0000');
  const [drawBrushSize, setDrawBrushSize] = useState<number>(5);
  const [drawActions, setDrawActions] = useState<AnnotationAction[]>([]);

  // Live preview & source tracking state
  const [livePreviewEnabled, setLivePreviewEnabled] = useState(true);
  const [processedSourceTool, setProcessedSourceTool] = useState<string | null>(null);
  const [compressOptions, setCompressOptions] = useState<CompressOptions | null>(null);

  // Selection state
  const [magicWandTolerance, setMagicWandTolerance] = useState<number>(30);
  const [magicWandModeActive, setMagicWandModeActive] = useState<boolean>(false);
  const [aiProgress, setAiProgress] = useState<number>(0);
  const [aiStatus, setAiStatus] = useState<string>('');

  // Watermark state
  const [watermarkOptions, setWatermarkOptions] = useState<WatermarkOptions>({
    type: 'text',
    position: 'bottom-right',
    opacity: 0.8,
    scale: 1.0,
    rotation: 0,
    color: '#ffffff'
  });

  // Filter state
  const [activeFilter, setActiveFilter] = useState<FilterType>('none');
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);

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
    setCyberDecodedMessage(null);
    setCyberScanReport(null);
    setAdjustments(getDefaultAdjustments());
    setProcessedSourceTool(null);
    setCompressOptions(null);
    setDrawActions([]);
    setActiveFilter('none');
    setHistogramData(null);

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
      
      // Compute histogram if we're on the filter tab
      if (activeTab === 'filter') {
        calculateHistogram(workingFile).then(setHistogramData).catch(console.error);
      }
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

  // Handle active tab change effects
  useEffect(() => {
    if (activeTab === 'filter' && originalFile) {
      const targetFile = processedBlob ? new File([processedBlob], 'temp.png', { type: processedBlob.type }) : originalFile;
      calculateHistogram(targetFile).then(setHistogramData).catch(console.error);
    }
  }, [activeTab, originalFile, processedBlob]);

  // Adjustments handlers
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

  // Cyber handlers
  const handleCyberScan = useCallback(async () => {
    if (!originalFile) return;
    setIsProcessing(true);
    try {
      const report = await scanForPayloads(originalFile);
      setCyberScanReport(report);
      showToast(report.isSafe ? 'Scan complete: File is safe.' : 'Scan complete: Threats detected!', report.isSafe ? 'success' : 'warning');
    } catch (err) {
      showToast(`Scan failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, showToast]);

  const handleCyberEncode = useCallback(async (message: string) => {
    if (!originalFile) return;
    setIsProcessing(true);
    try {
      const blob = await encodeSteganography(originalFile, message);
      await updateProcessedResult(blob, 'cyber');
      showToast('Message encoded into image.', 'success');
    } catch (err) {
      showToast(`Encoding failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, updateProcessedResult, showToast]);

  const handleCyberDecode = useCallback(async () => {
    const fileToDecode = processedBlob ? new File([processedBlob], 'processed') : originalFile;
    if (!fileToDecode) return;
    setIsProcessing(true);
    try {
      const message = await decodeSteganography(fileToDecode);
      setCyberDecodedMessage(message);
      showToast('Message decoded successfully.', 'success');
    } catch (err) {
      showToast(`Decoding failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, processedBlob, showToast]);

  const handleCyberELA = useCallback(async () => {
    if (!originalFile) return;
    setIsProcessing(true);
    try {
      const elaDataUrl = await generateErrorLevelAnalysis(originalFile);
      const res = await fetch(elaDataUrl);
      const blob = await res.blob();
      await updateProcessedResult(blob, 'cyber_ela');
      showToast('ELA generated.', 'success');
    } catch (err) {
      showToast(`ELA failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, updateProcessedResult, showToast]);

  const handleCyberDeepScrub = useCallback(async () => {
    if (!originalFile) return;
    setIsProcessing(true);
    try {
      const blob = await deepScrub(originalFile);
      await updateProcessedResult(blob, 'cyber_scrub');
      showToast('Deep scrub completed.', 'success');
    } catch (err) {
      showToast(`Deep scrub failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, updateProcessedResult, showToast]);

  // Draw handlers
  const handleDrawActionComplete = useCallback((action: AnnotationAction) => {
    setDrawActions(prev => [...prev, action]);
  }, []);

  const handleDrawUndo = useCallback(() => {
    setDrawActions(prev => prev.slice(0, -1));
  }, []);

  const handleDrawClear = useCallback(() => {
    setDrawActions([]);
    if (originalFile && processedSourceTool === 'draw') {
      // Revert to original visually
      fileToDataUrl(originalFile).then(url => {
        setProcessedBlob(null);
        setProcessedDataUrl(url);
        setProcessedInfo(originalInfo || null);
        setProcessedSourceTool(null);
      });
    }
  }, [originalFile, processedSourceTool, originalInfo]);

  const handleDrawApply = useCallback(async () => {
    if (!originalFile) return;
    setIsProcessing(true);
    try {
      const result = await applyAnnotations(originalFile, drawActions);
      await updateProcessedResult(result, 'draw');
      showToast('Annotations applied!', 'success');
    } catch (err) {
      showToast(`Failed to apply annotations: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, drawActions, updateProcessedResult, showToast]);

  // Selection Handlers
  const handleRemoveBackgroundAI = useCallback(async () => {
    if (!originalFile) return;
    setIsProcessing(true);
    setAiProgress(0);
    setAiStatus('Starting...');
    try {
      const result = await removeBackgroundAI(originalFile, (progress, status) => {
        setAiProgress(progress);
        setAiStatus(status);
      });
      await updateProcessedResult(result, 'select');
      showToast('Background removed via AI!', 'success');
    } catch (err) {
      showToast(`AI Removal failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
      setAiStatus('');
      setAiProgress(0);
    }
  }, [originalFile, updateProcessedResult, showToast]);

  const handleMagicWandSelection = useCallback(async (pt: Point) => {
    // If we have a processed blob, we should operate on that, otherwise operate on original
    const targetFile = processedBlob ? new File([processedBlob], 'temp.png', { type: processedBlob.type }) : originalFile;
    if (!targetFile) return;
    
    setIsProcessing(true);
    try {
      const result = await magicWandSelection(targetFile, pt, magicWandTolerance);
      await updateProcessedResult(result, 'select');
      showToast('Magic wand applied.', 'success');
    } catch (err) {
      showToast(`Magic wand failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
      setMagicWandModeActive(false); // Turn off after single click? Optional. Let's keep it on for multi clicks.
    }
  }, [originalFile, processedBlob, magicWandTolerance, updateProcessedResult, showToast]);

  // Watermark Handler
  const handleWatermarkApply = useCallback(async () => {
    // If we have a processed blob, we can operate on that, otherwise operate on original
    const targetFile = processedBlob ? new File([processedBlob], 'temp.png', { type: processedBlob.type }) : originalFile;
    if (!targetFile) return;

    setIsProcessing(true);
    try {
      const result = await applyWatermark(targetFile, watermarkOptions);
      await updateProcessedResult(result, 'water');
      showToast('Watermark applied.', 'success');
    } catch (err) {
      showToast(`Watermark failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, processedBlob, watermarkOptions, updateProcessedResult, showToast]);

  // Filter Handler
  const handleFilterApply = useCallback(async (filter: FilterType) => {
    setActiveFilter(filter);
    const targetFile = processedBlob ? new File([processedBlob], 'temp.png', { type: processedBlob.type }) : originalFile;
    if (!targetFile) return;

    if (filter === 'none') {
      // Just revert if it's the last tool used
      if (processedSourceTool === 'filter') {
        setProcessedBlob(null);
        fileToDataUrl(originalFile!).then(setProcessedDataUrl);
        setProcessedInfo(originalInfo || null);
        setProcessedSourceTool(null);
      }
      return;
    }

    setIsProcessing(true);
    try {
      const result = await applyColorFilter(targetFile, filter);
      await updateProcessedResult(result, 'filter');
    } catch (err) {
      showToast(`Filter failed: ${(err as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, processedBlob, originalInfo, processedSourceTool, updateProcessedResult, showToast]);

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
    setCyberDecodedMessage(null);
    setCyberScanReport(null);
    setAdjustments(getDefaultAdjustments());
    setProcessedSourceTool(null);
    setCompressOptions(null);
    setDrawActions([]);
    setActiveFilter('none');
    setHistogramData(null);
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
      case 'cyber':
        return (
          <CyberPanel
            originalFile={originalFile}
            onEncode={handleCyberEncode}
            onDecode={handleCyberDecode}
            onScan={handleCyberScan}
            onAnalyzeELA={handleCyberELA}
            onDeepScrub={handleCyberDeepScrub}
            decodedMessage={cyberDecodedMessage}
            scanReport={cyberScanReport}
            isProcessing={isProcessing}
          />
        );
      case 'draw':
        return (
          <DrawPanel
            currentTool={drawTool}
            setCurrentTool={setDrawTool}
            color={drawColor}
            setColor={setDrawColor}
            brushSize={drawBrushSize}
            setBrushSize={setDrawBrushSize}
            onUndo={handleDrawUndo}
            onClear={handleDrawClear}
            onApply={handleDrawApply}
            hasActions={drawActions.length > 0}
            isProcessing={isProcessing}
          />
        );
      case 'select':
        return (
          <SelectionPanel
            onRemoveBackgroundAI={handleRemoveBackgroundAI}
            magicWandTolerance={magicWandTolerance}
            setMagicWandTolerance={setMagicWandTolerance}
            magicWandModeActive={magicWandModeActive}
            setMagicWandModeActive={setMagicWandModeActive}
            isProcessing={isProcessing}
            aiProgress={aiProgress}
            aiStatus={aiStatus}
          />
        );
      case 'water':
        return (
          <WatermarkPanel
            options={watermarkOptions}
            onChange={setWatermarkOptions}
            onApply={handleWatermarkApply}
            isProcessing={isProcessing}
          />
        );
      case 'filter':
        return (
          <FilterPanel
            histogramData={histogramData}
            activeFilter={activeFilter}
            onApplyFilter={handleFilterApply}
            isProcessing={isProcessing}
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
                overlay={
                  activeTab === 'draw' && originalInfo ? (
                    <DrawOverlay
                      width={originalInfo.width}
                      height={originalInfo.height}
                      currentTool={drawTool}
                      color={drawColor}
                      brushSize={drawBrushSize}
                      actions={drawActions}
                      onActionComplete={handleDrawActionComplete}
                    />
                  ) : activeTab === 'select' && magicWandModeActive && originalInfo ? (
                    <SelectionOverlay
                      width={originalInfo.width}
                      height={originalInfo.height}
                      active={magicWandModeActive}
                      onPointSelected={handleMagicWandSelection}
                    />
                  ) : undefined
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
