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

  it("submitGuess sends POST to /rooms/:code/guess", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "active", participants: [] } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.submitGuess("ABCD", "p1", "pizza");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/guess"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1", text: "pizza" }),
      })
    );
  });

  it("updateDrawing sends POST to /rooms/:code/draw", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "active", participants: [] } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.updateDrawing("ABCD", "p1", [{ points: [{ x: 1, y: 2 }] }]);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/draw"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1", strokes: [{ points: [{ x: 1, y: 2 }] }] }),
      })
    );
  });

  it("clearDrawing sends POST to /rooms/:code/clear", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "active", participants: [] } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.clearDrawing("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/clear"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
  });
});
