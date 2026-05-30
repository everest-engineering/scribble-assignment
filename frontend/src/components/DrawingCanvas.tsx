import { useCallback, useEffect, useRef } from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type Point,
  type Stroke,
  type StrokeInput
} from "../services/api";

interface DrawingCanvasProps {
  strokes: Stroke[];
  canDraw: boolean;
  onStrokeComplete: (stroke: StrokeInput) => Promise<void>;
}

function drawStroke(context: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length < 2) {
    return;
  }

  context.strokeStyle = stroke.color;
  context.lineWidth = stroke.width;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (let index = 1; index < stroke.points.length; index += 1) {
    context.lineTo(stroke.points[index].x, stroke.points[index].y);
  }

  context.stroke();
}

function renderStrokes(context: CanvasRenderingContext2D, strokes: Stroke[]) {
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (const stroke of strokes) {
    drawStroke(context, stroke);
  }
}

export function DrawingCanvas({ strokes, canDraw, onStrokeComplete }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activePointsRef = useRef<Point[]>([]);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    renderStrokes(context, strokes);
  }, [strokes]);

  const getCanvasPoint = useCallback((event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: Math.min(CANVAS_WIDTH, Math.max(0, (event.clientX - rect.left) * scaleX)),
      y: Math.min(CANVAS_HEIGHT, Math.max(0, (event.clientY - rect.top) * scaleY))
    };
  }, []);

  const drawActivePath = useCallback((points: Point[]) => {
    const canvas = canvasRef.current;

    if (!canvas || points.length < 2) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    renderStrokes(context, strokes);
    drawStroke(context, {
      id: "active",
      points,
      color: "#111827",
      width: 3
    });
  }, [strokes]);

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    activePointsRef.current = [getCanvasPoint(event)];
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw || !isDrawingRef.current) {
      return;
    }

    activePointsRef.current = [...activePointsRef.current, getCanvasPoint(event)];
    drawActivePath(activePointsRef.current);
  }

  async function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw || !isDrawingRef.current) {
      return;
    }

    isDrawingRef.current = false;

    const points = activePointsRef.current;

    activePointsRef.current = [];

    if (points.length < 2) {
      return;
    }

    try {
      await onStrokeComplete({ points, color: "#111827", width: 3 });
    } catch {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");

      if (context) {
        renderStrokes(context, strokes);
      }
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="drawing-canvas"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        width: "100%",
        maxWidth: `${CANVAS_WIDTH}px`,
        height: "auto",
        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        touchAction: canDraw ? "none" : "auto",
        cursor: canDraw ? "crosshair" : "default"
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
