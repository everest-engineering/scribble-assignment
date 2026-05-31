import { useCallback, useEffect, useRef } from "react";
import type { Stroke } from "../services/api";

interface DrawingCanvasProps {
  strokes: Stroke[];
  isDrawer: boolean;
  onStrokesChange: (strokes: Stroke[]) => void;
}

export function DrawingCanvas({ strokes, isDrawer, onStrokesChange }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef<{ x: number; y: number }[]>([]);

  const getCanvasPoint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const renderStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

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

  useEffect(() => {
    renderStrokes();
  }, [renderStrokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      renderStrokes();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [renderStrokes]);

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;
    isDrawing.current = true;
    currentStroke.current = [getCanvasPoint(event)];
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const point = getCanvasPoint(event);
    currentStroke.current.push(point);

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(currentStroke.current[currentStroke.current.length - 2].x, currentStroke.current[currentStroke.current.length - 2].y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  function handleMouseUp() {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currentStroke.current.length > 0) {
      const newStrokes = [...strokes, { points: currentStroke.current }];
      onStrokesChange(newStrokes);
      currentStroke.current = [];
    }
  }

  function handleClear() {
    onStrokesChange([]);
  }

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "500px",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          cursor: isDrawer ? "crosshair" : "default",
          backgroundColor: "#ffffff",
          display: "block"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {isDrawer ? (
        <button
          className="button button--secondary"
          type="button"
          onClick={handleClear}
          style={{ marginTop: "8px" }}
        >
          Clear Canvas
        </button>
      ) : null}
    </div>
  );
}