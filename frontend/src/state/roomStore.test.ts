import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoomStore } from "./roomStore";
import { api } from "../services/api";
import type { RoomSnapshot } from "../services/api";

vi.mock("../services/api", () => ({
  api: {
    startGame: vi.fn(),
    fetchRoom: vi.fn(),
    submitGuess: vi.fn(),
    endRound: vi.fn(),
    restartGame: vi.fn(),
  },
}));

function makeMockRoom(overrides?: Partial<RoomSnapshot>): RoomSnapshot {
  return {
    code: "ABCD",
    status: "lobby",
    participants: [],
    hostId: "p1",
    drawerId: "",
    guesses: [],
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

  describe("submitGuess", () => {
    it("calls API and updates snapshot on success", async () => {
      const mockRoom = makeMockRoom({ status: "playing", guesses: [] });
      store.setRoomSession({ participantId: "p1", room: mockRoom });

      const updatedRoom = makeMockRoom({
        status: "playing",
        guesses: [{ id: "g1", participantId: "p1", text: "hello", isCorrect: true, timestamp: new Date().toISOString() }],
      });
      vi.mocked(api.submitGuess).mockResolvedValue({ room: updatedRoom });

      const result = await store.submitGuess("hello");

      expect(api.submitGuess).toHaveBeenCalledWith("ABCD", "p1", "hello");
      expect(store.getSnapshot().room?.guesses).toHaveLength(1);
      expect(result).toEqual({ room: updatedRoom });
    });

    it("sets error state on failure", async () => {
      const mockRoom = makeMockRoom({ status: "playing" });
      store.setRoomSession({ participantId: "p1", room: mockRoom });

      vi.mocked(api.submitGuess).mockRejectedValue(
        new Error("Only guessers can submit guesses")
      );

      await expect(store.submitGuess("hello")).rejects.toThrow(
        "Only guessers can submit guesses"
      );
      expect(store.getSnapshot().error).toBe("Only guessers can submit guesses");
    });

    it("returns null when no room or participantId is set", async () => {
      const result = await store.submitGuess("hello");
      expect(result).toBeNull();
    });
  });

  describe("endRound", () => {
    it("calls API and updates snapshot on success", async () => {
      const mockRoom = makeMockRoom({ status: "playing" });
      store.setRoomSession({ participantId: "p1", room: mockRoom });

      const updatedRoom = makeMockRoom({ status: "result", secretWord: "rocket" });
      vi.mocked(api.endRound).mockResolvedValue({ room: updatedRoom });

      const result = await store.endRound();

      expect(api.endRound).toHaveBeenCalledWith("ABCD", "p1");
      expect(store.getSnapshot().room?.status).toBe("result");
      expect(result).toEqual({ room: updatedRoom });
    });

    it("sets error state on failure", async () => {
      const mockRoom = makeMockRoom({ status: "playing" });
      store.setRoomSession({ participantId: "p1", room: mockRoom });

      vi.mocked(api.endRound).mockRejectedValue(
        new Error("Only the host can end the round")
      );

      await expect(store.endRound()).rejects.toThrow(
        "Only the host can end the round"
      );
      expect(store.getSnapshot().error).toBe("Only the host can end the round");
    });

    it("returns null when no room or participantId is set", async () => {
      const result = await store.endRound();
      expect(result).toBeNull();
    });
  });

  describe("restartGame", () => {
    it("calls API and updates snapshot on success", async () => {
      const mockRoom = makeMockRoom({ status: "result" });
      store.setRoomSession({ participantId: "p1", room: mockRoom });

      const updatedRoom = makeMockRoom({ status: "lobby" });
      vi.mocked(api.restartGame).mockResolvedValue({ room: updatedRoom });

      const result = await store.restartGame();

      expect(api.restartGame).toHaveBeenCalledWith("ABCD", "p1");
      expect(store.getSnapshot().room?.status).toBe("lobby");
      expect(result).toEqual({ room: updatedRoom });
    });

    it("sets error state on failure", async () => {
      const mockRoom = makeMockRoom({ status: "result" });
      store.setRoomSession({ participantId: "p1", room: mockRoom });

      vi.mocked(api.restartGame).mockRejectedValue(
        new Error("Only the host can restart the game")
      );

      await expect(store.restartGame()).rejects.toThrow(
        "Only the host can restart the game"
      );
      expect(store.getSnapshot().error).toBe("Only the host can restart the game");
    });

    it("returns null when no room or participantId is set", async () => {
      const result = await store.restartGame();
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
