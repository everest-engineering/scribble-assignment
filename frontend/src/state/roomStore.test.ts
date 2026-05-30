import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../services/api";
import { RoomStore } from "./roomStore";

vi.mock("../services/api", () => ({
  api: {
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    fetchRoom: vi.fn(),
    startRoom: vi.fn()
  }
}));

const lobbyRoom = {
  code: "ABCD",
  status: "lobby" as const,
  hostParticipantId: "p1",
  participants: [{ id: "p1", name: "Alice", joinedAt: "2026-05-30T00:00:00.000Z" }],
  availableWords: ["rocket"],
  roles: ["drawer" as const, "guesser" as const]
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
          { id: "p2", name: "Bob", joinedAt: "2026-05-30T00:00:02.000Z" }
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
});
