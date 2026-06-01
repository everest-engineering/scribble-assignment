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
          room: {
            code: "ABCD",
            status: "lobby",
            participants: [],
            availableWords: [],
            roles: [],
            drawerParticipantId: null,
            roundPhase: null,
            canvasEvents: [],
            guessHistory: [],
            scores: {}
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

  it("joinRoom sends POST to /rooms/:code/join with playerName in body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p2",
          room: {
            code: "ABCD",
            status: "lobby",
            participants: [],
            availableWords: [],
            roles: [],
            drawerParticipantId: null,
            roundPhase: null,
            canvasEvents: [],
            guessHistory: [],
            scores: {}
          }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.joinRoom("ABCD", "Bob");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/join"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ playerName: "Bob" })
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
            participants: [],
            availableWords: [],
            roles: [],
            drawerParticipantId: null,
            roundPhase: null,
            canvasEvents: [],
            guessHistory: [],
            scores: {}
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

  it("startRoom sends POST to /rooms/:code/start with participantId in body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "game",
            participants: [],
            availableWords: [],
            roles: [],
            drawerParticipantId: "p1",
            roundPhase: "active",
            canvasEvents: [],
            guessHistory: [],
            scores: {},
            secretWord: "rocket"
          }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.startRoom("ABCD", "p1", "rocket");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/start"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1", secretWord: "rocket" })
      })
    );
  });

  it("drawCanvas sends POST to /rooms/:code/draw with stroke payload", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "game",
            participants: [],
            availableWords: [],
            roles: [],
            drawerParticipantId: "p1",
            roundPhase: "active",
            canvasEvents: [],
            guessHistory: [],
            scores: {},
            secretWord: "rocket"
          }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.drawCanvas("ABCD", "p1", {
      points: [{ x: 1, y: 2 }],
      color: "#111827",
      lineWidth: 4
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/draw"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          participantId: "p1",
          stroke: {
            points: [{ x: 1, y: 2 }],
            color: "#111827",
            lineWidth: 4
          }
        })
      })
    );
  });

  it("clearCanvas sends POST to /rooms/:code/clear with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "game",
            participants: [],
            availableWords: [],
            roles: [],
            drawerParticipantId: "p1",
            roundPhase: "active",
            canvasEvents: [],
            guessHistory: [],
            scores: {},
            secretWord: "rocket"
          }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.clearCanvas("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/clear"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" })
      })
    );
  });

  it("submitGuess sends POST to /rooms/:code/guess with guessText", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "game",
            participants: [],
            availableWords: [],
            roles: [],
            drawerParticipantId: "p1",
            roundPhase: "active",
            canvasEvents: [],
            guessHistory: [],
            scores: {},
            secretWord: "rocket"
          }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.submitGuess("ABCD", "p2", "Rocket");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/guess"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p2", guessText: "Rocket" })
      })
    );
  });

  it("restartRoom sends POST to /rooms/:code/restart with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "lobby",
            participants: [],
            availableWords: [],
            roles: [],
            drawerParticipantId: null,
            roundPhase: null,
            canvasEvents: [],
            guessHistory: [],
            scores: {}
          }
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.restartRoom("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/restart"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" })
      })
    );
  });

});
