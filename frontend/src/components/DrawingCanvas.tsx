import { useCallback, useEffect, useRef, useState } from "react";
import type { DrawingStroke } from "../services/api";

const COLORS = ["#000000", "#ffffff", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];
const WIDTHS = [2, 4, 6, 10];
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

interface DrawingCanvasProps {
  isDrawer: boolean;
  serverStrokes: DrawingStroke[];
  clearVersion: number;
  onStrokesSubmit: (strokes: DrawingStroke[]) => void;
  onClear: () => void;
}

export function DrawingCanvas({ isDrawer, serverStrokes, clearVersion, onStrokesSubmit, onClear }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(WIDTHS[1]);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStroke = useRef<{ x: number; y: number }[]>([]);
  const strokesRef = useRef<{ server: DrawingStroke[]; local: DrawingStroke[]; drawing: boolean }>({
    server: [],
    local: [],
    drawing: false
  });

  const clearVersionRef = useRef(clearVersion);
  useEffect(() => {
    if (clearVersion !== clearVersionRef.current) {
      clearVersionRef.current = clearVersion;
      strokesRef.current.server = [];
      strokesRef.current.local = [];
      redraw();
    }
  }, [clearVersion]);

  useEffect(() => {
    strokesRef.current.server = serverStrokes;
    strokesRef.current.drawing = false;
    redraw();
  }, [serverStrokes]);

  function getCanvasPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const allStrokes = [...strokesRef.current.server, ...strokesRef.current.local];

    for (const stroke of allStrokes) {
      if (stroke.points.length === 0) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    const pos = getCanvasPos(e);
    setIsDrawing(true);
    currentStroke.current = [pos];
  }, [isDrawer]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer) return;
    const pos = getCanvasPos(e);
    currentStroke.current.push(pos);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pts = currentStroke.current;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  }, [isDrawing, isDrawer, color, width]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !isDrawer) return;
    setIsDrawing(false);

    if (currentStroke.current.length > 0) {
      const stroke: DrawingStroke = {
        color,
        width,
        points: currentStroke.current
      };
      strokesRef.current.local.push(stroke);
      onStrokesSubmit([stroke]);
    }
    currentStroke.current = [];
  }, [isDrawing, isDrawer, color, width, onStrokesSubmit]);

  return (
    <div className="drawing-canvas-wrapper">
      {isDrawer && (
        <div className="drawing-toolbar">
          <div className="drawing-toolbar__group">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`color-swatch ${color === c ? "color-swatch--active" : ""}`}
                style={{ backgroundColor: c, border: c === "#ffffff" ? "1px solid #d1d5db" : undefined }}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
          <div className="drawing-toolbar__group">
            {WIDTHS.map((w) => (
              <button
                key={w}
                className={`width-option ${width === w ? "width-option--active" : ""}`}
                onClick={() => setWidth(w)}
                aria-label={`Width ${w}px`}
              >
                <span className="width-option__line" style={{ width: `${w * 2}px`, height: `${w}px` }} />
              </button>
            ))}
          </div>
          <button className="button button--secondary button--small" onClick={onClear}>
            Clear Canvas
          </button>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="drawing-canvas"
        style={{ cursor: isDrawer ? "crosshair" : "default", border: "1px solid #e5e7eb" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}
