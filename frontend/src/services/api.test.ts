import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

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
          room: {
            code: "ABCD",
            status: "lobby",
            participants: [],
            hostId: "p1",
            currentWord: null,
            currentWordLength: 0,
            currentRound: 0,
            availableWords: [],
            roles: [],
          },
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
          room: {
            code: "XYZW",
            status: "lobby",
            participants: [],
            hostId: "p1",
            currentWord: null,
            currentWordLength: 0,
            currentRound: 0,
            availableWords: [],
            roles: [],
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  it("submitGuess sends POST to /rooms/:code/guess with participantId and text", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "playing",
            participants: [
              { id: "p1", name: "Host", joinedAt: "", role: "drawer", score: 0 },
              { id: "p2", name: "Guest", joinedAt: "", role: "guesser", score: 100 },
            ],
            hostId: "p1",
            currentWord: null,
            currentWordLength: 6,
            currentRound: 1,
            guesses: [
              { participantId: "p2", participantName: "Guest", text: "rocket", correct: true },
            ],
            availableWords: [],
            roles: [],
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await api.submitGuess("ABCD", "p2", "rocket");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/guess"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p2", text: "rocket" }),
      })
    );
    expect(result.room.guesses[0].correct).toBe(true);
    expect(result.room.participants[1].score).toBe(100);
  });

  it("restartGame sends POST to /rooms/:code/restart with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "lobby",
            participants: [
              { id: "p1", name: "Host", joinedAt: "", role: "guesser", score: 0 },
              { id: "p2", name: "Guest", joinedAt: "", role: "guesser", score: 0 },
            ],
            hostId: "p1",
            currentWord: null,
            currentWordLength: 0,
            currentRound: 0,
            guesses: [],
            availableWords: [],
            roles: [],
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await api.restartGame("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/restart"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
    expect(result.room.status).toBe("lobby");
    expect(result.room.guesses).toEqual([]);
  });

  it("startGame sends POST to /rooms/:code/start with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "playing",
            participants: [
              { id: "p1", name: "Host", joinedAt: "", role: "drawer" },
              { id: "p2", name: "Guest", joinedAt: "", role: "guesser" },
            ],
            hostId: "p1",
            currentWord: "rocket",
            currentWordLength: 6,
            currentRound: 1,
            availableWords: [],
            roles: [],
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await api.startGame("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/start"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
    expect(result.room.currentWord).toBe("rocket");
    expect(result.room.participants[0].role).toBe("drawer");
  });
});
