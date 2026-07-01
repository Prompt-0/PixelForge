import { useState, useRef, useCallback } from 'react';
import { Upload, Image, FileImage } from 'lucide-react';
import './UploadZone.css';

interface UploadZoneProps {
  onFileSelect: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
}

const SUPPORTED_FORMATS = ['JPEG', 'PNG', 'WebP', 'AVIF', 'BMP', 'GIF', 'HEIC'];

const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/gif',
  'image/heic',
  'image/heif',
];

function validateFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter((file) =>
    ACCEPTED_MIME_TYPES.includes(file.type)
  );
}

export default function UploadZone({
  onFileSelect,
  multiple = true,
  accept = 'image/*',
}: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const valid = validateFiles(e.dataTransfer.files);
      if (valid.length > 0) {
        onFileSelect(multiple ? valid : [valid[0]]);
      }
    },
    [onFileSelect, multiple]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const valid = validateFiles(e.target.files);
      if (valid.length > 0) {
        onFileSelect(multiple ? valid : [valid[0]]);
      }
      // Reset so the same file can be re-selected
      e.target.value = '';
    },
    [onFileSelect, multiple]
  );

  const handleClick = () => inputRef.current?.click();

  return (
    <div
      className={`upload-zone ${dragActive ? 'upload-zone--active' : ''}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      aria-label="Upload Zone"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
    >
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        className="upload-zone__input"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Drag-over overlay */}
      {dragActive && (
        <div className="upload-zone__overlay">
          <FileImage size={48} />
          <span>Drop your images here</span>
        </div>
      )}

      {/* Main content */}
      <div className="upload-zone__content">
        <div className="upload-zone__icon">
          <Upload size={48} strokeWidth={1.5} />
        </div>

        <h3 className="upload-zone__title">
          Drag &amp; drop your images here
        </h3>

        <p className="upload-zone__subtitle">or</p>

        <button
          type="button"
          className="upload-zone__browse"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          <Image size={18} />
          Browse Files
        </button>

        {/* Format badges */}
        <div className="upload-zone__formats">
          {SUPPORTED_FORMATS.map((fmt) => (
            <span key={fmt} className="upload-zone__badge">
              {fmt}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
