import { describe, expect, it } from "vitest";
import { appendCanvasAction, clearCanvas, createRoom, djb2Hash, getRoom, joinRoom, selectSecretWord, startGame, submitGuess, toRoomSnapshot } from "./roomStore.js";

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

  describe("canvas actions", () => {
    it("appendCanvasAction adds a stroke to canvasActions", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const started = startGame(room.code, participantId);

      const action = { type: "stroke" as const, points: [{ x: 1, y: 2 }], color: "#000", width: 2, timestamp: new Date().toISOString() };
      appendCanvasAction(started.room, action);

      expect(started.room.canvasActions).toHaveLength(1);
      expect(started.room.canvasActions[0]).toEqual(action);
    });

    it("clearCanvas replaces canvasActions with a clear entry", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const started = startGame(room.code, participantId);

      appendCanvasAction(started.room, { type: "stroke", points: [{ x: 1, y: 2 }], color: "#000", width: 2, timestamp: "t1" });
      clearCanvas(started.room, "t2");

      expect(started.room.canvasActions).toHaveLength(1);
      expect(started.room.canvasActions[0].type).toBe("clear");
    });

    it("canvasActions are included in room snapshot", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const started = startGame(room.code, participantId);
      appendCanvasAction(started.room, { type: "stroke", points: [{ x: 1, y: 2 }], color: "#000", width: 2, timestamp: "t1" });

      started.room.updatedAt = new Date().toISOString();
      getRoom(room.code);
      const snapshot = toRoomSnapshot(started.room, participantId);

      expect(snapshot.canvasActions).toHaveLength(1);
      expect(snapshot.canvasActions[0].type).toBe("stroke");
    });
  });

  describe("submitGuess", () => {
    function setupGame() {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const started = startGame(room.code, participantId);
      const guesserId = started.room.participants.find((p) => p.id !== participantId)!.id;
      return { started, participantId, guesserId, secretWord: started.room.secretWord };
    }

    it("accepts a correct guess with case-insensitive comparison", () => {
      const { started, guesserId, secretWord } = setupGame();

      const result = submitGuess(started.room, guesserId, secretWord.toUpperCase());

      expect(result.correct).toBe(true);
      expect(result.score).toBe(100);
    });

    it("accepts a correct guess with different case", () => {
      const { started, guesserId, secretWord } = setupGame();
      const mixedCase = secretWord.charAt(0).toUpperCase() + secretWord.slice(1).toLowerCase();

      const result = submitGuess(started.room, guesserId, mixedCase);

      expect(result.correct).toBe(true);
      expect(result.score).toBe(100);
    });

    it("rejects an incorrect guess with correct=false and score 0", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const started = startGame(room.code, participantId);
      const guesserId = started.room.participants.find((p) => p.id !== participantId)!.id;

      const result = submitGuess(started.room, guesserId, "wrong");

      expect(result.correct).toBe(false);
      expect(result.score).toBe(0);
    });

    it("throws 403 if drawer tries to guess", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const started = startGame(room.code, participantId);

      expect(() => submitGuess(started.room, participantId, "pizza")).toThrow("The drawer cannot submit guesses");
    });

    it("throws error if guesser already scored 100", () => {
      const { started, guesserId, secretWord } = setupGame();

      submitGuess(started.room, guesserId, secretWord);

      expect(() => submitGuess(started.room, guesserId, secretWord)).toThrow("already scored");
    });

    it("records guess in guessHistory", () => {
      const { started, guesserId, secretWord } = setupGame();

      submitGuess(started.room, guesserId, secretWord);

      expect(started.room.guessHistory).toHaveLength(1);
      expect(started.room.guessHistory[0].participantId).toBe(guesserId);
      expect(started.room.guessHistory[0].correct).toBe(true);
      expect(started.room.guessHistory[0].text).toBe(secretWord);
    });
  });

  describe("scoring and round-end detection", () => {
    it("scores are included in room snapshot", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const started = startGame(room.code, participantId);
      const guesserId = started.room.participants.find((p) => p.id !== participantId)!.id;

      const snapshot = toRoomSnapshot(started.room, participantId);
      expect(snapshot.scores).toEqual({ [guesserId]: 0 });
    });

    it("roundOver is false when not all guessers have scored", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      joinRoom(room.code, "Charlie");
      const started = startGame(room.code, participantId);
      const guessers = started.room.participants.filter((p) => p.id !== participantId);

      submitGuess(started.room, guessers[0].id, started.room.secretWord);

      const snapshot = toRoomSnapshot(started.room, participantId);
      expect(snapshot.roundOver).toBe(false);
    });

    it("roundOver is true when all guessers have scored 100", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      joinRoom(room.code, "Charlie");
      const started = startGame(room.code, participantId);
      const guessers = started.room.participants.filter((p) => p.id !== participantId);

      submitGuess(started.room, guessers[0].id, started.room.secretWord);
      submitGuess(started.room, guessers[1].id, started.room.secretWord);

      const snapshot = toRoomSnapshot(started.room, participantId);
      expect(snapshot.roundOver).toBe(true);
    });

    it("incorrect guess results in 0 score", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const started = startGame(room.code, participantId);
      const guesserId = started.room.participants.find((p) => p.id !== participantId)!.id;

      const result = submitGuess(started.room, guesserId, "wrongword");

      expect(result.correct).toBe(false);
      expect(result.score).toBe(0);
      expect(started.room.scores[guesserId]).toBe(0);
    });
  });

  describe("guess history in snapshot", () => {
    it("includes guessHistory in room snapshot", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const started = startGame(room.code, participantId);
      const guesserId = started.room.participants.find((p) => p.id !== participantId)!.id;

      submitGuess(started.room, guesserId, started.room.secretWord);

      const snapshot = toRoomSnapshot(started.room);
      expect(snapshot.guessHistory).toHaveLength(1);
      expect(snapshot.guessHistory[0].participantId).toBe(guesserId);
      expect(snapshot.guessHistory[0].correct).toBe(true);
    });

    it("guessHistory is empty when no guesses submitted", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const started = startGame(room.code, participantId);

      const snapshot = toRoomSnapshot(started.room);
      expect(snapshot.guessHistory).toEqual([]);
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
