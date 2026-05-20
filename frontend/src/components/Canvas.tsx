import { useLayoutEffect, useRef, useState, useCallback } from "react";
import type { CanvasStroke } from "../services/api";

interface CanvasProps {
  strokes: CanvasStroke[];
  isDrawer: boolean;
  onStroke: (stroke: CanvasStroke) => void;
  onClear: () => void;
}

export function Canvas({ strokes, isDrawer, onStroke, onClear }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<CanvasStroke | null>(null);
  const currentStrokeRef = useRef<CanvasStroke | null>(null);
  currentStrokeRef.current = currentStroke;

  const normalize = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    e.preventDefault();
    const { x, y } = normalize(e.clientX, e.clientY);
    setCurrentStroke({ points: [{ x, y }], color: "#000000", width: 3 });
    setIsDrawing(true);
  }, [isDrawer, normalize]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = normalize(e.clientX, e.clientY);
    setCurrentStroke((prev) =>
      prev ? { ...prev, points: [...prev.points, { x, y }] } : null
    );
  }, [isDrawing, normalize]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const stroke = currentStrokeRef.current;
    if (stroke && stroke.points.length >= 2) {
      onStroke(stroke);
    }
    setCurrentStroke(null);
  }, [isDrawing, onStroke]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== Math.round(rect.width) || canvas.height !== Math.round(rect.height)) {
      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.height);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const allStrokes = [...strokes, ...(currentStroke ? [currentStroke] : [])];
    for (const stroke of allStrokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
      }
      ctx.stroke();
    }
  }, [strokes, currentStroke]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          aspectRatio: "4 / 3",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          cursor: isDrawer ? "crosshair" : "default",
          touchAction: "none",
          display: "block"
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      {isDrawer && (
        <button className="button button--secondary" style={{ marginTop: "8px" }} onClick={onClear}>
          Clear Canvas
        </button>
      )}
    </div>
  );
}
