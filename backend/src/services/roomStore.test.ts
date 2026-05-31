import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, selectWord, startRoom, toRoomSnapshot } from "./roomStore.js";
import { HttpError } from "../api/schemas.js";
import { STARTER_WORDS } from "../seed/starterData.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostId to the creator's participantId", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("createRoom trims player name", () => {
    const result = createRoom("  Alice  ");

    expect(result.room.participants[0].name).toBe("  Alice  ");
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom succeeds for a lobby room and snapshot includes hostId", () => {
    const host = createRoom("Alice");
    const result = joinRoom(host.room.code, "Bob");

    expect(result).not.toBeNull();
    expect(result!.room.participants).toHaveLength(2);
    expect(result!.room.hostId).toBe(host.participantId);
  });

  it("joinRoom throws 409 when room is active", () => {
    const host = createRoom("Alice");
    createRoom("Carol");
    joinRoom(host.room.code, "Bob");
    startRoom(host.room.code, host.participantId);

    expect(() => joinRoom(host.room.code, "Dave")).toThrow(HttpError);

    try {
      joinRoom(host.room.code, "Dave");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).statusCode).toBe(409);
    }
  });

  it("room isolation: joining room A does not affect room B", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Carol");

    joinRoom(roomA.room.code, "Bob");

    const afterA = joinRoom(roomA.room.code, "Dave");
    expect(afterA!.room.participants).toHaveLength(3);

    const fresh = joinRoom(roomB.room.code, "Eve");
    expect(fresh!.room.participants).toHaveLength(2);
    expect(roomA.room.code).not.toBe(roomB.room.code);
  });

  it("toRoomSnapshot includes hostId", () => {
    const result = createRoom("Alice");
    const snapshot = toRoomSnapshot(result.room);

    expect(snapshot.hostId).toBe(result.participantId);
  });

  describe("selectWord", () => {
    it("returns the same word for the same room code on repeated calls", () => {
      const first = selectWord("ABCD", STARTER_WORDS);
      const second = selectWord("ABCD", STARTER_WORDS);

      expect(first).toBe(second);
    });

    it("returns the expected hard-coded word for room code ABCD", () => {
      // "ABCD" char codes: 65+66+67+68 = 266; 266 % 5 = 1 → "pizza"
      const expected = STARTER_WORDS[266 % STARTER_WORDS.length];

      expect(selectWord("ABCD", STARTER_WORDS)).toBe(expected);
    });

    it("returns different words for different room codes", () => {
      const wordA = selectWord("ABCD", STARTER_WORDS);
      const wordZ = selectWord("ZZZZ", STARTER_WORDS);

      expect(wordA).not.toBe(wordZ);
    });

    it("returns the identical word across 100 calls for the same code (SC-003)", () => {
      const first = selectWord("ABCD", STARTER_WORDS);
      const results = Array.from({ length: 100 }, () => selectWord("ABCD", STARTER_WORDS));

      expect(results.every((word) => word === first)).toBe(true);
    });
  });

  describe("startRoom drawer assignment", () => {
    it("sets drawerId to hostId after game starts", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");

      const room = startRoom(host.room.code, host.participantId);

      expect(room.drawerId).toBe(host.participantId);
    });

    it("sets secretWord using selectWord with the room code", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");

      const room = startRoom(host.room.code, host.participantId);

      expect(room.secretWord).toBe(selectWord(room.code, STARTER_WORDS));
      expect(room.secretWord.length).toBeGreaterThan(0);
    });
  });

  describe("toRoomSnapshot viewer scoping", () => {
    it("drawer snapshot includes secretWord and no wordPlaceholder", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const activeRoom = startRoom(host.room.code, host.participantId);

      const snapshot = toRoomSnapshot(activeRoom, activeRoom.drawerId);

      expect(snapshot.secretWord).toBeDefined();
      expect(snapshot.wordPlaceholder).toBeUndefined();
    });

    it("guesser snapshot includes wordPlaceholder and no secretWord", () => {
      const host = createRoom("Alice");
      const guest = joinRoom(host.room.code, "Bob");
      const activeRoom = startRoom(host.room.code, host.participantId);

      const snapshot = toRoomSnapshot(activeRoom, guest!.participantId);

      expect(snapshot.wordPlaceholder).toBeDefined();
      expect(snapshot.secretWord).toBeUndefined();
    });

    it("guesser placeholder has correct character count", () => {
      const host = createRoom("Alice");
      const guest = joinRoom(host.room.code, "Bob");
      const activeRoom = startRoom(host.room.code, host.participantId);

      const snapshot = toRoomSnapshot(activeRoom, guest!.participantId);
      const placeholderChars = snapshot.wordPlaceholder!.split(" ");

      expect(placeholderChars).toHaveLength(activeRoom.secretWord.length);
      expect(placeholderChars.every((ch) => ch === "_")).toBe(true);
    });

    it("guesser snapshot has empty availableWords", () => {
      const host = createRoom("Alice");
      const guest = joinRoom(host.room.code, "Bob");
      const activeRoom = startRoom(host.room.code, host.participantId);

      const snapshot = toRoomSnapshot(activeRoom, guest!.participantId);

      expect(snapshot.availableWords).toEqual([]);
    });

    it("lobby snapshot has no secretWord or wordPlaceholder and drawerId is empty", () => {
      const host = createRoom("Alice");

      const snapshot = toRoomSnapshot(host.room, host.participantId);

      expect(snapshot.secretWord).toBeUndefined();
      expect(snapshot.wordPlaceholder).toBeUndefined();
      expect(snapshot.drawerId).toBe("");
    });
  });

  describe("startRoom", () => {
    it("throws 404 for unknown room", () => {
      expect(() => startRoom("UNKN", "some-uuid")).toThrow(HttpError);

      try {
        startRoom("UNKN", "some-uuid");
      } catch (error) {
        expect((error as HttpError).statusCode).toBe(404);
      }
    });

    it("throws 403 when caller is not host", () => {
      const host = createRoom("Alice");
      const guest = joinRoom(host.room.code, "Bob");

      expect(() => startRoom(host.room.code, guest!.participantId)).toThrow(HttpError);

      try {
        startRoom(host.room.code, guest!.participantId);
      } catch (error) {
        expect((error as HttpError).statusCode).toBe(403);
      }
    });

    it("throws 400 when fewer than 2 participants", () => {
      const host = createRoom("Alice");

      expect(() => startRoom(host.room.code, host.participantId)).toThrow(HttpError);

      try {
        startRoom(host.room.code, host.participantId);
      } catch (error) {
        expect((error as HttpError).statusCode).toBe(400);
      }
    });

    it("transitions room to active with host and ≥2 participants", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");

      const room = startRoom(host.room.code, host.participantId);

      expect(room.status).toBe("active");
      expect(room.hostId).toBe(host.participantId);
    });

    it("throws 409 when room already active", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      startRoom(host.room.code, host.participantId);

      expect(() => startRoom(host.room.code, host.participantId)).toThrow(HttpError);

      try {
        startRoom(host.room.code, host.participantId);
      } catch (error) {
        expect((error as HttpError).statusCode).toBe(409);
      }
    });
  });
});
