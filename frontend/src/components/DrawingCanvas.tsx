import { useEffect, useRef, useState } from "react";
import type { DrawingData, DrawingPath, DrawingPoint } from "../services/api";

interface DrawingCanvasProps {
  drawing: DrawingData;
  canDraw: boolean;
  onChange: (drawing: DrawingData) => Promise<void> | void;
  onClear: () => Promise<void> | void;
}

const strokeColor = "#111827";
const strokeWidth = 4;

function drawPaths(canvas: HTMLCanvasElement, paths: DrawingPath[]) {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineCap = "round";
  context.lineJoin = "round";

  paths.forEach((path) => {
    if (path.points.length === 0) {
      return;
    }

    context.strokeStyle = path.color;
    context.lineWidth = path.width;
    context.beginPath();
    context.moveTo(path.points[0].x, path.points[0].y);
    path.points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.stroke();
  });
}

function pointerPoint(canvas: HTMLCanvasElement, event: React.PointerEvent<HTMLCanvasElement>): DrawingPoint {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height
  };
}

export function DrawingCanvas({ drawing, canDraw, onChange, onClear }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [draftPath, setDraftPath] = useState<DrawingPath | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    drawPaths(canvas, draftPath ? [...drawing.paths, draftPath] : drawing.paths);
  }, [drawing, draftPath]);

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw || !canvasRef.current) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDraftPath({
      color: strokeColor,
      width: strokeWidth,
      points: [pointerPoint(canvasRef.current, event)]
    });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw || !canvasRef.current || !draftPath) {
      return;
    }

    setDraftPath({
      ...draftPath,
      points: [...draftPath.points, pointerPoint(canvasRef.current, event)]
    });
  }

  async function commitDraftPath() {
    if (!draftPath) {
      return;
    }

    const nextDrawing = {
      paths: [...drawing.paths, draftPath]
    };
    setDraftPath(null);
    await onChange(nextDrawing);
  }

  return (
    <div className="drawing-surface">
      <canvas
        ref={canvasRef}
        className="drawing-surface__canvas"
        width={900}
        height={560}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={commitDraftPath}
        onPointerCancel={() => setDraftPath(null)}
      />
      <div className="button-row button-row--compact">
        <button className="button button--secondary" type="button" disabled={!canDraw} onClick={onClear}>
          Clear Canvas
        </button>
      </div>
    </div>
  );
}
