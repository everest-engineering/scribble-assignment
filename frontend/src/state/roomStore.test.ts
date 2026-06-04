import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "../services/api";
import { RoomStore } from "./roomStore";

describe("RoomStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("stores host and room status when creating a room", async () => {
    vi.spyOn(api, "createRoom").mockResolvedValue({
      participantId: "p1",
      room: {
        code: "ABCD",
        status: "lobby",
        hostParticipantId: "p1",
        currentDrawerId: null,
        participants: [],
        drawing: [],
        guessHistory: [],
        availableWords: []
      }
    });

    const store = new RoomStore();
    await store.createRoom("Alice");

    expect(store.getSnapshot()).toMatchObject({
      participantId: "p1",
      hostParticipantId: "p1",
      roomStatus: "lobby"
    });
  });

  it("restores a persisted room session from localStorage", () => {
    window.localStorage.setItem(
      "scribble.room-session",
      JSON.stringify({
        participantId: "p2",
        room: {
          code: "ABCD",
          status: "result",
          hostParticipantId: "p1",
          currentDrawerId: "p1",
          participants: [],
          drawing: [],
          guessHistory: [],
          availableWords: [],
          currentWord: "rocket"
        }
      })
    );

    const store = new RoomStore();

    expect(store.getSnapshot()).toMatchObject({
      participantId: "p2",
      hostParticipantId: "p1",
      roomStatus: "result",
      room: expect.objectContaining({
        code: "ABCD",
        currentWord: "rocket"
      })
    });
  });

  it("polls the room on a 2000 ms cadence and stops cleanly", async () => {
    vi.spyOn(api, "fetchRoom").mockResolvedValue({
      room: {
        code: "ABCD",
        status: "lobby",
        hostParticipantId: "p1",
        currentDrawerId: null,
        participants: [],
        drawing: [],
        guessHistory: [],
        availableWords: []
      }
    });

    const store = new RoomStore();
    store.setRoomSession({
      participantId: "p1",
      room: {
        code: "ABCD",
        status: "lobby",
        hostParticipantId: "p1",
        currentDrawerId: null,
        participants: [],
        drawing: [],
        guessHistory: [],
        availableWords: []
      }
    });

    store.startLobbyPolling();
    expect(api.fetchRoom).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(2000);
    expect(api.fetchRoom).toHaveBeenCalledTimes(2);

    store.stopLobbyPolling();
    await vi.advanceTimersByTimeAsync(2000);
    expect(api.fetchRoom).toHaveBeenCalledTimes(2);
  });

  it("clears the room session when polling returns a 404", async () => {
    vi.spyOn(api, "fetchRoom").mockRejectedValue(new ApiError(404, "Unable to load room"));

    const store = new RoomStore();
    store.setRoomSession({
      participantId: "p1",
      room: {
        code: "ABCD",
        status: "lobby",
        hostParticipantId: "p1",
        currentDrawerId: null,
        participants: [],
        drawing: [],
        guessHistory: [],
        availableWords: []
      }
    });

    await expect(store.fetchRoom()).resolves.toBeNull();
    expect(store.getSnapshot()).toMatchObject({
      room: null,
      participantId: null,
      hostParticipantId: null,
      roomStatus: null
    });
  });

  it("submits guesses and updates the active room snapshot", async () => {
    vi.spyOn(api, "submitGuess").mockResolvedValue({
      room: {
        code: "ABCD",
        status: "game",
        hostParticipantId: "p1",
        currentDrawerId: "p1",
        participants: [
          {
            id: "p1",
            name: "Alice",
            joinedAt: "2026-06-05T00:00:00.000Z",
            score: 0,
            hasGuessedCorrectly: false,
            role: "drawer"
          },
          {
            id: "p2",
            name: "Bob",
            joinedAt: "2026-06-05T00:00:01.000Z",
            score: 100,
            hasGuessedCorrectly: true,
            role: "guesser"
          }
        ],
        drawing: [],
        guessHistory: [
          {
            participantId: "p2",
            participantName: "Bob",
            guess: "rocket",
            isCorrect: true
          }
        ],
        availableWords: [],
        currentWord: "rocket"
      }
    });

    const store = new RoomStore();
    store.setRoomSession({
      participantId: "p2",
      room: {
        code: "ABCD",
        status: "game",
        hostParticipantId: "p1",
        currentDrawerId: "p1",
        participants: [],
        drawing: [],
        guessHistory: [],
        availableWords: [],
        currentWord: "rocket"
      }
    });

    await store.submitGuess("rocket");

    expect(store.getSnapshot().room?.guessHistory).toHaveLength(1);
    expect(store.getSnapshot().room?.participants.find((participant) => participant.id === "p2")?.score).toBe(100);
  });

  it("restarts the active room and updates the snapshot to the lobby", async () => {
    vi.spyOn(api, "restartRoom").mockResolvedValue({
      room: {
        code: "ABCD",
        status: "lobby",
        hostParticipantId: "p1",
        currentDrawerId: null,
        participants: [
          {
            id: "p1",
            name: "Alice",
            joinedAt: "2026-06-05T00:00:00.000Z",
            score: 0,
            hasGuessedCorrectly: false
          }
        ],
        drawing: [],
        guessHistory: [],
        availableWords: []
      }
    });

    const store = new RoomStore();
    store.setRoomSession({
      participantId: "p1",
      room: {
        code: "ABCD",
        status: "result",
        hostParticipantId: "p1",
        currentDrawerId: "p1",
        participants: [
          {
            id: "p1",
            name: "Alice",
            joinedAt: "2026-06-05T00:00:00.000Z",
            score: 100,
            hasGuessedCorrectly: true,
            role: "drawer"
          }
        ],
        drawing: [],
        guessHistory: [],
        availableWords: [],
        currentWord: "rocket"
      }
    });

    await store.restartRoom("ABCD");

    expect(store.getSnapshot()).toMatchObject({
      roomStatus: "lobby",
      room: expect.objectContaining({
        status: "lobby",
        currentDrawerId: null
      })
    });
  });
});
