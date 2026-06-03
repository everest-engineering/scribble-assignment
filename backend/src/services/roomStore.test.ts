import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom marks the creator as the host", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("joinRoom preserves the original host", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");

    expect(joined).not.toBeNull();
    expect(joined?.room.hostId).toBe(created.participantId);
    expect(joined?.participantId).not.toBe(created.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  describe("startGame", () => {
    function roomWithTwoPlayers() {
      const created = createRoom("Alice");
      joinRoom(created.room.code, "Bob");
      return created;
    }

    it("assigns the host as drawer and selects a secret word", () => {
      const created = roomWithTwoPlayers();
      const result = startGame(created.room.code, created.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.status).toBe("playing");
        expect(result.room.drawerId).toBe(created.participantId);
        expect(result.room.secretWord).not.toBeNull();
      }
    });

    it("reveals the word only to the drawer", () => {
      const created = roomWithTwoPlayers();
      const result = startGame(created.room.code, created.participantId);
      if (!result.ok) throw new Error("expected start to succeed");

      const drawerView = toRoomSnapshot(result.room, created.participantId);
      const guesserView = toRoomSnapshot(result.room, "someone-else");

      expect(drawerView.word).toBe(result.room.secretWord);
      expect(guesserView.word).toBeNull();
    });

    it("rejects a non-host requester", () => {
      const created = roomWithTwoPlayers();
      const result = startGame(created.room.code, "not-the-host");

      expect(result).toEqual({ ok: false, error: "forbidden" });
    });

    it("rejects starting with fewer than 2 players", () => {
      const created = createRoom("Alice");
      const result = startGame(created.room.code, created.participantId);

      expect(result).toEqual({ ok: false, error: "too_few_players" });
    });

    it("rejects starting a room that is already playing", () => {
      const created = roomWithTwoPlayers();
      startGame(created.room.code, created.participantId);
      const second = startGame(created.room.code, created.participantId);

      expect(second).toEqual({ ok: false, error: "not_lobby" });
    });
  });
});
