import { useRef, type PointerEvent } from "react";

interface CanvasProps {
  isDrawer: boolean;
  drawerName?: string;
}

// The drawer's illustration surface. Drawer-local for this feature: strokes
// render only on the drawer's own screen and are NOT synced to guessers
// (FR-012, FR-013, FR-015). Guessers see a static placeholder.
export function Canvas({ isDrawer, drawerName }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  function pointFromEvent(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    // Map CSS pixels to the canvas's internal coordinate space.
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const context = canvasRef.current?.getContext("2d");
    const point = pointFromEvent(event);
    if (!context || !point) {
      return;
    }
    drawing.current = true;
    context.lineCap = "round";
    context.lineWidth = 3;
    context.strokeStyle = "#111827";
    context.beginPath();
    context.moveTo(point.x, point.y);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) {
      return;
    }
    const context = canvasRef.current?.getContext("2d");
    const point = pointFromEvent(event);
    if (!context || !point) {
      return;
    }
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function handlePointerUp() {
    drawing.current = false;
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  if (!isDrawer) {
    return (
      <div
        className="canvas-placeholder"
        style={{ minHeight: "440px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
      >
        {`Waiting for ${drawerName ?? "the drawer"}...`}
      </div>
    );
  }

  return (
    <div className="canvas">
      <canvas
        ref={canvasRef}
        width={800}
        height={440}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          width: "100%",
          height: "440px",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          touchAction: "none",
          cursor: "crosshair"
        }}
      />
      <div className="button-row button-row--compact" style={{ marginTop: "8px" }}>
        <button className="button button--secondary" type="button" onClick={handleClear}>
          Clear
        </button>
      </div>
    </div>
  );
}
