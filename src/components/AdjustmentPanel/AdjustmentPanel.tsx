import React, { useState, useCallback } from 'react';
import {
  Sun,
  Palette,
  RotateCcw,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import './AdjustmentPanel.css';

import { type AdjustmentOptions, getDefaultAdjustments } from '../../utils/imageAdjustments';

const DEFAULT_ADJUSTMENTS = getDefaultAdjustments();



interface SliderConfig {
  key: keyof AdjustmentOptions;
  label: string;
  min: number;
  max: number;
  icon?: React.ReactNode;
}

interface SectionConfig {
  id: string;
  title: string;
  icon: React.ReactNode;
  sliders: SliderConfig[];
}

const SECTIONS: SectionConfig[] = [
  {
    id: 'light',
    title: 'Light',
    icon: <Sun />,
    sliders: [
      { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
      { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
      { key: 'exposure', label: 'Exposure', min: -100, max: 100 },
    ],
  },
  {
    id: 'color',
    title: 'Color',
    icon: <Palette />,
    sliders: [
      { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
      { key: 'temperature', label: 'Temperature', min: -100, max: 100 },
      { key: 'hue', label: 'Hue', min: 0, max: 360 },
    ],
  },
  {
    id: 'effects',
    title: 'Effects',
    icon: <Sparkles />,
    sliders: [
      { key: 'sharpness', label: 'Sharpness', min: 0, max: 100 },
      { key: 'blur', label: 'Blur', min: 0, max: 100 },
      { key: 'vignette', label: 'Vignette', min: 0, max: 100 },
      { key: 'grayscale', label: 'Grayscale', min: 0, max: 100 },
      { key: 'sepia', label: 'Sepia', min: 0, max: 100 },
      { key: 'invert', label: 'Invert', min: 0, max: 100 },
    ],
  },
];

interface AdjustmentPanelProps {
  adjustments: AdjustmentOptions;
  onChange: (adjustments: AdjustmentOptions) => void;
  onApply: () => void;
}

function getSliderBackground(value: number, min: number, max: number): string {
  const range = max - min;
  const percentage = ((value - min) / range) * 100;

  if (min < 0) {
    // For sliders with negative range, fill from center
    const center = ((0 - min) / range) * 100;
    const left = Math.min(center, percentage);
    const right = Math.max(center, percentage);
    return `linear-gradient(to right, 
      var(--bg-primary) 0%, 
      var(--bg-primary) ${left}%, 
      #8b5cf6 ${left}%, 
      #8b5cf6 ${right}%, 
      var(--bg-primary) ${right}%, 
      var(--bg-primary) 100%)`;
  }

  // For 0-based sliders, fill from left
  return `linear-gradient(to right, 
    #8b5cf6 0%, 
    #8b5cf6 ${percentage}%, 
    var(--bg-primary) ${percentage}%, 
    var(--bg-primary) 100%)`;
}

const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ adjustments, onChange, onApply }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['light', 'color', 'effects'])
  );

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleSliderChange = useCallback(
    (key: keyof AdjustmentOptions, value: number) => {
      onChange({ ...adjustments, [key]: value });
    },
    [adjustments, onChange]
  );

  const handleResetSlider = useCallback(
    (key: keyof AdjustmentOptions) => {
      onChange({ ...adjustments, [key]: DEFAULT_ADJUSTMENTS[key] });
    },
    [adjustments, onChange]
  );

  const handleResetAll = useCallback(() => {
    onChange({ ...DEFAULT_ADJUSTMENTS });
  }, [onChange]);

  const isDefault = (key: keyof AdjustmentOptions): boolean => {
    return (adjustments[key] ?? 0) === (DEFAULT_ADJUSTMENTS as any)[key];
  };

  const hasAnyChanges = Object.keys(DEFAULT_ADJUSTMENTS).some(
    (key) => (adjustments[key as keyof AdjustmentOptions] ?? 0) !== (DEFAULT_ADJUSTMENTS as any)[key]
  );

  return (
    <div className="adjustment-panel">
      {hasAnyChanges && (
        <button className="adjustment-panel__reset-all" onClick={handleResetAll}>
          <RotateCcw />
          Reset All
        </button>
      )}

      {SECTIONS.map((section) => {
        const isExpanded = expandedSections.has(section.id);

        return (
          <div key={section.id} className="adjustment-panel__section">
            <div
              className="adjustment-panel__section-header"
              onClick={() => toggleSection(section.id)}
            >
              <div className="adjustment-panel__section-icon">{section.icon}</div>
              <span className="adjustment-panel__section-title">{section.title}</span>
              <div
                className={`adjustment-panel__section-chevron${
                  isExpanded ? ' adjustment-panel__section-chevron--expanded' : ''
                }`}
              >
                <ChevronDown />
              </div>
            </div>

            <div
              className={`adjustment-panel__section-content${
                isExpanded ? ' adjustment-panel__section-content--expanded' : ''
              }`}
            >
              {section.sliders.map((slider) => {
                const value = adjustments[slider.key];
                const isDefaultValue = isDefault(slider.key);

                return (
                  <div key={slider.key} className="adjustment-panel__slider-row">
                    <span className="adjustment-panel__slider-label">{slider.label}</span>
                    <div className="adjustment-panel__slider-input-wrapper">
                      <input
                        type="range"
                        className="adjustment-panel__slider-input"
                        min={slider.min}
                        max={slider.max}
                        value={value ?? 0}
                        onChange={(e) =>
                          handleSliderChange(slider.key, Number(e.target.value))
                        }
                        style={{
                          background: getSliderBackground(value ?? 0, slider.min, slider.max),
                        }}
                      />
                    </div>
                    <span
                      className={`adjustment-panel__slider-value${
                        !isDefaultValue ? ' adjustment-panel__slider-value--active' : ''
                      }`}
                    >
                      {value ?? 0}
                    </span>
                    <button
                      className={`adjustment-panel__slider-reset${
                        !isDefaultValue ? ' adjustment-panel__slider-reset--visible' : ''
                      }`}
                      onClick={() => handleResetSlider(slider.key)}
                      title={`Reset ${slider.label}`}
                      disabled={isDefaultValue}
                    >
                      <RotateCcw />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <button className="adjustment-panel__apply-btn btn btn-primary" onClick={onApply}>
        Apply Adjustments
      </button>
    </div>
  );
};

export default AdjustmentPanel;
