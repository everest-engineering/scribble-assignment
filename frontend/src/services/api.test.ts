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
            hostParticipantId: "p1",
            isHost: true,
            canStart: false,
            isDrawer: false,
            availableWords: [],
            roles: []
          },
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
          room: {
            code: "XYZW",
            status: "lobby",
            participants: [],
            hostParticipantId: "p1",
            isHost: true,
            canStart: false,
            isDrawer: false,
            availableWords: [],
            roles: []
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  it("joinRoom sends normalized code path and playerName body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p2",
          room: {
            code: "ABCD",
            status: "lobby",
            participants: [],
            hostParticipantId: "p1",
            isHost: false,
            canStart: false,
            isDrawer: false,
            availableWords: [],
            roles: []
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.joinRoom("ABCD", "Bob");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/join"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ playerName: "Bob" }),
      })
    );
  });

  it("startRoom sends POST to /rooms/:code/start with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "playing",
            participants: [],
            hostParticipantId: "p1",
            isHost: true,
            canStart: false,
            currentRound: {
              roundNumber: 1,
              drawerParticipantId: "p1",
              drawerName: "Alice"
            },
            viewerRole: "drawer",
            isDrawer: true,
            secretWord: "rocket",
            availableWords: [],
            roles: []
          },
        }),
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

  it("throws clear API error messages for rejected requests", async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ message: "Unable to join room" }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(api.joinRoom("ZZZZ", "Bob")).rejects.toThrow("Unable to join room");
  });

  it("submitDrawingStroke sends POST to /rooms/:code/drawing with participantId and stroke", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", scores: [] } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.submitDrawingStroke("ABCD", "p1", {
      color: "#111827",
      size: 4,
      points: [
        { x: 0.1, y: 0.1 },
        { x: 0.2, y: 0.2 }
      ]
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/drawing"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          participantId: "p1",
          stroke: {
            color: "#111827",
            size: 4,
            points: [
              { x: 0.1, y: 0.1 },
              { x: 0.2, y: 0.2 }
            ]
          }
        }),
      })
    );
  });

  it("clearDrawing sends POST to /rooms/:code/drawing/clear with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", scores: [] } }),
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

  it("submitGuess trims guesses before sending POST to /rooms/:code/guesses", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", scores: [] } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.submitGuess("ABCD", "p2", " Rocket ");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/guesses"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p2", guess: "Rocket" }),
      })
    );
  });

  it("endRound sends POST to /rooms/:code/round/end with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "result", scores: [] } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.endRound("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/round/end"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
  });

  it("restartRoom sends POST to /rooms/:code/restart with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "lobby", scores: [] } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.restartRoom("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/restart"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
  });

  it("accepts drawer snapshots with secretWord", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "playing",
            participants: [],
            hostParticipantId: "p1",
            viewerParticipantId: "p1",
            isHost: true,
            canStart: false,
            currentRound: {
              roundNumber: 1,
              drawerParticipantId: "p1",
              drawerName: "Alice"
            },
            viewerRole: "drawer",
            isDrawer: true,
            secretWord: "rocket",
            availableWords: [],
            roles: []
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const response = await api.fetchRoom("ABCD", "p1");

    expect(response.room.isDrawer).toBe(true);
    expect(response.room.secretWord).toBe("rocket");
  });

  it("accepts guesser snapshots without secretWord", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "playing",
            participants: [],
            hostParticipantId: "p1",
            viewerParticipantId: "p2",
            isHost: false,
            canStart: false,
            currentRound: {
              roundNumber: 1,
              drawerParticipantId: "p1",
              drawerName: "Alice"
            },
            viewerRole: "guesser",
            isDrawer: false,
            availableWords: [],
            roles: []
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const response = await api.fetchRoom("ABCD", "p2");

    expect(response.room.isDrawer).toBe(false);
    expect("secretWord" in response.room).toBe(false);
  });

  it("accepts gameplay snapshots with canvas, guesses, and scores", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "playing",
            participants: [],
            hostParticipantId: "p1",
            viewerParticipantId: "p2",
            isHost: false,
            canStart: false,
            currentRound: {
              roundNumber: 1,
              drawerParticipantId: "p1",
              drawerName: "Alice",
              canvas: {
                strokes: [
                  {
                    id: "s1",
                    color: "#111827",
                    size: 4,
                    points: [
                      { x: 0.1, y: 0.1 },
                      { x: 0.2, y: 0.2 }
                    ]
                  }
                ],
                updatedAt: "2026-05-29T09:30:00.000Z"
              },
              guesses: [
                {
                  id: "g1",
                  participantId: "p2",
                  participantName: "Bob",
                  text: "rocket",
                  isCorrect: true,
                  pointsAwarded: 100,
                  createdAt: "2026-05-29T09:31:00.000Z"
                }
              ]
            },
            viewerRole: "guesser",
            isDrawer: false,
            scores: [{ participantId: "p2", participantName: "Bob", score: 100 }],
            availableWords: [],
            roles: []
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const response = await api.fetchRoom("ABCD", "p2");

    expect(response.room.currentRound?.canvas.strokes).toHaveLength(1);
    expect(response.room.currentRound?.guesses).toHaveLength(1);
    expect(response.room.scores[0].score).toBe(100);
    expect("secretWord" in response.room).toBe(false);
  });

  it("accepts result snapshots with completed round data", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "result",
            participants: [],
            hostParticipantId: "p1",
            viewerParticipantId: "p2",
            isHost: false,
            canStart: false,
            completedRound: {
              roundNumber: 1,
              drawerParticipantId: "p1",
              drawerName: "Alice",
              secretWord: "rocket",
              startedAt: "2026-05-29T09:25:00.000Z",
              endedAt: "2026-05-29T09:35:00.000Z",
              canvas: {
                strokes: [],
                updatedAt: "2026-05-29T09:30:00.000Z"
              },
              guesses: [
                {
                  id: "g1",
                  participantId: "p2",
                  participantName: "Bob",
                  text: "rocket",
                  isCorrect: true,
                  pointsAwarded: 100,
                  createdAt: "2026-05-29T09:31:00.000Z"
                }
              ],
              scores: [{ participantId: "p2", participantName: "Bob", score: 100 }]
            },
            isDrawer: false,
            scores: [{ participantId: "p2", participantName: "Bob", score: 100 }],
            availableWords: [],
            roles: []
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const response = await api.fetchRoom("ABCD", "p2");

    expect(response.room.status).toBe("result");
    expect(response.room.completedRound?.secretWord).toBe("rocket");
    expect(response.room.completedRound?.guesses).toHaveLength(1);
    expect(response.room.completedRound?.scores[0].score).toBe(100);
  });

  it("accepts restarted lobby snapshots without completed round data", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "lobby",
            participants: [],
            hostParticipantId: "p1",
            viewerParticipantId: "p1",
            isHost: true,
            canStart: true,
            isDrawer: false,
            scores: [],
            availableWords: [],
            roles: []
          },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const response = await api.fetchRoom("ABCD", "p1");

    expect(response.room.status).toBe("lobby");
    expect(response.room.completedRound).toBeUndefined();
    expect(response.room.currentRound).toBeUndefined();
    expect("secretWord" in response.room).toBe(false);
  });
});
