import { useEffect, useRef } from "react";

interface DrawingCanvasProps {
  isDrawer: boolean;
  drawing: string | null;
  // Called with the serialized canvas image (or null on clear) so it can be
  // synced to guessers via polling. Only used by the drawer.
  onPush?: (drawing: string | null) => void;
}

// The drawer draws on an interactive canvas; its image is pushed on a ~2s
// cadence (and on clear) so guessers can render it read-only from the polled
// room snapshot. Strokes are synced as a whole-canvas image via HTTP polling
// (no real-time push), per the constitution.
export function DrawingCanvas({ isDrawer, drawing, onPush }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const onPushRef = useRef(onPush);
  onPushRef.current = onPush;

  useEffect(() => {
    if (!isDrawer) {
      return;
    }
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (context) {
      context.lineCap = "round";
      context.lineWidth = 3;
      context.strokeStyle = "#1f2937";
    }
  }, [isDrawer]);

  // Drawer: push the current canvas image every ~2s.
  useEffect(() => {
    if (!isDrawer) {
      return;
    }
    const handle = setInterval(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        onPushRef.current?.(canvas.toDataURL("image/png"));
      }
    }, 2000);
    return () => clearInterval(handle);
  }, [isDrawer]);

  if (!isDrawer) {
    return (
      <div
        className="canvas-placeholder"
        style={{ minHeight: "500px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", padding: 0 }}
      >
        {drawing ? (
          <img
            src={drawing}
            alt="The drawer's drawing"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          "Waiting for the drawing..."
        )}
      </div>
    );
  }

  function pointerPosition(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = canvasRef.current?.getContext("2d");
    if (!context) {
      return;
    }
    drawingRef.current = true;
    const { x, y } = pointerPosition(event);
    context.beginPath();
    context.moveTo(x, y);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) {
      return;
    }
    const context = canvasRef.current?.getContext("2d");
    if (!context) {
      return;
    }
    const { x, y } = pointerPosition(event);
    context.lineTo(x, y);
    context.stroke();
  }

  function stopDrawing() {
    if (!drawingRef.current) {
      return;
    }
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      onPushRef.current?.(canvas.toDataURL("image/png"));
    }
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      onPushRef.current?.(null);
    }
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        style={{
          width: "100%",
          minHeight: "500px",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          touchAction: "none",
          cursor: "crosshair"
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />
      <div className="button-row button-row--compact" style={{ marginTop: "8px" }}>
        <button className="button button--secondary" type="button" onClick={handleClear}>
          Clear Canvas
        </button>
      </div>
    </div>
  );
}
