import { useCallback, useEffect, useRef, useState } from "react";
import type { StrokePoint } from "../services/api";

interface DrawingCanvasProps {
  onStroke: (points: StrokePoint[]) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function DrawingCanvas({ onStroke, onClear, disabled = false }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<StrokePoint[]>([]);

  const getCanvasPoint = useCallback((event: React.MouseEvent<HTMLCanvasElement>): StrokePoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    if (disabled) return;
    setIsDrawing(true);
    currentStrokeRef.current = [getCanvasPoint(event)];
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || disabled) return;
    const point = getCanvasPoint(event);
    currentStrokeRef.current.push(point);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    if (currentStrokeRef.current.length === 1) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    } else {
      const prev = currentStrokeRef.current[currentStrokeRef.current.length - 2];
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  }

  function handleMouseUp() {
    if (!isDrawing || disabled) return;
    setIsDrawing(false);

    if (currentStrokeRef.current.length > 0) {
      onStroke([...currentStrokeRef.current]);
    }
    currentStrokeRef.current = [];
  }

  function handleMouseLeave() {
    if (isDrawing) {
      handleMouseUp();
    }
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }, []);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ border: "1px solid #ccc", cursor: disabled ? "default" : "crosshair", width: "100%", height: "400px" }}
      />
      <div className="button-row button-row--compact">
        <button className="button button--secondary" onClick={handleClear} disabled={disabled}>
          Clear Canvas
        </button>
      </div>
    </div>
  );
}
