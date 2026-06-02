import { describe, expect, it } from "vitest";
import { clearDrawing, createRoom, getRoom, joinRoom, restartRoom, startRoom, submitGuess, toRoomSnapshot, updateDrawing } from "./roomStore.js";

describe("roomStore", () => {
  describe("createRoom", () => {
    it("returns a room with a 4-character uppercase code", () => {
      const result = createRoom("Alice");

      expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
      expect(result.room.participants).toHaveLength(1);
      expect(result.room.participants[0].name).toBe("Alice");
      expect(result.room.participants[0].isHost).toBe(true);
      expect(result.room.participants[0].score).toBe(0);
      expect(result.participantId).toBeDefined();
    });
  });

  describe("joinRoom", () => {
    it("returns null for an unknown room code", () => {
      const result = joinRoom("ZZZZ", "Bob");
      expect(result).toBeNull();
    });

    it("adds participant as non-host with zero score", () => {
      const { room } = createRoom("Alice");
      const result = joinRoom(room.code, "Bob");

      expect(result).not.toBeNull();
      expect(result!.room.participants).toHaveLength(2);
      const bob = result!.room.participants.find((p) => p.name === "Bob");
      expect(bob).toBeDefined();
      expect(bob!.isHost).toBe(false);
      expect(bob!.score).toBe(0);
    });
  });

  describe("startRoom", () => {
    it("throws 404 for unknown room", () => {
      expect(() => startRoom("ZZZZ", "p1")).toThrow("Room not found");
    });

    it("throws 403 for non-participant", () => {
      const { room } = createRoom("Alice");
      expect(() => startRoom(room.code, "nonexistent")).toThrow("You are not in this room");
    });

    it("throws 403 for non-host participant", () => {
      const { room } = createRoom("Alice");
      const joinResult = joinRoom(room.code, "Bob");
      expect(() => startRoom(room.code, joinResult!.participantId)).toThrow("Only the host can start the game");
    });

    it("throws 400 when fewer than 2 players", () => {
      const { room, participantId } = createRoom("Alice");
      expect(() => startRoom(room.code, participantId)).toThrow("Need at least 2 players to start");
    });

    it("succeeds for host with 2+ players", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const result = startRoom(room.code, participantId);
      expect(result.room).toBeDefined();
    });

    it("throws 400 if game already started", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      startRoom(room.code, participantId);
      expect(() => startRoom(room.code, participantId)).toThrow("Game has already started");
    });
  });

  describe("startRoom round state", () => {
    it("transitions room status to playing", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const result = startRoom(room.code, participantId);
      expect(result.room.status).toBe("playing");
    });

    it("assigns host as drawer", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const result = startRoom(room.code, participantId);
      const host = result.room.participants.find((p) => p.isHost)!;
      expect(result.room.round?.drawerPlayerId).toBe(host.id);
    });

    it("selects STARTER_WORDS[0] as secret word", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const result = startRoom(room.code, participantId);
      expect(result.room.round?.secretWord).toBe("rocket");
    });

    it("re-zeros all scores", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      room.participants[0].score = 50;
      const result = startRoom(room.code, participantId);
      result.room.participants.forEach((p) => {
        expect(p.score).toBe(0);
      });
    });
  });

  describe("toRoomSnapshot secret word filtering", () => {
    it("reveals secret word to drawer", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const started = startRoom(room.code, participantId);
      const snapshot = toRoomSnapshot(started.room, participantId);
      expect(snapshot.round?.secretWord).toBe("rocket");
    });

    it("hides secret word from guesser", () => {
      const { room, participantId } = createRoom("Alice");
      const joinResult = joinRoom(room.code, "Bob");
      const started = startRoom(room.code, participantId);
      const snapshot = toRoomSnapshot(started.room, joinResult!.participantId);
      expect(snapshot.round?.secretWord).toBeNull();
    });

    it("hides secret word when no viewer id provided", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const started = startRoom(room.code, participantId);
      const snapshot = toRoomSnapshot(started.room);
      expect(snapshot.round?.secretWord).toBeNull();
    });
  });

  describe("updateDrawing", () => {
    function setup() {
      const alice = createRoom("Alice");
      const bob = joinRoom(alice.room.code, "Bob");
      startRoom(alice.room.code, alice.participantId);
      return { code: alice.room.code, drawerId: alice.participantId, guesserId: bob!.participantId };
    }

    it("allows drawer to update drawing", () => {
      const { code, drawerId } = setup();
      const strokes = [{ points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] }];
      const result = updateDrawing(code, drawerId, strokes);
      expect(result.room.round?.drawing).toEqual(strokes);
    });

    it("rejects update from non-drawer", () => {
      const { code, guesserId } = setup();
      expect(() => updateDrawing(code, guesserId, [])).toThrow("Only the drawer can perform this action");
    });

    it("replaces drawing entirely on each update", () => {
      const { code, drawerId } = setup();
      updateDrawing(code, drawerId, [{ points: [{ x: 0, y: 0 }] }]);
      const result = updateDrawing(code, drawerId, [{ points: [{ x: 5, y: 5 }] }]);
      expect(result.room.round?.drawing).toHaveLength(1);
      expect(result.room.round?.drawing[0].points[0]).toEqual({ x: 5, y: 5 });
    });
  });

  describe("clearDrawing", () => {
    function setup() {
      const alice = createRoom("Alice");
      const bob = joinRoom(alice.room.code, "Bob");
      startRoom(alice.room.code, alice.participantId);
      return { code: alice.room.code, drawerId: alice.participantId, guesserId: bob!.participantId };
    }

    it("allows drawer to clear drawing", () => {
      const { code, drawerId } = setup();
      updateDrawing(code, drawerId, [{ points: [{ x: 0, y: 0 }] }]);
      const result = clearDrawing(code, drawerId);
      expect(result.room.round?.drawing).toEqual([]);
    });

    it("rejects clear from non-drawer", () => {
      const { code, guesserId } = setup();
      expect(() => clearDrawing(code, guesserId)).toThrow("Only the drawer can perform this action");
    });
  });

  describe("submitGuess", () => {
    function setup() {
      const alice = createRoom("Alice");
      const bob = joinRoom(alice.room.code, "Bob");
      startRoom(alice.room.code, alice.participantId);
      return { code: alice.room.code, drawerId: alice.participantId, guesserId: bob!.participantId };
    }

    it("rejects guess from drawer", () => {
      const { code, drawerId } = setup();
      expect(() => submitGuess(code, drawerId, "rocket")).toThrow("The drawer cannot submit guesses");
    });

    it("rejects empty guess", () => {
      const { code, guesserId } = setup();
      expect(() => submitGuess(code, guesserId, "")).toThrow("Guess is required");
    });

    it("adds incorrect guess to history with 0 score change", () => {
      const { code, guesserId } = setup();
      const result = submitGuess(code, guesserId, "wrong");
      expect(result.room.round?.guesses).toHaveLength(1);
      expect(result.room.round?.guesses[0].isCorrect).toBe(false);
      expect(result.room.round?.guesses[0].value).toBe("wrong");
      const guesser = result.room.participants.find((p) => p.id === guesserId);
      expect(guesser?.score).toBe(0);
    });

    it("treats case-insensitive correct guess as correct and awards 100 points", () => {
      const { code, guesserId } = setup();
      const result = submitGuess(code, guesserId, "ROCKET");
      expect(result.room.round?.guesses).toHaveLength(1);
      expect(result.room.round?.guesses[0].isCorrect).toBe(true);
      const guesser = result.room.participants.find((p) => p.id === guesserId);
      expect(guesser?.score).toBe(100);
    });

    it("transitions room to result on correct guess", () => {
      const { code, guesserId } = setup();
      const result = submitGuess(code, guesserId, "rocket");
      expect(result.room.status).toBe("result");
      expect(result.room.round?.phase).toBe("result");
      expect(result.room.round?.winnerPlayerId).toBe(guesserId);
    });

    it("trims whitespace from guess before comparing", () => {
      const { code, guesserId } = setup();
      const result = submitGuess(code, guesserId, "  rocket  ");
      expect(result.room.round?.guesses[0].isCorrect).toBe(true);
    });
  });

  describe("toRoomSnapshot result phase", () => {
    function setupResult() {
      const alice = createRoom("Alice");
      const bob = joinRoom(alice.room.code, "Bob");
      startRoom(alice.room.code, alice.participantId);
      submitGuess(alice.room.code, bob!.participantId, "rocket");
      return { code: alice.room.code, hostId: alice.participantId, guesserId: bob!.participantId };
    }

    it("reveals secret word to drawer in result phase", () => {
      const { code, hostId } = setupResult();
      const room = getRoom(code)!;
      const snapshot = toRoomSnapshot(room, hostId);
      expect(snapshot.round?.secretWord).toBe("rocket");
    });

    it("reveals secret word to guesser in result phase", () => {
      const { code, guesserId } = setupResult();
      const room = getRoom(code)!;
      const snapshot = toRoomSnapshot(room, guesserId);
      expect(snapshot.round?.secretWord).toBe("rocket");
    });

    it("reveals secret word when no viewer id in result phase", () => {
      const { code } = setupResult();
      const room = getRoom(code)!;
      const snapshot = toRoomSnapshot(room);
      expect(snapshot.round?.secretWord).toBe("rocket");
    });
  });

  describe("restartRoom", () => {
    function setupResult() {
      const alice = createRoom("Alice");
      const bob = joinRoom(alice.room.code, "Bob");
      startRoom(alice.room.code, alice.participantId);
      submitGuess(alice.room.code, bob!.participantId, "rocket");
      return { code: alice.room.code, hostId: alice.participantId, guesserId: bob!.participantId };
    }

    it("throws 404 for unknown room", () => {
      expect(() => restartRoom("ZZZZ", "p1")).toThrow("Room not found");
    });

    it("throws 403 for non-participant", () => {
      const { code } = setupResult();
      expect(() => restartRoom(code, "nonexistent")).toThrow("You are not in this room");
    });

    it("throws 403 for non-host participant", () => {
      const { code, guesserId } = setupResult();
      expect(() => restartRoom(code, guesserId)).toThrow("Only the host can restart the room");
    });

    it("throws 400 when room is not in result state", () => {
      const { room, participantId } = createRoom("Alice");
      const bob = joinRoom(room.code, "Bob");
      startRoom(room.code, participantId);
      expect(() => restartRoom(room.code, participantId)).toThrow("Room is not in result state");
    });

    it("clears round state and sets status to lobby", () => {
      const { code, hostId } = setupResult();
      const result = restartRoom(code, hostId);
      expect(result.room.status).toBe("lobby");
      expect(result.room.round).toBeNull();
    });

    it("preserves participants and their scores on restart", () => {
      const { code, hostId, guesserId } = setupResult();
      const before = getRoom(code)!;
      const guesserBefore = before.participants.find((p) => p.id === guesserId)!;
      expect(guesserBefore.score).toBe(100);

      const result = restartRoom(code, hostId);
      expect(result.room.participants).toHaveLength(2);
      const host = result.room.participants.find((p) => p.id === hostId)!;
      const guesser = result.room.participants.find((p) => p.id === guesserId)!;
      expect(host.isHost).toBe(true);
      expect(guesser.score).toBe(100);
    });

    it("allows a new game after restart", () => {
      const { code, hostId } = setupResult();
      restartRoom(code, hostId);
      const result = startRoom(code, hostId);
      expect(result.room.status).toBe("playing");
      expect(result.room.round?.phase).toBe("playing");
    });
  });
});
