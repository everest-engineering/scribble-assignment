import { useCallback, useEffect, useRef } from "react";

interface CanvasProps {
  drawing: number[][][];
  onDrawingChange?: (drawing: number[][][]) => void;
  readOnly?: boolean;
}

export function Canvas({ drawing, onDrawingChange, readOnly = false }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef<number[][]>([]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of drawing) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0], stroke[0][1]);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i][0], stroke[i][1]);
      }
      ctx.stroke();
    }
  }, [drawing]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  function getPos(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    if (readOnly) return;
    isDrawing.current = true;
    currentStroke.current = [getPos(event)];
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || readOnly) return;
    currentStroke.current.push(getPos(event));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(event);
    const prev = currentStroke.current[currentStroke.current.length - 2];
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(prev[0], prev[1]);
    ctx.lineTo(pos[0], pos[1]);
    ctx.stroke();
  }

  function handleMouseUp() {
    if (readOnly) return;
    isDrawing.current = false;
    if (currentStroke.current.length > 0) {
      onDrawingChange?.([...drawing, currentStroke.current]);
    }
    currentStroke.current = [];
  }

  function handleClear() {
    if (readOnly) return;
    onDrawingChange?.([]);
  }

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={500}
        style={{ border: "1px solid #e5e7eb", cursor: readOnly ? "default" : "crosshair", display: "block" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {!readOnly ? (
        <button
          className="button button--secondary"
          style={{ marginTop: "8px" }}
          onClick={handleClear}
        >
          Clear Canvas
        </button>
      ) : null}
    </div>
  );
}
