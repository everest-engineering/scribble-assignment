import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

function mockRoom(overrides = {}) {
  return {
    code: "ABCD",
    status: "lobby",
    hostParticipantId: "p1",
    isHost: true,
    drawerParticipantId: null,
    drawerName: null,
    secretWord: null,
    correctWord: null,
    scores: [],
    drawing: { strokes: [] },
    guesses: [],
    participants: [],
    availableWords: [],
    roles: [],
    ...overrides
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
          room: mockRoom()
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
          room: mockRoom({ code: "XYZW" })
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  it("startGame sends POST to /rooms/:code/start with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: mockRoom({
            status: "playing",
            drawerParticipantId: "p1",
            drawerName: "Alice",
            secretWord: "rocket"
          })
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

  it("updateDrawing sends POST to /rooms/:code/drawing with participantId and drawing", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: mockRoom({ drawing: { strokes: [{ points: [{ x: 1, y: 2 }] }] } }) })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.updateDrawing("ABCD", "p1", { strokes: [{ points: [{ x: 1, y: 2 }] }] });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/drawing"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          participantId: "p1",
          drawing: { strokes: [{ points: [{ x: 1, y: 2 }] }] }
        })
      })
    );
  });

  it("clearDrawing sends POST to /rooms/:code/clear with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: mockRoom() })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.clearDrawing("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/clear"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" })
      })
    );
  });

  it("restartGame sends POST to /rooms/:code/restart with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: mockRoom() })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.restartGame("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/restart"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" })
      })
    );
  });

  it("submitGuess sends POST to /rooms/:code/guesses with participantId and guessText", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: mockRoom() })
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
