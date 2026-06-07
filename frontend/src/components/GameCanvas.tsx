import { useCallback, useEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
}

interface GameCanvasProps {
  isDrawer: boolean;
  canvasData: string;
  roomCode: string;
  participantId: string;
  onSave: (strokes: string) => void;
}

export function GameCanvas({ isDrawer, canvasData, onSave }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStroke = useRef<Point[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!canvasData) {
      setStrokes([]);
      return;
    }
    try {
      const parsed = JSON.parse(canvasData) as Stroke[];
      setStrokes(parsed);
    } catch {
      setStrokes([]);
    }
  }, [canvasData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
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
  }, [strokes]);

  function getPos(e: React.MouseEvent | React.TouchEvent): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0] ?? (e as React.TouchEvent).changedTouches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }

  function debounceSave(newStrokes: Stroke[]) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onSave(JSON.stringify(newStrokes));
    }, 500);
  }

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    e.preventDefault();
    setIsDrawing(true);
    currentStroke.current = [getPos(e)];
  }, [isDrawer]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawer) return;
    e.preventDefault();
    const pos = getPos(e);
    currentStroke.current.push(pos);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pts = currentStroke.current;
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  }, [isDrawing, isDrawer]);

  const handleEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawer) return;
    e.preventDefault();
    setIsDrawing(false);

    const newStroke: Stroke = { points: [...currentStroke.current] };
    const newStrokes = [...strokes, newStroke];
    setStrokes(newStrokes);
    currentStroke.current = [];
    debounceSave(newStrokes);
  }, [isDrawing, isDrawer, strokes]);

  function handleClear() {
    if (!isDrawer) return;
    setStrokes([]);
    onSave("[]");
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        style={{
          width: "100%",
          height: "500px",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          cursor: isDrawer ? "crosshair" : "default",
          touchAction: isDrawer ? "none" : "auto"
        }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
      {isDrawer && (
        <div className="button-row" style={{ marginTop: "8px" }}>
          <button className="button button--secondary" type="button" onClick={handleClear}>
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
}
