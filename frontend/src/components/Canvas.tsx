import { useEffect, useRef } from "react";

interface CanvasProps {
  disabled?: boolean;
}

export function DrawingCanvas({ disabled = false }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  function getPos(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    if (disabled) return;
    isDrawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(event);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || disabled) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(event);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function handleMouseUp() {
    isDrawing.current = false;
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={600}
        height={500}
        className="drawing-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: disabled ? "default" : "crosshair" }}
      />
      {!disabled ? (
        <div className="button-row" style={{ marginTop: "12px" }}>
          <button className="button button--secondary" type="button" onClick={handleClear}>
            Clear Canvas
          </button>
        </div>
      ) : null}
    </div>
  );
}
