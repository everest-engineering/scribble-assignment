import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoom, joinRoom, pollRoom, startGame, toRoomSnapshot } from "./roomStore.js";

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

  describe("round start, drawer and word reveal", () => {
    it("creates round 1 with the host as the drawer when the game starts", () => {
      const { room, participantId } = createRoom("Host");
      joinRoom(room.code, "Second");

      const result = startGame(room.code, participantId);

      expect("room" in result).toBe(true);
      if ("room" in result) {
        expect(result.room.round?.number).toBe(1);
        expect(result.room.round?.drawerId).toBe(participantId);
      }
    });

    it("reports round: null while the room is still in the lobby", () => {
      const { room, participantId } = createRoom("Host");

      const snapshot = toRoomSnapshot(room, participantId);

      expect(snapshot.round).toBeNull();
    });

    it("reveals the secret word to the drawer but not to guessers", () => {
      const { room, participantId } = createRoom("Host");
      const joined = joinRoom(room.code, "Guest");
      const guestId = "participantId" in joined ? joined.participantId : "";
      const started = startGame(room.code, participantId);
      const startedRoom = "room" in started ? started.room : room;
      const word = startedRoom.round?.word ?? "";

      const drawerView = toRoomSnapshot(startedRoom, participantId);
      const guesserView = toRoomSnapshot(startedRoom, guestId);

      // Drawer sees the full word (FR-006).
      expect(drawerView.round?.word).toBe(word);
      // Guesser never receives the word (FR-007), only the concealed form.
      expect(guesserView.round?.word).toBeUndefined();
      expect(guesserView.round?.wordLength).toBe(word.length);
      expect(guesserView.round?.maskedWord.replace(/\s/g, "")).toBe("_".repeat(word.length));
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
