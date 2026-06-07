import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoom, joinRoom, pollRoom, startGame } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a 4-character uppercase code and assigns the creator as host", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.hostId).toBe(result.participantId);
  });

  it("joinRoom reports not_found for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toEqual({ failure: "not_found" });
  });

  it("joinRoom disambiguates duplicate display names within a room", () => {
    const { room } = createRoom("Sam");
    const joined = joinRoom(room.code, "Sam");

    expect("room" in joined).toBe(true);
    if ("room" in joined) {
      expect(joined.room.participants.map((participant) => participant.name)).toEqual([
        "Sam",
        "Sam (2)"
      ]);
    }
  });

  it("joinRoom rejects a full room (max 8 players)", () => {
    const { room } = createRoom("Host");
    for (let index = 0; index < 7; index += 1) {
      joinRoom(room.code, `Player ${index}`);
    }

    expect(joinRoom(room.code, "Late")).toEqual({ failure: "full" });
  });

  it("joinRoom rejects a room whose game has already started", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Second");
    startGame(room.code, participantId);

    expect(joinRoom(room.code, "Late")).toEqual({ failure: "started" });
  });

  describe("startGame guards", () => {
    it("rejects a non-host requester", () => {
      const { room } = createRoom("Host");
      const joined = joinRoom(room.code, "Guest");
      const guestId = "participantId" in joined ? joined.participantId : "";

      expect(startGame(room.code, guestId)).toEqual({ failure: "not_host" });
    });

    it("rejects starting with fewer than two players", () => {
      const { room, participantId } = createRoom("Solo");

      expect(startGame(room.code, participantId)).toEqual({ failure: "too_few" });
    });

    it("starts when the host has at least two players", () => {
      const { room, participantId } = createRoom("Host");
      joinRoom(room.code, "Second");

      const result = startGame(room.code, participantId);

      expect("room" in result).toBe(true);
      if ("room" in result) {
        expect(result.room.status).toBe("playing");
      }
    });
  });

  describe("presence pruning", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("prunes a player who has not polled within the timeout", () => {
      vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
      const { room, participantId } = createRoom("Host");
      joinRoom(room.code, "Guest");

      vi.setSystemTime(new Date("2026-01-01T00:00:11.000Z"));
      const polled = pollRoom(room.code, participantId);

      expect(polled?.participants.map((participant) => participant.name)).toEqual(["Host"]);
    });

    it("closes the room when the host departs", () => {
      vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
      const { room } = createRoom("Host");
      const joined = joinRoom(room.code, "Guest");
      const guestId = "participantId" in joined ? joined.participantId : "";

      vi.setSystemTime(new Date("2026-01-01T00:00:11.000Z"));
      const polled = pollRoom(room.code, guestId);

      expect(polled).toBeNull();
    });
  });

  it("keeps rooms isolated from one another", () => {
    const a = createRoom("Alice");
    const b = createRoom("Bob");
    joinRoom(a.room.code, "Anna");

    const roomA = pollRoom(a.room.code, a.participantId);
    const roomB = pollRoom(b.room.code, b.participantId);

    expect(roomA?.participants.map((participant) => participant.name)).toEqual(["Alice", "Anna"]);
    expect(roomB?.participants.map((participant) => participant.name)).toEqual(["Bob"]);
  });
});
