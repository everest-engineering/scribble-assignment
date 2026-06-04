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

  it("polls the room on a 2000 ms cadence and stops cleanly", async () => {
    vi.spyOn(api, "fetchRoom").mockResolvedValue({
      room: {
        code: "ABCD",
        status: "lobby",
        hostParticipantId: "p1",
        currentDrawerId: null,
        participants: [],
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
});
