import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

function makeMockRoom() {
  return {
    code: "ABCD",
    status: "lobby" as const,
    hostId: "p1",
    participants: [],
    drawerId: null,
    secretWord: null,
    guesses: [],
    scores: {},
    availableWords: ["rocket", "pizza", "castle", "guitar", "sunflower"],
    roles: ["drawer", "guesser"] as ("drawer" | "guesser")[],
    viewerRole: "guesser" as ("drawer" | "guesser") | null
  };
}

describe("api service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("createRoom sends POST to /rooms with playerName in body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p1",
          room: makeMockRoom()
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.createRoom("Alice");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ playerName: "Alice" }),
      })
    );
  });

  it("fetchRoom sends GET to /rooms/:code with participantId query param", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: makeMockRoom()
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  it("startGame sends POST to /rooms/:code/start", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p1",
          room: { ...makeMockRoom(), status: "playing" as const }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.startGame("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/start"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
  });

  it("submitGuess sends POST to /rooms/:code/guess", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p2",
          room: makeMockRoom()
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.submitGuess("ABCD", "p2", "rocket");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/guess"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p2", text: "rocket" }),
      })
    );
  });
});
