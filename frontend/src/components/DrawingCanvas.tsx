import { useEffect, useRef } from "react";

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    function getPos(event: MouseEvent, el: HTMLCanvasElement) {
      const rect = el.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function onMouseDown(event: MouseEvent) {
      const el = canvasRef.current;
      const c = el?.getContext("2d");
      if (!el || !c) return;
      isDrawing.current = true;
      const { x, y } = getPos(event, el);
      c.beginPath();
      c.moveTo(x, y);
    }

    function onMouseMove(event: MouseEvent) {
      if (!isDrawing.current) return;
      const el = canvasRef.current;
      const c = el?.getContext("2d");
      if (!el || !c) return;
      const { x, y } = getPos(event, el);
      c.lineTo(x, y);
      c.stroke();
    }

    function onMouseUp() {
      isDrawing.current = false;
    }

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);
    };
  }, []);

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return (
    <div className="drawing-canvas">
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{
          display: "block",
          width: "100%",
          border: "1px solid #e5e7eb",
          borderRadius: "4px",
          backgroundColor: "#ffffff",
          cursor: "crosshair",
          touchAction: "none"
        }}
      />
      <div className="button-row button-row--compact" style={{ marginTop: "8px" }}>
        <button className="button button--secondary" type="button" onClick={handleClear}>
          Clear Canvas
        </button>
      </div>
    </div>
  );
}
