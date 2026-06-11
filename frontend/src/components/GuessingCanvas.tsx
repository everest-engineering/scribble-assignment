import { useEffect, useRef } from "react";
import type { Stroke } from "../services/api";

interface GuessingCanvasProps {
  strokes: Stroke[];
}

export function GuessingCanvas({ strokes }: GuessingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    for (const stroke of strokes) {
      if (stroke.points.length === 0) continue;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.stroke();
    }
  }, [strokes]);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        className="guessing-canvas"
        style={{ border: "1px solid #ccc", width: "100%", height: "400px" }}
      />
    </div>
  );
}
