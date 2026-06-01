import { describe, expect, it } from "vitest";
import {
  createRoom,
  joinRoom,
  getRoom,
  startGame,
  submitGuess,
  getGuesses
} from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("startGame returns not-enough when fewer than 2 players", () => {
    const created = createRoom("Host");

    const result = startGame(created.room.code, created.participantId);

    expect((result as any).reason).toBe("not-enough");
  });

  it("startGame enforces host-only and allows host to start when enough players", () => {
    const created = createRoom("Host");
    const joinRes = joinRoom(created.room.code, "Guest");

    // Non-host cannot start
    if (joinRes === null) throw new Error("Join failed in test");
    const nonHostStart = startGame(
      created.room.code,
      (joinRes as any).participantId
    );
    expect((nonHostStart as any).reason).toBe("not-host");

    // Host can start when >=2 players
    const hostStart = startGame(created.room.code, created.participantId);
    expect((hostStart as any).room).toBeDefined();
    expect((hostStart as any).room.status).toBe("in-game");

    const persisted = getRoom(created.room.code);
    expect(persisted?.status).toBe("in-game");
  });

  it("trims player names on create and join", () => {
    const created = createRoom("  Alice  ");
    expect(created.room.participants[0].name).toBe("Alice");

    const joinRes = joinRoom(created.room.code, "  Bob  ");
    if (joinRes === null) throw new Error("Join failed in test");
    expect(
      (joinRes as any).room.participants.some((p: any) => p.name === "Bob")
    ).toBe(true);
  });

  it("assigns drawer and secret word when starting game", () => {
    const created = createRoom("Host");
    const joinRes = joinRoom(created.room.code, "Guest");
    if (joinRes === null) throw new Error("Join failed in test");

    const hostStart = startGame(created.room.code, created.participantId);
    expect((hostStart as any).room).toBeDefined();
    const persisted = getRoom(created.room.code);
    expect(persisted?.status).toBe("in-game");
    expect(persisted?.drawerId).toBeDefined();
    expect(persisted?.secretWord).toBeDefined();
  });

  it("records guesses, validates trimming, and awards points for correct guess", () => {
    const created = createRoom("Host");
    const joinRes = joinRoom(created.room.code, "Guesser");
    if (joinRes === null) throw new Error("Join failed in test");

    // start game as host
    const hostStart = startGame(created.room.code, created.participantId);
    expect((hostStart as any).room).toBeDefined();

    // find a guesser id
    const guesserId = (joinRes as any).participantId;

    // submit empty guess -> rejected by helper
    const empty = submitGuess(created.room.code, guesserId, "   ");
    expect((empty as any).reason).toBe("empty");

    // submit too long guess
    const longText = "a".repeat(201);
    const tooLong = submitGuess(created.room.code, guesserId, longText);
    expect((tooLong as any).reason).toBe("too-long");

    // submit incorrect guess
    const wrong = submitGuess(created.room.code, guesserId, "wrongguess");
    expect((wrong as any).guess).toBeDefined();
    expect((wrong as any).guess.isCorrect).toBe(false);

    // submit correct guess (use secret from room)
    const room = getRoom(created.room.code);
    const secret = room?.secretWord ?? "";
    const correct = submitGuess(created.room.code, guesserId, secret);
    expect((correct as any).guess.isCorrect).toBe(true);

    // verify guesses stored
    const guesses = getGuesses(created.room.code);
    expect(guesses?.length).toBeGreaterThanOrEqual(2);

    // verify score was awarded to guesser
    const updated = getRoom(created.room.code);
    const guesser = updated?.participants.find(
      (p) => p.id === guesserId
    ) as any;
    expect(guesser.score).toBeDefined();
    expect(guesser.score).toBe(100);
  });
});
