import { useEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
}

interface Line {
  points: Point[];
}

interface DrawingCanvasProps {
  isDrawer: boolean;
  drawingData?: string;
  onChange?: (data: string) => void;
}

export function DrawingCanvas({ isDrawer, drawingData, onChange }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Sync guesser canvas with incoming drawingData
  useEffect(() => {
    if (!isDrawer && drawingData) {
      try {
        const parsed = JSON.parse(drawingData) as Line[];
        setLines(parsed);
      } catch (e) {
        // Handle parsing errors gracefully
      }
    } else if (!isDrawer && !drawingData) {
      setLines([]);
    }
  }, [isDrawer, drawingData]);

  // Redraw canvas whenever lines state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw lines
    ctx.strokeStyle = "#1e293b"; // Slate-800
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    lines.forEach((line) => {
      if (line.points.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(line.points[0].x, line.points[0].y);
      for (let index = 1; index < line.points.length; index += 1) {
        ctx.lineTo(line.points[index].x, line.points[index].y);
      }
      ctx.stroke();
    });
  }, [lines]);

  function getMousePos(event: React.MouseEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Scale coords to match canvas internal width/height
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  }

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;
    setIsDrawing(true);
    const pos = getMousePos(event);
    setLines((prev) => [...prev, { points: [pos] }]);
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawer || !isDrawing) return;
    const pos = getMousePos(event);
    setLines((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const lastLine = { ...copy[copy.length - 1] };
      lastLine.points = [...lastLine.points, pos];
      copy[copy.length - 1] = lastLine;
      return copy;
    });
  }

  function handleMouseUpOrLeave() {
    if (!isDrawer || !isDrawing) return;
    setIsDrawing(false);
    // Send updated canvas data to parent/store
    if (onChange) {
      onChange(JSON.stringify(lines));
    }
  }

  function handleClear() {
    if (!isDrawer) return;
    setLines([]);
    if (onChange) {
      onChange(JSON.stringify([]));
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          backgroundColor: "#ffffff",
          cursor: isDrawer ? "crosshair" : "not-allowed",
          width: "100%",
          height: "auto",
          aspectRatio: "3/2"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      />
      {isDrawer && (
        <button
          className="button button--secondary"
          onClick={handleClear}
          style={{ alignSelf: "flex-end" }}
        >
          Clear Canvas
        </button>
      )}
    </div>
  );
}
