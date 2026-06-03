import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("api service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("createRoom sends POST to /rooms with playerName in body and the correct base URL", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p1",
          room: { code: "ABCD", status: "lobby", hostParticipantId: "p1", participants: [], currentRound: null, guesses: [], availableWords: [], roles: [] },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.createRoom("Alice");

    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(calledUrl).toMatch(/^http:\/\/localhost:3001\/rooms$/);
    expect(calledUrl).not.toContain("/bug/");

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
          room: { code: "XYZW", status: "lobby", hostParticipantId: "p1", participants: [], currentRound: null, guesses: [], availableWords: [], roles: [] },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  it("joinRoom surfaces the server's message verbatim on a non-ok response", async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ message: "Room not found" }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(api.joinRoom("ZZZZ", "Bob")).rejects.toThrow("Room not found");
  });

  it("startGame sends POST to /rooms/:code/start with participantId in body and correct base URL", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "playing",
            hostParticipantId: "host-id",
            participants: [],
            currentRound: { drawerParticipantId: "host-id", secretWord: "rocket" },
            guesses: [],
            availableWords: [],
            roles: [],
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.startGame("ABCD", "host-id");

    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(calledUrl).toBe("http://localhost:3001/rooms/ABCD/start");
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "host-id" }),
      })
    );
  });

  it("startGame surfaces the server's message verbatim on a non-ok response", async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ message: "Only the host can start the game" }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(api.startGame("ABCD", "not-the-host")).rejects.toThrow(
      "Only the host can start the game"
    );
  });

  it("submitGuess sends POST to /rooms/:code/guess with participantId and text in body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "playing",
            hostParticipantId: "host-id",
            participants: [],
            currentRound: { drawerParticipantId: "host-id", secretWord: null },
            guesses: [],
            availableWords: [],
            roles: [],
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.submitGuess("ABCD", "guest-id", "rocket");

    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(calledUrl).toBe("http://localhost:3001/rooms/ABCD/guess");
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "guest-id", text: "rocket" }),
      })
    );
  });

  it("submitGuess surfaces the server's message verbatim on a non-ok response", async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ message: "Only guessers can submit guesses" }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(api.submitGuess("ABCD", "drawer-id", "rocket")).rejects.toThrow(
      "Only guessers can submit guesses"
    );
  });

  it("endRound sends POST to /rooms/:code/end with participantId in body and the correct base URL", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "result",
            hostParticipantId: "host-id",
            participants: [],
            currentRound: { drawerParticipantId: "host-id", secretWord: "rocket" },
            guesses: [],
            availableWords: [],
            roles: [],
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.endRound("ABCD", "host-id");

    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(calledUrl).toBe("http://localhost:3001/rooms/ABCD/end");
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "host-id" }),
      })
    );
  });

  it("endRound surfaces the server's message verbatim on a non-ok response", async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ message: "Only the host can end the round" }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(api.endRound("ABCD", "not-the-host")).rejects.toThrow(
      "Only the host can end the round"
    );
  });

  it("restart sends POST to /rooms/:code/restart with participantId in body and the correct base URL", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "lobby",
            hostParticipantId: "host-id",
            participants: [],
            currentRound: null,
            guesses: [],
            availableWords: [],
            roles: [],
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.restart("ABCD", "host-id");

    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(calledUrl).toBe("http://localhost:3001/rooms/ABCD/restart");
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "host-id" }),
      })
    );
  });

  it("restart surfaces the server's message verbatim on a non-ok response", async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ message: "Only the host can restart" }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(api.restart("ABCD", "not-the-host")).rejects.toThrow(
      "Only the host can restart"
    );
  });

});
