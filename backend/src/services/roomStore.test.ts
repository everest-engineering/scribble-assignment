import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, nextRound, restartGame, saveDrawing, startGame, submitGuess, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code and hostId", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.participants[0].score).toBe(0);
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.currentRound).toBe(0);
    expect(result.room.rounds).toEqual([]);
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom is case-insensitive", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const result = joinRoom(code.toLowerCase(), "Bob");

    expect(result).not.toBeNull();
    expect(result!.room.participants).toHaveLength(2);
  });

  it("joinRoom rejects joining a game in progress", () => {
    const created = createRoom("Alice");
    const code = created.room.code;

    joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const result = joinRoom(code, "Charlie");
    expect(result).toBeNull();
  });

  it("startGame fails if not the host", () => {
    const created = createRoom("Alice");
    const code = created.room.code;

    joinRoom(code, "Bob");

    expect(() => startGame(code, "wrong-id")).toThrow("Only the host can start the game");
  });

  it("startGame fails with fewer than 2 players", () => {
    const created = createRoom("Alice");
    const code = created.room.code;

    expect(() => startGame(code, created.participantId)).toThrow("At least 2 players required to start");
  });

  it("startGame creates round 1 with host as drawer", () => {
    const created = createRoom("Alice");
    const code = created.room.code;

    joinRoom(code, "Bob");
    const result = startGame(code, created.participantId);

    expect(result).not.toBeNull();
    expect(result!.room.status).toBe("playing");
    expect(result!.room.currentRound).toBe(1);
    expect(result!.room.rounds).toHaveLength(1);
    expect(result!.room.rounds[0].number).toBe(1);
    expect(result!.room.rounds[0].drawerId).toBe(created.participantId);
    expect(result!.room.rounds[0].secretWord).toBeDefined();
    expect(result!.room.rounds[0].status).toBe("drawing");
  });

  it("startGame selects word deterministically from starter list", () => {
    const created = createRoom("Alice");
    const code = created.room.code;

    joinRoom(code, "Bob");
    const result1 = startGame(code, created.participantId);
    const word1 = result1!.room.rounds[0].secretWord;

    const created2 = createRoom("Charlie");
    const code2 = created2.room.code;
    joinRoom(code2, "Dave");
    const result2 = startGame(code2, created2.participantId);
    const word2 = result2!.room.rounds[0].secretWord;

    expect(word1).toBe(word2);
    expect(typeof word1).toBe("string");
  });

  it("getRoom is case-insensitive", () => {
    const created = createRoom("Alice");
    const code = created.room.code;

    const room = getRoom(code.toLowerCase());
    expect(room).not.toBeNull();
    expect(room!.code).toBe(code);
  });

  it("toRoomSnapshot includes isHost flag for viewer", () => {
    const { room, participantId } = createRoom("Alice");

    const snapshot = toRoomSnapshot(room, participantId);
    expect(snapshot.isHost).toBe(true);

    const otherSnapshot = toRoomSnapshot(room, "other-id");
    expect(otherSnapshot.isHost).toBe(false);
  });

  it("toRoomSnapshot shows secretWord only for the drawer", () => {
    const created = createRoom("Alice");
    const code = created.room.code;

    joinRoom(code, "Bob");
    const started = startGame(code, created.participantId);
    const room = started!.room;

    const drawerSnapshot = toRoomSnapshot(room, created.participantId);
    expect(drawerSnapshot.secretWord).toBe(room.rounds[0].secretWord);
    expect(drawerSnapshot.drawerId).toBe(created.participantId);

    const guesserSnapshot = toRoomSnapshot(room, "non-drawer-id");
    expect(guesserSnapshot.secretWord).toBeNull();
    expect(guesserSnapshot.drawerId).toBe(created.participantId);
  });

  it("submitGuess rejects empty guesses", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    startGame(code, created.participantId);

    expect(() => submitGuess(code, "non-drawer-id", "  ")).toThrow("Guess text is required");
  });

  it("submitGuess rejects drawer from guessing", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    startGame(code, created.participantId);

    expect(() => submitGuess(code, created.participantId, "pizza")).toThrow("The drawer cannot submit guesses");
  });

  it("submitGuess marks correct guess and awards 100 points", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    const game = startGame(code, created.participantId);
    const word = game!.room.rounds[0].secretWord;

    const guesserId = game!.room.participants.find((p) => p.id !== created.participantId)!.id;
    const result = submitGuess(code, guesserId, word);

    expect(result).not.toBeNull();
    expect(result!.guess.isCorrect).toBe(true);
    expect(result!.scoreAwarded).toBe(100);

    const room = getRoom(code);
    const guesser = room!.participants.find((p) => p.id === guesserId);
    expect(guesser!.score).toBe(100);
  });

  it("submitGuess marks incorrect guess and awards 0 points", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    const game = startGame(code, created.participantId);

    const guesserId = game!.room.participants.find((p) => p.id !== created.participantId)!.id;
    const result = submitGuess(code, guesserId, "wrongword");

    expect(result).not.toBeNull();
    expect(result!.guess.isCorrect).toBe(false);
    expect(result!.scoreAwarded).toBe(0);

    const room = getRoom(code);
    const guesser = room!.participants.find((p) => p.id === guesserId);
    expect(guesser!.score).toBe(0);
  });

  it("submitGuess is case-insensitive", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    const game = startGame(code, created.participantId);
    const word = game!.room.rounds[0].secretWord;

    const guesserId = game!.room.participants.find((p) => p.id !== created.participantId)!.id;
    const result = submitGuess(code, guesserId, word.toUpperCase());

    expect(result!.guess.isCorrect).toBe(true);
  });

  it("submitGuess ends round after first correct guess", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    joinRoom(code, "Charlie");
    const game = startGame(code, created.participantId);
    const word = game!.room.rounds[0].secretWord;

    const guesser1 = game!.room.participants.find((p) => p.id !== created.participantId)!.id;
    const guesser2 = game!.room.participants.find((p) => p.id !== created.participantId && p.id !== guesser1)!.id;

    const result1 = submitGuess(code, guesser1, word);
    expect(result1!.guess.isCorrect).toBe(true);
    expect(result1!.scoreAwarded).toBe(100);

    const result2 = submitGuess(code, guesser2, word);
    expect(result2).toBeNull();

    const room = getRoom(code);
    expect(room!.status).toBe("round_end");
    expect(room!.rounds[0].status).toBe("revealed");
  });

  it("saveDrawing allows drawer to save", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const drawing = [[[10, 20], [30, 40]]];
    const result = saveDrawing(code, created.participantId, drawing);

    expect(result).toEqual({ ok: true });

    const room = getRoom(code);
    expect(room!.rounds[0].drawing).toEqual(drawing);
  });

  it("saveDrawing rejects guesser", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    const game = startGame(code, created.participantId);

    const guesserId = game!.room.participants.find((p) => p.id !== created.participantId)!.id;

    expect(() => saveDrawing(code, guesserId, [[[10, 20]]])).toThrow("Only the drawer can update the drawing");
  });

  it("toRoomSnapshot shows secretWord to all when round_end", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    const game = startGame(code, created.participantId);
    const word = game!.room.rounds[0].secretWord;
    const guesserId = game!.room.participants.find((p) => p.id !== created.participantId)!.id;

    submitGuess(code, guesserId, word);
    const room = getRoom(code)!;
    const snapshot = toRoomSnapshot(room, "any-viewer");
    expect(snapshot.secretWord).toBe(word);
    expect(snapshot.status).toBe("round_end");
  });

  it("nextRound advances to next round with new drawer", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    const game = startGame(code, created.participantId);
    const word = game!.room.rounds[0].secretWord;
    const guesserId = game!.room.participants.find((p) => p.id !== created.participantId)!.id;

    submitGuess(code, guesserId, word);
    const result = nextRound(code, created.participantId);

    expect(result).not.toBeNull();
    expect(result!.gameOver).toBe(false);
    expect(result!.room.status).toBe("playing");
    expect(result!.room.currentRound).toBe(2);
    expect(result!.room.rounds).toHaveLength(2);
    expect(result!.room.rounds[1].drawerId).toBe(guesserId);
    expect(result!.room.rounds[1].status).toBe("drawing");
    expect(result!.room.rounds[1].drawing).toEqual([]);
    expect(result!.room.rounds[1].guesses).toEqual([]);
  });

  it("nextRound rejects non-host", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    const game = startGame(code, created.participantId);
    const word = game!.room.rounds[0].secretWord;
    const guesserId = game!.room.participants.find((p) => p.id !== created.participantId)!.id;

    submitGuess(code, guesserId, word);

    expect(() => nextRound(code, "wrong-id")).toThrow("Only the host can advance to the next round");
  });

  it("nextRound returns null if not in round_end", () => {
    const created = createRoom("Alice");
    const code = created.room.code;

    const result = nextRound(code, created.participantId);
    expect(result).toBeNull();
  });

  it("nextRound transitions to game_over after all participants have drawn", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    const game = startGame(code, created.participantId);

    const word1 = game!.room.rounds[0].secretWord;
    const guesserId = game!.room.participants.find((p) => p.id !== created.participantId)!.id;

    submitGuess(code, guesserId, word1);
    nextRound(code, created.participantId);

    const room = getRoom(code)!;
    const word2 = room.rounds[1].secretWord;
    const drawer2 = room.rounds[1].drawerId;
    submitGuess(code, drawer2 === created.participantId ? guesserId : created.participantId, word2);

    const result = nextRound(code, created.participantId);
    expect(result).not.toBeNull();
    expect(result!.gameOver).toBe(true);
    expect(result!.room.status).toBe("game_over");
  });

  it("restartGame resets scores, rounds, and status", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    const game = startGame(code, created.participantId);
    const word = game!.room.rounds[0].secretWord;
    const guesserId = game!.room.participants.find((p) => p.id !== created.participantId)!.id;

    submitGuess(code, guesserId, word);
    nextRound(code, created.participantId);

    const room = getRoom(code)!;
    const word2 = room.rounds[1].secretWord;
    const drawer2 = room.rounds[1].drawerId;
    submitGuess(code, drawer2 === created.participantId ? guesserId : created.participantId, word2);
    nextRound(code, created.participantId);

    const result = restartGame(code, created.participantId);
    expect(result).not.toBeNull();
    expect(result!.room.status).toBe("lobby");
    expect(result!.room.currentRound).toBe(0);
    expect(result!.room.rounds).toEqual([]);
    for (const p of result!.room.participants) {
      expect(p.score).toBe(0);
    }
  });

  it("restartGame rejects non-host", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    const game = startGame(code, created.participantId);
    const word = game!.room.rounds[0].secretWord;
    const guesserId = game!.room.participants.find((p) => p.id !== created.participantId)!.id;

    submitGuess(code, guesserId, word);
    nextRound(code, created.participantId);

    const room = getRoom(code)!;
    const word2 = room.rounds[1].secretWord;
    const drawer2 = room.rounds[1].drawerId;
    submitGuess(code, drawer2 === created.participantId ? guesserId : created.participantId, word2);
    nextRound(code, created.participantId);

    expect(() => restartGame(code, "wrong-id")).toThrow("Only the host can restart the game");
  });

  it("restartGame returns null if not in game_over", () => {
    const created = createRoom("Alice");
    const code = created.room.code;

    const result = restartGame(code, created.participantId);
    expect(result).toBeNull();
  });
});
