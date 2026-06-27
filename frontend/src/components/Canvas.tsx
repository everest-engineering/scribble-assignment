import { useCallback, useEffect, useRef, useState } from "react";
import type { DrawingStroke } from "../services/api";

const COLORS = ["#000000", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7"];
const PEN_WIDTH = 3;

interface CanvasProps {
  isDrawer: boolean;
  strokes: DrawingStroke[];
  secretWord?: string | null;
  onAddStrokes?: (strokes: DrawingStroke[]) => void;
  onClearCanvas?: () => void;
}

export function Canvas({ isDrawer, strokes, secretWord, onAddStrokes, onClearCanvas }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const currentStrokeRef = useRef<{ points: { x: number; y: number }[]; color: string }>({ points: [], color: COLORS[0] });
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokesRef.current) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }

    const inProgress = currentStrokeRef.current;
    if (inProgress.points.length >= 2) {
      ctx.strokeStyle = inProgress.color;
      ctx.lineWidth = PEN_WIDTH;
      ctx.beginPath();
      ctx.moveTo(inProgress.points[0].x, inProgress.points[0].y);
      for (let i = 1; i < inProgress.points.length; i++) {
        ctx.lineTo(inProgress.points[i].x, inProgress.points[i].y);
      }
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    redraw();
  }, [strokes, redraw]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    const pos = getCanvasPos(e);
    setIsDrawing(true);
    currentStrokeRef.current = { points: [pos], color: currentColor };
  }, [isDrawer, getCanvasPos]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer) return;
    const pos = getCanvasPos(e);
    currentStrokeRef.current.points.push(pos);
    currentStrokeRef.current.color = currentColor;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const points = currentStrokeRef.current.points;
    const len = points.length;
    if (len < 2) return;

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = PEN_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(points[len - 2].x, points[len - 2].y);
    ctx.lineTo(points[len - 1].x, points[len - 1].y);
    ctx.stroke();
  }, [isDrawing, isDrawer, getCanvasPos, currentColor]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !isDrawer) return;
    setIsDrawing(false);
    const stroke = currentStrokeRef.current;
    if (stroke.points.length < 2) return;

    const newStroke: DrawingStroke = {
      id: crypto.randomUUID(),
      points: stroke.points,
      color: stroke.color,
      width: PEN_WIDTH
    };
    onAddStrokes?.([newStroke]);
    currentStrokeRef.current = { points: [], color: COLORS[0] };
  }, [isDrawing, isDrawer, onAddStrokes]);

  const handleClear = useCallback(() => {
    onClearCanvas?.();
  }, [onClearCanvas]);

  return (
    <div className="canvas-container">
      {isDrawer && secretWord && (
        <div className="canvas-secret-word">
          Word: <strong>{secretWord}</strong>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="canvas-element"
        style={{
          border: "1px solid #d1d5db",
          borderRadius: "4px",
          backgroundColor: "#ffffff",
          cursor: isDrawer ? "crosshair" : "default",
          display: "block"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {isDrawer && (
        <div className="canvas-toolbar">
          <div className="canvas-colors">
            {COLORS.map((color) => (
              <button
                key={color}
                className="canvas-color-btn"
                style={{
                  backgroundColor: color,
                  border: currentColor === color ? "2px solid #000" : "1px solid #d1d5db",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  cursor: "pointer"
                }}
                onClick={() => setCurrentColor(color)}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
          <button className="button button--secondary" onClick={handleClear}>
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
}
