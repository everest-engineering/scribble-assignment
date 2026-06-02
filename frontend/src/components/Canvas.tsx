import { useEffect, useRef, type PointerEvent } from "react";
import type { Stroke } from "../services/api";

interface CanvasProps {
  strokes: Stroke[];
  isDrawer: boolean;
  onStrokesChange?: (strokes: Stroke[]) => void;
  onClear?: () => void;
}

export function Canvas({ strokes, isDrawer, onStrokesChange, onClear }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef<Stroke>([]);

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
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }
  }, [strokes]);

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(event.pointerId);
    isDrawing.current = true;
    const rect = canvas.getBoundingClientRect();
    currentStroke.current = [{ x: event.clientX - rect.left, y: event.clientY - rect.top }];
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    currentStroke.current.push({ x: event.clientX - rect.left, y: event.clientY - rect.top });

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const points = currentStroke.current;
    if (points.length < 2) return;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
  }

  function handlePointerUp() {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (currentStroke.current.length > 0 && onStrokesChange) {
      onStrokesChange([...strokes, currentStroke.current]);
    }
    currentStroke.current = [];
  }

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="canvas-element"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: "none", cursor: isDrawer ? "crosshair" : "default" }}
      />
      {isDrawer && (
        <div className="canvas-toolbar">
          <button className="button button--secondary" onClick={onClear}>
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
}
