import { useRef } from "react";

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  function getContext() {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext("2d") : null;
  }

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    isDrawing.current = true;
    const ctx = getContext();
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const ctx = getContext();
    if (!ctx) return;
    ctx.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
    ctx.stroke();
  }

  function handleMouseUp() {
    isDrawing.current = false;
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
