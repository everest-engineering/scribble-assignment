import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Canvas } from "./Canvas";

function createMockContext() {
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => createMockContext()) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
});

afterEach(cleanup);

describe("Canvas", () => {
  it("renders a canvas element", () => {
    render(<Canvas strokes={[]} />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("does not render clear button in readOnly mode", () => {
    render(<Canvas strokes={[]} readOnly />);
    expect(screen.queryByText("Clear Canvas")).toBeNull();
  });

  it("renders clear button when not readOnly and onClear provided", () => {
    render(<Canvas strokes={[]} onClear={vi.fn()} />);
    expect(screen.getByText("Clear Canvas")).toBeDefined();
  });

  it("calls onClear when clear button is clicked", () => {
    const onClear = vi.fn();
    render(<Canvas strokes={[]} onClear={onClear} />);
    fireEvent.click(screen.getByText("Clear Canvas"));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("calls onStrokesChange when drawing completes", () => {
    const onStrokesChange = vi.fn();
    render(<Canvas strokes={[]} onStrokesChange={onStrokesChange} />);

    const canvas = document.querySelector("canvas")!;
    const rect = { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => null };
    canvas.getBoundingClientRect = vi.fn(() => rect);

    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 20 });
    fireEvent.pointerMove(canvas, { clientX: 30, clientY: 40 });
    fireEvent.pointerUp(canvas, { clientX: 30, clientY: 40 });

    expect(onStrokesChange).toHaveBeenCalledOnce();
    const newStrokes = onStrokesChange.mock.calls[0][0];
    expect(newStrokes).toHaveLength(1);
    expect(newStrokes[0]).toHaveLength(2);
  });

  it("does not draw or call onStrokesChange in readOnly mode", () => {
    const onStrokesChange = vi.fn();
    render(<Canvas strokes={[]} readOnly onStrokesChange={onStrokesChange} />);

    const canvas = document.querySelector("canvas")!;
    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 20 });
    fireEvent.pointerUp(canvas, { clientX: 10, clientY: 20 });

    expect(onStrokesChange).not.toHaveBeenCalled();
  });
});
