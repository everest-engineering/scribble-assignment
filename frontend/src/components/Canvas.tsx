import { useEffect, useRef } from "react";
import type { Stroke, Point } from "../services/api";

interface CanvasProps {
  strokes: Stroke[];
  onStrokesChange?: (strokes: Stroke[]) => void;
  readOnly?: boolean;
  onClear?: () => void;
}

export function Canvas({ strokes, onStrokesChange, readOnly = false, onClear }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Point[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokes) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }
  }, [strokes]);

  function getCanvasPoint(clientX: number, clientY: number): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (readOnly) return;
    event.preventDefault();
    isDrawingRef.current = true;
    const point = getCanvasPoint(event.clientX, event.clientY);
    currentStrokeRef.current = [point];

    // Draw immediately
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    canvas.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    event.preventDefault();
    const point = getCanvasPoint(event.clientX, event.clientY);
    currentStrokeRef.current.push(point);

    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    event.preventDefault();
    isDrawingRef.current = false;

    if (currentStrokeRef.current.length > 0) {
      const newStrokes = [...strokes, currentStrokeRef.current];
      onStrokesChange?.(newStrokes);
    }

    currentStrokeRef.current = [];
  }

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={500}
        style={{
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          cursor: readOnly ? "default" : "crosshair",
          touchAction: "none",
          display: "block",
          width: "100%",
          maxWidth: "600px",
          height: "auto",
          aspectRatio: "600 / 500",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      {!readOnly && onClear && (
        <button
          className="button button--secondary"
          onClick={onClear}
          style={{ marginTop: "8px" }}
        >
          Clear Canvas
        </button>
      )}
    </div>
  );
}
