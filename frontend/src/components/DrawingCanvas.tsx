import { useEffect, useRef, type PointerEvent } from "react";
import type { DrawCommand, Point } from "../services/api";

interface DrawingCanvasProps {
  drawCommands: DrawCommand[];
  isDrawer: boolean;
  onStroke: (points: Point[]) => void;
  onClear: () => void;
}

export function DrawingCanvas({ drawCommands, isDrawer, onStroke, onClear }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Point[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#1f2937";

    for (const cmd of drawCommands) {
      if (cmd.type === "clear") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else if (cmd.type === "stroke" && cmd.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(cmd.points[0].x, cmd.points[0].y);
        for (let i = 1; i < cmd.points.length; i++) {
          ctx.lineTo(cmd.points[i].x, cmd.points[i].y);
        }
        ctx.stroke();
      }
    }
  }, [drawCommands]);

  function getCanvasPos(e: PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function handlePointerDown(e: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;
    isDrawingRef.current = true;
    const pos = getCanvasPos(e);
    currentStrokeRef.current = [pos];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function handlePointerMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    const pos = getCanvasPos(e);
    currentStrokeRef.current.push(pos);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function handlePointerUp() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentStrokeRef.current.length >= 2) {
      onStroke(currentStrokeRef.current);
    }
    currentStrokeRef.current = [];
  }

  function handleClear() {
    if (!isDrawer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  }

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          width: "100%",
          height: "auto",
          cursor: isDrawer ? "crosshair" : "default",
          touchAction: "none",
          display: "block",
          borderRadius: "8px"
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      {isDrawer ? (
        <button
          className="button button--secondary"
          style={{ position: "absolute", top: "8px", right: "8px", minHeight: "36px", fontSize: "0.875rem" }}
          onClick={handleClear}
          type="button"
        >
          Clear Canvas
        </button>
      ) : null}
    </div>
  );
}
