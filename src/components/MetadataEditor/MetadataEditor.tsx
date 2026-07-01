import React, { useState, useMemo } from 'react';
import {
  Search,
  Check,
  ChevronDown,
  ChevronRight,
  Trash2,
  Download,
  FileText,
  Camera,
  Clock,
  MapPin,
  User,
  Info,
} from 'lucide-react';
import './MetadataEditor.css';

import { type MetadataResult, getMetadataFields } from '../../utils/metadataHandler';

export interface MetadataField {
  name: string;
  value: any;
  category: string;
  editable: boolean;
}

interface MetadataEditorProps {
  metadata: MetadataResult | null;
  onStripFields: (fields: string[]) => void;
  onUpdateFields: (updates: Record<string, any>) => void;
  onExportJson: () => void;
}

const CATEGORY_ORDER = ['Camera', 'Date & Time', 'GPS & Location', 'Author & Copyright', 'Image', 'Software', 'Other'];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Camera: <Camera size={16} />,
  'Date & Time': <Clock size={16} />,
  'GPS & Location': <MapPin size={16} />,
  'Author & Copyright': <User size={16} />,
  'Image': <Info size={16} />,
  'Software': <FileText size={16} />,
  Other: <FileText size={16} />,
};

const MetadataEditor: React.FC<MetadataEditorProps> = ({
  metadata,
  onStripFields,
  onUpdateFields,
  onExportJson,
}) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>(CATEGORY_ORDER);
  const [searchQuery, setSearchQuery] = useState('');

  const mappedFields = useMemo(() => {
    if (!metadata) return [];
    const fieldsList: MetadataField[] = [];
    const uiCategories = getMetadataFields();
    
    // Create a flat map of all keys present in exif/iptc/xmp etc for quick lookup
    const allKeys: Record<string, any> = {};
    if (metadata.exif) Object.assign(allKeys, metadata.exif);
    if (metadata.iptc) Object.assign(allKeys, metadata.iptc);
    if (metadata.xmp) Object.assign(allKeys, metadata.xmp);
    if (metadata.gps) Object.assign(allKeys, { GPSLatitude: metadata.gps.latitude, GPSLongitude: metadata.gps.longitude, GPSAltitude: metadata.gps.altitude });
    
    // Map known fields
    const knownKeys = new Set<string>();
    uiCategories.forEach(cat => {
      cat.fields.forEach(f => {
        if (allKeys[f.key] !== undefined) {
          fieldsList.push({
            name: f.key,
            value: allKeys[f.key],
            category: cat.category,
            editable: f.editable
          });
          knownKeys.add(f.key);
        }
      });
    });

    // Map unknown fields
    Object.keys(allKeys).forEach(key => {
      if (!knownKeys.has(key)) {
        fieldsList.push({
          name: key,
          value: allKeys[key],
          category: 'Other',
          editable: false
        });
      }
    });

    return fieldsList;
  }, [metadata]);

  const filteredFields = useMemo(() => {
    if (!mappedFields.length) return [];
    if (!searchQuery.trim()) return mappedFields;
    const query = searchQuery.toLowerCase();
    return mappedFields.filter((field) =>
      field.name.toLowerCase().includes(query)
    );
  }, [mappedFields, searchQuery]);

  const groupedFields = useMemo(() => {
    const groups: Record<string, MetadataField[]> = {};
    for (const field of filteredFields) {
      const cat = field.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(field);
    }
    return groups;
  }, [filteredFields]);

  const sortedCategories = useMemo(() => {
    const cats = Object.keys(groupedFields);
    return cats.sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [groupedFields]);

  const toggleSection = (category: string) => {
    setExpandedSections((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleField = (fieldName: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldName)
        ? prev.filter((f) => f !== fieldName)
        : [...prev, fieldName]
    );
  };

  const handleSelectAll = () => {
    if (!mappedFields.length) return;
    setSelectedFields(filteredFields.map((f) => f.name));
  };

  const handleDeselectAll = () => {
    setSelectedFields([]);
  };

  const handleStripSelected = () => {
    if (selectedFields.length > 0) {
      onStripFields(selectedFields);
    }
  };

  const handleFieldValueChange = (fieldName: string, newValue: string) => {
    onUpdateFields({ [fieldName]: newValue });
  };

  if (!metadata) {
    return (
      <div className="metadata-editor">
        <div className="metadata-editor__empty">
          <FileText size={48} className="metadata-editor__empty-icon" />
          <p className="metadata-editor__empty-text">No metadata available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="metadata-editor">
      <div className="metadata-editor__search">
        <Search size={16} className="metadata-editor__search-icon" />
        <input
          type="text"
          className="metadata-editor__search-input"
          placeholder="Filter metadata fields..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="metadata-editor__toolbar">
        <button
          className="metadata-editor__toolbar-btn"
          onClick={handleSelectAll}
          title="Select All"
        >
          <Check size={14} />
          <span>Select All</span>
        </button>
        <button
          className="metadata-editor__toolbar-btn"
          onClick={handleDeselectAll}
          title="Deselect All"
        >
          <span>Deselect All</span>
        </button>
        <button
          className="metadata-editor__toolbar-btn metadata-editor__toolbar-btn--strip"
          onClick={handleStripSelected}
          disabled={selectedFields.length === 0}
          title="Strip Selected"
        >
          <Trash2 size={14} />
          <span>Strip Selected</span>
          {selectedFields.length > 0 && (
            <span className="metadata-editor__badge">{selectedFields.length}</span>
          )}
        </button>
        <button
          className="metadata-editor__toolbar-btn metadata-editor__toolbar-btn--export"
          onClick={onExportJson}
          title="Export as JSON"
        >
          <Download size={14} />
          <span>Export as JSON</span>
        </button>
      </div>

      <div className="metadata-editor__sections">
        {sortedCategories.map((category) => {
          const fields = groupedFields[category];
          const isExpanded = expandedSections.includes(category);
          const icon = CATEGORY_ICONS[category] || <FileText size={16} />;

          return (
            <div className="metadata-editor__section" key={category}>
              <button
                className="metadata-editor__section-header"
                onClick={() => toggleSection(category)}
              >
                <span className={`metadata-editor__chevron ${isExpanded ? 'metadata-editor__chevron--expanded' : ''}`}>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                <span className="metadata-editor__section-icon">{icon}</span>
                <span className="metadata-editor__section-title">{category}</span>
                <span className="metadata-editor__section-count">{fields.length}</span>
              </button>

              {isExpanded && (
                <div className="metadata-editor__field-list">
                  {fields.map((field, index) => (
                    <div
                      className={`metadata-editor__field-row ${index % 2 === 1 ? 'metadata-editor__field-row--alt' : ''}`}
                      key={field.name}
                    >
                      <label
                        className="metadata-editor__checkbox-wrapper"
                        onClick={() => toggleField(field.name)}
                      >
                        <span
                          className={`metadata-editor__checkbox ${selectedFields.includes(field.name) ? 'metadata-editor__checkbox--checked' : ''}`}
                        >
                          {selectedFields.includes(field.name) && <Check size={12} />}
                        </span>
                      </label>
                      <span className="metadata-editor__field-name">{field.name}</span>
                      {field.editable ? (
                        <input
                          type="text"
                          className="metadata-editor__field-input"
                          defaultValue={String(field.value ?? '')}
                          onBlur={(e) => handleFieldValueChange(field.name, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleFieldValueChange(field.name, (e.target as HTMLInputElement).value);
                            }
                          }}
                        />
                      ) : (
                        <span className="metadata-editor__field-value">
                          {String(field.value ?? '')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MetadataEditor;
