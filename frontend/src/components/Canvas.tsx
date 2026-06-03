import { useEffect, useRef } from "react";
import type { Point, Stroke } from "../services/api";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const MAX_POINTS_PER_STROKE = 250;

interface CanvasProps {
  strokes: Stroke[];
  isDrawer: boolean;
  disabled?: boolean;
  onStrokeComplete: (points: Point[]) => void;
  onClear: () => void;
}

function decimatePoints(points: Point[]) {
  if (points.length <= MAX_POINTS_PER_STROKE) {
    return points;
  }

  const step = Math.ceil(points.length / MAX_POINTS_PER_STROKE);
  const decimated: Point[] = [];

  for (let index = 0; index < points.length; index += step) {
    decimated.push(points[index]);
  }

  if (decimated[decimated.length - 1] !== points[points.length - 1]) {
    decimated.push(points[points.length - 1]);
  }

  return decimated.slice(0, MAX_POINTS_PER_STROKE);
}

function drawStrokes(context: CanvasRenderingContext2D, strokes: Stroke[]) {
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (const stroke of strokes) {
    if (stroke.points.length < 2) {
      continue;
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
}

export function Canvas({ strokes, isDrawer, disabled = false, onStrokeComplete, onClear }: CanvasProps) {
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

    drawStrokes(context, strokes);
  }, [strokes]);

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: Math.round((event.clientX - rect.left) * scaleX),
      y: Math.round((event.clientY - rect.top) * scaleY)
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || disabled) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    activePointsRef.current = [getCanvasPoint(event)];
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || disabled || !isDrawingRef.current) {
      return;
    }

    activePointsRef.current.push(getCanvasPoint(event));

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    drawStrokes(context, strokes);

    const previewPoints = activePointsRef.current;

    if (previewPoints.length < 2) {
      return;
    }

    context.strokeStyle = "#000000";
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(previewPoints[0].x, previewPoints[0].y);

    for (let index = 1; index < previewPoints.length; index += 1) {
      context.lineTo(previewPoints[index].x, previewPoints[index].y);
    }

    context.stroke();
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || disabled || !isDrawingRef.current) {
      return;
    }

    isDrawingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);

    const points = decimatePoints(activePointsRef.current);
    activePointsRef.current = [];

    if (points.length >= 2) {
      onStrokeComplete(points);
    }
  }

  return (
    <div className="canvas-shell">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          width: "100%",
          maxWidth: `${CANVAS_WIDTH}px`,
          height: "auto",
          aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
          border: "1px solid #e5e7eb",
          touchAction: "none",
          cursor: isDrawer && !disabled ? "crosshair" : "default"
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      {isDrawer ? (
        <div className="button-row button-row--compact" style={{ marginTop: "8px" }}>
          <button
            className="button button--secondary"
            type="button"
            disabled={disabled}
            onClick={() => onClear()}
          >
            Clear Canvas
          </button>
        </div>
      ) : null}
    </div>
  );
}
