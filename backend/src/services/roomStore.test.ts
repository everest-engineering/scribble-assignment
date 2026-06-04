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

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("createRoom assigns hostId, trims name, and sets initial score to 0", () => {
    const result = createRoom("  Alice  ");
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.scores[result.participantId]).toBe(0);
  });

  it("joinRoom adds player, trims name, sets score to 0, and keeps hostId", () => {
    const creatorResult = createRoom("Alice");
    const code = creatorResult.room.code;

    const joinResult = joinRoom(code, "  Bob  ");
    expect(joinResult).not.toBeNull();
    if (joinResult) {
      expect(joinResult.room.participants).toHaveLength(2);
      expect(joinResult.room.participants[1].name).toBe("Bob");
      expect(joinResult.room.scores[joinResult.participantId]).toBe(0);
      expect(joinResult.room.hostId).toBe(creatorResult.participantId);
    }
  });

  it("startGame requires at least 2 players", () => {
    const result = createRoom("Alice");
    expect(() => startGame(result.room.code)).toThrow("Cannot start game with fewer than 2 players");
  });

  it("startGame sets status to playing, assigns drawer to host, and selects deterministic word", () => {
    const creatorResult = createRoom("Alice");
    const code = creatorResult.room.code;
    joinRoom(code, "Bob");

    const room = startGame(code);
    expect(room).not.toBeNull();
    if (room) {
      expect(room.status).toBe("playing");
      expect(room.drawerId).toBe(creatorResult.participantId);
      expect(room.secretWord).toBeDefined();
      expect(room.secretWord).not.toBeNull();
    }
  });

  it("toRoomSnapshot masks secretWord for guessers and reveals for drawer", () => {
    const creatorResult = createRoom("Alice");
    const code = creatorResult.room.code;
    const joinResult = joinRoom(code, "Bob");
    expect(joinResult).not.toBeNull();

    if (joinResult) {
      const room = startGame(code);
      expect(room).not.toBeNull();
      if (room) {
        // Drawer snapshot (Alice)
        const drawerSnapshot = toRoomSnapshot(room, creatorResult.participantId);
        expect(drawerSnapshot.viewerRole).toBe("drawer");
        expect(drawerSnapshot.secretWord).toBe(room.secretWord);

        // Guesser snapshot (Bob)
        const guesserSnapshot = toRoomSnapshot(room, joinResult.participantId);
        expect(guesserSnapshot.viewerRole).toBe("guesser");
        expect(guesserSnapshot.secretWord).toBeNull();
      }
    }
  });
});
