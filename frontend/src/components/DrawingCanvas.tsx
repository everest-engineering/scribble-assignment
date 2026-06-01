import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";
import type { DrawingPoint, DrawingPath } from "../services/api";

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 320;

function getCanvasPoint(
  event: PointerEvent<HTMLCanvasElement>,
): DrawingPoint {
  const canvas = event.currentTarget;
  const bounds = canvas.getBoundingClientRect();

  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  };
}

function drawPath(
  context: CanvasRenderingContext2D,
  path: DrawingPath,
  strokeOnly = false,
) {
  if (path.points.length === 0) {
    return;
  }

  context.strokeStyle = path.color;
  context.lineWidth = path.width;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(path.points[0].x, path.points[0].y);

  for (let index = 1; index < path.points.length; index += 1) {
    const point = path.points[index];
    context.lineTo(point.x, point.y);
  }

  if (!strokeOnly) {
    context.stroke();
  } else {
    context.stroke();
  }
}

interface DrawingCanvasProps {
  readOnly?: boolean;
}

export function DrawingCanvas({ readOnly = false }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<DrawingPoint[]>([]);

  const canDraw = !readOnly && room?.drawerId === participantId;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !room) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    room.drawingPaths.forEach((path) => {
      drawPath(context, path);
    });

    if (currentPoints.length > 0) {
      drawPath(
        context,
        {
          points: currentPoints,
          color: "#000000",
          width: 2,
        },
      );
    }
  }, [room?.drawingPaths, currentPoints, room]);

  async function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!canDraw) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDrawing(true);
    setCurrentPoints([getCanvasPoint(event)]);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!canDraw || !isDrawing) {
      return;
    }

    setCurrentPoints((previousPoints) => [
      ...previousPoints,
      getCanvasPoint(event),
    ]);
  }

  async function finishDrawing() {
    if (!canDraw || currentPoints.length === 0) {
      setIsDrawing(false);
      setCurrentPoints([]);
      return;
    }

    try {
      await roomStore.appendDrawing({
        points: currentPoints,
        color: "#000000",
        width: 2,
      });
    } catch {
      // Error flows into store state and will show via room error.
    } finally {
      setIsDrawing(false);
      setCurrentPoints([]);
    }
  }

  function handlePointerUp() {
    finishDrawing();
  }

  function handlePointerLeave() {
    if (isDrawing) {
      finishDrawing();
    }
  }

  async function handleClear() {
    if (!canDraw) {
      return;
    }

    try {
      await roomStore.clearDrawing();
    } catch {
      // Error flows into store state.
    }
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          width: "100%",
          height: "auto",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          touchAction: canDraw ? "none" : "auto",
          cursor: canDraw ? "crosshair" : "default",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      />
      {!readOnly ? (
        <div className="button-row" style={{ marginTop: "12px" }}>
          <button
            className="button button--secondary"
            type="button"
            onClick={handleClear}
            disabled={!canDraw}
          >
            Clear Canvas
          </button>
        </div>
      ) : null}
    </div>
  );
}
