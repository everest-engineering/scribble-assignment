import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";

describe("DrawerCanvas", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.restoreAllMocks();
  });

  it("renders a canvas element", async () => {
    const mockUseRoomState = () => ({
      room: { code: "ABCD", status: "in-game", drawerId: "host-1" },
      participantId: "host-1",
      error: null,
      isLoading: false
    });

    vi.doMock("../state/roomStore", () => ({
      useRoomState: mockUseRoomState,
      useRoomStore: () => ({})
    }));

    const { DrawerCanvas } = await import("./DrawerCanvas");

    await act(async () => {
      ReactDOM.render(React.createElement(DrawerCanvas), container);
    });

    const canvas = container.querySelector(
      'canvas[aria-label="drawer-canvas"]'
    );
    expect(canvas).toBeTruthy();
  });
});
