import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { RoomStore } from "./roomStore";
import { api, type ParticipantRole } from "../services/api";

vi.mock("../services/api", () => ({
  api: {
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    fetchRoom: vi.fn(),
  },
}));

describe("RoomStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores room snapshot after createRoom succeeds", async () => {
    const roomSnapshot = {
      code: "ABCD",
      hostId: "host-1",
      gameState: "lobby" as const,
      participants: [],
      availableWords: [],
      roles: [] as ParticipantRole[]
    };
    vi.mocked(api.createRoom).mockResolvedValue({ participantId: "host-1", room: roomSnapshot });

    const store = new RoomStore();
    await store.createRoom("Alice");

    expect(api.createRoom).toHaveBeenCalledWith("Alice");
    expect(store.getSnapshot().room).toEqual(roomSnapshot);
  });

  it("stores room snapshot after joinRoom succeeds", async () => {
    const roomSnapshot = {
      code: "EFGH",
      hostId: "host-1",
      gameState: "lobby" as const,
      participants: [],
      availableWords: [],
      roles: [] as ParticipantRole[]
    };
    vi.mocked(api.joinRoom).mockResolvedValue({ participantId: "player-2", room: roomSnapshot });

    const store = new RoomStore();
    await store.joinRoom("IJKL", "Bob");

    expect(api.joinRoom).toHaveBeenCalledWith("IJKL", "Bob");
    expect(store.getSnapshot().room).toEqual(roomSnapshot);
  });

  it("starts polling and updates snapshot on interval", async () => {
    const roomSnapshot = {
      code: "WXYZ",
      hostId: "host-1",
      gameState: "lobby" as const,
      participants: [],
      availableWords: [],
      roles: [] as ParticipantRole[]
    };
    vi.mocked(api.fetchRoom).mockResolvedValue({ room: roomSnapshot });
    vi.useFakeTimers();

    const store = new RoomStore();
    store.setRoomSnapshot(roomSnapshot);

    store.startPolling();

    expect(store.getSnapshot().isPolling).toBe(true);
    expect(api.fetchRoom).toHaveBeenCalledWith("WXYZ", undefined);

    vi.mocked(api.fetchRoom).mockResolvedValue({ room: { ...roomSnapshot, gameState: "inProgress" as const } });
    await vi.advanceTimersByTimeAsync(5000);

    expect(api.fetchRoom).toHaveBeenCalledTimes(3);
    expect(store.getSnapshot().room?.gameState).toBe("inProgress");

    store.stopPolling();
    expect(store.getSnapshot().isPolling).toBe(false);
  });
});
