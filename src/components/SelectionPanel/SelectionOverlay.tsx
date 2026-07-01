import React, { useRef } from 'react';
import { type Point } from '../../utils/selectionEngine';

interface SelectionOverlayProps {
  width: number;
  height: number;
  active: boolean;
  onPointSelected: (pt: Point) => void;
}

const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  width,
  height,
  active,
  onPointSelected
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!active) return null;

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    onPointSelected({
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    });
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        cursor: 'crosshair',
        touchAction: 'none'
      }}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
    />
  );
};

export default SelectionOverlay;
