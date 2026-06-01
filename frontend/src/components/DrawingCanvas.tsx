import { useEffect, useMemo, useRef, useState } from "react";
import type { DrawingPoint, DrawingStroke } from "../services/api";

interface DrawingCanvasProps {
  strokes: DrawingStroke[];
  canDraw: boolean;
  onStrokesChange: (strokes: DrawingStroke[]) => void;
}

const STROKE_COLOR = "#111827";
const STROKE_WIDTH = 3;

function drawStrokes(context: CanvasRenderingContext2D, strokes: DrawingStroke[]) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.lineCap = "round";
  context.lineJoin = "round";

  for (const stroke of strokes) {
    if (stroke.points.length === 0) {
      continue;
    }

    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.width;
    context.beginPath();
    context.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let index = 1; index < stroke.points.length; index += 1) {
      context.lineTo(stroke.points[index].x, stroke.points[index].y);
    }

    context.stroke();
  }
}

function getCanvasPoint(canvas: HTMLCanvasElement, event: PointerEvent): DrawingPoint {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

export function DrawingCanvas({ strokes, canDraw, onStrokesChange }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeStroke, setActiveStroke] = useState<DrawingStroke | null>(null);
  const activeStrokeRef = useRef<DrawingStroke | null>(null);
  const isDrawingRef = useRef(false);

  const displayStrokes = useMemo(
    () => (activeStroke ? [...strokes, activeStroke] : strokes),
    [activeStroke, strokes]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    drawStrokes(context, displayStrokes);
  }, [displayStrokes]);

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    const stroke: DrawingStroke = {
      color: STROKE_COLOR,
      width: STROKE_WIDTH,
      points: [getCanvasPoint(canvas, event.nativeEvent)]
    };
    activeStrokeRef.current = stroke;
    setActiveStroke(stroke);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw || !isDrawingRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    setActiveStroke((current) => {
      const next = current
        ? {
            ...current,
            points: [...current.points, getCanvasPoint(canvas, event.nativeEvent)]
          }
        : current;
      activeStrokeRef.current = next;
      return next;
    });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    isDrawingRef.current = false;

    const completed = activeStrokeRef.current;

    if (completed && completed.points.length > 0) {
      onStrokesChange([...strokes, completed]);
    }

    activeStrokeRef.current = null;
    setActiveStroke(null);
  }

  return (
    <canvas
      ref={canvasRef}
      className="drawing-canvas"
      width={640}
      height={480}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: "none", cursor: canDraw ? "crosshair" : "default" }}
    />
  );
}
