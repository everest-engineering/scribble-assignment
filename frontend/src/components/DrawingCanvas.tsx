import { useEffect, useRef, useState } from "react";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

/**
 * Freehand drawing surface for the drawer. Strokes are local to this client —
 * per the spec, the drawing is only visible on the drawer's own screen.
 */
export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#111827";
    setContext(ctx);
  }, []);

  function pointerPosition(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT
    };
  }

  function startStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!context) {
      return;
    }

    const { x, y } = pointerPosition(event);
    context.beginPath();
    context.moveTo(x, y);
    isDrawingRef.current = true;
  }

  function extendStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!context || !isDrawingRef.current) {
      return;
    }

    const { x, y } = pointerPosition(event);
    context.lineTo(x, y);
    context.stroke();
  }

  function endStroke() {
    isDrawingRef.current = false;
  }

  function clearCanvas() {
    if (!context) {
      return;
    }

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  return (
    <div className="drawing-canvas">
      <canvas
        ref={canvasRef}
        className="drawing-canvas__surface"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onPointerDown={startStroke}
        onPointerMove={extendStroke}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
      />
      <div className="button-row button-row--compact">
        <button className="button button--secondary" type="button" onClick={clearCanvas}>
          Clear Canvas
        </button>
      </div>
    </div>
  );
}
