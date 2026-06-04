import { useEffect, useRef } from "react";

interface DrawingCanvasProps {
  canDraw: boolean;
  canvasData?: string;
  onStrokeEnd?: (dataUrl: string) => void;
}

export function DrawingCanvas({ canDraw, canvasData, onStrokeEnd }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    if (canDraw || !canvasData || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = canvasData;
  }, [canDraw, canvasData]);

  function getPos(event: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!canDraw) return;
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!canDraw || !drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(event);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function handleMouseUp() {
    if (!canDraw || !drawing.current) return;
    drawing.current = false;
    onStrokeEnd?.(canvasRef.current!.toDataURL());
  }

  function handleClear() {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    onStrokeEnd?.(canvasRef.current!.toDataURL());
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={450}
        style={{
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          cursor: canDraw ? "crosshair" : "default",
          width: "100%"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {canDraw && (
        <button className="button button--secondary" type="button" onClick={handleClear}>
          Clear Canvas
        </button>
      )}
    </div>
  );
}
