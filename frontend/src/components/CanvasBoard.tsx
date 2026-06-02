import { useCallback, useEffect, useRef, useState } from "react";
import type { DrawingStroke } from "../services/api";

interface CanvasBoardProps {
  isDrawer: boolean;
  strokes: DrawingStroke[];
  onDraw: (stroke: { color: string; size: number; points: { x: number; y: number }[] }) => void;
  onClear: () => void;
}

export function CanvasBoard({ isDrawer, strokes, onDraw, onClear }: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const first = stroke.points[0];
      ctx.moveTo(first.x * canvas.width, first.y * canvas.height);

      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
      }

      ctx.stroke();
    }
  }, [strokes]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  function getCanvasPoint(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!canvas || !rect) return { x: 0, y: 0 };

    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(event.pointerId);
    setIsDrawing(true);
    const point = getCanvasPoint(event.clientX, event.clientY);
    currentStrokeRef.current = [point];
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || !isDrawer) return;
    event.preventDefault();
    const point = getCanvasPoint(event.clientX, event.clientY);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const current = currentStrokeRef.current;
    if (current.length > 0) {
      const last = current[current.length - 1];
      ctx.beginPath();
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(last.x * canvas.width, last.y * canvas.height);
      ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
      ctx.stroke();
    }

    current.push(point);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || !isDrawer) return;
    event.preventDefault();

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(event.pointerId);
    }

    setIsDrawing(false);

    const points = currentStrokeRef.current;
    if (points.length >= 2) {
      onDraw({
        color: "#111827",
        size: 4,
        points
      });
    }

    currentStrokeRef.current = [];
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleResize() {
      const canvas = canvasRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redraw();
    }

    const observer = new ResizeObserver(handleResize);
    observer.observe(container);
    handleResize();

    return () => observer.disconnect();
  }, [redraw]);

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="canvas-board"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: "none", cursor: isDrawer ? "crosshair" : "default" }}
      />
      {!isDrawer && strokes.length === 0 && (
        <div className="canvas-overlay">
          Waiting for the drawer to draw...
        </div>
      )}
    </div>
  );
}
