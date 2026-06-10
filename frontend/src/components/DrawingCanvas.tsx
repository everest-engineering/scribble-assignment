import { useEffect, useRef, useCallback } from "react";
import type { CanvasAction, CanvasActionSubmission } from "../services/api";

interface DrawingCanvasProps {
  isDrawer: boolean;
  canvasActions: CanvasAction[];
  onStrokeComplete: (action: CanvasActionSubmission) => void;
  onClear: () => void;
}

function drawCanvasAction(ctx: CanvasRenderingContext2D, action: CanvasAction) {
  if (action.type === "clear") {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    return;
  }
  if (action.points.length < 2) {
    ctx.beginPath();
    ctx.arc(action.points[0].x, action.points[0].y, action.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = action.color;
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(action.points[0].x, action.points[0].y);
  for (let i = 1; i < action.points.length; i++) {
    ctx.lineTo(action.points[i].x, action.points[i].y);
  }
  ctx.strokeStyle = action.color;
  ctx.lineWidth = action.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

function replayActions(canvas: HTMLCanvasElement, actions: CanvasAction[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const action of actions) {
    drawCanvasAction(ctx, action);
  }
}

export function DrawingCanvas({ isDrawer, canvasActions, onStrokeComplete, onClear }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);
  const lastActionsRef = useRef<CanvasAction[]>([]);

  const getPos = (event: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    isDrawingRef.current = true;
    const pos = getPos(event);
    currentPointsRef.current = [pos];
  }, [isDrawer]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !isDrawer) return;
    const pos = getPos(event);
    currentPointsRef.current.push(pos);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const points = currentPointsRef.current;
    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.fill();
    } else {
      const prev = points[points.length - 2];
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
  }, [isDrawer]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current || !isDrawer) return;
    isDrawingRef.current = false;
    const points = currentPointsRef.current;
    if (points.length > 0) {
      onStrokeComplete({
        type: "stroke",
        points,
        color: "#000000",
        width: 3
      });
    }
    currentPointsRef.current = [];
  }, [isDrawer, onStrokeComplete]);

  const handleClear = useCallback(() => {
    if (!isDrawer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  }, [isDrawer, onClear]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (canvasActions !== lastActionsRef.current) {
      lastActionsRef.current = canvasActions;
      if (!isDrawer) {
        replayActions(canvas, canvasActions);
      }
    }
  }, [canvasActions, isDrawer]);

  return (
    <div className="drawing-canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        width={600}
        height={500}
        style={{
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          cursor: isDrawer ? "crosshair" : "default",
          display: "block",
          width: "100%",
          height: "auto",
          aspectRatio: "600 / 500"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {isDrawer && (
        <div className="button-row" style={{ marginTop: "0.5rem" }}>
          <button className="button button--secondary" type="button" onClick={handleClear}>
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
}
