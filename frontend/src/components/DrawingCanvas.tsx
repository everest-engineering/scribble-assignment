import { useCallback, useEffect, useRef } from "react";
import type { Stroke } from "../services/api";

interface DrawingCanvasProps {
  strokes: Stroke[];
  isDrawer: boolean;
  onStrokeComplete: (stroke: Stroke) => void;
  onClear: () => void;
}

export function DrawingCanvas({ strokes, isDrawer, onStrokeComplete, onClear }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);

  const getCanvasPoint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    drawingRef.current = true;
    currentPointsRef.current = [getCanvasPoint(event)];
  }, [isDrawer]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !isDrawer) return;
    const point = getCanvasPoint(event);
    currentPointsRef.current.push(point);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1f2937";
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }, [isDrawer]);

  const handleMouseUp = useCallback(() => {
    if (!drawingRef.current || !isDrawer) return;
    drawingRef.current = false;

    if (currentPointsRef.current.length > 0) {
      onStrokeComplete({ points: [...currentPointsRef.current] });
    }
    currentPointsRef.current = [];
  }, [isDrawer, onStrokeComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1f2937";

    for (const stroke of strokes) {
      if (stroke.points.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [strokes]);

  return (
    <div className="drawing-canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={600}
        height={500}
        className="drawing-canvas"
        style={{ border: "1px solid #e5e7eb", borderRadius: "8px", cursor: isDrawer ? "crosshair" : "default", display: "block", maxWidth: "100%" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {isDrawer ? (
        <div className="button-row" style={{ marginTop: "12px" }}>
          <button className="button button--secondary" type="button" onClick={onClear}>
            Clear Canvas
          </button>
        </div>
      ) : null}
    </div>
  );
}
