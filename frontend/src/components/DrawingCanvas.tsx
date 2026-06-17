import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const lastSaveRef = useRef<number>(0);
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  const isDrawer = participantId === room?.drawerId;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allStrokes = strokesRef.current;
    for (const stroke of allStrokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, []);

  const saveCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const now = Date.now();
    if (now - lastSaveRef.current < 500) return;
    lastSaveRef.current = now;

    const dataUrl = canvas.toDataURL();
    roomStore.saveDrawing(dataUrl);
  }, [roomStore]);

  useEffect(() => {
    if (!room || !isDrawer) return;

    strokesRef.current = [];
    currentStrokeRef.current = null;
    redraw();
  }, [room?.status, isDrawer, redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width - 4;
      canvas.height = 400;
      redraw();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [redraw]);

  function getCanvasPoint(e: React.MouseEvent | React.TouchEvent): Point | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function handlePointerDown(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawer) return;
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;

    setIsDrawing(true);
    currentStrokeRef.current = {
      points: [point],
      color: "#1f2937",
      width: 3
    };
  }

  function handlePointerMove(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing || !currentStrokeRef.current) return;
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;

    currentStrokeRef.current.points.push(point);
    redraw();
  }

  function handlePointerUp(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawing || !currentStrokeRef.current) return;

    if (currentStrokeRef.current.points.length > 0) {
      strokesRef.current.push(currentStrokeRef.current);
    }

    currentStrokeRef.current = null;
    setIsDrawing(false);
    saveCanvas();
  }

  async function handleClear() {
    strokesRef.current = [];
    currentStrokeRef.current = null;
    redraw();
    await roomStore.clearCanvas();
  }

  return (
    <div className="drawing-canvas-container">
      {isDrawer ? (
        <>
          <canvas
            ref={canvasRef}
            className="drawing-canvas"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
          <div className="drawing-canvas-toolbar">
            <button className="button button--secondary" onClick={handleClear}>
              Clear Canvas
            </button>
          </div>
        </>
      ) : room?.drawingData ? (
        <img
          src={room.drawingData}
          alt="Current drawing"
          className="drawing-canvas drawing-canvas--viewer"
        />
      ) : (
        <div className="drawing-canvas-placeholder">
          <p>Waiting for the drawer to draw...</p>
        </div>
      )}
    </div>
  );
}
