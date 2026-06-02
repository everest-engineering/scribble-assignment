import { useEffect, useRef, useCallback } from "react";
import type { DrawingStroke } from "../services/api";

interface CanvasProps {
  strokes: DrawingStroke[];
  isDrawer: boolean;
  onStrokesChange?: (strokes: DrawingStroke[]) => void;
}

export function Canvas({ strokes, isDrawer, onStrokesChange }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef<DrawingStroke | null>(null);

  const renderStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      if (stroke.points.length === 0) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color ?? "#000000";
      ctx.lineWidth = stroke.size ?? 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }

    if (currentStroke.current && currentStroke.current.points.length > 0) {
      const s = currentStroke.current;
      ctx.beginPath();
      ctx.strokeStyle = s.color ?? "#000000";
      ctx.lineWidth = s.size ?? 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
    }
  }, [strokes]);

  useEffect(() => {
    renderStrokes();
  }, [renderStrokes]);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    isDrawing.current = true;
    const point = getCanvasPoint(e);
    currentStroke.current = { points: [point] };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !currentStroke.current) return;
    const point = getCanvasPoint(e);
    currentStroke.current.points.push(point);
    renderStrokes();
  };

  const handleMouseUp = () => {
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;
    if (currentStroke.current.points.length > 1) {
      const newStroke = currentStroke.current;
      currentStroke.current = null;
      onStrokesChange?.([...strokes, newStroke]);
    } else {
      currentStroke.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (isDrawing.current) {
      handleMouseUp();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={500}
      className={`drawing-canvas ${isDrawer ? "drawing-canvas--interactive" : ""}`}
      style={{
        cursor: isDrawer ? "crosshair" : "default",
        touchAction: isDrawer ? "none" : "auto"
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}
