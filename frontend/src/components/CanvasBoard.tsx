import { useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";

interface Point {
  x: number;
  y: number;
}

export function CanvasBoard() {
  const [strokes, setStrokes] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  function getPointerPosition(
    event: MouseEvent<HTMLDivElement> | ReactPointerEvent<HTMLDivElement>
  ) {
    // Primary approach: use bounding client rect + clientX/Y
    const target = event.currentTarget as HTMLElement;
    const rect = target?.getBoundingClientRect?.();

    if (rect && rect.width > 0 && rect.height > 0) {
      const left = rect.left;
      const top = rect.top;
      const width = rect.width;
      const height = rect.height;

      let x = (event as any).clientX - left;
      let y = (event as any).clientY - top;

      // Clamp to canvas bounds to avoid dots rendering outside the box.
      const maxX = Math.max(0, width - 1);
      const maxY = Math.max(0, height - 1);
      x = Math.max(0, Math.min(maxX, x));
      y = Math.max(0, Math.min(maxY, y));

      return { x, y };
    }

    // Fallbacks: use native offsets when bounding rect isn't available (JSDOM/build quirks)
    const native: any = (event as any).nativeEvent || {};
    if (typeof native.offsetX === "number" && typeof native.offsetY === "number") {
      return { x: native.offsetX, y: native.offsetY };
    }

    // Last resort: use element offsetParent position
    const offsetLeft = target?.offsetLeft ?? 0;
    const offsetTop = target?.offsetTop ?? 0;
    return { x: (event as any).clientX - offsetLeft, y: (event as any).clientY - offsetTop };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    // Try to capture the pointer so move events continue to be delivered
    try {
      const pid = (event as any).pointerId;
      if (typeof target.setPointerCapture === "function" && pid != null) {
        // @ts-ignore setPointerCapture exists on HTMLElement in browsers
        target.setPointerCapture(pid);
      }
    } catch (err) {
      // ignore - capture not supported
    }

    setIsDrawing(true);
    setStrokes((current) => [...current, getPointerPosition(event as any)]);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) {
    if (!isDrawing) return;
    setStrokes((current) => [...current, getPointerPosition(event as any)]);
  }

  function handlePointerUp(event?: ReactPointerEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) {
    const target = event?.currentTarget as HTMLElement | undefined;
    try {
      const pid = event && (event as any).pointerId;
      if (target && typeof target.releasePointerCapture === "function" && pid != null) {
        // @ts-ignore
        target.releasePointerCapture(pid);
      }
    } catch (err) {
      // ignore
    }

    setIsDrawing(false);
  }

  function handleClear() {
    setStrokes([]);
    setIsDrawing(false);
  }

  return (
    <div>
      <div
        className="canvas-board"
        role="img"
        aria-label="Drawing canvas"
        onPointerDown={handlePointerDown as any}
        onPointerMove={handlePointerMove as any}
        onPointerUp={handlePointerUp as any}
        onMouseDown={handlePointerDown as any}
        onMouseMove={handlePointerMove as any}
        onMouseUp={handlePointerUp as any}
        onMouseLeave={handlePointerUp as any}
        style={{
          minHeight: 320,
          backgroundColor: "#ffffff",
          border: "1px solid #d1d5db",
          overflow: "hidden",
          position: "relative",
          touchAction: "none",
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        {strokes.map((point, index) => (
          <div
            key={`${point.x}-${point.y}-${index}`}
            className="canvas-board__dot"
            style={{
              position: "absolute",
              left: point.x,
              top: point.y,
              transform: "translate(-50%, -50%)",
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#111827",
              pointerEvents: "none"
            }}
          />
        ))}
      </div>
      <div className="button-row button-row--compact" style={{ marginTop: 12 }}>
        <button className="button button--secondary" type="button" onClick={handleClear}>
          Clear Canvas
        </button>
      </div>
    </div>
  );
}
