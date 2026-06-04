import { useEffect, useRef, useCallback, useState } from "react";
import type { CanvasStroke } from "../services/api";

interface DrawingCanvasProps {
  strokes: CanvasStroke[];
  isDrawer: boolean;
  onStrokeComplete: (stroke: CanvasStroke) => void;
  onClear: () => void;
  color?: string;
  strokeWidth?: number;
}

export function DrawingCanvas({
  strokes,
  isDrawer,
  onStrokeComplete,
  onClear,
  color = "#000000",
  strokeWidth = 3
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStroke = useRef<{ x: number; y: number }[]>([]);

  const getCanvasPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }

    if (currentStroke.current.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(currentStroke.current[0].x, currentStroke.current[0].y);
      for (let i = 1; i < currentStroke.current.length; i++) {
        ctx.lineTo(currentStroke.current[i].x, currentStroke.current[i].y);
      }
      ctx.stroke();
    }
  }, [strokes, color, strokeWidth]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      const cvs = canvasRef.current;
      if (!cvs) return;
      const parent = cvs.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      cvs.width = rect.width;
      cvs.height = rect.height;
      redraw();
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [redraw]);

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;
    event.preventDefault();
    const point = getCanvasPoint(event.clientX, event.clientY);
    currentStroke.current = [point];
    setIsDrawing(true);
    (event.target as HTMLCanvasElement).setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || !isDrawer) return;
    event.preventDefault();
    const point = getCanvasPoint(event.clientX, event.clientY);
    currentStroke.current.push(point);
    redraw();
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || !isDrawer) return;
    event.preventDefault();
    setIsDrawing(false);

    if (currentStroke.current.length > 1) {
      onStrokeComplete({
        points: [...currentStroke.current],
        color,
        width: strokeWidth
      });
    }

    currentStroke.current = [];
    (event.target as HTMLCanvasElement).releasePointerCapture(event.pointerId);
  }

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          minHeight: "500px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          cursor: isDrawer ? "crosshair" : "default",
          touchAction: "none",
          display: "block"
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      {isDrawer ? (
        <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
          <button className="button button--secondary" type="button" onClick={onClear}>
            Clear Canvas
          </button>
        </div>
      ) : null}
    </div>
  );
}
