import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, leaveRoom, startGame, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  describe("createRoom", () => {
    it("returns a room with a 4-character uppercase code and assigns host", () => {
      const result = createRoom("Alice");

      expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
      expect(result.room.participants).toHaveLength(1);
      expect(result.room.participants[0].name).toBe("Alice");
      expect(result.room.hostId).toBe(result.participantId);
      expect(result.participantId).toBeDefined();
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

    it("trims whitespace from player name", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "  Bob  ");

      expect(result).not.toBeNull();
      expect(result!.room.participants[1].name).toBe("Bob");
    });

    it("rejects empty name after trimming", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "   ");

      expect(result).toBeNull();
    });

    it("rejects name longer than 20 characters", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "A".repeat(21));

      expect(result).toBeNull();
    });

    it("accepts name of exactly 20 characters", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "A".repeat(20));

      expect(result).not.toBeNull();
      expect(result!.room.participants[1].name).toBe("A".repeat(20));
    });

    it("rejects duplicate name (case-sensitive)", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "Alice");

      expect(result).toBeNull();
    });

    it("accepts name that differs only by case", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "alice");

      expect(result).not.toBeNull();
      expect(result!.room.participants[1].name).toBe("alice");
    });
  });

  describe("drawer assignment", () => {
    it("assigns first-joined participant as drawer", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      joinRoom(host.room.code, "Charlie");
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.drawerId).toBe(host.participantId);
      }
    });

    it("assigns drawer deterministically regardless of host", () => {
      const host = createRoom("HostPlayer");
      const bobResult = joinRoom(host.room.code, "Bob");
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.drawerId).toBe(host.participantId);
      }
    });

    it("toRoomSnapshot sets drawer role for drawer", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId);

      expect(started.ok).toBe(true);
      if (started.ok) {
        const snapshot = toRoomSnapshot(started.room, host.participantId);
        expect(snapshot.yourRole).toBe("drawer");
      }
    });

    it("toRoomSnapshot sets guesser role for non-drawer", () => {
      const host = createRoom("Alice");
      const bobResult = joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId);

      expect(started.ok).toBe(true);
      if (started.ok) {
        const snapshot = toRoomSnapshot(started.room, bobResult!.participantId);
        expect(snapshot.yourRole).toBe("guesser");
      }
    });

    it("toRoomSnapshot returns drawerId for all viewers", () => {
      const host = createRoom("Alice");
      const bobResult = joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId);

      expect(started.ok).toBe(true);
      if (started.ok) {
        const hostSnapshot = toRoomSnapshot(started.room, host.participantId);
        const bobSnapshot = toRoomSnapshot(started.room, bobResult!.participantId);
        expect(hostSnapshot.drawerId).toBe(host.participantId);
        expect(bobSnapshot.drawerId).toBe(host.participantId);
      }
    });

    it("defaults to guesser role when no viewerId provided", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId);

      expect(started.ok).toBe(true);
      if (started.ok) {
        const snapshot = toRoomSnapshot(started.room);
        expect(snapshot.yourRole).toBe("guesser");
      }
    });
  });

  describe("startGame", () => {
    it("starts the game when host calls with 2+ players", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.status).toBe("playing");
      }
    });

    it("returns error when non-host tries to start", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const bobResult = joinRoom(host.room.code, "Charlie");
      const result = startGame(host.room.code, bobResult!.participantId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(403);
        expect(result.error).toContain("host");
      }
    });

    it("returns error when fewer than 2 players", () => {
      const host = createRoom("Alice");
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
        expect(result.error).toContain("2 players");
      }
    });

    it("returns error for unknown room", () => {
      const result = startGame("ZZZZ", "some-id");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(404);
      }
    });
  });

  describe("word selection", () => {
    it("selects a word from the word pool on game start", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.secretWord).toBeTruthy();
        expect(typeof result.room.secretWord).toBe("string");
      }
    });

    it("selects the same word deterministically across repeated calls", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const result1 = startGame(host.room.code, host.participantId);
      const result2 = startGame(host.room.code, host.participantId);

      expect(result1.ok && result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.room.secretWord).toBe(result2.room.secretWord);
      }
    });

    it("shows secret word to drawer via toRoomSnapshot", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId);

      expect(started.ok).toBe(true);
      if (started.ok) {
        const snapshot = toRoomSnapshot(started.room, host.participantId);
        expect(snapshot.secretWord).toBe(started.room.secretWord);
      }
    });

    it("hides secret word from guesser via toRoomSnapshot", () => {
      const host = createRoom("Alice");
      const bobResult = joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId);

      expect(started.ok).toBe(true);
      if (started.ok) {
        const snapshot = toRoomSnapshot(started.room, bobResult!.participantId);
        expect(snapshot.secretWord).toBeUndefined();
      }
    });
  });

  describe("leaveRoom", () => {
    it("removes a participant from the room", () => {
      const host = createRoom("Alice");
      const bobResult = joinRoom(host.room.code, "Bob");
      const result = leaveRoom(host.room.code, bobResult!.participantId);

      expect(result.ok).toBe(true);
      if (result.ok && result.room) {
        expect(result.room.participants).toHaveLength(1);
      }
    });

    it("reassigns drawer when drawer leaves during game", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      startGame(host.room.code, host.participantId);
      const result = leaveRoom(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok && result.room) {
        expect(result.room.drawerId).not.toBe(host.participantId);
      }
    });

    it("reassigns host when host leaves", () => {
      const host = createRoom("Alice");
      const bobResult = joinRoom(host.room.code, "Bob");
      const result = leaveRoom(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok && result.room) {
        expect(result.room.hostId).toBe(bobResult!.participantId);
      }
    });

    it("removes the room when last participant leaves", () => {
      const host = createRoom("Alice");
      const result = leaveRoom(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room).toBeNull();
        expect(getRoom(host.room.code)).toBeNull();
      }
    });

    it("returns error for unknown room", () => {
      const result = leaveRoom("ZZZZ", "some-id");
      expect(result.ok).toBe(false);
    });
  });

  describe("getRoom", () => {
    it("returns null for an unknown code", () => {
      expect(getRoom("ZZZZ")).toBeNull();
    });

    it("returns a cloned room for an existing code", () => {
      const created = createRoom("Alice");
      const room = getRoom(created.room.code);

      expect(room).not.toBeNull();
      expect(room!.code).toBe(created.room.code);
    });
  });
});
