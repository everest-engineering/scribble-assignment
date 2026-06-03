import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRoomPolling } from "./useRoomPolling";

function PollingProbe({ onPoll }: { onPoll: () => void }) {
  useRoomPolling(onPoll, true);
  return null;
}

describe("useRoomPolling", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible"
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
  });

  it("calls onPoll immediately and every 2000 ms while visible", () => {
    const onPoll = vi.fn();

    act(() => {
      root.render(<PollingProbe onPoll={onPoll} />);
    });

    expect(onPoll).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onPoll).toHaveBeenCalledTimes(2);
  });

  it("does not poll while document is hidden", () => {
    const onPoll = vi.fn();

    act(() => {
      root.render(<PollingProbe onPoll={onPoll} />);
    });
    onPoll.mockClear();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden"
    });

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onPoll).not.toHaveBeenCalled();
  });
});
