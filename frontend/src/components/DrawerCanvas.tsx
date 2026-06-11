import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

interface DrawerCanvasProps {
  viewerIsDrawer: boolean;
  width?: number;
  height?: number;
}

const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT = 320;

export function DrawerCanvas({
  viewerIsDrawer,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT
}: DrawerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!viewerIsDrawer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      return;
    }
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#222";
  }, [viewerIsDrawer]);

  if (!viewerIsDrawer) {
    return (
      <section className="drawer-canvas drawer-canvas--placeholder" data-testid="canvas-placeholder">
        <p>Waiting for the drawer…</p>
      </section>
    );
  }

  function getRelativePoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    drawingRef.current = true;
    lastPointRef.current = getRelativePoint(event);
    canvasRef.current?.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const point = getRelativePoint(event);
    const last = lastPointRef.current ?? point;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false;
    lastPointRef.current = null;
    canvasRef.current?.releasePointerCapture(event.pointerId);
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return (
    <section className="drawer-canvas" data-testid="drawer-canvas">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="drawer-canvas__surface"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        data-testid="drawer-canvas-surface"
      />
      <button
        type="button"
        className="drawer-canvas__clear"
        onClick={handleClear}
        data-testid="drawer-canvas-clear"
      >
        Clear
      </button>
    </section>
  );
}
