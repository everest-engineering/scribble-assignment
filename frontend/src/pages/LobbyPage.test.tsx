import React, { StrictMode, act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LobbyPage } from "./LobbyPage";

const mocks = vi.hoisted(() => {
  const roomSession = {
    participantId: "participant-1",
    room: {
      code: "ABCD",
      status: "lobby",
      hostParticipantId: "participant-1",
      currentDrawerId: null,
      participants: [
        {
          id: "participant-1",
          name: "Alice",
          joinedAt: "2026-06-05T00:00:00.000Z"
        }
      ],
      availableWords: []
    }
  };

  return {
    navigate: vi.fn(),
    roomSession,
    roomStore: {
      startLobbyPolling: vi.fn(),
      stopLobbyPolling: vi.fn(),
      leaveRoom: vi.fn(),
      setRoomSession: vi.fn(),
      fetchRoom: vi.fn(),
      startRoom: vi.fn()
    }
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useLocation: () => ({ state: mocks.roomSession })
  };
});

vi.mock("../state/roomStore", () => ({
  useRoomStore: () => mocks.roomStore,
  useRoomState: () => ({
    room: null,
    participantId: null,
    hostParticipantId: null,
    roomStatus: null,
    error: null,
    isLoading: false
  })
}));

describe("LobbyPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.navigate.mockReset();
    mocks.roomStore.startLobbyPolling.mockReset();
    mocks.roomStore.stopLobbyPolling.mockReset();
    mocks.roomStore.leaveRoom.mockReset();
    mocks.roomStore.setRoomSession.mockReset();
    mocks.roomStore.fetchRoom.mockReset();
    mocks.roomStore.startRoom.mockReset();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("does not leave the room during the StrictMode verification cleanup", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StrictMode>
          <LobbyPage />
        </StrictMode>
      );
    });

    expect(mocks.roomStore.setRoomSession).toHaveBeenCalled();
    expect(mocks.roomStore.startLobbyPolling).toHaveBeenCalled();
    expect(mocks.roomStore.leaveRoom).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      root.unmount();
    });

    expect(mocks.roomStore.leaveRoom).toHaveBeenCalledTimes(1);
  });
});
