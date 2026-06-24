import { useEffect, useRef, useCallback } from "react";
import type { Stroke, StrokePoint } from "../services/api";

interface CanvasProps {
  strokes: Stroke[];
  isDrawer: boolean;
  onStroke: (stroke: Stroke) => void;
  onClear: () => void;
}

function renderStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  }
}

export function Canvas({ strokes, isDrawer, onStroke, onClear }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const currentPoints = useRef<StrokePoint[]>([]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderStrokes(ctx, strokes);
  }, [strokes]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    redraw();
  }, [redraw]);

  function getCanvasPoint(e: React.MouseEvent<HTMLCanvasElement>): StrokePoint {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;
    isDrawing.current = true;
    currentPoints.current = [getCanvasPoint(e)];
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const point = getCanvasPoint(e);
    const points = currentPoints.current;
    const prev = points[points.length - 1];
    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    points.push(point);
  }

  function handleMouseUp() {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const points = currentPoints.current;
    currentPoints.current = [];
    if (points.length < 2) return;
    onStroke({ points, color: "#000000", width: 3 });
  }

  function handleMouseLeave() {
    if (!isDrawing.current) return;
    handleMouseUp();
  }

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: 400 }}>
      <canvas
        ref={canvasRef}
        style={{
          border: "1px solid var(--line)",
          borderRadius: "12px",
          cursor: isDrawer ? "crosshair" : "default",
          display: "block"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {!isDrawer && strokes.length === 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "var(--ink-soft)",
            fontSize: "1.125rem",
            fontWeight: 500,
            pointerEvents: "none"
          }}
        >
          Waiting for the drawer to draw...
        </div>
      ) : null}
      {isDrawer ? (
        <button
          className="button button--secondary"
          style={{ marginTop: 8 }}
          onClick={onClear}
        >
          Clear Canvas
        </button>
      ) : null}
    </div>
  );
}
