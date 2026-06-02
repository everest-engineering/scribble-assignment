import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoomState } from "../state/roomStore";
import { LobbyPage } from "./LobbyPage";

vi.mock("../state/roomStore", () => ({
  useRoomState: vi.fn(),
  useRoomStore: vi.fn()
}));

import { useRoomState, useRoomStore } from "../state/roomStore";

const HOST_ID = "host-id";
const GUEST_ID = "guest-id";

function makeRoom(overrides: Record<string, unknown> = {}) {
  return {
    code: "ABCD",
    status: "lobby" as const,
    hostId: HOST_ID,
    participants: [
      { id: HOST_ID, name: "Alice", joinedAt: "2026-01-01T00:00:00Z" }
    ],
    availableWords: [],
    roles: [],
    drawerId: null,
    currentWord: null,
    ...overrides
  };
}

function makeState(overrides: Partial<RoomState> = {}): RoomState {
  return {
    room: makeRoom(),
    participantId: HOST_ID,
    error: null,
    isLoading: false,
    ...overrides
  };
}

const mockFetchRoom = vi.fn().mockResolvedValue(null);
const mockStartGame = vi.fn().mockResolvedValue(null);

afterEach(cleanup);

beforeEach(() => {
  vi.mocked(useRoomStore).mockReturnValue({
    fetchRoom: mockFetchRoom,
    startGame: mockStartGame
  } as never);
  mockFetchRoom.mockClear();
  mockStartGame.mockClear();
});

describe("LobbyPage — 'Need at least 2 players' label", () => {
  // T005: label shown when host is alone
  it("shows 'Need at least 2 players' label when host is the only participant", () => {
    vi.mocked(useRoomState).mockReturnValue(makeState());
    render(<MemoryRouter><LobbyPage /></MemoryRouter>);
    expect(screen.getByText(/need at least 2 players/i)).toBeTruthy();
  });

  it("does not show the label when there are 2 participants", () => {
    vi.mocked(useRoomState).mockReturnValue(makeState({
      room: makeRoom({
        participants: [
          { id: HOST_ID, name: "Alice", joinedAt: "2026-01-01T00:00:00Z" },
          { id: GUEST_ID, name: "Bob", joinedAt: "2026-01-01T00:00:01Z" }
        ]
      })
    }));
    render(<MemoryRouter><LobbyPage /></MemoryRouter>);
    expect(screen.queryByText(/need at least 2 players/i)).toBeNull();
  });
});

describe("LobbyPage — additional state rendering", () => {
  it("shows 'No participants' message when participants list is empty", () => {
    vi.mocked(useRoomState).mockReturnValue(makeState({
      room: makeRoom({ participants: [] })
    }));
    render(<MemoryRouter><LobbyPage /></MemoryRouter>);
    expect(screen.getByText(/no participants are connected/i)).toBeTruthy();
  });

  it("shows error message when there is a displayError", () => {
    vi.mocked(useRoomState).mockReturnValue(makeState({ error: "Something went wrong" }));
    render(<MemoryRouter><LobbyPage /></MemoryRouter>);
    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });

  it("shows loading spinner text when isLoading is true and host has 2+ players", () => {
    vi.mocked(useRoomState).mockReturnValue(makeState({
      isLoading: true,
      room: makeRoom({
        participants: [
          { id: HOST_ID, name: "Alice", joinedAt: "2026-01-01T00:00:00Z" },
          { id: GUEST_ID, name: "Bob", joinedAt: "2026-01-01T00:00:01Z" }
        ]
      })
    }));
    render(<MemoryRouter><LobbyPage /></MemoryRouter>);
    expect(screen.getByText(/starting…/i)).toBeTruthy();
  });
});

describe("LobbyPage — handleStartGame", () => {
  it("calls startGame when host clicks the enabled Start Game button", async () => {
    vi.mocked(useRoomState).mockReturnValue(makeState({
      room: makeRoom({
        participants: [
          { id: HOST_ID, name: "Alice", joinedAt: "2026-01-01T00:00:00Z" },
          { id: GUEST_ID, name: "Bob", joinedAt: "2026-01-01T00:00:01Z" }
        ]
      })
    }));
    render(<MemoryRouter><LobbyPage /></MemoryRouter>);

    const btn = screen.getByRole("button", { name: /start game/i });
    fireEvent.click(btn);
    expect(mockStartGame).toHaveBeenCalledTimes(1);
  });
});

// T018: non-host button behaviour
describe("LobbyPage — Start button role-based visibility", () => {
  it("non-host sees a disabled Start Game button", () => {
    vi.mocked(useRoomState).mockReturnValue(makeState({
      participantId: GUEST_ID,
      room: makeRoom({
        participants: [
          { id: HOST_ID, name: "Alice", joinedAt: "2026-01-01T00:00:00Z" },
          { id: GUEST_ID, name: "Bob", joinedAt: "2026-01-01T00:00:01Z" }
        ]
      })
    }));
    render(<MemoryRouter><LobbyPage /></MemoryRouter>);

    const btn = screen.getByRole("button", { name: /start game/i });
    expect(btn.hasAttribute("disabled") || btn.getAttribute("aria-disabled") === "true").toBe(true);
  });

  it("host with 2+ players sees an enabled Start Game button", () => {
    vi.mocked(useRoomState).mockReturnValue(makeState({
      room: makeRoom({
        participants: [
          { id: HOST_ID, name: "Alice", joinedAt: "2026-01-01T00:00:00Z" },
          { id: GUEST_ID, name: "Bob", joinedAt: "2026-01-01T00:00:01Z" }
        ]
      })
    }));
    render(<MemoryRouter><LobbyPage /></MemoryRouter>);

    const btn = screen.getByRole("button", { name: /start game/i });
    expect(btn.hasAttribute("disabled")).toBe(false);
  });
});
