import { useCallback, useEffect, useRef, useState } from "react";
import type { Stroke } from "../services/api";

interface CanvasProps {
  strokes: Stroke[];
  isDrawer: boolean;
  secretWord?: string;
  onDraw: (stroke: Stroke) => void;
  onClear: () => void;
}

export function Canvas({ strokes, isDrawer, secretWord, onDraw, onClear }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const s of strokes) {
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.stroke();
    }
  }, [strokes]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  function getCanvasPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;
    const pos = getCanvasPos(e);
    if (!pos) return;
    setIsDrawing(true);
    setLastPos(pos);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !isDrawer || !lastPos) return;
    const pos = getCanvasPos(e);
    if (!pos) return;

    const stroke: Stroke = {
      x1: lastPos.x,
      y1: lastPos.y,
      x2: pos.x,
      y2: pos.y,
      color: "#000000",
      width: 3
    };

    onDraw(stroke);
    setLastPos(pos);
  }

  function handleMouseUp() {
    setIsDrawing(false);
    setLastPos(null);
  }

  function handleMouseLeave() {
    setIsDrawing(false);
    setLastPos(null);
  }

  return (
    <div>
      {isDrawer && secretWord && (
        <p style={{ textAlign: "center", marginBottom: "8px", fontWeight: "bold" }}>
          Your word: {secretWord}
        </p>
      )}
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          cursor: isDrawer ? "crosshair" : "default",
          display: "block",
          margin: "0 auto"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {isDrawer && (
        <div style={{ textAlign: "center", marginTop: "8px" }}>
          <button className="button button--secondary" onClick={onClear}>
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
}
