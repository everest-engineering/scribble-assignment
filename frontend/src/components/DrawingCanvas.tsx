import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";
import type { DrawingPoint, Stroke } from "../services/api";

const VIEWBOX_WIDTH = 960;
const VIEWBOX_HEIGHT = 560;
const STROKE_COLOR = "#111827";
const STROKE_LINE_WIDTH = 4;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pointFromEvent(event: ReactPointerEvent<SVGSVGElement>) {
  const svg = event.currentTarget;
  const rect = svg.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) {
    return null;
  }

  return {
    x: clamp(((event.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH, 0, VIEWBOX_WIDTH),
    y: clamp(((event.clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT, 0, VIEWBOX_HEIGHT)
  };
}

function renderStroke(stroke: Stroke, key: string) {
  const points = stroke.points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <polyline
      key={key}
      points={points}
      fill="none"
      stroke={stroke.color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={stroke.lineWidth}
    />
  );
}

export function DrawingCanvas() {
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const draftStrokeRef = useRef<DrawingPoint[]>([]);
  const [draftStroke, setDraftStroke] = useState<DrawingPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const viewer = room?.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer =
    Boolean(room && participantId && viewer) &&
    (viewer?.role === "drawer" || viewer?.id === room?.currentDrawerId);
  const canDraw = Boolean(room && participantId && room.status === "game" && isDrawer);
  const strokes = room?.drawing ?? [];

  useEffect(() => {
    if (isDrawing) {
      return;
    }

    draftStrokeRef.current = [];
    setDraftStroke([]);
  }, [room?.code, room?.drawing.length, isDrawing]);

  useEffect(() => {
    if (canDraw) {
      return;
    }

    draftStrokeRef.current = [];
    setDraftStroke([]);
    setIsDrawing(false);
  }, [canDraw]);

  async function handleClear() {
    try {
      setStatusMessage(null);
      await roomStore.clearCanvas();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to clear canvas");
    }
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (!canDraw) {
      return;
    }

    const point = pointFromEvent(event);

    if (!point) {
      return;
    }

    event.preventDefault();
    setStatusMessage(null);
    draftStrokeRef.current = [point];
    setDraftStroke([point]);
    setIsDrawing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!canDraw || !isDrawing) {
      return;
    }

    const point = pointFromEvent(event);

    if (!point) {
      return;
    }

    event.preventDefault();
    draftStrokeRef.current = [...draftStrokeRef.current, point];
    setDraftStroke([...draftStrokeRef.current]);
  }

  async function finishStroke(event: ReactPointerEvent<SVGSVGElement>) {
    if (!canDraw || !isDrawing) {
      return;
    }

    event.preventDefault();

    const stroke = draftStrokeRef.current;
    draftStrokeRef.current = [];
    setDraftStroke([]);
    setIsDrawing(false);

    try {
      if (stroke.length > 0) {
        await roomStore.submitStroke(stroke);
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to save stroke");
    } finally {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture is best-effort.
      }
    }
  }

  if (!room) {
    return null;
  }

  return (
    <div className="drawing-canvas">
      <svg
        ref={svgRef}
        className={`drawing-canvas__surface${canDraw ? " drawing-canvas__surface--active" : ""}`}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        aria-label="Shared drawing canvas"
        role="img"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
        onPointerLeave={finishStroke}
      >
        <rect className="drawing-canvas__background" x="0" y="0" width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} />
        {strokes.length === 0 && !isDrawing ? (
          <text className="drawing-canvas__placeholder" x={VIEWBOX_WIDTH / 2} y={VIEWBOX_HEIGHT / 2}>
            Waiting for the first stroke...
          </text>
        ) : null}
        {strokes.map((stroke, index) => renderStroke(stroke, `stroke-${index}`))}
        {draftStroke.length > 0
          ? renderStroke(
              {
                points: draftStroke,
                color: STROKE_COLOR,
                lineWidth: STROKE_LINE_WIDTH
              },
              "draft-stroke"
            )
          : null}
      </svg>

      <div className="drawing-canvas__footer">
        <p className="drawing-canvas__hint">
          {canDraw ? "Use the fixed black pen. Release to sync your stroke to everyone." : "Waiting for the drawer to update the canvas."}
        </p>
        {statusMessage ? <p className="drawing-canvas__status">{statusMessage}</p> : null}
        {canDraw ? (
          <div className="button-row button-row--compact">
            <button className="button button--secondary drawing-canvas__clear-button" type="button" onClick={handleClear}>
              Clear Canvas
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
