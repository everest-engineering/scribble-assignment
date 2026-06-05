import { useEffect, useRef, useState } from "react";
import type { Stroke, StrokePoint } from "../services/api";

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;

interface DrawingCanvasProps {
  strokes: Stroke[];
  canDraw: boolean;
  onStrokeComplete: (stroke: Stroke) => void;
  onClear: () => void;
}

export function DrawingCanvas({ strokes, canDraw, onStrokeComplete, onClear }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentPoints = useRef<StrokePoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

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
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#1f2937";

    const drawPoints = (points: StrokePoint[]) => {
      if (points.length === 0) {
        return;
      }

      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
      context.stroke();
    };

    strokes.forEach((stroke) => drawPoints(stroke.points));
    if (isDrawing) {
      drawPoints(currentPoints.current);
    }
  }, [strokes, isDrawing]);

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>): StrokePoint {
    const rect = event.currentTarget.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    currentPoints.current = [pointFromEvent(event)];
    setIsDrawing(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw || !isDrawing) {
      return;
    }

    currentPoints.current = [...currentPoints.current, pointFromEvent(event)];
    setIsDrawing(true);

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (context && currentPoints.current.length >= 2) {
      const points = currentPoints.current;
      context.beginPath();
      context.moveTo(points[points.length - 2].x, points[points.length - 2].y);
      context.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      context.stroke();
    }
  }

  function finishStroke() {
    if (!canDraw || !isDrawing) {
      return;
    }

    const points = currentPoints.current;
    currentPoints.current = [];
    setIsDrawing(false);

    if (points.length > 0) {
      onStrokeComplete({ points });
    }
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="drawing-canvas"
        style={{
          width: "100%",
          maxWidth: `${CANVAS_WIDTH}px`,
          aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          touchAction: "none",
          cursor: canDraw ? "crosshair" : "default"
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerLeave={finishStroke}
      />
      {canDraw ? (
        <div className="button-row button-row--compact" style={{ marginTop: "12px" }}>
          <button className="button button--secondary" type="button" onClick={onClear}>
            Clear Canvas
          </button>
        </div>
      ) : null}
    </div>
  );
}
