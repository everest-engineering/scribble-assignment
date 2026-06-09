import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoomStore } from "./roomStore";
import { api } from "../services/api";
import type { RoomSnapshot } from "../services/api";

vi.mock("../services/api", () => ({
  api: {
    startGame: vi.fn(),
    fetchRoom: vi.fn(),
  },
}));

function makeMockRoom(overrides?: Partial<RoomSnapshot>): RoomSnapshot {
  return {
    code: "ABCD",
    status: "lobby",
    participants: [],
    hostId: "p1",
    drawerId: "",
    ...overrides,
  };
}

describe("RoomStore", () => {
  let store: RoomStore;

  beforeEach(() => {
    store = new RoomStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("startGame", () => {
    it("calls API and updates snapshot on success", async () => {
      const mockRoom = makeMockRoom();
      store.setRoomSession({ participantId: "p1", room: mockRoom });

      const updatedRoom = makeMockRoom({ status: "playing" });
      vi.mocked(api.startGame).mockResolvedValue({ room: updatedRoom });

      const result = await store.startGame();

      expect(api.startGame).toHaveBeenCalledWith("ABCD", "p1");
      expect(store.getSnapshot().room?.status).toBe("playing");
      expect(result).toEqual({ room: updatedRoom });
    });

    it("sets error state on failure", async () => {
      const mockRoom = makeMockRoom();
      store.setRoomSession({ participantId: "p1", room: mockRoom });

      vi.mocked(api.startGame).mockRejectedValue(
        new Error("Only the host can start the game")
      );

      await expect(store.startGame()).rejects.toThrow(
        "Only the host can start the game"
      );
      expect(store.getSnapshot().error).toBe("Only the host can start the game");
    });

    it("returns null when no room or participantId is set", async () => {
      const result = await store.startGame();
      expect(result).toBeNull();
    });
  });

  describe("polling", () => {
    it("calls fetchRoom after interval and stops on stopPolling", async () => {
      vi.useFakeTimers();

      const mockRoom = makeMockRoom();
      store.setRoomSession({ participantId: "p1", room: mockRoom });

      vi.mocked(api.fetchRoom).mockResolvedValue({ room: mockRoom });

      store.startPolling(1000);

      expect(vi.mocked(api.fetchRoom)).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);

      expect(vi.mocked(api.fetchRoom)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(api.fetchRoom)).toHaveBeenCalledWith("ABCD", "p1");

      store.stopPolling();
      vi.advanceTimersByTime(3000);

      expect(vi.mocked(api.fetchRoom)).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it("sets error state when fetchRoom fails during polling", async () => {
      vi.useFakeTimers();

      const mockRoom = makeMockRoom();
      store.setRoomSession({ participantId: "p1", room: mockRoom });

      vi.mocked(api.fetchRoom).mockRejectedValue(new Error("Network error"));

      store.startPolling(1000);
      vi.advanceTimersByTime(1000);

      await vi.waitFor(() => {
        expect(store.getSnapshot().error).toBe("Network error");
      });

      store.stopPolling();
      vi.useRealTimers();
    });
  });
});
