import { useEffect, useRef, useState } from "react";
import type { Stroke } from "../services/api";
import { useRoomStore } from "../state/roomStore";

interface DrawingCanvasProps {
  strokes: Stroke[];
  canDraw: boolean;
}

export function DrawingCanvas({ strokes, canDraw }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const roomStore = useRoomStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPoints = useRef<{ x: number; y: number }[]>([]);

  function getNormalizedPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height
    };
  }

  function renderStrokes() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#111827";
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";

    for (const stroke of strokes) {
      if (stroke.points.length === 0) {
        continue;
      }

      context.beginPath();
      stroke.points.forEach((point, index) => {
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      });
      context.stroke();
    }
  }

  useEffect(() => {
    renderStrokes();
  }, [strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      renderStrokes();
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  async function finishStroke() {
    if (currentPoints.current.length === 0) {
      return;
    }

    const stroke: Stroke = {
      points: [...currentPoints.current]
    };
    currentPoints.current = [];

    try {
      await roomStore.addStroke(stroke);
    } catch {
      // polling will resync canvas state
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw) {
      return;
    }

    const point = getNormalizedPoint(event);
    if (!point) {
      return;
    }

    setIsDrawing(true);
    currentPoints.current = [point];
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw || !isDrawing) {
      return;
    }

    const point = getNormalizedPoint(event);
    if (!point) {
      return;
    }

    currentPoints.current.push(point);
    renderStrokes();

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || currentPoints.current.length < 2) {
      return;
    }

    const points = currentPoints.current;
    const last = points[points.length - 2];
    const current = points[points.length - 1];
    context.beginPath();
    context.moveTo(last.x * canvas.width, last.y * canvas.height);
    context.lineTo(current.x * canvas.width, current.y * canvas.height);
    context.stroke();
  }

  async function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw || !isDrawing) {
      return;
    }

    setIsDrawing(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
    await finishStroke();
  }

  return (
    <canvas
      ref={canvasRef}
      className={`drawing-canvas${canDraw ? " drawing-canvas--active" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
