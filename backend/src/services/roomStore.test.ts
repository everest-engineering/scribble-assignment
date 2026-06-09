import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame } from "./roomStore.js";

function createRoomWithParticipants(count: number) {
  const host = createRoom("Host");
  const participants = [host];

  for (let i = 1; i < count; i++) {
    const joiner = joinRoom(host.room.code, `Player${i}`);
    if (joiner) {
      participants.push(joiner);
    }
  }

  return participants[0];
}

describe("roomStore", () => {
  describe("createRoom", () => {
    it("returns a room with a 4-character uppercase code", () => {
      const result = createRoom("Alice");

      expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
      expect(result.room.participants).toHaveLength(1);
      expect(result.room.participants[0].name).toBe("Alice");
      expect(result.participantId).toBeDefined();
    });

    it("sets the creator as host", () => {
      const result = createRoom("Alice");

      expect(result.room.hostId).toBe(result.participantId);
    });

    it("uses the trimmed playerName", () => {
      const result = createRoom("  Alice  ");

      expect(result.room.participants[0].name).toBe("Alice");
    });
  });

  describe("joinRoom", () => {
    it("returns null for an unknown room code", () => {
      const result = joinRoom("ZZZZ", "Bob");

      expect(result).toBeNull();
    });

    it("adds a participant to an existing room", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "Bob");

      expect(result).not.toBeNull();
      expect(result!.room.participants).toHaveLength(2);
      expect(result!.room.participants[1].name).toBe("Bob");
    });

    it("does not affect existing participants when joining", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "Bob");

      expect(result!.room.participants[0].name).toBe("Alice");
    });
  });

  describe("startGame", () => {
    it("starts the game for the host with 2+ participants", () => {
      const host = createRoomWithParticipants(2);
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
    });

    it("transitions room status to playing", () => {
      const host = createRoomWithParticipants(2);
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.status).toBe("playing");
      }
    });

    it("fails for non-host participant (403)", () => {
      const host = createRoom("Alice");
      const joiner = joinRoom(host.room.code, "Bob");

      const result = startGame(host.room.code, joiner!.participantId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(403);
      }
    });

    it("fails with fewer than 2 participants (400)", () => {
      const host = createRoom("Alice");
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
      }
    });

    it("fails for unknown room code (404)", () => {
      const result = startGame("ZZZZ", "some-id");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(404);
      }
    });
  });
});
