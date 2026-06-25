import { useEffect, useRef, useState, type PointerEvent } from "react";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 540;

interface DrawingCanvasProps {
  drawingDataUrl: string | null;
  disabled: boolean;
  hint: string;
  onDrawingChange: (drawingDataUrl: string) => void;
}

function prepareCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 5;
  context.strokeStyle = "#111827";

  return context;
}

function getCanvasPoint(canvas: HTMLCanvasElement, event: PointerEvent<HTMLCanvasElement>) {
  const bounds = canvas.getBoundingClientRect();

  return {
    x: ((event.clientX - bounds.left) / bounds.width) * CANVAS_WIDTH,
    y: ((event.clientY - bounds.top) / bounds.height) * CANVAS_HEIGHT
  };
}

export function DrawingCanvas({ drawingDataUrl, disabled, hint, onDrawingChange }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawing, setHasDrawing] = useState(Boolean(drawingDataUrl));

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = prepareCanvas(canvas);

    setHasDrawing(Boolean(drawingDataUrl));

    if (!context || !drawingDataUrl) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    };
    image.src = drawingDataUrl;
  }, [drawingDataUrl]);

  function startDrawing(event: PointerEvent<HTMLCanvasElement>) {
    if (disabled || !canvasRef.current) {
      return;
    }

    const context = canvasRef.current.getContext("2d");

    if (!context) {
      return;
    }

    const point = getCanvasPoint(canvasRef.current, event);
    isDrawingRef.current = true;
    setHasDrawing(true);
    canvasRef.current.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function draw(event: PointerEvent<HTMLCanvasElement>) {
    if (disabled || !isDrawingRef.current || !canvasRef.current) {
      return;
    }

    const context = canvasRef.current.getContext("2d");

    if (!context) {
      return;
    }

    const point = getCanvasPoint(canvasRef.current, event);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function finishDrawing(event: PointerEvent<HTMLCanvasElement>) {
    if (disabled || !isDrawingRef.current || !canvasRef.current) {
      return;
    }

    isDrawingRef.current = false;
    canvasRef.current.releasePointerCapture(event.pointerId);
    onDrawingChange(canvasRef.current.toDataURL("image/png"));
  }

  const showHint = !hasDrawing;

  return (
    <div className="drawing-board">
      <canvas
        ref={canvasRef}
        className="drawing-board__canvas"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
        onPointerLeave={finishDrawing}
        aria-label="Drawing canvas"
      />
      {showHint ? <p className="drawing-board__hint">{hint}</p> : null}
    </div>
  );
}
