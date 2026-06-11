import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

const COLORS = [
  "#000000", "#ffffff", "#ff0000", "#0000ff",
  "#00cc00", "#ffcc00", "#ff8800", "#cc00cc"
];

const DEFAULT_COLOR = "#000000";
const BRUSH_SIZE = 3;

interface Point {
  x: number;
  y: number;
}

export interface StrokeData {
  color: string;
  points: Point[];
}

interface CanvasProps {
  readOnly?: boolean;
  strokes: StrokeData[];
  onStrokeComplete?: (stroke: StrokeData) => void;
  onClear?: () => void;
}

export function Canvas({ readOnly = false, strokes, onStrokeComplete, onClear }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const lastPoint = useRef<Point | null>(null);
  const currentStroke = useRef<Point[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = BRUSH_SIZE;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [strokes]);

  const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    setIsDrawing(true);
    const pos = getPos(e);
    lastPoint.current = pos;
    currentStroke.current = [pos];
  }, [readOnly, getPos]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !lastPoint.current) return;

    const current = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(current.x, current.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = BRUSH_SIZE;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastPoint.current = current;
    currentStroke.current.push(current);
  }, [isDrawing, readOnly, color, getPos]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPoint.current = null;

    if (currentStroke.current.length > 1 && onStrokeComplete) {
      onStrokeComplete({ color, points: [...currentStroke.current] });
    }
    currentStroke.current = [];
  }, [isDrawing, color, onStrokeComplete]);

  const handleClear = useCallback(() => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (onClear) onClear();
  }, [readOnly, onClear]);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        className="canvas-element"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {!readOnly && (
        <div className="canvas-toolbar">
          <div className="canvas-colors">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`canvas-color-swatch${c === color ? " canvas-color-swatch--active" : ""}`}
                style={{ backgroundColor: c, border: c === "#ffffff" ? "1px solid #d1d5db" : undefined }}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
          <button className="button button--secondary canvas-clear" onClick={handleClear}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
