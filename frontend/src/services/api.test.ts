import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("api service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("uses http://localhost:3001 as default base URL", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p1",
          room: {
            code: "ABCD",
            status: "lobby",
            hostParticipantId: "p1",
            participants: [],
            availableWords: [],
            roles: []
          }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.createRoom("Alice");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/rooms",
      expect.anything()
    );
  });

  it("createRoom sends POST to /rooms with playerName in body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p1",
          room: {
            code: "ABCD",
            status: "lobby",
            hostParticipantId: "p1",
            participants: []
          }
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

  it("startGame sends POST to /rooms/:code/start with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "playing",
            hostParticipantId: "p1",
            participants: [],
            availableWords: [],
            roles: [],
            currentRound: {
              roundIndex: 0,
              drawerParticipantId: "p1",
              secretWord: "rocket"
            }
          }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.startGame("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/rooms/ABCD/start",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" })
      })
    );
  });

  it("fetchRoom sends GET to /rooms/:code with participantId query param", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "XYZW",
            status: "lobby",
            hostParticipantId: "p1",
            participants: []
          }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  it("appendStroke sends POST to /rooms/:code/strokes with participantId and points", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "playing",
            hostParticipantId: "p1",
            participants: [],
            availableWords: [],
            roles: [],
            currentRound: {
              roundIndex: 0,
              drawerParticipantId: "p1",
              secretWord: "rocket",
              strokes: [],
              guesses: [],
              scores: [],
              winnerParticipantId: null
            }
          }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.appendStroke("ABCD", "p1", {
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 }
      ]
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/rooms/ABCD/strokes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          participantId: "p1",
          points: [
            { x: 1, y: 2 },
            { x: 3, y: 4 }
          ]
        })
      })
    );
  });

  it("submitGuess sends POST to /rooms/:code/guess with participantId and text", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "playing",
            hostParticipantId: "p1",
            participants: [],
            availableWords: [],
            roles: [],
            currentRound: {
              roundIndex: 0,
              drawerParticipantId: "p1",
              secretWord: null,
              strokes: [],
              guesses: [],
              scores: [],
              winnerParticipantId: null
            }
          }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.submitGuess("ABCD", "p2", "rocket");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/rooms/ABCD/guess",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p2", text: "rocket" })
      })
    );
  });
});
