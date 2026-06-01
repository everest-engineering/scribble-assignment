import { useEffect, useRef } from "react";

interface CanvasProps {
  isDrawer: boolean;
  canvasData: string | null;
  onCanvasUpdate?: (dataUrl: string) => void;
}

export function Canvas({ isDrawer, canvasData, onCanvasUpdate }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!isDrawer) return;

    let lastX = 0;
    let lastY = 0;

    function startDrawing(x: number, y: number) {
      isDrawing.current = true;
      lastX = x;
      lastY = y;
    }

    function draw(x: number, y: number) {
      if (!isDrawing.current) return;

      ctx!.beginPath();
      ctx!.moveTo(lastX, lastY);
      ctx!.lineTo(x, y);
      ctx!.strokeStyle = "#000000";
      ctx!.lineWidth = 3;
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";
      ctx!.stroke();

      lastX = x;
      lastY = y;
      hasDrawn.current = true;
    }

    function stopDrawing() {
      if (isDrawing.current) {
        isDrawing.current = false;
        if (hasDrawn.current && onCanvasUpdate) {
          onCanvasUpdate(canvas!.toDataURL());
        }
      }
    }

    function getPos(event: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }

    function onMouseDown(event: MouseEvent) {
      const pos = getPos(event);
      startDrawing(pos.x, pos.y);
    }

    function onMouseMove(event: MouseEvent) {
      const pos = getPos(event);
      draw(pos.x, pos.y);
    }

    function onMouseUp() {
      stopDrawing();
    }

    function onMouseLeave() {
      stopDrawing();
    }

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [isDrawer, onCanvasUpdate]);

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (onCanvasUpdate) {
      onCanvasUpdate(canvas.toDataURL());
    }
  }

  if (!isDrawer && canvasData) {
    return (
      <div className="canvas-wrapper">
        <img src={canvasData} alt="Drawing" className="canvas-image" />
      </div>
    );
  }

  if (!isDrawer) {
    return (
      <div className="canvas-wrapper">
        <div className="canvas-placeholder">Waiting for the drawer to draw...</div>
      </div>
    );
  }

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="canvas-element"
        style={{ border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "crosshair", backgroundColor: "#ffffff" }}
      />
      <div className="button-row" style={{ marginTop: "12px" }}>
        <button className="button button--secondary" type="button" onClick={handleClear}>
          Clear Canvas
        </button>
      </div>
    </div>
  );
}
