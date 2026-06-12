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
          room: { code: "ABCD", status: "lobby", participants: [], hostId: "p1", drawerId: null, currentWord: null, availableWords: [], scores: {}, guessHistory: [], canvasStrokes: [] },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await api.createRoom("Alice");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ playerName: "Alice" }),
      })
    );
    expect(result.room.drawerId).toBeNull();
    expect(result.room.currentWord).toBeNull();
  });

  it("fetchRoom sends GET to /rooms/:code with participantId query param", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: { code: "XYZW", status: "lobby", participants: [], hostId: "p1", drawerId: null, currentWord: null, availableWords: [], scores: {}, guessHistory: [], canvasStrokes: [] },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
    expect(result.room.drawerId).toBeNull();
  });

  it("startGame sends POST to /rooms/:code/start with participantId in body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: { code: "ABCD", status: "playing", participants: [], hostId: "p1", drawerId: "p1", currentWord: "rocket", availableWords: [], scores: {}, guessHistory: [], canvasStrokes: [] },
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
    expect(result.room.drawerId).toBe("p1");
    expect(result.room.currentWord).toBe("rocket");
  });
});
