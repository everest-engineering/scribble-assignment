import { useEffect, useRef } from "react";
import type { DrawingStroke } from "../services/api";

interface DrawingCanvasProps {
  strokes: DrawingStroke[];
  readOnly?: boolean;
  onStrokeComplete?: (stroke: DrawingStroke) => void;
}

function drawStrokes(context: CanvasRenderingContext2D, strokes: DrawingStroke[], width: number, height: number) {
  context.clearRect(0, 0, width, height);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "#111827";
  context.lineWidth = 3;

  for (const stroke of strokes) {
    if (stroke.points.length === 0) {
      continue;
    }

    context.beginPath();
    const [first, ...rest] = stroke.points;
    context.moveTo(first.x * width, first.y * height);

    for (const point of rest) {
      context.lineTo(point.x * width, point.y * height);
    }

    context.stroke();
  }
}

export function DrawingCanvas({ strokes, readOnly = false, onStrokeComplete }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activePointsRef = useRef<{ x: number; y: number }[]>([]);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    drawStrokes(context, strokes, canvas.width, canvas.height);
  }, [strokes]);

  function normalizePoint(clientX: number, clientY: number) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (readOnly) {
      return;
    }

    const point = normalizePoint(event.clientX, event.clientY);

    if (!point) {
      return;
    }

    drawingRef.current = true;
    activePointsRef.current = [point];
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (readOnly || !drawingRef.current) {
      return;
    }

    const point = normalizePoint(event.clientX, event.clientY);

    if (!point) {
      return;
    }

    activePointsRef.current.push(point);

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    drawStrokes(context, strokes, canvas.width, canvas.height);

    const points = activePointsRef.current;
    const previous = points[points.length - 2];
    const current = points[points.length - 1];

    context.beginPath();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";
    context.lineWidth = 3;
    context.moveTo(previous.x * canvas.width, previous.y * canvas.height);
    context.lineTo(current.x * canvas.width, current.y * canvas.height);
    context.stroke();
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (readOnly || !drawingRef.current) {
      return;
    }

    drawingRef.current = false;

    if (activePointsRef.current.length > 0 && onStrokeComplete) {
      onStrokeComplete({
        id: crypto.randomUUID(),
        points: activePointsRef.current
      });
    }

    activePointsRef.current = [];

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className={`drawing-canvas${readOnly ? " drawing-canvas--readonly" : ""}`}
      width={800}
      height={500}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
