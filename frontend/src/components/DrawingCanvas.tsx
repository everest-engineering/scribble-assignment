import { useRef } from "react";
import { Card } from "./Card";

interface DrawingCanvasProps {
  enabled?: boolean;
}

// Interactive freehand canvas for the drawer. Drawer-local: strokes are not synced to guessers.
export function DrawingCanvas({ enabled = false }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  function getContext() {
    return canvasRef.current?.getContext("2d") ?? null;
  }

  function pointerPos(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!enabled) {
      return;
    }

    const ctx = getContext();

    if (!ctx) {
      return;
    }

    drawingRef.current = true;
    const { x, y } = pointerPos(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!enabled || !drawingRef.current) {
      return;
    }

    const ctx = getContext();

    if (!ctx) {
      return;
    }

    const { x, y } = pointerPos(event);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function handlePointerUp() {
    drawingRef.current = false;
  }

  function handleClear() {
    const ctx = getContext();
    const canvas = canvasRef.current;

    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  return (
    <Card title="Canvas">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          width: "100%",
          height: 500,
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          touchAction: "none",
          cursor: enabled ? "crosshair" : "default"
        }}
      />
      {enabled ? (
        <div className="button-row button-row--compact" style={{ marginTop: 8 }}>
          <button className="button button--secondary" type="button" onClick={handleClear}>
            Clear Canvas
          </button>
        </div>
      ) : (
        <p style={{ marginTop: 8, fontSize: "0.875rem", color: "#6b7280" }}>
          Waiting for the drawer to draw…
        </p>
      )}
    </Card>
  );
}
