import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react-dom/test-utils";
import ReactDOM from "react-dom";

// Mock polling to avoid timers in tests
vi.mock("../services/polling", () => ({
  createPoller: () => ({ start: () => {}, stop: () => {} })
}));

// Mock navigation to avoid needing a Router
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));

describe("LobbyPage Start button", () => {
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

  it("disables Start when current user is not host", async () => {
    vi.resetModules();

    const mockUseRoomState = () => ({
      room: {
        code: "ABCD",
        status: "lobby",
        hostId: "host-1",
        participants: [
          { id: "host-1", name: "Host" },
          { id: "p2", name: "P2" }
        ]
      },
      participantId: "p2",
      error: null,
      isLoading: false
    });

    const mockStart = () => {};
    const mockUseRoomStore = () => ({
      startRoom: mockStart,
      fetchRoom: () => {}
    });

    vi.doMock("../state/roomStore", () => ({
      useRoomState: mockUseRoomState,
      useRoomStore: mockUseRoomStore
    }));

    const { LobbyPage } = await import("./LobbyPage");

    await act(async () => {
      ReactDOM.render(React.createElement(LobbyPage), container);
    });

    const startButton = container.querySelector(
      "button.button--primary"
    ) as HTMLButtonElement;
    expect(startButton).toBeTruthy();
    expect(startButton.disabled).toBe(true);
    expect(startButton.textContent).toContain("Only host can start");
  });

  it("enables Start for host and calls startRoom then navigates", async () => {
    vi.resetModules();

    const mockUseRoomState = () => ({
      room: {
        code: "EFGH",
        status: "lobby",
        hostId: "host-2",
        participants: [
          { id: "host-2", name: "Host" },
          { id: "p3", name: "P3" }
        ]
      },
      participantId: "host-2",
      error: null,
      isLoading: false
    });

    const mockStart = vi.fn(() =>
      Promise.resolve({ room: { code: "EFGH", status: "in-game" } })
    );
    const mockFetch = () => {};
    const mockUseRoomStore = () => ({
      startRoom: mockStart,
      fetchRoom: mockFetch
    });

    const mockNavigate = vi.fn();

    vi.doMock("../state/roomStore", () => ({
      useRoomState: mockUseRoomState,
      useRoomStore: mockUseRoomStore
    }));
    vi.doMock("react-router-dom", () => ({ useNavigate: () => mockNavigate }));

    const { LobbyPage } = await import("./LobbyPage");

    await act(async () => {
      ReactDOM.render(React.createElement(LobbyPage), container);
    });

    const startButton = container.querySelector(
      "button.button--primary"
    ) as HTMLButtonElement;
    expect(startButton).toBeTruthy();
    expect(startButton.disabled).toBe(false);

    await act(async () => {
      startButton.click();
      // allow any async handlers
      await Promise.resolve();
    });

    expect(mockStart).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/game");
  });
});
