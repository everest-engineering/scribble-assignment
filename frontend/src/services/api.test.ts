import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

function createPlayingSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    code: "ABCD",
    status: "playing",
    hostParticipantId: "p1",
    participants: [
      {
        id: "p1",
        name: "Alice",
        joinedAt: "2026-05-30T12:00:00.000Z",
        score: 0
      },
      {
        id: "p2",
        name: "Bob",
        joinedAt: "2026-05-30T12:00:01.000Z",
        score: 0
      }
    ],
    viewerIsHost: false,
    canStartGame: false,
    minimumPlayersToStart: 2,
    drawerParticipantId: "p1",
    viewerIsDrawer: false,
    viewerCanDraw: false,
    viewerCanGuess: true,
    wordVisibility: "hidden",
    canvas: {
      strokes: []
    },
    guessHistory: [],
    ...overrides
  };
}

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
            hostParticipantId: "p1",
            participants: [],
            viewerIsHost: true,
            canStartGame: false,
            minimumPlayersToStart: 2,
            viewerIsDrawer: false,
            viewerCanDraw: false,
            viewerCanGuess: false
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

  it("fetchRoom sends GET to /rooms/:code with participantId query param", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "XYZW",
            status: "lobby",
            hostParticipantId: "p1",
            participants: [],
            viewerIsHost: true,
            canStartGame: false,
            minimumPlayersToStart: 2,
            viewerIsDrawer: false,
            viewerCanDraw: false,
            viewerCanGuess: false
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

  it("joinRoom sends POST to /rooms/:code/join with playerName in body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p2",
          room: {
            code: "ABCD",
            status: "lobby",
            hostParticipantId: "p1",
            participants: [],
            viewerIsHost: false,
            canStartGame: false,
            minimumPlayersToStart: 2,
            viewerIsDrawer: false,
            viewerCanDraw: false,
            viewerCanGuess: false
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

  it("startGame sends POST to /rooms/:code/start with participantId in body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: createPlayingSnapshot({
            viewerIsHost: true,
            viewerIsDrawer: true,
            viewerCanDraw: true,
            viewerCanGuess: false,
            wordVisibility: "visible",
            secretWord: "rocket"
          })
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.startGame("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/start"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" })
      })
    );
  });

  it("drawStroke sends POST to /rooms/:code/drawing with normalized points", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: createPlayingSnapshot({
            viewerIsHost: true,
            viewerIsDrawer: true,
            viewerCanDraw: true,
            viewerCanGuess: false,
            canvas: {
              strokes: [
                {
                  id: "stroke-1",
                  drawnByParticipantId: "p1",
                  createdAt: "2026-05-30T12:01:00.000Z",
                  points: [
                    { x: 0.1, y: 0.1 },
                    { x: 0.3, y: 0.3 }
                  ]
                }
              ]
            }
          })
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.drawStroke("ABCD", "p1", [
      { x: 0.1, y: 0.1 },
      { x: 0.3, y: 0.3 }
    ]);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/drawing"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          participantId: "p1",
          points: [
            { x: 0.1, y: 0.1 },
            { x: 0.3, y: 0.3 }
          ]
        })
      })
    );
  });

  it("clearCanvas sends POST to /rooms/:code/drawing/clear with participantId in body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: createPlayingSnapshot({
            viewerIsHost: true,
            viewerIsDrawer: true,
            viewerCanDraw: true,
            viewerCanGuess: false,
            canvas: {
              strokes: [],
              clearedAt: "2026-05-30T12:02:00.000Z"
            }
          })
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.clearCanvas("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/drawing/clear"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" })
      })
    );
  });

  it("submitGuess sends POST to /rooms/:code/guesses with guess text in body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: createPlayingSnapshot({
            guessHistory: [
              {
                id: "guess-1",
                participantId: "p2",
                participantName: "Bob",
                guess: "Rocket",
                isCorrect: true,
                scoreAwarded: 100,
                submittedAt: "2026-05-30T12:03:00.000Z"
              }
            ],
            participants: [
              {
                id: "p1",
                name: "Alice",
                joinedAt: "2026-05-30T12:00:00.000Z",
                score: 0
              },
              {
                id: "p2",
                name: "Bob",
                joinedAt: "2026-05-30T12:00:01.000Z",
                score: 100
              }
            ]
          })
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.submitGuess("ABCD", "p2", "Rocket");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/guesses"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p2", guess: "Rocket" })
      })
    );
  });

  it("fetchRoom supports polling a gameplay snapshot with canvas and guess history", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: createPlayingSnapshot({
            canvas: {
              strokes: [
                {
                  id: "stroke-1",
                  drawnByParticipantId: "p1",
                  createdAt: "2026-05-30T12:01:00.000Z",
                  points: [{ x: 0.2, y: 0.4 }]
                }
              ]
            },
            guessHistory: [
              {
                id: "guess-1",
                participantId: "p2",
                participantName: "Bob",
                guess: "wrong",
                isCorrect: false,
                scoreAwarded: 0,
                submittedAt: "2026-05-30T12:03:00.000Z"
              }
            ]
          })
        })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const response = await api.fetchRoom("ABCD", "p2");

    expect(response.room.status).toBe("playing");
    expect(response.room.viewerIsDrawer).toBe(false);
    expect(response.room.canvas?.strokes).toHaveLength(1);
    expect(response.room.guessHistory?.[0].scoreAwarded).toBe(0);
    expect(response.room.secretWord).toBeUndefined();
  });
});
