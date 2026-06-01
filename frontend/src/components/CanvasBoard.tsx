import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { CanvasEvent, CanvasStroke } from "../services/api";

interface CanvasBoardProps {
  canvasEvents: CanvasEvent[];
  isDrawer: boolean;
  onDrawStroke?: (stroke: CanvasStroke) => Promise<void> | void;
  onClear?: () => Promise<void> | void;
  disabled?: boolean;
}

const DEFAULT_STROKE_COLOR = "#111827";
const DEFAULT_LINE_WIDTH = 4;

function toCanvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: CanvasStroke
) {
  const [firstPoint, ...points] = stroke.points;

  if (!firstPoint) {
    return;
  }

  context.beginPath();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = stroke.color;
  context.lineWidth = stroke.lineWidth;
  context.moveTo(firstPoint.x, firstPoint.y);

  for (const point of points) {
    context.lineTo(point.x, point.y);
  }

  context.stroke();
}

export function CanvasBoard({ canvasEvents, isDrawer, onDrawStroke, onClear, disabled = false }: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);

  const canEdit = isDrawer && !disabled;

  const renderedEvents = useMemo(() => canvasEvents.filter((event) => event.type === "stroke" && event.stroke), [canvasEvents]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (const event of renderedEvents) {
      if (event.stroke) {
        drawStroke(context, event.stroke);
      }
    }

    if (isDrawing && points.length > 0) {
      drawStroke(context, {
        points,
        color: DEFAULT_STROKE_COLOR,
        lineWidth: DEFAULT_LINE_WIDTH
      });
    }
  }, [isDrawing, points, renderedEvents]);

  function finishStroke() {
    if (!canEdit || points.length === 0) {
      setIsDrawing(false);
      setPoints([]);
      return;
    }

    const stroke: CanvasStroke = {
      points,
      color: DEFAULT_STROKE_COLOR,
      lineWidth: DEFAULT_LINE_WIDTH
    };

    setIsDrawing(false);
    setPoints([]);
    void Promise.resolve(onDrawStroke?.(stroke)).catch(() => undefined);
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!canEdit || !canvasRef.current) {
      return;
    }

    const point = toCanvasPoint(canvasRef.current, event.clientX, event.clientY);
    setIsDrawing(true);
    setPoints([point]);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!canEdit || !isDrawing || !canvasRef.current) {
      return;
    }

    const point = toCanvasPoint(canvasRef.current, event.clientX, event.clientY);
    setPoints((currentPoints) => [...currentPoints, point]);
  }

  function handlePointerUp() {
    if (!canEdit) {
      return;
    }

    finishStroke();
  }

  return (
    <div className="canvas-board">
      <canvas
        ref={canvasRef}
        className={`drawing-canvas${canEdit ? " drawing-canvas--editable" : ""}`}
        width={960}
        height={540}
        aria-label="Drawing canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          width: "100%",
          height: "auto",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "20px",
          touchAction: "none",
          cursor: canEdit ? "crosshair" : "default"
        }}
      />
      <div className="canvas-board__actions button-row button-row--compact">
        {isDrawer ? (
          <button
            className="button button--secondary"
            type="button"
            disabled={!onClear || disabled}
            onClick={() => {
              void Promise.resolve(onClear?.()).catch(() => undefined);
            }}
          >
            Clear Canvas
          </button>
        ) : null}
      </div>
      {!isDrawer ? (
        <p className="canvas-board__hint">Only the drawer can draw or clear the canvas.</p>
      ) : null}
    </div>
  );
}
