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

  it("startGame sends participant id to /rooms/:code/start", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "active", participants: [] } }),
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

  it("updateDrawing sends strokes to /rooms/:code/drawing", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "active", participants: [] } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);
    const strokes = [{ id: "stroke-1", points: [{ x: 10, y: 20 }] }];

    await api.updateDrawing("ABCD", "p1", strokes);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/drawing"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1", strokes }),
      })
    );
  });

  it("clearDrawing sends participant id to /rooms/:code/drawing/clear", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "active", participants: [] } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.clearDrawing("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/drawing/clear"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
  });

  it("submitGuess sends trimmed guess text to /rooms/:code/guesses caller payload", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "active", participants: [] } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.submitGuess("ABCD", "p2", "rocket");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/guesses"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p2", text: "rocket" }),
      })
    );
  });
});
