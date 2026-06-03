import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DrawingCanvas } from "./DrawingCanvas";

// jsdom does not implement HTMLCanvasElement.getContext — provide a minimal mock
beforeAll(() => {
  const mockCtx = {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn()
  };
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx) as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue("data:image/png;base64,mock") as typeof HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.setPointerCapture = vi.fn() as typeof HTMLCanvasElement.prototype.setPointerCapture;

  // jsdom does not ship PointerEvent — polyfill with MouseEvent
  if (typeof PointerEvent === "undefined") {
    class PointerEventPolyfill extends MouseEvent {
      pointerId: number;
      constructor(type: string, init?: PointerEventInit) {
        super(type, init);
        this.pointerId = init?.pointerId ?? 1;
      }
    }
    (globalThis as unknown as Record<string, unknown>).PointerEvent = PointerEventPolyfill;
  }
});

afterEach(cleanup);

// Helper to create a minimal PointerEvent-like object
function pointerEvent(type: string, x = 50, y = 50) {
  return new PointerEvent(type, {
    clientX: x,
    clientY: y,
    bubbles: true,
    pointerId: 1
  });
}

// T016: interactive mode (drawer)
describe("DrawingCanvas — interactive mode (isDrawer=true)", () => {
  it("renders a canvas element with aria-label", () => {
    render(
      <DrawingCanvas
        isDrawer={true}
        canvasDataUrl={null}
        onCanvasChange={vi.fn()}
        onClear={vi.fn()}
      />
    );
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(canvas?.getAttribute("aria-label")).toBe("Drawing canvas");
  });

  it("renders a Clear button when isDrawer is true", () => {
    render(
      <DrawingCanvas
        isDrawer={true}
        canvasDataUrl={null}
        onCanvasChange={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /clear/i })).toBeTruthy();
  });

  it("calls onClear when Clear button is clicked", () => {
    const onClear = vi.fn();
    render(
      <DrawingCanvas
        isDrawer={true}
        canvasDataUrl={null}
        onCanvasChange={vi.fn()}
        onClear={onClear}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("calls onCanvasChange after pointer stroke (pointerdown + pointermove + pointerup)", () => {
    const onCanvasChange = vi.fn();
    render(
      <DrawingCanvas
        isDrawer={true}
        canvasDataUrl={null}
        onCanvasChange={onCanvasChange}
        onClear={vi.fn()}
      />
    );
    const canvas = document.querySelector("canvas")!;
    fireEvent(canvas, pointerEvent("pointerdown", 10, 10));
    fireEvent(canvas, pointerEvent("pointermove", 20, 20));
    fireEvent(canvas, pointerEvent("pointerup", 30, 30));
    expect(onCanvasChange).toHaveBeenCalledTimes(1);
    expect(typeof onCanvasChange.mock.calls[0][0]).toBe("string");
  });
});

// T026: read-only mode (guesser)
describe("DrawingCanvas — read-only mode (isDrawer=false)", () => {
  it("renders a canvas element", () => {
    render(
      <DrawingCanvas
        isDrawer={false}
        canvasDataUrl={null}
        onCanvasChange={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(document.querySelector("canvas")).toBeTruthy();
  });

  it("does not render a Clear button when isDrawer is false", () => {
    render(
      <DrawingCanvas
        isDrawer={false}
        canvasDataUrl={null}
        onCanvasChange={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: /clear/i })).toBeNull();
  });

  it("does not call onCanvasChange on pointer events when isDrawer is false", () => {
    const onCanvasChange = vi.fn();
    render(
      <DrawingCanvas
        isDrawer={false}
        canvasDataUrl={null}
        onCanvasChange={onCanvasChange}
        onClear={vi.fn()}
      />
    );
    const canvas = document.querySelector("canvas")!;
    fireEvent(canvas, pointerEvent("pointerdown", 10, 10));
    fireEvent(canvas, pointerEvent("pointermove", 20, 20));
    fireEvent(canvas, pointerEvent("pointerup", 30, 30));
    expect(onCanvasChange).not.toHaveBeenCalled();
  });
});
