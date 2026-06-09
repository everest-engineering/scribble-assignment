import { useEffect, useRef, type PointerEvent } from "react";

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface DrawingCanvasProps {
  strokes: Stroke[];
  onStroke?: (stroke: Stroke) => void;
  width?: number;
  height?: number;
}

function normalizePoint(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top) / rect.height
  };
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  width: number,
  height: number
) {
  if (stroke.points.length < 2) return;

  ctx.beginPath();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width * Math.min(width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const { x: x0, y: y0 } = stroke.points[0];
  ctx.moveTo(x0 * width, y0 * height);

  for (let i = 1; i < stroke.points.length; i++) {
    const { x, y } = stroke.points[i];
    ctx.lineTo(x * width, y * height);
  }

  ctx.stroke();
}

function renderAllStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  for (const stroke of strokes) {
    drawStroke(ctx, stroke, width, height);
  }
}

export function DrawingCanvas({
  strokes,
  onStroke,
  width = 800,
  height = 600
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Point[]>([]);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    renderAllStrokes(ctx, strokes, width, height);
  }, [strokes, width, height]);

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!onStroke) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    currentStrokeRef.current = [normalizePoint(event.clientX, event.clientY, canvas)];
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = normalizePoint(event.clientX, event.clientY, canvas);
    currentStrokeRef.current.push(point);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const allStrokes = [...strokesRef.current];

    if (currentStrokeRef.current.length >= 2) {
      allStrokes.push({
        points: currentStrokeRef.current,
        color: "#000000",
        width: 0.008
      });
    }

    renderAllStrokes(ctx, allStrokes, width, height);
  }

  function handlePointerUp() {
    if (!isDrawingRef.current || !onStroke) return;
    isDrawingRef.current = false;

    if (currentStrokeRef.current.length >= 2) {
      onStroke({
        points: currentStrokeRef.current,
        color: "#000000",
        width: 0.008
      });
    }

    currentStrokeRef.current = [];
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        cursor: onStroke ? "crosshair" : "default",
        display: "block",
        width: "100%",
        height: "auto",
        aspectRatio: `${width} / ${height}`,
        touchAction: "none"
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}
