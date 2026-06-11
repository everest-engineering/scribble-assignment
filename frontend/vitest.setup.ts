// Enable React 18's act(...) testing environment flag for jsdom.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom does not implement <canvas>.getContext; provide a minimal 2D-context
// stub so components mounting a canvas don't hit jsdom's "not-implemented"
// warning. Tests that need real canvas pixels should override this per-test.
if (typeof HTMLCanvasElement !== "undefined") {
  (HTMLCanvasElement.prototype as unknown as { getContext: () => unknown }).getContext = () => ({
    lineWidth: 0,
    lineCap: "round",
    lineJoin: "round",
    strokeStyle: "#000",
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    clearRect() {}
  });
}
