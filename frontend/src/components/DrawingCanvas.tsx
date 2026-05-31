import { useEffect, useRef } from "react";
import type { Stroke } from "../services/api";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const DEFAULT_COLOR = "#111827";
const DEFAULT_WIDTH = 4;

interface DrawingCanvasProps {
  strokes: Stroke[];
  interactive: boolean;
  onStrokeComplete?: (stroke: Omit<Stroke, "id">) => void;
  onClear?: () => void;
}

function drawStrokes(context: CanvasRenderingContext2D, strokes: Stroke[]) {
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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

export function DrawingCanvas({ strokes, interactive, onStrokeComplete, onClear }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activePointsRef = useRef<{ x: number; y: number }[]>([]);
  const drawingRef = useRef(false);

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

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!interactive) {
      return;
    }

    const point = getCanvasPoint(event);
    if (!point) {
      return;
    }

    drawingRef.current = true;
    activePointsRef.current = [point];
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!interactive || !drawingRef.current) {
      return;
    }

    const point = getCanvasPoint(event);
    if (!point) {
      return;
    }

    activePointsRef.current.push(point);

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context || !canvas) {
      return;
    }

    drawStrokes(context, strokes);

    const activePoints = activePointsRef.current;
    if (activePoints.length < 2) {
      return;
    }

    context.strokeStyle = DEFAULT_COLOR;
    context.lineWidth = DEFAULT_WIDTH;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(activePoints[activePoints.length - 2].x, activePoints[activePoints.length - 2].y);
    context.lineTo(activePoints[activePoints.length - 1].x, activePoints[activePoints.length - 1].y);
    context.stroke();
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!interactive || !drawingRef.current) {
      return;
    }

    drawingRef.current = false;

    if (activePointsRef.current.length > 0) {
      onStrokeComplete?.({
        color: DEFAULT_COLOR,
        width: DEFAULT_WIDTH,
        points: activePointsRef.current.map((point) => ({ ...point }))
      });
    }

    activePointsRef.current = [];
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div className="drawing-canvas">
      <canvas
        ref={canvasRef}
        className="drawing-canvas__surface"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          width: "100%",
          height: "500px",
          touchAction: interactive ? "none" : "auto",
          cursor: interactive ? "crosshair" : "default",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb"
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      {interactive && onClear ? (
        <div className="button-row button-row--compact" style={{ marginTop: "8px" }}>
          <button className="button button--secondary" type="button" onClick={onClear}>
            Clear canvas
          </button>
        </div>
      ) : null}
    </div>
  );
}
