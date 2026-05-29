import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { DrawingPoint, DrawingStroke, DrawingStrokeInput } from "../services/api";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 520;
const STROKE_COLOR = "#111827";
const STROKE_SIZE = 4;

interface CanvasBoardProps {
  strokes: DrawingStroke[];
  isDrawer: boolean;
  onDraw: (stroke: DrawingStrokeInput) => Promise<unknown>;
  onClear: () => Promise<unknown>;
}

function drawStroke(context: CanvasRenderingContext2D, stroke: Pick<DrawingStroke, "color" | "size" | "points">) {
  if (stroke.points.length < 2) {
    return;
  }

  context.beginPath();
  context.strokeStyle = stroke.color;
  context.lineWidth = stroke.size;
  context.lineCap = "round";
  context.lineJoin = "round";

  const [firstPoint, ...remainingPoints] = stroke.points;
  context.moveTo(firstPoint.x * CANVAS_WIDTH, firstPoint.y * CANVAS_HEIGHT);

  remainingPoints.forEach((point) => {
    context.lineTo(point.x * CANVAS_WIDTH, point.y * CANVAS_HEIGHT);
  });

  context.stroke();
}

function normalizePoint(event: PointerEvent<HTMLCanvasElement>): DrawingPoint {
  const bounds = event.currentTarget.getBoundingClientRect();

  return {
    x: Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1),
    y: Math.min(Math.max((event.clientY - bounds.top) / bounds.height, 0), 1)
  };
}

export function CanvasBoard({ strokes, isDrawer, onDraw, onClear }: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activePoints, setActivePoints] = useState<DrawingPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    strokes.forEach((stroke) => drawStroke(context, stroke));

    if (activePoints.length >= 2) {
      drawStroke(context, {
        color: STROKE_COLOR,
        size: STROKE_SIZE,
        points: activePoints
      });
    }
  }, [activePoints, strokes]);

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || isSaving) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setError(null);
    setActivePoints([normalizePoint(event)]);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || activePoints.length === 0 || isSaving) {
      return;
    }

    setActivePoints((points) => [...points, normalizePoint(event)]);
  }

  async function finishStroke() {
    if (!isDrawer || activePoints.length === 0) {
      return;
    }

    const points = activePoints;
    setActivePoints([]);

    if (points.length < 2) {
      return;
    }

    try {
      setIsSaving(true);
      await onDraw({
        color: STROKE_COLOR,
        size: STROKE_SIZE,
        points
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save drawing");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClear() {
    try {
      setError(null);
      setIsSaving(true);
      await onClear();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to clear canvas");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="canvas-board">
      <canvas
        ref={canvasRef}
        className={`canvas-board__surface ${isDrawer ? "canvas-board__surface--active" : "canvas-board__surface--readonly"}`}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => void finishStroke()}
        onPointerCancel={() => void finishStroke()}
        aria-label={isDrawer ? "Drawing canvas" : "Read-only drawing canvas"}
      />
      <div className="canvas-board__footer">
        <p className="canvas-board__hint">{isDrawer ? "Draw with your pointer. Release to sync the stroke." : "Watch the drawer. The canvas updates through polling."}</p>
        <button className="button button--secondary" type="button" disabled={!isDrawer || isSaving} onClick={() => void handleClear()}>
          Clear Canvas
        </button>
      </div>
      {error ? <p className="form__error">{error}</p> : null}
    </div>
  );
}
