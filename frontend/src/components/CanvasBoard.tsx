import { useRef, useState } from "react";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

export function CanvasBoard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [strokeCount, setStrokeCount] = useState(0);

  function context() {
    return canvasRef.current?.getContext("2d") ?? null;
  }

  function relativePoint(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    isDrawingRef.current = true;
    lastPointRef.current = relativePoint(event);
    const ctx = context();
    if (ctx) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#111827";
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    }
    setStrokeCount((count) => count + 1);
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    const ctx = context();
    if (!ctx) return;
    const point = relativePoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  }

  function handleMouseUp() {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }

  function handleClear() {
    const ctx = context();
    if (ctx) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    setStrokeCount(0);
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }

  return (
    <div className="canvas-board">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        data-testid="canvas-board"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          width: "100%",
          maxWidth: `${CANVAS_WIDTH}px`,
          display: "block",
          cursor: "crosshair"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <span
        data-testid="canvas-stroke-count"
        style={{ display: "none" }}
        aria-hidden="true"
      >
        {strokeCount}
      </span>
      <div className="button-row button-row--compact" style={{ marginTop: "8px" }}>
        <button
          className="button button--secondary"
          type="button"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
