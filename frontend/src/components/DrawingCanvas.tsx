import { useRef } from "react";
import type { Point } from "../services/api";

interface Props {
  onStrokeComplete?: (path: Point[]) => void;
  onClearCanvas?: () => void;
}

export function DrawingCanvas({ onStrokeComplete, onClearCanvas }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentPath = useRef<Point[]>([]);

  function getContext() {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext("2d") : null;
  }

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    isDrawing.current = true;
    currentPath.current = [];
    const x = event.nativeEvent.offsetX;
    const y = event.nativeEvent.offsetY;
    currentPath.current.push({ x, y });
    const ctx = getContext();
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const x = event.nativeEvent.offsetX;
    const y = event.nativeEvent.offsetY;
    currentPath.current.push({ x, y });
    const ctx = getContext();
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handleMouseUp() {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currentPath.current.length > 1) {
      onStrokeComplete?.(currentPath.current);
    }
    currentPath.current = [];
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClearCanvas?.();
  }

  return (
    <div className="drawing-canvas">
      <canvas
        ref={canvasRef}
        width={700}
        height={500}
        style={{ display: "block", cursor: "crosshair", backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="button-row button-row--compact" style={{ marginTop: "0.5rem" }}>
        <button className="button button--secondary" type="button" onClick={handleClear}>
          Clear
        </button>
      </div>
    </div>
  );
}
