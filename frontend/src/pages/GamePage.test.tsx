import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoomState } from "../state/roomStore";
import { GamePage } from "./GamePage";

vi.mock("../state/roomStore", () => ({
  useRoomState: vi.fn(),
  useRoomStore: vi.fn()
}));

import { useRoomState, useRoomStore } from "../state/roomStore";

// jsdom does not implement canvas APIs — mock them globally for this test file
beforeAll(() => {
  const mockCtx = {
    beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    stroke: vi.fn(), clearRect: vi.fn(), drawImage: vi.fn()
  };
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx) as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue("data:image/png;base64,mock") as typeof HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.setPointerCapture = vi.fn() as typeof HTMLCanvasElement.prototype.setPointerCapture;
});

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
    canvasDataUrl: null,
    guesses: [],
    scores: { [HOST_ID]: 0, [GUEST_ID]: 0 },
    roundEndsAt: null,
    hasGuessedCorrectly: false,
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
const mockUpdateCanvas = vi.fn().mockResolvedValue(undefined);
const mockClearCanvas = vi.fn().mockResolvedValue(undefined);
const mockSubmitGuess = vi.fn().mockResolvedValue(undefined);

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRoomStore).mockReturnValue({
    fetchRoom: mockFetchRoom,
    updateCanvas: mockUpdateCanvas,
    clearCanvas: mockClearCanvas,
    submitGuess: mockSubmitGuess
  } as never);
});

describe("GamePage — drawer identity and word visibility", () => {
  it("shows the drawer's name to all players", () => {
    vi.mocked(useRoomState).mockReturnValue(makeState({
      participantId: GUEST_ID,
      room: makeRoom({ drawerId: HOST_ID, currentWord: null })
    }));
    render(<MemoryRouter><GamePage /></MemoryRouter>);
    expect(screen.getAllByText(/alice/i).length).toBeGreaterThanOrEqual(1);
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

// T027: polling interval is established when GamePage mounts with active room
describe("GamePage — polling", () => {
  it("calls fetchRoom on the polling interval when status is in-progress", () => {
    vi.useFakeTimers();
    vi.mocked(useRoomState).mockReturnValue(makeState());
    render(<MemoryRouter><GamePage /></MemoryRouter>);
    vi.advanceTimersByTime(2000);
    expect(mockFetchRoom).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(2000);
    expect(mockFetchRoom).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

// T041: ResultPanel re-renders with updated guesses when room snapshot changes
describe("GamePage — ResultPanel integration", () => {
  it("renders guess entries from room.guesses", () => {
    vi.mocked(useRoomState).mockReturnValue(makeState({
      room: makeRoom({
        guesses: [
          {
            id: "g1",
            participantId: GUEST_ID,
            participantName: "Bob",
            text: "rocket",
            correct: true,
            submittedAt: "2026-06-03T10:05:00Z"
          }
        ]
      })
    }));
    render(<MemoryRouter><GamePage /></MemoryRouter>);
    expect(screen.getByText("rocket")).toBeTruthy();
  });
});
