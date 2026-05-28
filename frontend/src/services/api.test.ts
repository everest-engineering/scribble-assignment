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

  it("updateDrawing sends PUT to /rooms/:code/drawing", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "game", participants: [] } }),
    } as unknown as Response);

    const drawing = [{ id: "s1", color: "#111827", size: 5, points: [{ x: 0.1, y: 0.2 }] }];
    await api.updateDrawing("ABCD", "p1", drawing);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/drawing"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ participantId: "p1", drawing }),
      })
    );
  });

  it("clearDrawing sends POST to /rooms/:code/drawing/clear", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "game", participants: [] } }),
    } as unknown as Response);

    await api.clearDrawing("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/drawing/clear"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
  });

  it("submitGuess sends POST to /rooms/:code/guesses", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "game", participants: [] } }),
    } as unknown as Response);

    await api.submitGuess("ABCD", "p2", "rocket");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/guesses"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p2", text: "rocket" }),
      })
    );
  });

  it("endRound sends POST to /rooms/:code/end", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "results", participants: [] } }),
    } as unknown as Response);

    await api.endRound("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/end"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
  });

  it("restartRoom sends POST to /rooms/:code/restart", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "lobby", participants: [] } }),
    } as unknown as Response);

    await api.restartRoom("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/restart"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
  });
});
