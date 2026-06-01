import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../services/api";
import { RoomStore } from "./roomStore";

vi.mock("../services/api", () => ({
  api: {
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    fetchRoom: vi.fn(),
    startRoom: vi.fn(),
    restartRoom: vi.fn(),
    drawCanvas: vi.fn(),
    clearCanvas: vi.fn(),
    submitGuess: vi.fn()
  }
}));

const mockedApi = vi.mocked(api);

describe("RoomStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedApi.createRoom.mockReset();
    mockedApi.joinRoom.mockReset();
    mockedApi.fetchRoom.mockReset();
    mockedApi.startRoom.mockReset();
    mockedApi.restartRoom.mockReset();
    mockedApi.drawCanvas.mockReset();
    mockedApi.clearCanvas.mockReset();
    mockedApi.submitGuess.mockReset();
  });

  it("creates a room session and polls for room updates", async () => {
    mockedApi.createRoom.mockResolvedValue({
      participantId: "p1",
      room: {
        code: "ABCD",
        status: "lobby",
        participants: [{ id: "p1", name: "Alice", joinedAt: "2026-05-31T00:00:00.000Z" }],
        availableWords: ["rocket"],
        roles: ["drawer", "guesser"],
        drawerParticipantId: null,
        roundPhase: null,
        canvasEvents: [],
        guessHistory: [],
        scores: {}
      }
    });
    mockedApi.fetchRoom.mockResolvedValue({
      room: {
        code: "ABCD",
        status: "lobby",
        participants: [{ id: "p1", name: "Alice", joinedAt: "2026-05-31T00:00:00.000Z" }],
        availableWords: ["rocket"],
        roles: ["drawer", "guesser"],
        drawerParticipantId: null,
        roundPhase: null,
        canvasEvents: [],
        guessHistory: [],
        scores: {}
      }
    });

    const store = new RoomStore();
    await store.createRoom("Alice");
    store.enablePolling();

    expect(store.getSnapshot().participantId).toBe("p1");
    expect(store.getSnapshot().room?.participants[0]?.id).toBe("p1");

    await vi.advanceTimersByTimeAsync(2000);

    expect(mockedApi.fetchRoom).toHaveBeenCalledWith("ABCD", "p1");
  });

  it("joins an existing room and keeps the returned snapshot", async () => {
    mockedApi.joinRoom.mockResolvedValue({
      participantId: "p2",
      room: {
        code: "ABCD",
        status: "lobby",
        participants: [
          { id: "p1", name: "Alice", joinedAt: "2026-05-31T00:00:00.000Z" },
          { id: "p2", name: "Bob", joinedAt: "2026-05-31T00:00:01.000Z" }
        ],
        availableWords: ["rocket"],
        roles: ["drawer", "guesser"],
        drawerParticipantId: null,
        roundPhase: null,
        canvasEvents: [],
        guessHistory: [],
        scores: {}
      }
    });

    const store = new RoomStore();
    await store.joinRoom("ABCD", "Bob");

    expect(store.getSnapshot().participantId).toBe("p2");
    expect(store.getSnapshot().room?.participants).toHaveLength(2);
  });

  it("starts the current room through the API when the host requests it", async () => {
    mockedApi.createRoom.mockResolvedValue({
      participantId: "p1",
      room: {
        code: "ABCD",
        status: "lobby",
        participants: [
          { id: "p1", name: "Alice", joinedAt: "2026-05-31T00:00:00.000Z" },
          { id: "p2", name: "Bob", joinedAt: "2026-05-31T00:00:01.000Z" }
        ],
        availableWords: ["rocket"],
        roles: ["drawer", "guesser"],
        drawerParticipantId: null,
        roundPhase: null,
        canvasEvents: [],
        guessHistory: [],
        scores: {}
      }
    });
    mockedApi.startRoom.mockResolvedValue({
      room: {
        code: "ABCD",
        status: "game",
        participants: [
          { id: "p1", name: "Alice", joinedAt: "2026-05-31T00:00:00.000Z" },
          { id: "p2", name: "Bob", joinedAt: "2026-05-31T00:00:01.000Z" }
        ],
        availableWords: ["rocket"],
        roles: ["drawer", "guesser"],
        drawerParticipantId: "p1",
        roundPhase: "active",
        canvasEvents: [],
        guessHistory: [],
        scores: { p1: 0, p2: 0 },
        secretWord: "rocket"
      }
    });

    const store = new RoomStore();
    await store.createRoom("Alice");

    const started = await store.startRoom("rocket");

    expect(started?.status).toBe("game");
    expect(store.getSnapshot().room?.status).toBe("game");
    expect(mockedApi.startRoom).toHaveBeenCalledWith("ABCD", "p1", "rocket");
  });

  it("draws, clears, and submits guesses through the API", async () => {
    mockedApi.createRoom.mockResolvedValue({
      participantId: "p1",
      room: {
        code: "ABCD",
        status: "game",
        participants: [
          { id: "p1", name: "Alice", joinedAt: "2026-05-31T00:00:00.000Z" },
          { id: "p2", name: "Bob", joinedAt: "2026-05-31T00:00:01.000Z" }
        ],
        availableWords: ["rocket"],
        roles: ["drawer", "guesser"],
        drawerParticipantId: "p1",
        roundPhase: "active",
        canvasEvents: [],
        guessHistory: [],
        scores: { p1: 0, p2: 0 },
        secretWord: "rocket"
      }
    });
    mockedApi.drawCanvas.mockResolvedValue({
      room: {
        code: "ABCD",
        status: "game",
        participants: [
          { id: "p1", name: "Alice", joinedAt: "2026-05-31T00:00:00.000Z" },
          { id: "p2", name: "Bob", joinedAt: "2026-05-31T00:00:01.000Z" }
        ],
        availableWords: ["rocket"],
        roles: ["drawer", "guesser"],
        drawerParticipantId: "p1",
        roundPhase: "active",
        canvasEvents: [
          {
            id: "event-1",
            type: "stroke",
            participantId: "p1",
            createdAt: "2026-05-31T00:00:02.000Z",
            stroke: {
              points: [{ x: 1, y: 2 }],
              color: "#111827",
              lineWidth: 4
            }
          }
        ],
        guessHistory: [],
        scores: { p1: 0, p2: 0 },
        secretWord: "rocket"
      }
    });
    mockedApi.clearCanvas.mockResolvedValue({
      room: {
        code: "ABCD",
        status: "game",
        participants: [
          { id: "p1", name: "Alice", joinedAt: "2026-05-31T00:00:00.000Z" },
          { id: "p2", name: "Bob", joinedAt: "2026-05-31T00:00:01.000Z" }
        ],
        availableWords: ["rocket"],
        roles: ["drawer", "guesser"],
        drawerParticipantId: "p1",
        roundPhase: "active",
        canvasEvents: [],
        guessHistory: [],
        scores: { p1: 0, p2: 0 },
        secretWord: "rocket"
      }
    });
    mockedApi.submitGuess.mockResolvedValue({
      room: {
        code: "ABCD",
        status: "game",
        participants: [
          { id: "p1", name: "Alice", joinedAt: "2026-05-31T00:00:00.000Z" },
          { id: "p2", name: "Bob", joinedAt: "2026-05-31T00:00:01.000Z" }
        ],
        availableWords: ["rocket"],
        roles: ["drawer", "guesser"],
        drawerParticipantId: "p1",
        roundPhase: "active",
        canvasEvents: [],
        guessHistory: [
          {
            id: "guess-1",
            participantId: "p2",
            rawText: "Rocket",
            normalizedText: "rocket",
            isCorrect: true,
            pointsAwarded: 100,
            createdAt: "2026-05-31T00:00:03.000Z"
          }
        ],
        scores: { p1: 0, p2: 100 },
        secretWord: "rocket"
      }
    });

    const store = new RoomStore();
    await store.createRoom("Alice");

    await store.drawCanvas({
      points: [{ x: 1, y: 2 }],
      color: "#111827",
      lineWidth: 4
    });
    await store.clearCanvas();
    await store.submitGuess("Rocket");

    expect(mockedApi.drawCanvas).toHaveBeenCalledWith("ABCD", "p1", {
      points: [{ x: 1, y: 2 }],
      color: "#111827",
      lineWidth: 4
    });
    expect(mockedApi.clearCanvas).toHaveBeenCalledWith("ABCD", "p1");
    expect(mockedApi.submitGuess).toHaveBeenCalledWith("ABCD", "p1", "Rocket");
  });

  it("restarts the current room through the API when requested", async () => {
    mockedApi.createRoom.mockResolvedValue({
      participantId: "p1",
      room: {
        code: "ABCD",
        status: "game",
        participants: [
          { id: "p1", name: "Alice", joinedAt: "2026-05-31T00:00:00.000Z" },
          { id: "p2", name: "Bob", joinedAt: "2026-05-31T00:00:01.000Z" }
        ],
        availableWords: ["rocket"],
        roles: ["drawer", "guesser"],
        drawerParticipantId: "p1",
        roundPhase: "ended",
        canvasEvents: [],
        guessHistory: [],
        scores: { p1: 0, p2: 100 },
        secretWord: "rocket"
      }
    });
    mockedApi.restartRoom.mockResolvedValue({
      room: {
        code: "ABCD",
        status: "lobby",
        participants: [
          { id: "p1", name: "Alice", joinedAt: "2026-05-31T00:00:00.000Z" },
          { id: "p2", name: "Bob", joinedAt: "2026-05-31T00:00:01.000Z" }
        ],
        availableWords: ["rocket"],
        roles: ["drawer", "guesser"],
        drawerParticipantId: null,
        roundPhase: null,
        canvasEvents: [],
        guessHistory: [],
        scores: {}
      }
    });

    const store = new RoomStore();
    await store.createRoom("Alice");

    const restarted = await store.restartRoom();

    expect(restarted?.status).toBe("lobby");
    expect(store.getSnapshot().room?.status).toBe("lobby");
    expect(mockedApi.restartRoom).toHaveBeenCalledWith("ABCD", "p1");
  });
});
