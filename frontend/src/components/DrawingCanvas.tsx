import { useEffect, useRef } from "react";
import { api } from "../services/api";
import type { Stroke } from "../services/api";

interface DrawingCanvasProps {
  strokes: Stroke[];
  isDrawer: boolean;
  roomCode: string;
  participantId: string;
}

function redrawCanvas(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const stroke of strokes) {
    if (stroke.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    ctx.stroke();
  }
}

export function DrawingCanvas({
  strokes,
  isDrawer,
  roomCode,
  participantId,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const isDrawingRef = useRef(false);

  // Wholesale redraw whenever strokes prop changes (server state is authoritative)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    redrawCanvas(ctx, strokes);
  }, [strokes]);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    const point = getPoint(event);
    currentStrokeRef.current = [point];

    // Draw the start point locally for immediate feedback
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "#1a1a1a";
      ctx.fill();
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || !isDrawingRef.current) return;
    const point = getPoint(event);
    const stroke = currentStrokeRef.current;

    // Draw incrementally for immediate local feedback
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && stroke.length > 0) {
      const prev = stroke[stroke.length - 1];
      ctx.beginPath();
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    stroke.push(point);
  }

  async function handlePointerUp() {
    if (!isDrawer || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    const completedStroke = currentStrokeRef.current;
    currentStrokeRef.current = [];

    if (completedStroke.length === 0) return;

    const updatedStrokes = [...strokes, completedStroke];
    try {
      await api.updateCanvas(roomCode, participantId, updatedStrokes);
    } catch {
      // Fire-and-forget — poll will correct any mismatch
    }
  }

  const className = isDrawer
    ? "drawing-canvas"
    : "drawing-canvas drawing-canvas--readonly";

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={600}
      height={400}
      aria-label={
        isDrawer
          ? "Drawing canvas — draw your word here"
          : "Drawing canvas — read only"
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
