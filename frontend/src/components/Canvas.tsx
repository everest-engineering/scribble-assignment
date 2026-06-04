import { useEffect, useRef, useCallback } from "react";

interface CanvasProps {
  disabled?: boolean;
  onDraw?: () => void;
}

export function Canvas({ disabled = false, onDraw }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1f2937";
    return ctx;
  }, []);

  function getCanvasPoint(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (disabled) return;
    isDrawingRef.current = true;
    const ctx = getCanvasContext();
    if (!ctx) return;
    const point = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || disabled) return;
    const ctx = getCanvasContext();
    if (!ctx) return;
    const point = getCanvasPoint(e);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  function handleMouseUp() {
    isDrawingRef.current = false;
    if (onDraw) onDraw();
  }

  function handleMouseLeave() {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      if (onDraw) onDraw();
    }
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (onDraw) onDraw();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = 500;
  }, []);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        style={{ width: "100%", height: "500px", cursor: disabled ? "default" : "crosshair" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {!disabled && (
        <div className="button-row" style={{ marginTop: "8px" }}>
          <button className="button button--secondary" type="button" onClick={handleClear}>
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
}
