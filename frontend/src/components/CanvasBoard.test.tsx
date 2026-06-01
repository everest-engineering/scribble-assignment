import { describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { CanvasBoard } from "./CanvasBoard";

describe("CanvasBoard", () => {
  it("renders a drawing surface and allows clearing", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<CanvasBoard />);
    });

    const canvas = container.querySelector(".canvas-board");
    expect(canvas).toBeInstanceOf(HTMLElement);

    act(() => {
      canvas?.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: 10,
          clientY: 10
        })
      );
    });

    act(() => {
      canvas?.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: 20,
          clientY: 20
        })
      );
    });

    expect(container.querySelectorAll(".canvas-board__dot").length).toBeGreaterThan(0);

    const clearButton = container.querySelector("button");
    expect(clearButton?.textContent).toBe("Clear Canvas");

    act(() => {
      clearButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelectorAll(".canvas-board__dot").length).toBe(0);

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
