import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

const baseRoom = {
  code: "ABCD",
  status: "lobby" as const,
  hostId: "p1",
  isHost: true,
  canStart: false,
  drawerId: undefined,
  viewerRole: null,
  secretWord: null,
  strokes: [],
  guesses: [],
  participants: [],
  availableWords: ["rocket"],
  roles: ["drawer", "guesser"] as const
};

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
          room: baseRoom
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.createRoom("Alice");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ playerName: "Alice" })
      })
    );
  });

  it("fetchRoom sends GET to /rooms/:code with participantId query param", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: { ...baseRoom, code: "XYZW" }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  it("startGame sends POST to /rooms/:code/start with participantId in body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p1",
          room: {
            ...baseRoom,
            status: "playing",
            canStart: false,
            drawerId: "p1",
            viewerRole: "drawer",
            secretWord: "rocket"
          }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.startGame("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/start"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" })
      })
    );
  });

  it("addStroke sends POST to /rooms/:code/strokes", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p1",
          room: { ...baseRoom, status: "playing", strokes: [{ id: "s1", points: [{ x: 0.1, y: 0.2 }] }] }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.addStroke("ABCD", "p1", { id: "s1", points: [{ x: 0.1, y: 0.2 }] });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/strokes"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("submitGuess sends POST to /rooms/:code/guesses", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p2",
          room: {
            ...baseRoom,
            status: "playing",
            guesses: [
              {
                id: "g1",
                participantId: "p2",
                participantName: "Bob",
                text: "rocket",
                isCorrect: true,
                submittedAt: "2026-01-01T00:00:00.000Z"
              }
            ]
          }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.submitGuess("ABCD", "p2", "rocket");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/guesses"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p2", guessText: "rocket" })
      })
    );
  });
});
