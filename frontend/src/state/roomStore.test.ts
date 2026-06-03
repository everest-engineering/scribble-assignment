import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, type RoomSnapshot, type RoomSessionResponse } from "../services/api";
import { RoomStore } from "./roomStore";

vi.mock("../services/api", () => ({
  api: {
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    fetchRoom: vi.fn(),
    startGame: vi.fn(),
    updateDrawing: vi.fn(),
    clearDrawing: vi.fn(),
    submitGuess: vi.fn(),
    restartRoom: vi.fn()
  }
}));

const lobbyRoom: RoomSnapshot = {
  code: "ABCD",
  status: "lobby",
  hostParticipantId: "p1",
  viewerParticipantId: "p1",
  viewerRole: null,
  drawerParticipantId: null,
  participants: [{ id: "p1", name: "Alice", joinedAt: "now", isHost: true, role: null, score: 0 }],
  drawing: { strokes: [] },
  guesses: [],
  scores: {},
  canStart: false,
  canRestart: false,
  availableWords: ["rocket"],
  roles: ["drawer", "guesser"]
};

describe("RoomStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores room sessions from createRoom", async () => {
    const response: RoomSessionResponse = { participantId: "p1", room: lobbyRoom };
    vi.mocked(api.createRoom).mockResolvedValue(response);
    const store = new RoomStore();

    await store.createRoom("Alice");

    expect(store.getSnapshot().participantId).toBe("p1");
    expect(store.getSnapshot().room?.code).toBe("ABCD");
  });

  it("fetchRoom keeps participant id in the API call", async () => {
    const response: RoomSessionResponse = { participantId: "p1", room: lobbyRoom };
    vi.mocked(api.createRoom).mockResolvedValue(response);
    vi.mocked(api.fetchRoom).mockResolvedValue({ room: { ...lobbyRoom, canStart: true } });
    const store = new RoomStore();

    await store.createRoom("Alice");
    await store.fetchRoom();

    expect(api.fetchRoom).toHaveBeenCalledWith("ABCD", "p1");
    expect(store.getSnapshot().room?.canStart).toBe(true);
  });

  it("startGame updates the stored room snapshot", async () => {
    const response: RoomSessionResponse = { participantId: "p1", room: { ...lobbyRoom, canStart: true } };
    vi.mocked(api.createRoom).mockResolvedValue(response);
    vi.mocked(api.startGame).mockResolvedValue({ room: { ...lobbyRoom, status: "active" } });
    const store = new RoomStore();

    await store.createRoom("Alice");
    await store.startGame();

    expect(api.startGame).toHaveBeenCalledWith("ABCD", "p1");
    expect(store.getSnapshot().room?.status).toBe("active");
  });

  it("updateDrawing stores the returned drawing snapshot", async () => {
    const response: RoomSessionResponse = { participantId: "p1", room: { ...lobbyRoom, status: "active", viewerRole: "drawer" } };
    const strokes = [{ id: "stroke-1", points: [{ x: 10, y: 20 }] }];
    vi.mocked(api.createRoom).mockResolvedValue(response);
    vi.mocked(api.updateDrawing).mockResolvedValue({ room: { ...response.room, drawing: { strokes } } });
    const store = new RoomStore();

    await store.createRoom("Alice");
    await store.updateDrawing(strokes);

    expect(api.updateDrawing).toHaveBeenCalledWith("ABCD", "p1", strokes);
    expect(store.getSnapshot().room?.drawing.strokes).toHaveLength(1);
  });

  it("submitGuess stores the returned guess and score snapshot", async () => {
    const response: RoomSessionResponse = { participantId: "p2", room: { ...lobbyRoom, status: "active", viewerRole: "guesser" } };
    vi.mocked(api.joinRoom).mockResolvedValue(response);
    vi.mocked(api.submitGuess).mockResolvedValue({
      room: {
        ...response.room,
        guesses: [{ id: "g1", participantId: "p2", participantName: "Bob", text: "rocket", isCorrect: true, scoreDelta: 100, createdAt: "now" }],
        scores: { p1: 0, p2: 100 }
      }
    });
    const store = new RoomStore();

    await store.joinRoom("ABCD", "Bob");
    await store.submitGuess("rocket");

    expect(api.submitGuess).toHaveBeenCalledWith("ABCD", "p2", "rocket");
    expect(store.getSnapshot().room?.guesses).toHaveLength(1);
    expect(store.getSnapshot().room?.scores.p2).toBe(100);
  });
});
