import { useEffect, useRef } from "react";
import type { Point } from "../services/api";

interface DrawingCanvasProps {
  strokes: Point[][];
  readOnly?: boolean;
  onStrokeComplete?: (points: Point[]) => void;
}

export function DrawingCanvas({ strokes, readOnly = false, onStrokeComplete }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef<Point[]>([]);

  function redraw(ctx: CanvasRenderingContext2D, strokeList: Point[][]) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (const stroke of strokeList) {
      if (stroke.length === 0) continue;

      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);

      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }

      ctx.stroke();
    }
  }

  // Redraw whenever strokes prop changes (polling update for guessers)
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    redraw(ctx, strokes);
  }, [strokes]);

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    if (readOnly) return;

    isDrawing.current = true;
    currentStroke.current = [{ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY }];

    const ctx = canvasRef.current?.getContext("2d");

    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
    }
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || readOnly) return;

    const point: Point = { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY };
    currentStroke.current.push(point);

    const ctx = canvasRef.current?.getContext("2d");

    if (ctx) {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  }

  function handleMouseUp() {
    if (!isDrawing.current || readOnly) return;

    isDrawing.current = false;

    if (currentStroke.current.length > 0 && onStrokeComplete) {
      onStrokeComplete(currentStroke.current);
    }

    currentStroke.current = [];
  }

  function handleMouseLeave() {
    if (isDrawing.current && !readOnly) {
      handleMouseUp();
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      style={{ border: "1px solid #e5e7eb", backgroundColor: "#ffffff", cursor: readOnly ? "default" : "crosshair" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}
