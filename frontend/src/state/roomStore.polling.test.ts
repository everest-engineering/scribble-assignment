import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RoomStore } from "./roomStore";
import { api } from "../services/api";

describe("roomStore polling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("updates guesses over multiple polling intervals", async () => {
    const now = Date.now();

    const g1 = {
      playerId: "p1",
      textTrimmed: "one",
      timestamp: new Date(now).toISOString(),
      isCorrect: false
    };
    const g2 = {
      playerId: "p2",
      textTrimmed: "two",
      timestamp: new Date(now + 1000).toISOString(),
      isCorrect: false
    };

    const fetchMock = vi
      .spyOn(api, "fetchGuesses")
      .mockImplementationOnce(async (_code: string) => ({ guesses: [g1] }))
      .mockImplementationOnce(async (_code: string) => ({ guesses: [g1, g2] }))
      .mockImplementation(async (_code: string) => ({ guesses: [g1, g2] }));

    const store = new RoomStore();
    // set a minimal room snapshot so fetchGuesses uses the code
    store.setRoomSnapshot({
      code: "RO01",
      status: "in-game",
      participants: [],
      availableWords: [],
      roles: []
    } as any);

    store.startGuessPolling(100);

    // immediate tick on start
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().guesses.length).toBe(1);

    // advance to next interval (allow for jitter) - use a larger time to be robust
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock).toHaveBeenCalled();
    expect(store.getSnapshot().guesses.length).toBe(2);

    store.stopGuessPolling();
  });
});
