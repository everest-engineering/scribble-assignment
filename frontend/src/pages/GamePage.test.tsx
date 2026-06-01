import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";

describe("GamePage visibility", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });

  it("shows secret word to drawer and drawer identity to others", async () => {
    vi.resetModules();

    const mockUseRoomState = () => ({
      room: {
        code: "ABCD",
        status: "in-game",
        hostId: "host-1",
        drawerId: "host-1",
        participants: [
          { id: "host-1", name: "Host" },
          { id: "p2", name: "P2" }
        ],
        secretWord: "rocket"
      },
      participantId: "host-1",
      error: null,
      isLoading: false
    });

    const mockUseRoomStore = () => ({ fetchRoom: () => {} });

    vi.doMock("../state/roomStore", () => ({
      useRoomState: mockUseRoomState,
      useRoomStore: mockUseRoomStore
    }));

    const { GamePage } = await import("./GamePage");

    await act(async () => {
      ReactDOM.render(
        React.createElement(MemoryRouter, null, React.createElement(GamePage)),
        container
      );
    });

    // drawer should see secret word
    expect(container.textContent).toContain("Drawer");
    expect(container.textContent).toContain("Host");
    expect(container.textContent).toContain("rocket");
  });

  it("hides secret word from non-drawers", async () => {
    vi.resetModules();

    const mockUseRoomState = () => ({
      room: {
        code: "WXYZ",
        status: "in-game",
        hostId: "host-2",
        drawerId: "host-2",
        participants: [
          { id: "host-2", name: "Host" },
          { id: "p3", name: "P3" }
        ]
      },
      participantId: "p3",
      error: null,
      isLoading: false
    });

    vi.doMock("../state/roomStore", () => ({
      useRoomState: mockUseRoomState,
      useRoomStore: () => ({ fetchRoom: () => {} })
    }));

    const { GamePage } = await import("./GamePage");

    await act(async () => {
      ReactDOM.render(
        React.createElement(MemoryRouter, null, React.createElement(GamePage)),
        container
      );
    });

    // non-drawer should not see secret word
    expect(container.textContent).toContain("Drawer");
    expect(container.textContent).toContain("Host");
    expect(container.textContent).not.toContain("secret word");
  });
});
