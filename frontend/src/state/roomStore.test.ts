import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../services/api";
import { RoomStore } from "./roomStore";

vi.mock("../services/api", () => ({
  api: {
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    fetchRoom: vi.fn(),
    startRoom: vi.fn(),
    submitGuess: vi.fn()
  }
}));

const lobbyRoom = {
  code: "ABCD",
  status: "lobby" as const,
  hostParticipantId: "p1",
  participants: [{ id: "p1", name: "Alice", joinedAt: "2026-05-30T00:00:00.000Z", score: 0 }],
  availableWords: ["rocket"],
  roles: ["drawer" as const, "guesser" as const],
  guessHistory: []
};

describe("RoomStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates the room snapshot when fetchRoom succeeds", async () => {
    const store = new RoomStore();
    store.setRoomSession({ participantId: "p1", room: lobbyRoom });
    vi.mocked(api.fetchRoom).mockResolvedValue({
      room: {
        ...lobbyRoom,
        participants: [
          ...lobbyRoom.participants,
          { id: "p2", name: "Bob", joinedAt: "2026-05-30T00:00:02.000Z", score: 0 }
        ]
      }
    });

    await store.fetchRoom();

    expect(store.getSnapshot().room?.participants).toHaveLength(2);
  });

  it("preserves the latest room snapshot when fetchRoom fails", async () => {
    const store = new RoomStore();
    store.setRoomSession({ participantId: "p1", room: lobbyRoom });
    vi.mocked(api.fetchRoom).mockRejectedValue(new Error("Unable to refresh room"));

    await expect(store.fetchRoom()).rejects.toThrow("Unable to refresh room");

    expect(store.getSnapshot().room).toEqual(lobbyRoom);
    expect(store.getSnapshot().error).toBe("Unable to refresh room");
  });

  it("updates room status when startRoom succeeds", async () => {
    const store = new RoomStore();
    store.setRoomSession({ participantId: "p1", room: lobbyRoom });
    vi.mocked(api.startRoom).mockResolvedValue({
      room: {
        ...lobbyRoom,
        status: "in-game"
      }
    });

    await store.startRoom();

    expect(api.startRoom).toHaveBeenCalledWith("ABCD", "p1");
    expect(store.getSnapshot().room?.status).toBe("in-game");
  });

  it("updates room snapshot when submitGuess succeeds", async () => {
    const store = new RoomStore();
    const activeRoom = { ...lobbyRoom, status: "in-game" as const };
    store.setRoomSession({ participantId: "p1", room: activeRoom });

    const updatedRoom = {
      ...activeRoom,
      guessHistory: [
        {
          id: "g1",
          participantId: "p1",
          playerName: "Alice",
          guessText: "rocket",
          isCorrect: true,
          createdAt: "2026-05-30T00:01:00.000Z"
        }
      ]
    };

    vi.mocked(api.submitGuess).mockResolvedValue({ room: updatedRoom });

    await store.submitGuess("rocket");

    expect(api.submitGuess).toHaveBeenCalledWith("ABCD", "p1", "rocket");
    expect(store.getSnapshot().room?.guessHistory).toHaveLength(1);
    expect(store.getSnapshot().room?.guessHistory[0].guessText).toBe("rocket");
  });

  it("verifies that scoreboard displays participants sorted by score descending", () => {
    const participants = [
      { id: "p1", name: "Alice", joinedAt: "2026-05-30T00:00:00Z", score: 50 },
      { id: "p2", name: "Bob", joinedAt: "2026-05-30T00:00:01Z", score: 150 },
      { id: "p3", name: "Carol", joinedAt: "2026-05-30T00:00:02Z", score: 100 }
    ];

    const sorted = [...participants].sort((a, b) => b.score - a.score);

    expect(sorted[0].name).toBe("Bob");
    expect(sorted[1].name).toBe("Carol");
    expect(sorted[2].name).toBe("Alice");
  });
});
