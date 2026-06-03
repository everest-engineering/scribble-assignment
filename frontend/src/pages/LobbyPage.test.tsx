import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LobbyPage } from "./LobbyPage";
import { RoomStoreContext } from "../state/roomStore";
import type { RoomState } from "../state/roomStore";
import type { RoomSnapshot } from "../services/api";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const baseRoom: RoomSnapshot = {
  code: "ABCD",
  status: "lobby",
  hostId: "p1",
  participants: [{ id: "p1", name: "Alice", joinedAt: "" }],
  availableWords: [],
  roles: [],
};

const baseState: RoomState = {
  room: baseRoom,
  participantId: "p1",
  error: null,
  isLoading: false,
};

function makeMockStore(
  state: RoomState,
  fetchRoom: () => Promise<RoomSnapshot | null>,
) {
  return {
    subscribe: (_listener: () => void) => () => {},
    getSnapshot: () => state,
    fetchRoom,
    startRoom: vi.fn(),
  };
}

describe("LobbyPage polling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("redirects to / when the poll throws a network error", async () => {
    const store = makeMockStore(baseState, () =>
      Promise.reject(new Error("Network error")),
    );

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <RoomStoreContext.Provider value={store as any}>
        <MemoryRouter>
          <LobbyPage />
        </MemoryRouter>
      </RoomStoreContext.Provider>,
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
      // Flush the rejected promise so the catch block runs
      await Promise.resolve();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("navigates to /game when the poll returns a room with playing status", async () => {
    const playingRoom: RoomSnapshot = { ...baseRoom, status: "playing" };
    const store = makeMockStore(baseState, () => Promise.resolve(playingRoom));

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <RoomStoreContext.Provider value={store as any}>
        <MemoryRouter>
          <LobbyPage />
        </MemoryRouter>
      </RoomStoreContext.Provider>,
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/game");
  });

  it("does not navigate on each successful lobby poll while status stays lobby", async () => {
    const store = makeMockStore(baseState, () =>
      Promise.resolve({ ...baseRoom, status: "lobby" }),
    );

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <RoomStoreContext.Provider value={store as any}>
        <MemoryRouter>
          <LobbyPage />
        </MemoryRouter>
      </RoomStoreContext.Provider>,
    );

    await act(async () => {
      vi.advanceTimersByTime(4000); // two poll cycles
      await Promise.resolve();
    });

    expect(mockNavigate).not.toHaveBeenCalledWith("/game");
    expect(mockNavigate).not.toHaveBeenCalledWith("/");
  });
});
