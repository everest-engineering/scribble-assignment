import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

function mockOkResponse(data: unknown) {
  return {
    ok: true,
    json: () => Promise.resolve(data),
  } as unknown as Response;
}

function mockErrorResponse(status: number, message: string) {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({ message }),
  } as unknown as Response;
}

describe("api service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  describe("createRoom", () => {
    it("sends POST to /rooms with playerName in body", async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockOkResponse({
          participantId: "p1",
          room: { code: "ABCD", status: "lobby", participants: [] },
        })
      );

      await api.createRoom("Alice");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/rooms"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ playerName: "Alice" }),
        })
      );
    });

    it("throws on server error", async () => {
      vi.mocked(fetch).mockResolvedValue(mockErrorResponse(400, "Name cannot be empty"));

      await expect(api.createRoom("")).rejects.toThrow("Name cannot be empty");
    });
  });

  describe("joinRoom", () => {
    it("sends POST to /rooms/:code/join with playerName", async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockOkResponse({
          participantId: "p2",
          room: { code: "ABCD", status: "lobby", participants: [] },
        })
      );

      await api.joinRoom("ABCD", "Bob");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/rooms/ABCD/join"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ playerName: "Bob" }),
        })
      );
    });

    it("throws on unknown room", async () => {
      vi.mocked(fetch).mockResolvedValue(mockErrorResponse(404, "Room not found"));

      await expect(api.joinRoom("ZZZZ", "Bob")).rejects.toThrow("Room not found");
    });
  });

  describe("fetchRoom", () => {
    it("sends GET to /rooms/:code with participantId query param", async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockOkResponse({
          room: { code: "XYZW", status: "lobby", participants: [] },
        })
      );

      await api.fetchRoom("XYZW", "p1");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/rooms/XYZW?participantId=p1"),
        expect.anything()
      );
    });

    it("works without participantId", async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockOkResponse({
          room: { code: "ABCD", status: "lobby", participants: [] },
        })
      );

      await api.fetchRoom("ABCD");

      expect(fetch).toHaveBeenCalledWith(
        expect.not.stringContaining("participantId"),
        expect.anything()
      );
    });

    it("throws on missing room", async () => {
      vi.mocked(fetch).mockResolvedValue(mockErrorResponse(404, "Unable to load room"));

      await expect(api.fetchRoom("ZZZZ")).rejects.toThrow("Unable to load room");
    });
  });

  describe("startGame", () => {
    it("sends POST to /rooms/:code/start with participantId", async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockOkResponse({
          started: true,
          room: { code: "ABCD", status: "playing", participants: [], hostId: "p1", drawerId: "p1", scores: {}, strokes: [], guesses: [], availableWords: [], roles: [], round: 1 },
        })
      );

      await api.startGame("ABCD", "p1");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/rooms/ABCD/start"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ participantId: "p1" }),
        })
      );
    });
  });

  describe("drawStroke", () => {
    it("sends POST to /rooms/:code/draw with stroke data", async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockOkResponse({
          room: { code: "ABCD", status: "playing", participants: [], hostId: "p1", drawerId: "p1", scores: {}, strokes: [{ x1: 0, y1: 0, x2: 100, y2: 100, color: "#000", width: 3 }], guesses: [], availableWords: [], roles: [], round: 1 },
        })
      );

      const stroke = { x1: 0, y1: 0, x2: 100, y2: 100, color: "#000", width: 3 };
      await api.drawStroke("ABCD", "p1", stroke);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/rooms/ABCD/draw"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ participantId: "p1", stroke }),
        })
      );
    });
  });

  describe("clearCanvas", () => {
    it("sends POST to /rooms/:code/clear with participantId", async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockOkResponse({
          room: { code: "ABCD", status: "playing", participants: [], hostId: "p1", drawerId: "p1", scores: {}, strokes: [], guesses: [], availableWords: [], roles: [], round: 1 },
        })
      );

      await api.clearCanvas("ABCD", "p1");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/rooms/ABCD/clear"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ participantId: "p1" }),
        })
      );
    });
  });

  describe("submitGuess", () => {
    it("sends POST to /rooms/:code/guess with guess text", async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockOkResponse({
          guess: { participantId: "p2", participantName: "Bob", text: "rocket", correct: true, timestamp: "2024-01-01" },
          room: { code: "ABCD", status: "result", participants: [], hostId: "p1", drawerId: "p1", scores: { p2: 100 }, strokes: [], guesses: [], availableWords: [], roles: [], round: 1 },
        })
      );

      await api.submitGuess("ABCD", "p2", "rocket");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/rooms/ABCD/guess"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ participantId: "p2", text: "rocket" }),
        })
      );
    });
  });

  describe("restartGame", () => {
    it("sends POST to /rooms/:code/restart with participantId", async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockOkResponse({
          room: { code: "ABCD", status: "lobby", participants: [], hostId: "p1", scores: {}, strokes: [], guesses: [], availableWords: [], roles: [], round: 1 },
        })
      );

      await api.restartGame("ABCD", "p1");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/rooms/ABCD/restart"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ participantId: "p1" }),
        })
      );
    });
  });

  describe("error handling", () => {
    it("throws generic message when response body has no message", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      } as unknown as Response);

      await expect(api.createRoom("Alice")).rejects.toThrow("Request failed");
    });

    it("throws on network error", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

      await expect(api.fetchRoom("ABCD")).rejects.toThrow("Network error");
    });

    it("throws on JSON parse error in error response", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Invalid JSON")),
      } as unknown as Response);

      await expect(api.createRoom("Alice")).rejects.toThrow("Request failed");
    });
  });
});
