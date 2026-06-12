import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";
import type { Point } from "../services/api";

const LOGICAL_SIZE = 1000;

export function Canvas() {
  const roomStore = useRoomStore();
  const { room } = useRoomState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<Point[]>([]);

  const isDrawer = room?.drawerId === roomStore.getSnapshot().participantId;

  const toLogical = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = LOGICAL_SIZE / rect.width;
    const scaleY = LOGICAL_SIZE / rect.height;
    return {
      x: Math.max(0, Math.min(LOGICAL_SIZE, (clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(LOGICAL_SIZE, (clientY - rect.top) * scaleY))
    };
  }, []);

  const drawStrokes = useCallback(() => {
    if (isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const strokes = room?.canvasStrokes ?? [];
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = (stroke.width / LOGICAL_SIZE) * rect.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const first = stroke.points[0];
      ctx.moveTo((first.x / LOGICAL_SIZE) * rect.width, (first.y / LOGICAL_SIZE) * rect.height);

      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        ctx.lineTo((p.x / LOGICAL_SIZE) * rect.width, (p.y / LOGICAL_SIZE) * rect.height);
      }
      ctx.stroke();
    }
  }, [room?.canvasStrokes, isDrawing]);

  useEffect(() => {
    drawStrokes();
  }, [drawStrokes]);

  useEffect(() => {
    const handleResize = () => drawStrokes();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawStrokes]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    setIsDrawing(true);
    currentStrokeRef.current = [toLogical(event.clientX, event.clientY)];
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawing) return;
    event.preventDefault();
    currentStrokeRef.current.push(toLogical(event.clientX, event.clientY));

    const ctx = canvasRef.current?.getContext("2d");
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const points = currentStrokeRef.current;
    if (points.length < 2) return;

    const prev = points[points.length - 2];
    const curr = points[points.length - 1];
    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = (4 / LOGICAL_SIZE) * rect.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo((prev.x / LOGICAL_SIZE) * rect.width, (prev.y / LOGICAL_SIZE) * rect.height);
    ctx.lineTo((curr.x / LOGICAL_SIZE) * rect.width, (curr.y / LOGICAL_SIZE) * rect.height);
    ctx.stroke();
  };

  const handlePointerUp = async (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawing) return;
    event.preventDefault();
    setIsDrawing(false);
    const points = currentStrokeRef.current;
    if (points.length >= 2) {
      await roomStore.submitStroke({
        points,
        color: "#000000",
        width: 4
      });
    }
    currentStrokeRef.current = [];
  };

  const handleClear = async () => {
    if (!isDrawer) return;
    await roomStore.clearCanvas();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "500px",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          touchAction: "none",
          cursor: isDrawer ? "crosshair" : "default"
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      {isDrawer && (
        <div className="button-row button-row--compact">
          <button className="button button--secondary" type="button" onClick={handleClear}>
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
}
