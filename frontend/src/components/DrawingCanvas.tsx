import { useEffect, useRef, useState } from "react";

interface DrawingCanvasProps {
  isDrawer: boolean;
  canvasDataUrl: string | null;
  onCanvasChange: (dataUrl: string) => void;
  onClear: () => void;
}

// T024 / T028: Freehand drawing canvas for drawer; read-only view for guessers.
export function DrawingCanvas({
  isDrawer,
  canvasDataUrl,
  onCanvasChange,
  onClear
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Read-only: render received canvas data URL onto canvas whenever it changes
  useEffect(() => {
    if (isDrawer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!canvasDataUrl) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = canvasDataUrl;
  }, [canvasDataUrl, isDrawer]);

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || !isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function handlePointerUp() {
    if (!isDrawer || !isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    onCanvasChange(canvas.toDataURL());
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  }

  return (
    <div className="drawing-canvas-wrapper">
      <canvas
        ref={canvasRef}
        aria-label="Drawing canvas"
        width={600}
        height={450}
        style={{
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          cursor: isDrawer ? "crosshair" : "default",
          display: "block",
          width: "100%"
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      {isDrawer && (
        <div className="button-row button-row--compact" style={{ marginTop: "0.5rem" }}>
          <button
            className="button button--secondary"
            type="button"
            onClick={handleClear}
            aria-label="Clear canvas"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
