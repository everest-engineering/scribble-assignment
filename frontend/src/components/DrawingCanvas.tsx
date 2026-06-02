import { useEffect, useRef } from "react";
import type { Stroke } from "../services/api";

interface DrawingCanvasProps {
  strokes: Stroke[];
  canDraw: boolean;
  onStrokeComplete: (stroke: Stroke) => void;
  onClear: () => void;
  disabled?: boolean;
}

const STROKE_COLOR = "#111827";
const STROKE_WIDTH = 3;

function drawStroke(context: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length === 0) {
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

export function DrawingCanvas({ strokes, canDraw, onStrokeComplete, onClear, disabled = false }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activePointsRef = useRef<Array<{ x: number; y: number }>>([]);
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

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      drawStroke(context, stroke);
    }
  }, [strokes]);

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw || disabled) {
      return;
    }

    const point = getCanvasPoint(event);

    if (!point) {
      return;
    }

    isDrawingRef.current = true;
    activePointsRef.current = [point];
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || !canDraw || disabled) {
      return;
    }

    const point = getCanvasPoint(event);

    if (!point) {
      return;
    }

    activePointsRef.current.push(point);

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context || activePointsRef.current.length < 2) {
      return;
    }

    const points = activePointsRef.current;
    const lastPoint = points[points.length - 2];
    const currentPoint = points[points.length - 1];

    context.strokeStyle = STROKE_COLOR;
    context.lineWidth = STROKE_WIDTH;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(currentPoint.x, currentPoint.y);
    context.stroke();
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || !canDraw || disabled) {
      return;
    }

    isDrawingRef.current = false;

    if (activePointsRef.current.length > 0) {
      onStrokeComplete({
        points: [...activePointsRef.current],
        color: STROKE_COLOR,
        width: STROKE_WIDTH
      });
    }

    activePointsRef.current = [];

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div className="drawing-canvas">
      <canvas
        ref={canvasRef}
        className="drawing-canvas__surface"
        width={800}
        height={500}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: "none", cursor: canDraw && !disabled ? "crosshair" : "default" }}
      />
      {canDraw ? (
        <div className="button-row button-row--compact">
          <button className="button button--secondary" type="button" disabled={disabled} onClick={onClear}>
            Clear Canvas
          </button>
        </div>
      ) : null}
    </div>
  );
}
