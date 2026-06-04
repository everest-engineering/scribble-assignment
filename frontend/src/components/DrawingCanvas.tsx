import { useCallback, useEffect, useRef } from "react";

interface DrawingCanvasProps {
  drawingData: string | null;
  isDrawer: boolean;
  onSaveDrawing: (dataUrl: string) => void;
}

export function DrawingCanvas({ drawingData, isDrawer, onSaveDrawing }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    if (!isDrawer && drawingData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = drawingData;
    }
  }, [drawingData, isDrawer]);

  const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawer) {
      return;
    }
    isDrawingRef.current = true;
    lastPosRef.current = getPos(e);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || !isDrawer) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current!.x, lastPosRef.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
    lastPosRef.current = pos;
  }

  function handleMouseUp() {
    if (!isDrawingRef.current || !isDrawer) {
      return;
    }
    isDrawingRef.current = false;
    lastPosRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      onSaveDrawing(canvas.toDataURL());
    }
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawer) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSaveDrawing(canvas.toDataURL());
  }

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={500}
        style={{
          border: "1px solid #e5e7eb",
          backgroundColor: "#fff",
          width: "100%",
          height: "auto",
          aspectRatio: "600 / 500",
          cursor: isDrawer ? "crosshair" : "default"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {isDrawer && (
        <div className="button-row" style={{ marginTop: "8px" }}>
          <button className="button button--secondary" type="button" onClick={handleClear}>
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
}
