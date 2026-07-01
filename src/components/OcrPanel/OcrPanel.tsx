import React, { useState } from 'react';
import { ScanText, Copy, Check, Crop, Languages, Loader2 } from 'lucide-react';
import './OcrPanel.css';

export interface OcrBlock {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export interface OcrResult {
  text: string;
  confidence: number;
  blocks: OcrBlock[];
}

interface OcrPanelProps {
  imageSrc: string | null;
  onRegionSelect?: () => void;
  isProcessing: boolean;
  result: OcrResult | null;
  onExtract: (lang: string) => void;
}

const LANGUAGES = [
  { label: 'English', value: 'eng' },
  { label: 'Spanish', value: 'spa' },
  { label: 'French', value: 'fra' },
  { label: 'German', value: 'deu' },
  { label: 'Chinese (Simplified)', value: 'chi_sim' },
  { label: 'Japanese', value: 'jpn' },
  { label: 'Korean', value: 'kor' },
  { label: 'Arabic', value: 'ara' },
  { label: 'Hindi', value: 'hin' },
  { label: 'Portuguese', value: 'por' },
];

function getConfidenceClass(confidence: number): string {
  if (confidence >= 80) return 'confidence--high';
  if (confidence >= 60) return 'confidence--medium';
  return 'confidence--low';
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 80) return 'High';
  if (confidence >= 60) return 'Medium';
  return 'Low';
}

const OcrPanel: React.FC<OcrPanelProps> = ({
  imageSrc,
  onRegionSelect,
  isProcessing,
  result,
  onExtract,
}) => {
  const [selectedLang, setSelectedLang] = useState('eng');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!result?.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed silently
    }
  };

  if (!imageSrc) {
    return (
      <div className="ocr-panel">
        <div className="ocr-panel__empty">
          <ScanText className="ocr-panel__empty-icon" />
          <p className="ocr-panel__empty-text">Upload an image to extract text</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ocr-panel">
      <div className="ocr-panel__header">
        <Languages size={18} />
        <span className="ocr-panel__title">OCR Text Extraction</span>
      </div>

      <div className="ocr-panel__controls">
        <div className="ocr-panel__lang-group">
          <label className="ocr-panel__label">Language</label>
          <select
            className="ocr-panel__select"
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            disabled={isProcessing}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ocr-panel__actions">
          <button
            className="ocr-panel__btn ocr-panel__btn--primary"
            onClick={() => onExtract(selectedLang)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 size={16} className="ocr-panel__spinner" />
            ) : (
              <ScanText size={16} />
            )}
            <span>{isProcessing ? 'Extracting…' : 'Extract Text'}</span>
          </button>

          {onRegionSelect && (
            <button
              className="ocr-panel__btn ocr-panel__btn--secondary"
              onClick={onRegionSelect}
              disabled={isProcessing}
            >
              <Crop size={16} />
              <span>Select Region</span>
            </button>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="ocr-panel__progress">
          <div className="ocr-panel__progress-bar" />
        </div>
      )}

      {result && (
        <div className="ocr-panel__results">
          <div className="ocr-panel__results-header">
            <span className="ocr-panel__results-title">Extracted Text</span>
            <span
              className={`ocr-panel__confidence ${getConfidenceClass(result.confidence)}`}
            >
              {Math.round(result.confidence)}% {getConfidenceLabel(result.confidence)}
            </span>
          </div>

          <div className="ocr-panel__textarea-wrapper">
            <textarea
              className="ocr-panel__textarea"
              value={result.text}
              readOnly
              rows={8}
            />
            <button
              className="ocr-panel__copy-btn"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {result.blocks.length > 0 && (
            <div className="ocr-panel__blocks">
              <span className="ocr-panel__blocks-title">
                Text Blocks ({result.blocks.length})
              </span>
              <ul className="ocr-panel__block-list">
                {result.blocks.map((block, index) => (
                  <li key={index} className="ocr-panel__block-item">
                    <span className="ocr-panel__block-text">
                      {block.text.length > 80
                        ? block.text.slice(0, 80) + '…'
                        : block.text}
                    </span>
                    <span
                      className={`ocr-panel__confidence ocr-panel__confidence--sm ${getConfidenceClass(block.confidence)}`}
                    >
                      {Math.round(block.confidence)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OcrPanel;
