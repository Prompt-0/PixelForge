import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, Minimize2 } from 'lucide-react';
import './ImagePreview.css';

export interface ImageInfo {
  width: number;
  height: number;
  size: number;
  format: string;
}

interface ImagePreviewProps {
  originalSrc: string;
  processedSrc?: string;
  originalInfo: ImageInfo;
  processedInfo?: ImageInfo;
  liveFilter?: string;
  overlay?: React.ReactNode;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  originalSrc,
  processedSrc,
  originalInfo,
  processedInfo,
  liveFilter,
  overlay,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25));
  }, []);

  const handleZoomFit = useCallback(() => {
    setZoom(1);
  }, []);

  const handleZoom100 = useCallback(() => {
    setZoom(1);
  }, []);

  const hasComparison = !!processedSrc;

  return (
    <div className="image-preview" ref={containerRef}>
      <div className="image-preview__checkerboard">
        {/* Single image mode */}
        {!hasComparison && (
          <div className="image-preview__single">
            <img
              src={originalSrc}
              alt="Original"
              className="image-preview__image"
              style={{ transform: `scale(${zoom})`, filter: liveFilter || 'none' }}
            />
            {overlay && <div className="image-preview__overlay-container" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>{overlay}</div>}
          </div>
        )}

        {/* Comparison mode */}
        {hasComparison && (
          <>
            {/* Original (full, behind) */}
            <div className="image-preview__layer image-preview__layer--original">
              <img
                src={originalSrc}
                alt="Original"
                className="image-preview__image"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>

            {/* Processed (clipped overlay) */}
            <div
              className="image-preview__layer image-preview__layer--processed"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={processedSrc}
                alt="Processed"
                className="image-preview__image"
                style={{ transform: `scale(${zoom})`, filter: liveFilter || 'none' }}
              />
            </div>

            {/* Slider divider */}
            <div
              className="image-preview__slider"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={handleMouseDown}
            >
              <div className="image-preview__slider-line" />
              <div className="image-preview__slider-handle">
                <span className="image-preview__slider-arrow image-preview__slider-arrow--left">
                  ◀
                </span>
                <span className="image-preview__slider-arrow image-preview__slider-arrow--right">
                  ▶
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Info badges */}
      <div className="image-preview__badge image-preview__badge--original">
        <span className="image-preview__badge-label">Original</span>
        <span className="image-preview__badge-detail">
          {originalInfo.width} × {originalInfo.height}
        </span>
        <span className="image-preview__badge-detail">
          {formatFileSize(originalInfo.size)}
        </span>
        <span className="image-preview__badge-detail">
          {originalInfo.format.toUpperCase()}
        </span>
      </div>

      {hasComparison && processedInfo && (
        <div className="image-preview__badge image-preview__badge--processed">
          <span className="image-preview__badge-label">Processed</span>
          <span className="image-preview__badge-detail">
            {processedInfo.width} × {processedInfo.height}
          </span>
          <span className="image-preview__badge-detail">
            {formatFileSize(processedInfo.size)}
          </span>
          <span className="image-preview__badge-detail">
            {processedInfo.format.toUpperCase()}
          </span>
        </div>
      )}

      {/* Zoom controls */}
      <div className="image-preview__zoom-controls">
        <button
          className="image-preview__zoom-btn"
          onClick={handleZoomFit}
          title="Fit to view"
          aria-label="Fit to view"
        >
          <Maximize size={16} />
        </button>
        <button
          className="image-preview__zoom-btn"
          onClick={handleZoom100}
          title="Zoom to 100%"
          aria-label="Zoom to 100%"
        >
          <Minimize2 size={16} />
        </button>
        <button
          className="image-preview__zoom-btn"
          onClick={handleZoomOut}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          className="image-preview__zoom-btn"
          onClick={handleZoomIn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        <span className="image-preview__zoom-level" aria-label={`Current zoom level is ${Math.round(zoom * 100)} percent`}>
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
};

export default ImagePreview;
