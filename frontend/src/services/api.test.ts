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
            viewerParticipantId: "p1",
            isHost: true,
            canStart: false,
            availableWords: [],
            roles: []
          }
        }),
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
            participants: [],
            hostParticipantId: "p1",
            viewerParticipantId: "p1",
            isHost: true,
            canStart: false,
            availableWords: [],
            roles: []
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  it("joinRoom sends POST to /rooms/:code/join with playerName", async () => {
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
            viewerParticipantId: "p2",
            isHost: false,
            canStart: false,
            availableWords: [],
            roles: []
          }
        }),
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

  it("throws error on non-ok join response", async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ message: "Room not found" })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(api.joinRoom("ZZZZ", "Bob")).rejects.toThrow("Room not found");
  });

  it("startRoom sends POST to /rooms/:code/start with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "inGame",
            participants: [],
            hostParticipantId: "p1",
            viewerParticipantId: "p1",
            isHost: true,
            canStart: false,
            availableWords: [],
            roles: []
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.startRoom("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/start"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" })
      })
    );
  });

  it("throws error on non-ok start response", async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ message: "Only the host can start the game" })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(api.startRoom("ABCD", "p2")).rejects.toThrow(
      "Only the host can start the game"
    );
  });

  it("submitDrawingStroke sends POST to /rooms/:code/drawing with stroke body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "inGame",
            participants: [],
            hostParticipantId: "p1",
            viewerParticipantId: "p1",
            isHost: true,
            canStart: false,
            availableWords: [],
            roles: ["drawer", "guesser"],
            viewerRole: "drawer",
            isDrawer: true,
            secretWord: "rocket"
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.submitDrawingStroke("ABCD", "p1", {
      color: "#111827",
      size: 4,
      points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/drawing"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("#111827")
      })
    );
  });

  it("clearDrawing sends POST to /rooms/:code/drawing/clear with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "inGame",
            participants: [],
            hostParticipantId: "p1",
            viewerParticipantId: "p1",
            isHost: true,
            canStart: false,
            availableWords: [],
            roles: ["drawer", "guesser"],
            viewerRole: "drawer",
            isDrawer: true,
            secretWord: "rocket"
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.clearDrawing("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/drawing/clear"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" })
      })
    );
  });

  it("submitGuess sends POST to /rooms/:code/guesses with trimmed guess body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "inGame",
            participants: [],
            hostParticipantId: "p1",
            viewerParticipantId: "p2",
            isHost: false,
            canStart: false,
            availableWords: [],
            roles: ["drawer", "guesser"],
            viewerRole: "guesser",
            isDrawer: false
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.submitGuess("ABCD", "p2", "rocket");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/guesses"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p2", guess: "rocket" })
      })
    );
  });

  it("submitGuess propagates error on non-ok response", async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ message: "Drawer cannot submit guesses" })
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(api.submitGuess("ABCD", "p1", "guess")).rejects.toThrow(
      "Drawer cannot submit guesses"
    );
  });

  it("fetchRoom handles extended gameplay snapshot with canvas and guesses", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "inGame",
            participants: [
              { id: "p1", name: "Alice", joinedAt: "2026-01-01T00:00:00.000Z" },
              { id: "p2", name: "Bob", joinedAt: "2026-01-01T00:00:01.000Z" }
            ],
            hostParticipantId: "p1",
            viewerParticipantId: "p1",
            isHost: true,
            canStart: false,
            availableWords: [],
            roles: ["drawer", "guesser"],
            currentRound: {
              roundNumber: 1,
              drawerParticipantId: "p1",
              drawerName: "Alice",
              canvas: {
                strokes: [{ id: "s1", color: "#111827", size: 4, points: [{ x: 0.1, y: 0.2 }] }],
                updatedAt: "2026-01-01T00:01:00.000Z"
              },
              guesses: [
                { id: "g1", participantId: "p2", participantName: "Bob", text: "rocket", isCorrect: true, pointsAwarded: 100, createdAt: "2026-01-01T00:02:00.000Z" }
              ]
            },
            viewerRole: "drawer",
            isDrawer: true,
            secretWord: "rocket",
            scores: [
              { participantId: "p1", participantName: "Alice", score: 0 },
              { participantId: "p2", participantName: "Bob", score: 100 }
            ]
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await api.fetchRoom("ABCD", "p1");
    expect(result.room.currentRound!.canvas!.strokes).toHaveLength(1);
    expect(result.room.currentRound!.guesses).toHaveLength(1);
    expect(result.room.scores).toHaveLength(2);
  });

  it("fetchRoom returns guesser snapshot without secretWord but with canvas and guesses", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "inGame",
            participants: [
              { id: "p1", name: "Alice", joinedAt: "2026-01-01T00:00:00.000Z" },
              { id: "p2", name: "Bob", joinedAt: "2026-01-01T00:00:01.000Z" }
            ],
            hostParticipantId: "p1",
            viewerParticipantId: "p2",
            isHost: false,
            canStart: false,
            availableWords: [],
            roles: ["drawer", "guesser"],
            currentRound: {
              roundNumber: 1,
              drawerParticipantId: "p1",
              drawerName: "Alice",
              canvas: {
                strokes: [{ id: "s1", color: "#111827", size: 4, points: [{ x: 0.1, y: 0.2 }] }],
                updatedAt: "2026-01-01T00:01:00.000Z"
              },
              guesses: []
            },
            viewerRole: "guesser",
            isDrawer: false,
            scores: [
              { participantId: "p1", participantName: "Alice", score: 0 },
              { participantId: "p2", participantName: "Bob", score: 0 }
            ]
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await api.fetchRoom("ABCD", "p2");
    expect(result.room.currentRound!.canvas!.strokes).toHaveLength(1);
    expect(result.room.secretWord).toBeUndefined();
    expect(result.room.scores).toBeDefined();
  });

  it("fetchRoom returns playing snapshot with currentRound for playing room", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "inGame",
            participants: [{ id: "p1", name: "Alice", joinedAt: "2026-01-01T00:00:00.000Z" }],
            hostParticipantId: "p1",
            viewerParticipantId: "p1",
            isHost: true,
            canStart: false,
            availableWords: [],
            roles: ["drawer", "guesser"],
            currentRound: {
              roundNumber: 1,
              drawerParticipantId: "p1",
              drawerName: "Alice"
            },
            viewerRole: "drawer",
            isDrawer: true,
            secretWord: "rocket"
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await api.fetchRoom("ABCD", "p1");
    expect(result.room.currentRound).toBeDefined();
    expect(result.room.currentRound!.drawerName).toBe("Alice");
    expect(result.room.viewerRole).toBe("drawer");
    expect(result.room.isDrawer).toBe(true);
    expect(result.room.secretWord).toBe("rocket");
  });

  it("fetchRoom returns guesser snapshot without secretWord", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "inGame",
            participants: [{ id: "p1", name: "Alice", joinedAt: "2026-01-01T00:00:00.000Z" }],
            hostParticipantId: "p1",
            viewerParticipantId: "p2",
            isHost: false,
            canStart: false,
            availableWords: [],
            roles: ["drawer", "guesser"],
            currentRound: {
              roundNumber: 1,
              drawerParticipantId: "p1",
              drawerName: "Alice"
            },
            viewerRole: "guesser",
            isDrawer: false
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await api.fetchRoom("ABCD", "p2");
    expect(result.room.currentRound).toBeDefined();
    expect(result.room.currentRound!.drawerName).toBe("Alice");
    expect(result.room.viewerRole).toBe("guesser");
    expect(result.room.isDrawer).toBe(false);
    expect(result.room.secretWord).toBeUndefined();
  });

  it("startRoom returns playing snapshot with drawer and secretWord for drawer", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: {
            code: "ABCD",
            status: "inGame",
            participants: [{ id: "p1", name: "Alice", joinedAt: "2026-01-01T00:00:00.000Z" }],
            hostParticipantId: "p1",
            viewerParticipantId: "p1",
            isHost: true,
            canStart: false,
            availableWords: [],
            roles: ["drawer", "guesser"],
            currentRound: {
              roundNumber: 1,
              drawerParticipantId: "p1",
              drawerName: "Alice"
            },
            viewerRole: "drawer",
            isDrawer: true,
            secretWord: "rocket"
          }
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await api.startRoom("ABCD", "p1");
    expect(result.room.currentRound).toBeDefined();
    expect(result.room.secretWord).toBeDefined();
  });
});
