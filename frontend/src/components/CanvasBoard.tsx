import { useCallback, useEffect, useRef, useState } from "react";
import type { DrawingPoint } from "../services/api";

interface CanvasBoardProps {
  disabled?: boolean;
  drawing?: DrawingPoint[];
  onSaveStroke?: (points: DrawingPoint[]) => void;
  onClearCanvas?: () => void;
}

export function CanvasBoard({
  disabled = false,
  drawing = [],
  onSaveStroke,
  onClearCanvas
}: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStroke = useRef<DrawingPoint[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.lineWidth = 3;
    context.lineCap = "round";
    context.strokeStyle = "#111827";
  }, []);

  function redraw() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();

    for (const point of drawing) {
      if (point.penDown === false) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    }

    context.stroke();
  }

  useEffect(() => {
    redraw();
  }, [drawing]);

  function getPosition(event: React.MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    if (disabled) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const position = getPosition(event);

    currentStroke.current = [
      { x: position.x, y: position.y, penDown: false }
    ];

    context.beginPath();
    context.moveTo(position.x, position.y);

    setIsDrawing(true);
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || disabled) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const position = getPosition(event);

    currentStroke.current.push({
      x: position.x,
      y: position.y,
      penDown: true
    });

    context.lineTo(position.x, position.y);
    context.stroke();
  }

  function handleMouseUp() {
    if (!isDrawing) {
      return;
    }

    setIsDrawing(false);

    if (currentStroke.current.length > 1 && onSaveStroke) {
      onSaveStroke(currentStroke.current);
    }

    currentStroke.current = [];
  }

  function handleMouseLeave() {
    handleMouseUp();
  }

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    onClearCanvas?.();
  }, [onClearCanvas]);

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        style={{
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          width: "100%",
          cursor: disabled ? "not-allowed" : "crosshair"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {!disabled && onClearCanvas && (
        <div className="button-row button-row--compact">
          <button className="button button--secondary" onClick={handleClear}>
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
}