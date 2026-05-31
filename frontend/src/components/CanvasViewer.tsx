import { useEffect, useRef } from "react";
import type { Point } from "../services/api";

interface Props {
  strokes: Point[][];
}

export function CanvasViewer({ strokes }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const path of strokes) {
      if (path.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    }
  }, [strokes]);

  return (
    <canvas
      ref={canvasRef}
      width={700}
      height={500}
      style={{ display: "block", backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
    />
  );
}
