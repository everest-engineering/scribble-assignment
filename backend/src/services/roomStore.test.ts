import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, startGame, submitGuess, restartGame } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets the creator as host", () => {
    const result = createRoom("Host");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("createRoom without name defaults to Player", () => {
    const result = createRoom();

    expect(result.room.participants[0].name).toBe("Player");
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("startGame fails with less than 2 players", () => {
    const host = createRoom("Solo");

    const result = startGame(host.room.code, host.participantId);

    expect("error" in result).toBe(true);
  });

  it("startGame succeeds with 2+ players and assigns drawer", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Player2");

    const result = startGame(host.room.code, host.participantId);

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.ok.status).toBe("playing");
      expect(result.ok.drawerId).toBe(host.participantId);
      expect(result.ok.secretWord).toBeDefined();
    }
  });

  it("submitGuess with correct word scores 100 and ends round", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guesser");
    const startResult = startGame(host.room.code, host.participantId);

    expect("error" in startResult).toBe(false);
    if ("error" in startResult) return;

    const guesserId = getRoom(host.room.code)!.participants[1].id;
    const secretWord = startResult.ok.secretWord!;

    const guessResult = submitGuess(host.room.code, guesserId, secretWord);

    expect("error" in guessResult).toBe(false);
    if (!("error" in guessResult)) {
      expect(guessResult.ok.scores[guesserId]).toBe(100);
      expect(guessResult.ok.status).toBe("round_end");
    }
  });

  it("restartGame resets round state and preserves participants", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Player2");
    startGame(host.room.code, host.participantId);

    const result = restartGame(host.room.code, host.participantId);

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.ok.status).toBe("lobby");
      expect(result.ok.drawerId).toBeNull();
      expect(result.ok.secretWord).toBeNull();
      expect(result.ok.guesses).toHaveLength(0);
      expect(result.ok.participants).toHaveLength(2);
    }
  });
});
