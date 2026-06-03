import { useEffect, useRef, useState } from "react";
import type { RoomSnapshot, Stroke } from "../services/api";
import type { RoomStore } from "../state/roomStore";

interface DrawingCanvasProps {
  room: RoomSnapshot;
  isDrawer: boolean;
  store: RoomStore;
}

export function DrawingCanvas({ room, isDrawer, store }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPointsRef = useRef<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of room.strokes) {
      if (stroke.points.length < 1) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [room.strokes]);

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    currentPointsRef.current = [getPoint(e)];
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const point = getPoint(e);
    currentPointsRef.current.push(point);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const points = currentPointsRef.current;
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
  }

  function handlePointerUp() {
    if (!isDrawing) return;
    setIsDrawing(false);
    const points = currentPointsRef.current;
    if (points.length > 0) {
      const stroke: Stroke = { points, color: "#000000", lineWidth: 4 };
      store.submitStroke(stroke).catch(() => {});
    }
    currentPointsRef.current = [];
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          cursor: isDrawer ? "crosshair" : "default",
          display: "block",
          width: "100%"
        }}
        onPointerDown={isDrawer ? handlePointerDown : undefined}
        onPointerMove={isDrawer ? handlePointerMove : undefined}
        onPointerUp={isDrawer ? handlePointerUp : undefined}
      />
      {isDrawer && (
        <div className="button-row button-row--compact" style={{ marginTop: "0.5rem" }}>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => store.clearCanvas().catch(() => {})}
          >
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
}
