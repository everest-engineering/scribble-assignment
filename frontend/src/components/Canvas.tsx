import { useRef, useEffect, useState } from "react";

interface CanvasProps {
  width?: number;
  height?: number;
  disabled?: boolean;
  onDraw?: (canvasState: string) => void;
}

export function Canvas({ width = 600, height = 400, disabled = false, onDraw }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setContext(ctx);
  }, []);

  function getMousePos(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    if (disabled || !context) return;
    setIsDrawing(true);
    const pos = getMousePos(event);
    context.beginPath();
    context.moveTo(pos.x, pos.y);
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !context) return;
    const pos = getMousePos(event);
    context.lineTo(pos.x, pos.y);
    context.stroke();
  }

  function handleMouseUp() {
    if (!context) return;
    setIsDrawing(false);
    context.closePath();

    // Emit canvas state
    if (onDraw && canvasRef.current) {
      const imageData = canvasRef.current.toDataURL();
      onDraw(imageData);
    }
  }

  function handleClear() {
    if (!context) return;
    context.fillStyle = "white";
    context.fillRect(0, 0, canvasRef.current?.width ?? 0, canvasRef.current?.height ?? 0);
    if (onDraw && canvasRef.current) {
      const imageData = canvasRef.current.toDataURL();
      onDraw(imageData);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: "1px solid #e5e7eb",
          backgroundColor: "white",
          cursor: disabled ? "not-allowed" : "crosshair",
          opacity: disabled ? 0.5 : 1
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <button
        className="button button--secondary"
        onClick={handleClear}
        disabled={disabled}
      >
        Clear Canvas
      </button>
    </div>
  );
}
