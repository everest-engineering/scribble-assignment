import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CanvasBoard } from "./CanvasBoard";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("CanvasBoard", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  async function render() {
    await act(async () => {
      root.render(createElement(CanvasBoard));
      await Promise.resolve();
    });
  }

  it("renders a canvas element and a Clear button", async () => {
    await render();

    const canvas = container.querySelector('[data-testid="canvas-board"]');
    expect(canvas).not.toBeNull();
    expect((canvas as HTMLCanvasElement).tagName).toBe("CANVAS");

    const clearButton = Array.from(container.querySelectorAll("button")).find(
      (b) => (b.textContent ?? "").trim() === "Clear"
    );
    expect(clearButton).toBeDefined();
  });

  it("starts with a stroke count of 0 and increments when a mouse-down begins a stroke", async () => {
    await render();

    const counter = container.querySelector('[data-testid="canvas-stroke-count"]');
    expect(counter?.textContent).toBe("0");

    await act(async () => {
      const canvas = container.querySelector(
        '[data-testid="canvas-board"]'
      ) as HTMLCanvasElement;
      // jsdom does not implement getBoundingClientRect with real geometry,
      // but the handler will still execute and increment the counter.
      canvas.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, clientX: 5, clientY: 5 })
      );
      await Promise.resolve();
    });

    const counterAfter = container.querySelector('[data-testid="canvas-stroke-count"]');
    expect(counterAfter?.textContent).toBe("1");
  });

  it("resets the stroke count to 0 when Clear is pressed", async () => {
    await render();

    await act(async () => {
      const canvas = container.querySelector(
        '[data-testid="canvas-board"]'
      ) as HTMLCanvasElement;
      canvas.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, clientX: 5, clientY: 5 })
      );
      await Promise.resolve();
    });

    expect(
      container.querySelector('[data-testid="canvas-stroke-count"]')?.textContent
    ).toBe("1");

    await act(async () => {
      const clearButton = Array.from(container.querySelectorAll("button")).find(
        (b) => (b.textContent ?? "").trim() === "Clear"
      ) as HTMLButtonElement;
      clearButton.click();
      await Promise.resolve();
    });

    expect(
      container.querySelector('[data-testid="canvas-stroke-count"]')?.textContent
    ).toBe("0");
  });
});
