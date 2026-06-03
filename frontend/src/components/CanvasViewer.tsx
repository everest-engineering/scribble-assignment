import { useCallback, useEffect, useRef } from "react";
import type { Stroke } from "../services/api";

interface CanvasViewerProps {
  strokes: Stroke[];
}

export function CanvasViewer({ strokes }: CanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i += 1) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [strokes]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={500}
      className="canvas-viewer"
      style={{ border: "1px solid #e5e7eb", display: "block", width: "100%", background: "#fff" }}
    />
  );
}
