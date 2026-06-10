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
          room: { code: "ABCD", status: "lobby", participants: [] },
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
          room: { code: "XYZW", status: "lobby", participants: [] },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  it("submitGuess sends POST to /rooms/:code/guess with text", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ correct: true, score: 100 }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await api.submitGuess("ABCD", "p1", "hello");

    expect(result).toEqual({ correct: true, score: 100 });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/guess?playerId=p1"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: "hello" })
      })
    );
  });

  it("submitCanvasAction sends POST to /rooms/:code/canvas", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await api.submitCanvasAction("ABCD", "p1", {
      type: "stroke",
      points: [{ x: 10, y: 20 }],
      color: "#000000",
      width: 3
    });

    expect(result).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/canvas?playerId=p1"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          type: "stroke",
          points: [{ x: 10, y: 20 }],
          color: "#000000",
          width: 3
        })
      })
    );
  });
});
