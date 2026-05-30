import { useRef, useState, type PointerEvent } from "react";
import type { CanvasState, DrawingPoint } from "../services/api";

interface DrawingSurfaceProps {
  canvas?: CanvasState;
  canDraw: boolean;
  isBusy?: boolean;
  onSubmitStroke: (points: DrawingPoint[]) => Promise<void>;
  onClearCanvas: () => Promise<void>;
}

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 700;

function clampCoordinate(value: number) {
  return Math.min(1, Math.max(0, value));
}

function toPolylinePoints(points: DrawingPoint[]) {
  return points
    .map((point) => `${point.x * VIEWBOX_WIDTH},${point.y * VIEWBOX_HEIGHT}`)
    .join(" ");
}

export function DrawingSurface({
  canvas,
  canDraw,
  isBusy = false,
  onSubmitStroke,
  onClearCanvas
}: DrawingSurfaceProps) {
  const canvasRef = useRef<SVGSVGElement | null>(null);
  const draftPointsRef = useRef<DrawingPoint[]>([]);
  const [draftPoints, setDraftPoints] = useState<DrawingPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getNormalizedPoint(event: PointerEvent<SVGSVGElement>): DrawingPoint | null {
    if (!canvasRef.current) {
      return null;
    }

    const bounds = canvasRef.current.getBoundingClientRect();

    if (bounds.width === 0 || bounds.height === 0) {
      return null;
    }

    return {
      x: clampCoordinate((event.clientX - bounds.left) / bounds.width),
      y: clampCoordinate((event.clientY - bounds.top) / bounds.height)
    };
  }

  function updateDraftPoints(nextPoints: DrawingPoint[]) {
    draftPointsRef.current = nextPoints;
    setDraftPoints(nextPoints);
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (!canDraw || isBusy) {
      return;
    }

    const point = getNormalizedPoint(event);

    if (!point) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setError(null);
    setIsDrawing(true);
    updateDraftPoints([point]);
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!isDrawing || !canDraw || isBusy) {
      return;
    }

    const point = getNormalizedPoint(event);

    if (!point) {
      return;
    }

    updateDraftPoints([...draftPointsRef.current, point]);
  }

  async function finishStroke() {
    if (!isDrawing) {
      return;
    }

    const points = draftPointsRef.current;
    setIsDrawing(false);

    if (points.length === 0) {
      updateDraftPoints([]);
      return;
    }

    try {
      setError(null);
      await onSubmitStroke(points);
      updateDraftPoints([]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update the canvas");
    }
  }

  async function handleClearCanvas() {
    try {
      setError(null);
      await onClearCanvas();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to clear the canvas");
    }
  }

  const strokes = canvas?.strokes ?? [];
  const hasCanvasMarks = strokes.length > 0;

  return (
    <div className="drawing-surface">
      <div className="drawing-surface__toolbar">
        <p className={`status-line ${canDraw ? "status-line--success" : "status-line--muted"}`}>
          {canDraw ? "Drawer controls enabled" : "Read-only canvas"}
        </p>
        {canDraw ? (
          <button
            className="button button--secondary"
            type="button"
            disabled={isBusy || (!hasCanvasMarks && draftPoints.length === 0)}
            onClick={() => {
              void handleClearCanvas();
            }}
          >
            Clear Canvas
          </button>
        ) : null}
      </div>

      <svg
        ref={canvasRef}
        className={`drawing-surface__canvas ${canDraw ? "drawing-surface__canvas--interactive" : ""}`}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => {
          void finishStroke();
        }}
        onPointerCancel={() => {
          void finishStroke();
        }}
      >
        <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} className="drawing-surface__background" />
        {strokes.map((stroke) =>
          stroke.points.length === 1 ? (
            <circle
              key={stroke.id}
              className="drawing-surface__stroke"
              cx={stroke.points[0].x * VIEWBOX_WIDTH}
              cy={stroke.points[0].y * VIEWBOX_HEIGHT}
              r="5"
            />
          ) : (
            <polyline
              key={stroke.id}
              className="drawing-surface__stroke"
              points={toPolylinePoints(stroke.points)}
            />
          )
        )}
        {draftPoints.length === 1 ? (
          <circle
            className="drawing-surface__stroke drawing-surface__stroke--draft"
            cx={draftPoints[0].x * VIEWBOX_WIDTH}
            cy={draftPoints[0].y * VIEWBOX_HEIGHT}
            r="5"
          />
        ) : draftPoints.length > 1 ? (
          <polyline
            className="drawing-surface__stroke drawing-surface__stroke--draft"
            points={toPolylinePoints(draftPoints)}
          />
        ) : null}
      </svg>

      <p className="drawing-surface__hint">
        {canDraw
          ? "Press and drag to add a stroke. Other players will see the update on their next refresh."
          : "Watch the shared canvas update as the drawer sketches."}
      </p>
      {error ? <p className="form__error">{error}</p> : null}
    </div>
  );
}
