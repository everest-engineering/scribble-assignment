import { useEffect, useRef } from "react";
import type { Point, Stroke } from "../services/api";

interface DrawingCanvasProps {
  strokes: Stroke[];
  canDraw: boolean;
  onStrokeComplete?: (stroke: Stroke) => void;
}

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;

// Strokes are stored as normalized 0..1 points so canvases of any size stay
// aligned. We render at a fixed internal resolution and let CSS scale the box.
export function DrawingCanvas({ strokes, canDraw, onStrokeComplete }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentStroke = useRef<Stroke>([]);
  const isDrawing = useRef(false);

  // Redraw whenever the synced strokes change.
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";

    for (const stroke of strokes) {
      drawStroke(context, stroke);
    }
  }, [strokes]);

  function drawStroke(context: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.length === 0) {
      return;
    }

    context.beginPath();
    stroke.forEach((point, index) => {
      const x = point.x * CANVAS_WIDTH;
      const y = point.y * CANVAS_HEIGHT;
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.stroke();
  }

  function toNormalizedPoint(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw) {
      return;
    }

    isDrawing.current = true;
    currentStroke.current = [toNormalizedPoint(event)];
    canvasRef.current?.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw || !isDrawing.current) {
      return;
    }

    const point = toNormalizedPoint(event);
    currentStroke.current.push(point);

    // Draw the in-progress stroke locally for immediate feedback.
    const context = canvasRef.current?.getContext("2d");
    if (context) {
      drawStroke(context, currentStroke.current);
    }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw || !isDrawing.current) {
      return;
    }

    isDrawing.current = false;
    canvasRef.current?.releasePointerCapture(event.pointerId);

    const finished = currentStroke.current;
    currentStroke.current = [];

    if (finished.length > 0) {
      onStrokeComplete?.(finished);
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className={`drawing-canvas${canDraw ? " drawing-canvas--active" : ""}`}
      style={{ touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
