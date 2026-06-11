import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "./api";

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

  it("joinRoom URL-encodes the code", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p1",
          room: { code: "AB CD", status: "lobby", participants: [] },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.joinRoom("AB CD", "Bob");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/AB%20CD/join"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("propagates the server's `message` and HTTP status as ApiError on a 404", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: "Room not found" }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(api.joinRoom("ZZZZ", "Bob")).rejects.toMatchObject({
      message: "Room not found",
      status: 404,
    });
    await expect(api.joinRoom("ZZZZ", "Bob")).rejects.toBeInstanceOf(ApiError);
  });

  it("submitGuess POSTs participantId + text to /rooms/:code/guesses", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({ room: { code: "ABCD", status: "round", participants: [] } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.submitGuess("ABCD", "p-bob", "  Rocket  ");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/guesses"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p-bob", text: "  Rocket  " }),
      })
    );
  });

  it("submitGuess maps a 409 lockout to ApiError with the server message", async () => {
    const mockResponse = {
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({ message: "You have already guessed correctly this round" }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(api.submitGuess("ABCD", "p-bob", "rocket")).rejects.toMatchObject({
      message: "You have already guessed correctly this round",
      status: 409,
    });
  });

  it("startRoom POSTs participantId to /rooms/:code/start", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({ room: { code: "ABCD", status: "lobby", participants: [] } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.startRoom("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/start"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
  });
});
