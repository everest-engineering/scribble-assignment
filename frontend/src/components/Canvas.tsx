import { useEffect, useRef, useCallback } from "react";
import { useRoomStore, useRoomState } from "../state/roomStore";
import type { DrawStroke } from "../services/api";

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const roomStore = useRoomStore();
  const { room } = useRoomState();

  const isDrawer = room?.drawerId === roomStore.getSnapshot().participantId;
  const isPlaying = room?.status === "playing";
  const enabled = isDrawer && isPlaying;

  const renderAllStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const strokes = room?.drawStrokes ?? [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }
  }, [room?.drawStrokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1f2937";
    }
  }, []);

  useEffect(() => {
    renderAllStrokes();
  }, [renderAllStrokes]);

  function getCanvasPoint(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!enabled) return;
    isDrawingRef.current = true;
    const point = getCanvasPoint(e);
    currentStrokeRef.current = [point];
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || !enabled) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const point = getCanvasPoint(e);
    currentStrokeRef.current.push(point);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  async function handleMouseUp() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = [];
    if (stroke.length > 0) {
      await roomStore.submitDrawStroke(stroke);
    }
  }

  function handleMouseLeave() {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      const stroke = currentStrokeRef.current;
      currentStrokeRef.current = [];
      if (stroke.length > 0) {
        roomStore.submitDrawStroke(stroke);
      }
    }
  }

  async function handleClear() {
    if (!enabled) return;
    await roomStore.clearDrawing();
  }

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        style={{ width: "100%", height: "500px", cursor: enabled ? "crosshair" : "default" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {enabled && (
        <div className="button-row" style={{ marginTop: "8px" }}>
          <button className="button button--secondary" type="button" onClick={handleClear}>
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
}
