import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DrawerCanvas } from "./DrawerCanvas";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  if (container.parentNode) container.parentNode.removeChild(container);
});

function render(element: React.ReactElement) {
  act(() => {
    root.render(element);
  });
}

// FR-010 (US3)
describe("<DrawerCanvas />", () => {
  it("for a NON-drawer viewer: renders the placeholder and NO <canvas> element", () => {
    render(createElement(DrawerCanvas, { viewerIsDrawer: false }));
    expect(container.querySelector("canvas")).toBeNull();
    expect(container.querySelector('[data-testid="canvas-placeholder"]')).not.toBeNull();
    expect(container.textContent).toContain("Waiting for the drawer");
  });

  it("for a drawer viewer: renders exactly one <canvas> and a Clear button", () => {
    render(createElement(DrawerCanvas, { viewerIsDrawer: true }));
    expect(container.querySelectorAll("canvas")).toHaveLength(1);
    expect(container.querySelector('[data-testid="drawer-canvas-clear"]')).not.toBeNull();
  });

  it("Clear button is wired and clickable (does not throw)", () => {
    render(createElement(DrawerCanvas, { viewerIsDrawer: true }));
    const clear = container.querySelector(
      '[data-testid="drawer-canvas-clear"]'
    ) as HTMLButtonElement;
    expect(() =>
      act(() => {
        clear.dispatchEvent(new Event("click", { bubbles: true }));
      })
    ).not.toThrow();
  });
});
