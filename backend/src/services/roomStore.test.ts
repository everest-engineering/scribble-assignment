import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startRound, submitGuess, restartRound } from "./roomStore.js";

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

  it("startRound, submitGuess awards points and moves to results, restartRound resets state", () => {
    const a = createRoom("Alice");
    const code = a.room.code;
    const hostId = a.participantId;

    const b = joinRoom(code, "Bob");
    expect(b).not.toBeNull();

    // Start round as host
    const started = startRound(code, hostId);
    expect(started).not.toBeNull();
    const startedRoom = started!;
    expect(startedRoom.status).toBe("active");
    expect(startedRoom.round).toBeDefined();

    // Find a guesser id
    const guesser = startedRoom.participants.find((p: any) => p.id !== startedRoom.round?.drawerId);
    expect(guesser).not.toBeNull();
    const guesserId = guesser!.id;

    // Submit a correct guess
    const secret = startedRoom.round!.secretWord;
    const afterGuess = submitGuess(code, guesserId, secret);
    expect(afterGuess).not.toBeNull();
    const afterGuessRoom = afterGuess!;
    expect(afterGuessRoom.status).toBe("results");
    const updatedGuesser = afterGuessRoom.participants.find((p: any) => p.id === guesserId);
    expect(updatedGuesser).not.toBeNull();
    expect(updatedGuesser!.score).toBeGreaterThanOrEqual(100);

    // Restart as host
    const restarted = restartRound(code, hostId);
    expect(restarted).not.toBeNull();
    const restartedRoom = restarted!;
    expect(restartedRoom.status).toBe("lobby");
    expect(restartedRoom.round).toBeNull();
    expect(restartedRoom.guesses).toHaveLength(0);
    restartedRoom.participants.forEach((p: any) => expect(p.role).toBeUndefined());
  });
});
