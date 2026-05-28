import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, submitGuess, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");
    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostId to the first participant id", () => {
    const result = createRoom("Alice");
    expect(result.room.hostId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    expect(joinRoom("ZZZZ", "Bob")).toBeNull();
  });

  it("startGame sets status to playing", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    expect(startGame(room.code, participantId).status).toBe("playing");
  });

  it("startGame sets drawerId to hostId", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    expect(startGame(room.code, participantId).drawerId).toBe(participantId);
  });

  it("startGame sets secretWord to 'rocket'", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    expect(startGame(room.code, participantId).secretWord).toBe("rocket");
  });

  it("startGame initialises scores to 0 for all participants", () => {
    const { room, participantId } = createRoom("Alice");
    const join = joinRoom(room.code, "Bob");
    const started = startGame(room.code, participantId);
    expect(started.scores[participantId]).toBe(0);
    expect(started.scores[join!.participantId]).toBe(0);
  });

  it("startGame initialises guesses to empty array", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    expect(startGame(room.code, participantId).guesses).toEqual([]);
  });

  it("toRoomSnapshot includes secretWord for the drawer", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    const started = startGame(room.code, participantId);
    expect(toRoomSnapshot(started, participantId).secretWord).toBe("rocket");
  });

  it("toRoomSnapshot omits secretWord for a guesser", () => {
    const { room, participantId } = createRoom("Alice");
    const join = joinRoom(room.code, "Bob");
    const started = startGame(room.code, participantId);
    expect(toRoomSnapshot(started, join!.participantId).secretWord).toBeUndefined();
  });

  it("submitGuess stores a correct guess and adds 100 to score", () => {
    const { room, participantId } = createRoom("Alice");
    const join = joinRoom(room.code, "Bob");
    startGame(room.code, participantId);
    const updated = submitGuess(room.code, join!.participantId, "rocket");
    expect(updated.guesses).toHaveLength(1);
    expect(updated.guesses[0].correct).toBe(true);
    expect(updated.scores[join!.participantId]).toBe(100);
  });

  it("submitGuess stores an incorrect guess and adds 0 to score", () => {
    const { room, participantId } = createRoom("Alice");
    const join = joinRoom(room.code, "Bob");
    startGame(room.code, participantId);
    const updated = submitGuess(room.code, join!.participantId, "pizza");
    expect(updated.guesses[0].correct).toBe(false);
    expect(updated.scores[join!.participantId]).toBe(0);
  });

  it("submitGuess is case-insensitive", () => {
    const { room, participantId } = createRoom("Alice");
    const join = joinRoom(room.code, "Bob");
    startGame(room.code, participantId);
    const updated = submitGuess(room.code, join!.participantId, "ROCKET");
    expect(updated.guesses[0].correct).toBe(true);
  });

  it("submitGuess throws 400 for empty text", () => {
    const { room, participantId } = createRoom("Alice");
    const join = joinRoom(room.code, "Bob");
    startGame(room.code, participantId);
    expect(() => submitGuess(room.code, join!.participantId, "   ")).toThrow("Guess cannot be empty");
  });

  it("startGame throws 403 when non-host tries to start", () => {
    const { room } = createRoom("Alice");
    const join = joinRoom(room.code, "Bob");
    expect(() => startGame(room.code, join!.participantId)).toThrow("Only the host can start the game");
  });

  it("startGame throws 403 when fewer than 2 players are present", () => {
    const { room, participantId } = createRoom("Alice");
    expect(() => startGame(room.code, participantId)).toThrow("Need at least 2 players to start");
  });
});
