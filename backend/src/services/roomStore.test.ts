import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, restartGame, saveStrokes, startGame, submitGuess, toRoomSnapshot } from "./roomStore.js";
import { HttpError } from "../models/game.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostId to the creator's participant ID", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("createRoom trims player name", () => {
    const result = createRoom("  Alice  ");

    expect(result.room.participants[0].name).toBe("Alice");
  });

  it("createRoom rejects empty player name", () => {
    expect(() => createRoom("")).toThrow(HttpError);
    expect(() => createRoom("   ")).toThrow(HttpError);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom trims player name", () => {
    const room = createRoom("Alice");
    const result = joinRoom(room.room.code, "  Bob  ");

    expect(result).not.toBeNull();
    expect(result!.room.participants[1].name).toBe("Bob");
  });

  it("joinRoom rejects empty player name", () => {
    const room = createRoom("Alice");

    expect(() => joinRoom(room.room.code, "")).toThrow(HttpError);
    expect(() => joinRoom(room.room.code, "   ")).toThrow(HttpError);
  });

  it("startGame returns updated room when host starts with 2+ players", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");

    const result = startGame(host.room.code, host.participantId);

    expect(result).not.toBeNull();
    expect(result!.status).toBe("playing");
  });

  it("startGame returns null for unknown room code", () => {
    const result = startGame("ZZZZ", "some-id");

    expect(result).toBeNull();
  });

  it("startGame rejects non-host requester", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(() => startGame(host.room.code, guest!.participantId)).toThrow(HttpError);
    expect(() => startGame(host.room.code, guest!.participantId)).toThrow("Only the host can start the game");
  });

  it("startGame rejects when fewer than 2 players", () => {
    const host = createRoom("Alice");

    expect(() => startGame(host.room.code, host.participantId)).toThrow(HttpError);
    expect(() => startGame(host.room.code, host.participantId)).toThrow("Need at least 2 players to start");
  });

  it("startGame rejects when game already started", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    expect(() => startGame(host.room.code, host.participantId)).toThrow(HttpError);
    expect(() => startGame(host.room.code, host.participantId)).toThrow("Game already started");
  });

  it("toRoomSnapshot includes hostId", () => {
    const room = createRoom("Alice");
    const snapshot = getRoom(room.room.code);

    expect(snapshot).not.toBeNull();
    expect(snapshot!.hostId).toBe(room.participantId);
  });

  it("startGame assigns drawer as host", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const result = startGame(host.room.code, host.participantId);

    expect(result!.drawerId).toBe(host.participantId);
  });

  it("startGame selects a deterministic word from the starter list", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const result = startGame(host.room.code, host.participantId);

    expect(["rocket", "pizza", "castle", "guitar", "sunflower"]).toContain(result!.secretWord);
  });

  it("startGame initialises all scores to 0", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const result = startGame(host.room.code, host.participantId);

    expect(result!.scores[host.participantId]).toBe(0);
    expect(Object.values(result!.scores!).every((s) => s === 0)).toBe(true);
  });

  it("toRoomSnapshot exposes secretWord to the drawer", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const game = startGame(host.room.code, host.participantId);
    const snapshot = toRoomSnapshot(game!, host.participantId);

    expect(snapshot.secretWord).toBe(game!.secretWord);
  });

  it("toRoomSnapshot hides secretWord from guessers", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    const game = startGame(host.room.code, host.participantId);
    const snapshot = toRoomSnapshot(game!, guest!.participantId);

    expect(snapshot.secretWord).toBeNull();
  });

  it("submitGuess returns null for unknown room", () => {
    const result = submitGuess("ZZZZ", "p1", "hello");

    expect(result).toBeNull();
  });

  it("submitGuess rejects empty guess", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const game = startGame(host.room.code, host.participantId);

    expect(() => submitGuess(host.room.code, game!.participants[1].id, "")).toThrow(HttpError);
    expect(() => submitGuess(host.room.code, game!.participants[1].id, "   ")).toThrow(HttpError);
  });

  it("submitGuess rejects guesses from drawer", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const game = startGame(host.room.code, host.participantId);

    expect(() => submitGuess(host.room.code, host.participantId, "guess")).toThrow(HttpError);
  });

  it("submitGuess returns room with guess recorded for incorrect answer", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    const game = startGame(host.room.code, host.participantId);

    const result = submitGuess(host.room.code, guest!.participantId, "wrong");

    expect(result).not.toBeNull();
    expect(result!.guesses).toHaveLength(1);
    expect(result!.guesses[0].isCorrect).toBe(false);
    expect(result!.guesses[0].text).toBe("wrong");
    expect(result!.scores[guest!.participantId]).toBe(0);
  });

  it("submitGuess scores 100 for correct case-insensitive guess", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    const game = startGame(host.room.code, host.participantId);

    const correctGuess = game!.secretWord!.toUpperCase();
    const result = submitGuess(host.room.code, guest!.participantId, correctGuess);

    expect(result!.guesses[0].isCorrect).toBe(true);
    expect(result!.scores[guest!.participantId]).toBe(100);
  });

  it("submitGuess trims whitespace from guess", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    const game = startGame(host.room.code, host.participantId);

    const result = submitGuess(host.room.code, guest!.participantId, `  ${game!.secretWord}  `);

    expect(result!.guesses[0].isCorrect).toBe(true);
  });

  it("submitGuess awards score only for first correct guess", () => {
    const host = createRoom("Alice");
    const guest1 = joinRoom(host.room.code, "Bob");
    const guest2 = joinRoom(host.room.code, "Charlie");
    const game = startGame(host.room.code, host.participantId);

    const word = game!.secretWord!;
    submitGuess(host.room.code, guest1!.participantId, word);
    const result = submitGuess(host.room.code, guest1!.participantId, word);

    expect(result!.scores[guest1!.participantId]).toBe(100);
    expect(result!.guesses).toHaveLength(2);
    expect(result!.guesses[1].isCorrect).toBe(true);
  });

  it("submitGuess transitions to finished when all guessers correct", () => {
    const host = createRoom("Alice");
    const guest1 = joinRoom(host.room.code, "Bob");
    const guest2 = joinRoom(host.room.code, "Charlie");
    const game = startGame(host.room.code, host.participantId);

    const word = game!.secretWord!;
    submitGuess(host.room.code, guest1!.participantId, word);
    const result = submitGuess(host.room.code, guest2!.participantId, word);

    expect(result!.status).toBe("finished");
  });

  it("submitGuess rejects when round is finished", () => {
    const host = createRoom("Alice");
    const guest1 = joinRoom(host.room.code, "Bob");
    const guest2 = joinRoom(host.room.code, "Charlie");
    const game = startGame(host.room.code, host.participantId);

    const word = game!.secretWord!;
    submitGuess(host.room.code, guest1!.participantId, word);
    submitGuess(host.room.code, guest2!.participantId, word);

    expect(() => submitGuess(host.room.code, guest1!.participantId, "extra")).toThrow(HttpError);
    expect(() => submitGuess(host.room.code, guest1!.participantId, "extra")).toThrow("Round is over");
  });

  it("saveStrokes returns null for unknown room", () => {
    const result = saveStrokes("ZZZZ", "p1", []);
    expect(result).toBeNull();
  });

  it("saveStrokes rejects non-drawer", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    const game = startGame(host.room.code, host.participantId);

    expect(() => saveStrokes(host.room.code, guest!.participantId, [])).toThrow(HttpError);
  });

  it("saveStrokes stores drawing data", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const game = startGame(host.room.code, host.participantId);

    const strokes = [{ points: [{ x: 10, y: 20 }, { x: 30, y: 40 }] }];
    const result = saveStrokes(host.room.code, host.participantId, strokes);

    expect(result!.strokes).toEqual(strokes);
  });

  it("toRoomSnapshot exposes secretWord to everyone when finished", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    const game = startGame(host.room.code, host.participantId);

    submitGuess(host.room.code, guest!.participantId, game!.secretWord!);
    const snapshot = toRoomSnapshot(getRoom(host.room.code)!, guest!.participantId);

    expect(snapshot.secretWord).toBe(game!.secretWord);
  });

  it("restartGame returns null for unknown room", () => {
    const result = restartGame("ZZZZ", "p1");
    expect(result).toBeNull();
  });

  it("restartGame rejects non-host requester", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    const game = startGame(host.room.code, host.participantId);
    submitGuess(host.room.code, guest!.participantId, game!.secretWord!);

    expect(() => restartGame(host.room.code, guest!.participantId)).toThrow(HttpError);
    expect(() => restartGame(host.room.code, guest!.participantId)).toThrow("Only the host can restart the game");
  });

  it("restartGame rejects when game is not finished", () => {
    const host = createRoom("Alice");

    expect(() => restartGame(host.room.code, host.participantId)).toThrow(HttpError);
    expect(() => restartGame(host.room.code, host.participantId)).toThrow("Game is not finished");
  });

  it("restartGame resets round state but preserves players", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    const game = startGame(host.room.code, host.participantId);
    submitGuess(host.room.code, guest!.participantId, game!.secretWord!);

    const result = restartGame(host.room.code, host.participantId);

    expect(result!.status).toBe("lobby");
    expect(result!.drawerId).toBeNull();
    expect(result!.secretWord).toBeNull();
    expect(result!.guesses).toHaveLength(0);
    expect(result!.strokes).toHaveLength(0);
    expect(result!.participants).toHaveLength(2);
    expect(result!.participants[0].id).toBe(host.participantId);
    expect(result!.participants[1].id).toBe(guest!.participantId);
  });

  it("restartGame allows starting a new game after restart", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    const game = startGame(host.room.code, host.participantId);
    submitGuess(host.room.code, guest!.participantId, game!.secretWord!);
    restartGame(host.room.code, host.participantId);

    const newGame = startGame(host.room.code, host.participantId);

    expect(newGame!.status).toBe("playing");
    expect(newGame!.drawerId).toBe(host.participantId);
  });
});