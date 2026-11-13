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

  it("requests use fallback URL http://localhost:3001", async () => {
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

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall[0]).toBe("http://localhost:3001/rooms");
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

  it("startGame sends POST to /rooms/:code/start with participantId in body", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true, status: "game" }),
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

  it("leaveRoom sends POST to /rooms/:code/leave with participantId in body", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true, message: "Left room successfully" }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.leaveRoom("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/leave"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
  });

  it("updateDrawing sends POST to /rooms/:code/canvas with drawingData in body", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.updateDrawing("ABCD", "data:image/png;base64,123");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/canvas"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ drawingData: "data:image/png;base64,123" }),
      })
    );
  });

  it("clearDrawing sends POST to /rooms/:code/canvas/clear", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.clearDrawing("ABCD");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/canvas/clear"),
      expect.objectContaining({
        method: "POST"
      })
    );
  });

  it("submitGuess sends POST to /rooms/:code/guesses with participantId and guessText in body", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true, guess: { id: "g1" } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.submitGuess("ABCD", "p1", "rocket");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/guesses"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1", guessText: "rocket" }),
      })
    );
  });
});
