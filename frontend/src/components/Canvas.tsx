import { useCallback, useEffect, useRef, useState } from "react";
import type { Stroke, Point } from "../services/api";

const COLOURS = [
  "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff",
  "#ffff00", "#ff00ff", "#00ffff", "#ff8800", "#888888"
];

const BRUSH_WIDTHS = [
  { label: "Thin", value: 2 as const },
  { label: "Medium", value: 4 as const },
  { label: "Thick", value: 8 as const }
];

interface CanvasProps {
  readOnly: boolean;
  strokes: Stroke[];
  onStrokeComplete?: (stroke: Stroke) => void;
  onClear?: () => void;
}

function normalizePoint(canvas: HTMLCanvasElement, clientX: number, clientY: number): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
  };
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length < 2) {
    return;
  }

  const canvas = ctx.canvas;
  ctx.strokeStyle = stroke.colour;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  const first = stroke.points[0];
  ctx.moveTo(first.x * canvas.width, first.y * canvas.height);

  for (let index = 1; index < stroke.points.length; index++) {
    const point = stroke.points[index];
    ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
  }

  ctx.stroke();
}

export function Canvas({ readOnly, strokes, onStrokeComplete, onClear }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colour, setColour] = useState("#000000");
  const [width, setWidth] = useState<2 | 4 | 8>(4);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Point[]>([]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      drawStroke(ctx, stroke);
    }
  }, [strokes]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    if (readOnly) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    isDrawingRef.current = true;
    currentStrokeRef.current = [normalizePoint(canvas, event.clientX, event.clientY)];
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const point = normalizePoint(canvas, event.clientX, event.clientY);
    const points = currentStrokeRef.current;

    if (points.length > 0) {
      const prev = points[points.length - 1];
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height);
      ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
      ctx.stroke();
    }

    points.push(point);
  }

  function handleMouseUp() {
    if (!isDrawingRef.current) {
      return;
    }

    isDrawingRef.current = false;
    const points = currentStrokeRef.current;

    if (points.length < 2) {
      currentStrokeRef.current = [];
      return;
    }

    const stroke: Stroke = {
      id: crypto.randomUUID(),
      points,
      colour,
      width,
      createdAt: new Date().toISOString()
    };

    currentStrokeRef.current = [];
    onStrokeComplete?.(stroke);
  }

  function handleMouseLeave() {
    if (isDrawingRef.current) {
      handleMouseUp();
    }
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ width: "100%", height: "auto", aspectRatio: "4/3", border: "1px solid #e5e7eb", cursor: readOnly ? "default" : "crosshair", backgroundColor: "#ffffff" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {!readOnly ? (
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            {COLOURS.map((c) => (
              <button
                key={c}
                style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: c, border: colour === c ? "2px solid #3b82f6" : "2px solid transparent", cursor: "pointer", padding: 0 }}
                onClick={() => setColour(c)}
                aria-label={`Colour ${c}`}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            {BRUSH_WIDTHS.map((bw) => (
              <button
                key={bw.value}
                style={{ padding: "4px 12px", border: "1px solid #d1d5db", borderRadius: "4px", background: width === bw.value ? "#e5e7eb" : "#ffffff", cursor: "pointer", fontWeight: width === bw.value ? "600" : "400" }}
                onClick={() => setWidth(bw.value)}
              >
                {bw.label}
              </button>
            ))}
          </div>
          <button className="button button--secondary" style={{ padding: "4px 12px", fontSize: "0.875rem" }} onClick={() => onClear?.()}>
            Clear Canvas
          </button>
        </div>
      ) : null}
    </div>
  );
}
