import { useCallback, useEffect, useRef, useState } from "react";
import type { Stroke } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

interface DrawingCanvasProps {
  isDrawer: boolean;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 480;
const SYNC_DEBOUNCE_MS = 800;

export function DrawingCanvas({ isDrawer }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Array<{ x: number; y: number }>>([]);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roomStore = useRoomStore();
  const { room } = useRoomState();
  const [localStrokes, setLocalStrokes] = useState<Stroke[]>([]);

  // Render all strokes onto the canvas
  const redraw = useCallback((strokes: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, []);

  // Sync canvas strokes from backend (for guessers via polling)
  useEffect(() => {
    if (!isDrawer && room?.canvasStrokes) {
      setLocalStrokes(room.canvasStrokes);
      redraw(room.canvasStrokes);
    }
  }, [isDrawer, redraw, room?.canvasStrokes]);

  // Debounced backend sync for drawer
  const scheduleSyncToBackend = useCallback((strokes: Stroke[]) => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = setTimeout(() => {
      roomStore.updateCanvas(strokes).catch(console.error);
    }, SYNC_DEBOUNCE_MS);
  }, [roomStore]);

  function getCanvasPoint(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;
    isDrawingRef.current = true;
    const point = getCanvasPoint(event);
    currentStrokeRef.current = [point];

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawer || !isDrawingRef.current) return;
    const point = getCanvasPoint(event);
    currentStrokeRef.current.push(point);

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  }

  function handleMouseUp() {
    if (!isDrawer || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    const finishedStroke: Stroke = { points: [...currentStrokeRef.current] };
    currentStrokeRef.current = [];

    const updated = [...localStrokes, finishedStroke];
    setLocalStrokes(updated);
    scheduleSyncToBackend(updated);
  }

  function handleMouseLeave() {
    if (isDrawingRef.current) {
      handleMouseUp();
    }
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    setLocalStrokes([]);
    roomStore.updateCanvas([]).catch(console.error);
  }

  return (
    <div className="drawing-canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="drawing-canvas"
        style={{
          cursor: isDrawer ? "crosshair" : "default",
          border: "1px solid #e5e7eb",
          borderRadius: "6px",
          backgroundColor: "#ffffff",
          width: "100%",
          display: "block"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {isDrawer && (
        <div className="button-row button-row--compact" style={{ marginTop: "8px" }}>
          <button
            id="clear-canvas-btn"
            className="button button--secondary"
            type="button"
            onClick={handleClear}
          >
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
}
