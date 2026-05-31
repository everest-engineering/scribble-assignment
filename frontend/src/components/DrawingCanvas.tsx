import { useEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
}

type Stroke = Point[];

interface DrawingCanvasProps {
  readOnly: boolean;
  drawingData: string;
  onChange?: (drawingData: string) => void;
}

export function DrawingCanvas({ readOnly, drawingData, onChange }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Point[]>([]);

  const strokesRef = useRef<Stroke[]>(strokes);
  strokesRef.current = strokes;

  // Parse strokes from drawingData prop when readOnly is true, or if it is cleared
  useEffect(() => {
    if (!drawingData || drawingData === "[]") {
      setStrokes([]);
    } else if (readOnly) {
      try {
        const parsed = JSON.parse(drawingData) as Stroke[];
        if (Array.isArray(parsed)) {
          setStrokes(parsed);
        } else {
          setStrokes([]);
        }
      } catch {
        setStrokes([]);
      }
    }
  }, [drawingData, readOnly]);

  // Redraw all strokes when strokes or canvas size changes
  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1f2937"; // Dark slate
    ctx.lineWidth = 4;

    const listToDraw = strokesRef.current;

    for (const stroke of listToDraw) {
      if (stroke.length === 0) continue;

      ctx.beginPath();
      const first = stroke[0];
      ctx.moveTo(first.x * canvas.width, first.y * canvas.height);

      if (stroke.length === 1) {
        ctx.lineTo(first.x * canvas.width, first.y * canvas.height);
      } else {
        for (let idx = 1; idx < stroke.length; idx += 1) {
          const pt = stroke[idx];
          ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
        }
      }
      ctx.stroke();
    }
  };

  // Resize canvas to match container layout size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        redraw();
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Trigger redraw whenever strokes changes
  useEffect(() => {
    redraw();
  }, [strokes]);

  // Touch handlers attached directly to DOM to prevent scrolling on touch devices
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || readOnly) return;

    const getTouchCoords = (e: TouchEvent): Point | null => {
      if (e.touches.length === 0) return null;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      return {
        x: (touch.clientX - rect.left) / rect.width,
        y: (touch.clientY - rect.top) / rect.height
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const pt = getTouchCoords(e);
      if (!pt) return;

      isDrawingRef.current = true;
      currentStrokeRef.current = [pt];

      // Draw point instantly for visual feedback
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#1f2937";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(pt.x * canvas.width, pt.y * canvas.height);
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
        ctx.stroke();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const pt = getTouchCoords(e);
      if (!pt) return;

      const lastPt = currentStrokeRef.current[currentStrokeRef.current.length - 1];
      currentStrokeRef.current.push(pt);

      const ctx = canvas.getContext("2d");
      if (ctx && lastPt) {
        ctx.beginPath();
        ctx.moveTo(lastPt.x * canvas.width, lastPt.y * canvas.height);
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
        ctx.stroke();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      isDrawingRef.current = false;

      if (currentStrokeRef.current.length > 0) {
        const updatedStrokes = [...strokes, currentStrokeRef.current];
        setStrokes(updatedStrokes);
        currentStrokeRef.current = [];
        if (onChange) {
          onChange(JSON.stringify(updatedStrokes));
        }
      }
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [readOnly, strokes, onChange]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const pt = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };

    isDrawingRef.current = true;
    currentStrokeRef.current = [pt];

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1f2937";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pt.x * canvas.width, pt.y * canvas.height);
      ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
      ctx.stroke();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const pt = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };

    const lastPt = currentStrokeRef.current[currentStrokeRef.current.length - 1];
    currentStrokeRef.current.push(pt);

    const ctx = canvas.getContext("2d");
    if (ctx && lastPt) {
      ctx.beginPath();
      ctx.moveTo(lastPt.x * canvas.width, lastPt.y * canvas.height);
      ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
      ctx.stroke();
    }
  };

  const handleMouseUpOrLeave = () => {
    if (!isDrawingRef.current || readOnly) return;
    isDrawingRef.current = false;

    if (currentStrokeRef.current.length > 0) {
      const updatedStrokes = [...strokes, currentStrokeRef.current];
      setStrokes(updatedStrokes);
      currentStrokeRef.current = [];
      if (onChange) {
        onChange(JSON.stringify(updatedStrokes));
      }
    }
  };

  const handleUndo = () => {
    if (readOnly || strokes.length === 0) return;
    const updatedStrokes = strokes.slice(0, -1);
    setStrokes(updatedStrokes);
    if (onChange) {
      onChange(JSON.stringify(updatedStrokes));
    }
  };

  const handleClear = () => {
    if (readOnly) return;
    setStrokes([]);
    if (onChange) {
      onChange("[]");
    }
  };

  // Keyboard shortcut for Undo (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    if (readOnly) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
          return;
        }
        e.preventDefault();
        
        const currentStrokes = strokesRef.current;
        if (currentStrokes.length > 0) {
          const updatedStrokes = currentStrokes.slice(0, -1);
          setStrokes(updatedStrokes);
          if (onChange) {
            onChange(JSON.stringify(updatedStrokes));
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readOnly, onChange]);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
        height: "100%"
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        style={{
          border: "2px solid #e5e7eb",
          borderRadius: "12px",
          backgroundColor: "#ffffff",
          cursor: readOnly ? "default" : "crosshair",
          touchAction: "none",
          width: "100%",
          height: "450px"
        }}
      />
      {!readOnly && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <button
            id="undo-button"
            className="button button--secondary"
            onClick={handleUndo}
            disabled={strokes.length === 0}
          >
            Undo Last Stroke
          </button>
          <button
            id="clear-canvas-button"
            className="button button--secondary"
            onClick={handleClear}
          >
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
}
