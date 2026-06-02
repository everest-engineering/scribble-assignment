import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoomState } from "../state/roomStore";
import { GamePage } from "./GamePage";

vi.mock("../state/roomStore", () => ({
  useRoomState: vi.fn(),
  useRoomStore: vi.fn()
}));

import { useRoomState } from "../state/roomStore";

const HOST_ID = "host-id";
const GUEST_ID = "guest-id";

function makeRoom(overrides: Record<string, unknown> = {}) {
  return {
    code: "ABCD",
    status: "in-progress" as const,
    hostId: HOST_ID,
    participants: [
      { id: HOST_ID, name: "Alice", joinedAt: "2026-01-01T00:00:00Z" },
      { id: GUEST_ID, name: "Bob", joinedAt: "2026-01-01T00:00:01Z" }
    ],
    availableWords: [],
    roles: [],
    drawerId: HOST_ID,
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

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
});

describe("GamePage — drawer identity and word visibility", () => {
  // T006: all players see drawer's name
  it("shows the drawer's name to all players", () => {
    vi.mocked(useRoomState).mockReturnValue(makeState({
      participantId: GUEST_ID,
      room: makeRoom({ drawerId: HOST_ID, currentWord: null })
    }));
    render(<MemoryRouter><GamePage /></MemoryRouter>);
    expect(screen.getByText(/alice/i)).toBeTruthy();
  });

  it("shows the secret word to the drawer", () => {
    vi.mocked(useRoomState).mockReturnValue(makeState({
      participantId: HOST_ID,
      room: makeRoom({ drawerId: HOST_ID, currentWord: "rocket" })
    }));
    render(<MemoryRouter><GamePage /></MemoryRouter>);
    expect(screen.getByText(/rocket/i)).toBeTruthy();
  });

  it("does not show the secret word to non-drawer players", () => {
    vi.mocked(useRoomState).mockReturnValue(makeState({
      participantId: GUEST_ID,
      room: makeRoom({ drawerId: HOST_ID, currentWord: null })
    }));
    render(<MemoryRouter><GamePage /></MemoryRouter>);
    expect(screen.queryByText(/rocket/i)).toBeNull();
  });

  it("announces drawer's name via aria-live region", () => {
    vi.mocked(useRoomState).mockReturnValue(makeState({
      participantId: GUEST_ID,
      room: makeRoom({ drawerId: HOST_ID, currentWord: null })
    }));
    render(<MemoryRouter><GamePage /></MemoryRouter>);
    const liveRegion = document.querySelector("[aria-live]");
    expect(liveRegion).toBeTruthy();
    expect(liveRegion!.textContent).toContain("Alice");
  });
});
