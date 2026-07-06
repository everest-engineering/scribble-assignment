import { useCallback, useEffect, useRef, useState } from "react";
import type { Point, Stroke } from "../services/api";

interface CanvasProps {
  strokes: Stroke[];
  isDrawer: boolean;
  onStrokeComplete: (points: Point[]) => void;
  onClear: () => void;
}

export function Canvas({ strokes, isDrawer, onStrokeComplete, onClear }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<Point[]>([]);
  const strokesRef = useRef<Stroke[]>([]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokesRef.current) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }

    const current = currentStrokeRef.current;
    if (current.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(current[0].x, current[0].y);
      for (let i = 1; i < current.length; i++) {
        ctx.lineTo(current[i].x, current[i].y);
      }
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    redraw();
  }, [redraw]);

  useEffect(() => {
    strokesRef.current = strokes;
    redraw();
  }, [strokes, redraw]);

  function getCanvasPoint(clientX: number, clientY: number): Point {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;
    event.preventDefault();
    const point = getCanvasPoint(event.clientX, event.clientY);
    currentStrokeRef.current = [point];
    setIsDrawing(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const point = getCanvasPoint(event.clientX, event.clientY);
    currentStrokeRef.current.push(point);
    redraw();
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    setIsDrawing(false);
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = [];

    if (stroke.length >= 2) {
      onStrokeComplete(stroke);
    }
  }

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        className="canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      {isDrawer && (
        <div className="canvas-toolbar">
          <button className="button button--secondary" type="button" onClick={onClear}>
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
}
