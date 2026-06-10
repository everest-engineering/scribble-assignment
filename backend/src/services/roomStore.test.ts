import { describe, expect, it } from "vitest";
import { createRoom, djb2Hash, joinRoom, selectSecretWord, startGame, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
    expect(result.room.drawerId).toBe("");
    expect(result.room.secretWord).toBe("");
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  describe("djb2Hash", () => {
    it("produces a deterministic hash for the same input", () => {
      expect(djb2Hash("ABCD")).toBe(djb2Hash("ABCD"));
    });

    it("produces different hashes for different inputs", () => {
      expect(djb2Hash("ABCD")).not.toBe(djb2Hash("EFGH"));
    });

    it("returns a non-negative integer", () => {
      const hash = djb2Hash("ABCD");
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(hash)).toBe(true);
    });
  });

  describe("selectSecretWord", () => {
    it("returns a word from the starter list", () => {
      const word = selectSecretWord("ABCD");
      expect(["rocket", "pizza", "castle", "guitar", "sunflower"]).toContain(word);
    });

    it("returns the same word for the same room code", () => {
      const word1 = selectSecretWord("ABCD");
      const word2 = selectSecretWord("ABCD");
      expect(word1).toBe(word2);
    });
  });

  describe("startGame", () => {
    it("sets drawerId to hostId and assigns a secret word", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");

      const result = startGame(room.code, participantId);

      expect(result.room.status).toBe("playing");
      expect(result.room.drawerId).toBe(participantId);
      expect(result.room.secretWord).toBeTruthy();
      expect(["rocket", "pizza", "castle", "guitar", "sunflower"]).toContain(result.room.secretWord);
    });

    it("throws 403 if non-host tries to start", () => {
      const { room } = createRoom("Alice");
      joinRoom(room.code, "Bob");

      expect(() => startGame(room.code, "some-other-id")).toThrow("Only the host can start the game");
    });

    it("throws 400 if fewer than 2 players", () => {
      const { room, participantId } = createRoom("Alice");

      expect(() => startGame(room.code, participantId)).toThrow("At least 2 players are required to start");
    });

    it("throws 404 for unknown room code", () => {
      expect(() => startGame("ZZZZ", "some-id")).toThrow("Room not found");
    });
  });

  describe("toRoomSnapshot", () => {
    it("includes drawerId in all snapshots", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const started = startGame(room.code, participantId);

      const snapshot = toRoomSnapshot(started.room, "non-drawer-id");
      expect(snapshot.drawerId).toBe(participantId);
    });

    it("omits secretWord when viewer is not the drawer", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const started = startGame(room.code, participantId);

      const snapshot = toRoomSnapshot(started.room, "non-drawer-id");
      expect(snapshot.secretWord).toBeUndefined();
    });

    it("includes secretWord when viewer is the drawer", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const started = startGame(room.code, participantId);

      const snapshot = toRoomSnapshot(started.room, participantId);
      expect(snapshot.secretWord).toBe(started.room.secretWord);
    });

    it("includes secretWord when viewerParticipantId is the host/drawer", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const started = startGame(room.code, participantId);

      const snapshot = toRoomSnapshot(started.room, participantId);
      expect(snapshot.secretWord).toBeDefined();
    });
  });

  describe("determinism", () => {
    it("same room started twice produces the same secret word", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const first = startGame(room.code, participantId);

      const second = startGame(room.code, participantId);

      expect(first.room.secretWord).toBe(second.room.secretWord);
    });

    it("hash distributes across word list indices", () => {
      const words = ["rocket", "pizza", "castle", "guitar", "sunflower"];
      const codes = ["AAAA", "BBBB", "CCCC", "DDDD", "EEEE"];

      for (const code of codes) {
        const word = selectSecretWord(code);
        expect(words).toContain(word);
      }
    });
  });
});
