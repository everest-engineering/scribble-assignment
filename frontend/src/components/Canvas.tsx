import { useEffect, useRef, useState } from "react";
import type { Point, Stroke } from "../services/api";
import { useRoomStore } from "../state/roomStore";

interface CanvasProps {
  strokes: Stroke[];
  isDrawer: boolean;
  width?: number;
  height?: number;
}

export function Canvas({ strokes, isDrawer, width = 800, height = 600 }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const store = useRoomStore();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const lastSyncTimeRef = useRef<number>(0);
  
  // Brush settings
  const color = "#000000";
  const brushSize = 5;

  // Render all strokes whenever the strokes array changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    strokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.brushSize;
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
    
    // Also render current in-progress stroke if it exists and we are drawing
    if (isDrawing && currentStrokeRef.current) {
      const stroke = currentStrokeRef.current;
      if (stroke.points.length > 0) {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.brushSize;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
    }
  }, [strokes, isDrawing, width, height]);

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    e.preventDefault();
    
    const point = getCanvasPoint(e);
    if (!point) return;

    setIsDrawing(true);
    const newStroke: Stroke = {
      id: crypto.randomUUID(),
      color,
      brushSize,
      points: [point],
      isComplete: false
    };
    currentStrokeRef.current = newStroke;
    lastSyncTimeRef.current = Date.now();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !isDrawing || !currentStrokeRef.current) return;
    e.preventDefault();

    const point = getCanvasPoint(e);
    if (!point) return;

    currentStrokeRef.current.points.push(point);
    
    // Force a re-render to show the line locally
    setIsDrawing(true);

    // Batch sync every 500ms
    if (Date.now() - lastSyncTimeRef.current >= 500) {
      store.addStroke({ ...currentStrokeRef.current });
      lastSyncTimeRef.current = Date.now();
    }
  };

  const stopDrawing = () => {
    if (!isDrawer || !isDrawing || !currentStrokeRef.current) return;
    
    setIsDrawing(false);
    currentStrokeRef.current.isComplete = true;
    
    // Final sync for this stroke
    store.addStroke({ ...currentStrokeRef.current });
    currentStrokeRef.current = null;
  };

  // Add global mouseup listener to catch stops outside canvas
  useEffect(() => {
    if (!isDrawer) return;
    const handleGlobalUp = () => stopDrawing();
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  });

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ 
        width: '100%',
        height: '100%',
        maxWidth: `${width}px`,
        touchAction: 'none', 
        cursor: isDrawer ? 'crosshair' : 'default',
        background: 'var(--surface)',
        borderRadius: '8px',
        border: '1px solid var(--line)'
      }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseOut={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      onTouchCancel={stopDrawing}
    />
  );
}
