import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, restartRoom, selectWord, startRoom, submitGuess, toRoomSnapshot } from "./roomStore.js";
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

  describe("submitGuess", () => {
    function setupActiveRoom() {
      const host = createRoom("Alice");
      const guest = joinRoom(host.room.code, "Bob");
      const room = startRoom(host.room.code, host.participantId);

      return { host, guest: guest!, room };
    }

    it("records an incorrect guess with 0 points and keeps room active", () => {
      const { guest, room } = setupActiveRoom();

      const updated = submitGuess(room.code, guest.participantId, "wrong");

      expect(updated.guesses).toHaveLength(1);
      expect(updated.guesses[0].text).toBe("wrong");
      expect(updated.guesses[0].correct).toBe(false);
      expect(updated.scores[guest.participantId]).toBe(0);
      expect(updated.status).toBe("active");
    });

    it("records a correct guess with 100 points and transitions room to ended", () => {
      const { guest, room } = setupActiveRoom();

      const updated = submitGuess(room.code, guest.participantId, room.secretWord);

      expect(updated.guesses).toHaveLength(1);
      expect(updated.guesses[0].correct).toBe(true);
      expect(updated.scores[guest.participantId]).toBe(100);
      expect(updated.status).toBe("ended");
    });

    it("treats guess as correct regardless of case", () => {
      const { guest, room } = setupActiveRoom();

      const upper = room.secretWord.toUpperCase();
      const updated = submitGuess(room.code, guest.participantId, upper);

      expect(updated.guesses[0].correct).toBe(true);
      expect(updated.scores[guest.participantId]).toBe(100);
    });

    it("trims whitespace from guess before comparison", () => {
      const { guest, room } = setupActiveRoom();

      const padded = `  ${room.secretWord}  `;
      const updated = submitGuess(room.code, guest.participantId, padded);

      expect(updated.guesses[0].text).toBe(room.secretWord);
      expect(updated.guesses[0].correct).toBe(true);
    });

    it("throws 400 for an empty string guess", () => {
      const { guest, room } = setupActiveRoom();

      try {
        submitGuess(room.code, guest.participantId, "");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).statusCode).toBe(400);
      }
    });

    it("throws 400 for a whitespace-only guess", () => {
      const { guest, room } = setupActiveRoom();

      try {
        submitGuess(room.code, guest.participantId, "   ");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).statusCode).toBe(400);
      }
    });

    it("throws 403 when the drawer attempts to guess", () => {
      const { host, room } = setupActiveRoom();

      try {
        submitGuess(room.code, host.participantId, "anything");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).statusCode).toBe(403);
        expect((error as HttpError).message).toMatch(/drawer/i);
      }
    });

    it("throws 403 for a participantId not in the room", () => {
      const { room } = setupActiveRoom();

      try {
        submitGuess(room.code, "00000000-0000-0000-0000-000000000000", "word");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).statusCode).toBe(403);
      }
    });

    it("throws 409 when room status is ended", () => {
      const { guest, room } = setupActiveRoom();

      submitGuess(room.code, guest.participantId, room.secretWord);

      try {
        submitGuess(room.code, guest.participantId, room.secretWord);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).statusCode).toBe(409);
      }
    });

    it("throws 404 for an unknown room code", () => {
      const { guest } = setupActiveRoom();

      try {
        submitGuess("ZZZZ", guest.participantId, "word");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).statusCode).toBe(404);
      }
    });
  });

  describe("toRoomSnapshot guesses and scores", () => {
    it("active room snapshot includes empty guesses and zero scores for all participants", () => {
      const host = createRoom("Alice");
      const guest = joinRoom(host.room.code, "Bob");
      const activeRoom = startRoom(host.room.code, host.participantId);

      const snapshot = toRoomSnapshot(activeRoom, guest!.participantId);

      expect(snapshot.guesses).toEqual([]);
      expect(snapshot.scores[host.participantId]).toBe(0);
      expect(snapshot.scores[guest!.participantId]).toBe(0);
    });

    it("ended room snapshot exposes secretWord to both drawer and guesser", () => {
      const host = createRoom("Alice");
      const guest = joinRoom(host.room.code, "Bob");
      const activeRoom = startRoom(host.room.code, host.participantId);

      submitGuess(activeRoom.code, guest!.participantId, activeRoom.secretWord);

      const hostSnapshot = toRoomSnapshot(
        { ...activeRoom, status: "ended", scores: { [host.participantId]: 0, [guest!.participantId]: 100 }, guesses: [] },
        host.participantId
      );
      const guestSnapshot = toRoomSnapshot(
        { ...activeRoom, status: "ended", scores: { [host.participantId]: 0, [guest!.participantId]: 100 }, guesses: [] },
        guest!.participantId
      );

      expect(hostSnapshot.secretWord).toBe(activeRoom.secretWord);
      expect(guestSnapshot.secretWord).toBe(activeRoom.secretWord);
      expect(hostSnapshot.wordPlaceholder).toBeUndefined();
      expect(guestSnapshot.wordPlaceholder).toBeUndefined();
    });

    it("snapshot includes correct guess history after submitGuess", () => {
      const host = createRoom("Alice");
      const guest = joinRoom(host.room.code, "Bob");
      const activeRoom = startRoom(host.room.code, host.participantId);

      submitGuess(activeRoom.code, guest!.participantId, "wrong");
      const afterIncorrect = submitGuess(activeRoom.code, guest!.participantId, "alsoWrong");

      const snapshot = toRoomSnapshot(afterIncorrect, guest!.participantId);

      expect(snapshot.guesses).toHaveLength(2);
      expect(snapshot.guesses[0].index).toBe(0);
      expect(snapshot.guesses[1].index).toBe(1);
      expect(snapshot.guesses[0].participantName).toBe("Bob");
    });
  });

  describe("restartRoom", () => {
    function setupEndedRoom() {
      const host = createRoom("Alice");
      const guest = joinRoom(host.room.code, "Bob");
      const active = startRoom(host.room.code, host.participantId);
      submitGuess(active.code, guest!.participantId, active.secretWord);
      return { host, guest: guest!, code: active.code };
    }

    it("resets all round state and returns room to lobby", () => {
      const { host, guest, code } = setupEndedRoom();

      const restarted = restartRoom(code, host.participantId);

      expect(restarted.status).toBe("lobby");
      expect(restarted.drawerId).toBe("");
      expect(restarted.secretWord).toBe("");
      expect(restarted.guesses).toEqual([]);
      expect(restarted.scores).toEqual({});
      expect(restarted.participants.map((p) => p.id)).toContain(host.participantId);
      expect(restarted.participants.map((p) => p.id)).toContain(guest.participantId);
    });

    it("preserves all participants after restart", () => {
      const { host, guest, code } = setupEndedRoom();

      const restarted = restartRoom(code, host.participantId);

      expect(restarted.participants).toHaveLength(2);
      expect(restarted.participants[0].name).toBe("Alice");
      expect(restarted.participants[1].name).toBe("Bob");
      expect(restarted.hostId).toBe(host.participantId);
      expect(guest.participantId).toBeDefined();
    });

    it("throws 409 when room is not ended", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      startRoom(host.room.code, host.participantId);

      try {
        restartRoom(host.room.code, host.participantId);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).statusCode).toBe(409);
      }
    });

    it("throws 403 when caller is not the host", () => {
      const { guest, code } = setupEndedRoom();

      try {
        restartRoom(code, guest.participantId);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).statusCode).toBe(403);
        expect((error as HttpError).message).toMatch(/host/i);
      }
    });

    it("throws 404 for an unknown room code", () => {
      try {
        restartRoom("ZZZZ", "00000000-0000-0000-0000-000000000000");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).statusCode).toBe(404);
      }
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
