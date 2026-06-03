import { useCallback, useEffect, useRef, useState } from "react";
import type { Point, Stroke } from "../services/api";

// Strokes are stored in this fixed logical coordinate space, then scaled to the
// rendered element size so every viewer sees the same drawing regardless of size.
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const STROKE_COLOR = "#1f2937";
const STROKE_WIDTH = 4;

interface DrawingCanvasProps {
  strokes: Stroke[];
  isDrawer: boolean;
  /** Called with the full stroke list whenever the drawer finishes a stroke. */
  onCommit: (strokes: Stroke[]) => void;
}

function drawStrokes(canvas: HTMLCanvasElement, strokes: Stroke[]) {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineCap = "round";
  context.lineJoin = "round";

  for (const stroke of strokes) {
    if (stroke.points.length === 0) {
      continue;
    }

    context.beginPath();
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.width;
    context.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (const point of stroke.points.slice(1)) {
      context.lineTo(point.x, point.y);
    }
    context.stroke();
  }
}

export function DrawingCanvas({ strokes, isDrawer, onCommit }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The drawer is the local authority over their own strokes; guessers follow the
  // synced strokes coming in via polling.
  const [localStrokes, setLocalStrokes] = useState<Stroke[]>(strokes);
  const activeStroke = useRef<Stroke | null>(null);
  const latestStrokes = useRef<Stroke[]>(strokes);

  useEffect(() => {
    if (!isDrawer) {
      setLocalStrokes(strokes);
    }
  }, [isDrawer, strokes]);

  useEffect(() => {
    latestStrokes.current = localStrokes;
    const canvas = canvasRef.current;
    if (canvas) {
      drawStrokes(canvas, localStrokes);
    }
  }, [localStrokes]);

  const toLogicalPoint = useCallback((event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT
    };
  }, []);

  // The in-progress stroke is kept as the last element of localStrokes so each
  // pointer move can extend it; on pointer up it is committed to the server.
  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const stroke: Stroke = {
      color: STROKE_COLOR,
      width: STROKE_WIDTH,
      points: [toLogicalPoint(event)]
    };
    activeStroke.current = stroke;
    setLocalStrokes((current) => [...current, stroke]);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || !activeStroke.current) {
      return;
    }
    activeStroke.current.points.push(toLogicalPoint(event));
    const extended = { ...activeStroke.current };
    setLocalStrokes((current) => [...current.slice(0, -1), extended]);
  }

  function finishStroke() {
    if (!isDrawer || !activeStroke.current) {
      return;
    }
    activeStroke.current = null;
    onCommit(latestStrokes.current);
  }

  return (
    <div className="drawing-canvas">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="drawing-canvas__surface"
        style={{
          width: "100%",
          aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          touchAction: "none",
          cursor: isDrawer ? "crosshair" : "default"
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerLeave={finishStroke}
      />
    </div>
  );
}
