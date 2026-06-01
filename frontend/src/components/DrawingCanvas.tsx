import { useCallback, useEffect, useRef } from "react";

interface DrawingCanvasProps {
  isDrawer: boolean;
  drawingData: string | null;
  onDraw: (data: string) => void;
  onClear: () => void;
}

export function DrawingCanvas({ isDrawer, drawingData, onDraw, onClear }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const hasLocalChangesRef = useRef(false);

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return ctx;
  }, []);

  const startDrawing = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDrawer) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = getCanvasContext();
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      isDrawingRef.current = true;
      hasLocalChangesRef.current = true;
      ctx.beginPath();
      ctx.moveTo(clientX - rect.left, clientY - rect.top);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#1f2937";
    },
    [isDrawer, getCanvasContext]
  );

  const draw = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDrawingRef.current || !isDrawer) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = getCanvasContext();
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(clientX - rect.left, clientY - rect.top);
      ctx.stroke();
    },
    [isDrawer, getCanvasContext]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      onDraw(dataUrl);
    }
    hasLocalChangesRef.current = false;
  }, [onDraw]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => startDrawing(e.clientX, e.clientY),
    [startDrawing]
  );
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => draw(e.clientX, e.clientY),
    [draw]
  );
  const handleMouseUp = useCallback(() => stopDrawing(), [stopDrawing]);
  const handleMouseLeave = useCallback(() => {
    if (isDrawingRef.current) {
      stopDrawing();
    }
  }, [stopDrawing]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      startDrawing(touch.clientX, touch.clientY);
    },
    [startDrawing]
  );
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      draw(touch.clientX, touch.clientY);
    },
    [draw]
  );
  const handleTouchEnd = useCallback(() => stopDrawing(), [stopDrawing]);

  const handleClear = useCallback(() => {
    const ctx = getCanvasContext();
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    onClear();
  }, [getCanvasContext, onClear]);

  useEffect(() => {
    if (isDrawer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (drawingData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = drawingData;
    }
  }, [isDrawer, drawingData]);

  return (
    <div>
      {isDrawer ? (
        <div style={{ marginBottom: "8px" }}>
          <button className="button button--secondary" type="button" onClick={handleClear} style={{ minHeight: "36px", fontSize: "0.875rem" }}>
            Clear Canvas
          </button>
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          cursor: isDrawer ? "crosshair" : "default",
          touchAction: "none",
          width: "100%",
          height: "auto",
          aspectRatio: "3 / 2"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
}
