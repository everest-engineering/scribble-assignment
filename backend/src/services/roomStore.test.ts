import { describe, expect, it } from "vitest";
import {
  createRoom,
  joinRoom,
  restartGame,
  selectWord,
  startGame,
  submitGuess
} from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code and hostId", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("selectWord is deterministic for the same room code", () => {
    const first = createRoom("Host");
    const second = createRoom("Host2");

    expect(selectWord(first.room.code)).toBe(selectWord(first.room.code));
    expect(selectWord(first.room.code)).not.toBe(selectWord(second.room.code));
  });

  it("startGame assigns drawer, word, and zero scores", () => {
    const host = createRoom("Host");
    const guest = joinRoom(host.room.code, "Guest");

    expect(guest).not.toBeNull();

    const started = startGame(host.room.code, host.participantId);

    expect(started.status).toBe("playing");
    expect(started.drawerId).toBe(host.participantId);
    expect(started.secretWord).toBe(selectWord(host.room.code));
    expect(started.scores[host.participantId]).toBe(0);
    expect(started.scores[guest!.participantId]).toBe(0);
  });

  it("submitGuess awards 100 points and ends the round on a correct guess", () => {
    const host = createRoom("Host");
    const guest = joinRoom(host.room.code, "Guest");

    startGame(host.room.code, host.participantId);

    const afterGuess = submitGuess(host.room.code, guest!.participantId, selectWord(host.room.code).toUpperCase());

    expect(afterGuess.status).toBe("result");
    expect(afterGuess.scores[guest!.participantId]).toBe(100);
    expect(afterGuess.guesses).toHaveLength(1);
    expect(afterGuess.guesses[0].correct).toBe(true);
  });

  it("restartGame clears round state and returns to lobby", () => {
    const host = createRoom("Host");
    const guest = joinRoom(host.room.code, "Guest");

    startGame(host.room.code, host.participantId);
    submitGuess(host.room.code, guest!.participantId, selectWord(host.room.code));

    const restarted = restartGame(host.room.code, host.participantId);

    expect(restarted.status).toBe("lobby");
    expect(restarted.participants).toHaveLength(2);
    expect(restarted.drawerId).toBeUndefined();
    expect(restarted.secretWord).toBeUndefined();
    expect(restarted.strokes).toHaveLength(0);
    expect(restarted.guesses).toHaveLength(0);
    expect(restarted.scores).toEqual({});
  });
});
