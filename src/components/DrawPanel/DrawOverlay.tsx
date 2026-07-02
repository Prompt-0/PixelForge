import React, { useRef, useEffect, useState, useCallback } from 'react';
import { type AnnotationTool, type AnnotationAction, type AnnotationPoint as Point } from '../../utils/annotationEngine';

interface DrawOverlayProps {
  width: number;
  height: number;
  currentTool: AnnotationTool;
  color: string;
  brushSize: number;
  actions: AnnotationAction[];
  onActionComplete: (action: AnnotationAction) => void;
}

const DrawOverlay: React.FC<DrawOverlayProps> = ({
  width,
  height,
  currentTool,
  color,
  brushSize,
  actions,
  onActionComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  // Render all committed actions + the current in-progress action
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const allActionsToRender = [...actions];
    if (isDrawing && currentPath.length > 0) {
      allActionsToRender.push({
        id: 'current',
        tool: currentTool,
        color,
        size: brushSize,
        points: currentPath
      });
    }

    for (const action of allActionsToRender) {
      ctx.beginPath();
      
      if (action.tool === 'freehand') {
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (action.points.length > 0) {
          ctx.moveTo(action.points[0].x, action.points[0].y);
          for (let i = 1; i < action.points.length; i++) {
            ctx.lineTo(action.points[i].x, action.points[i].y);
          }
          ctx.stroke();
        }
      } else if (action.tool === 'rectangle') {
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.size;
        if (action.points.length >= 2) {
          const start = action.points[0];
          const end = action.points[action.points.length - 1];
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        }
      } else if (action.tool === 'ellipse') {
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.size;
        if (action.points.length >= 2) {
          const start = action.points[0];
          const end = action.points[action.points.length - 1];
          const rx = Math.abs(end.x - start.x) / 2;
          const ry = Math.abs(end.y - start.y) / 2;
          const cx = Math.min(start.x, end.x) + rx;
          const cy = Math.min(start.y, end.y) + ry;
          
          ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
          ctx.stroke();
        }
      } else if (action.tool === 'blur') {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        if (action.points.length >= 2) {
          const start = action.points[0];
          const end = action.points[action.points.length - 1];
          ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y);
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        }
        ctx.setLineDash([]);
      }
    }
  }, [actions, isDrawing, currentPath, currentTool, color, brushSize, width, height]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const getPointFromEvent = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Account for CSS scaling on the container
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setCurrentPath([getPointFromEvent(e)]);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    setCurrentPath(prev => [...prev, getPointFromEvent(e)]);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentPath.length > 0) {
      const action: AnnotationAction = {
        id: Date.now().toString(),
        tool: currentTool,
        color,
        size: brushSize,
        points: currentPath,
      };

      // For shape tools, compute the rect from start and end points
      // so that applyAnnotations() can correctly render them
      if (currentTool !== 'freehand' && currentPath.length >= 2) {
        const start = currentPath[0];
        const end = currentPath[currentPath.length - 1];
        action.rect = {
          x: start.x,
          y: start.y,
          w: end.x - start.x,
          h: end.y - start.y,
        };
      }

      onActionComplete(action);
    }
    setCurrentPath([]);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: '100%',
        height: '100%',
        cursor: currentTool === 'freehand' ? 'crosshair' : 'default',
        touchAction: 'none'
      }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    />
  );
};

export default DrawOverlay;
