import { describe, expect, it, beforeEach } from "vitest";
import {
  createRoom,
  joinRoom,
  pickWordForRoom,
  resetRoomsForTests,
  restartGame,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";

describe("roomStore", () => {
  beforeEach(() => {
    resetRoomsForTests();
  });

  it("createRoom returns a room with a 4-character uppercase code and host", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.participantId).toBeDefined();
  });

  it("createRoom rejects empty names", () => {
    expect(() => createRoom("   ")).toThrow("Player name is required");
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom rejects invalid room code format", () => {
    expect(() => joinRoom("ab", "Bob")).toThrow("Room code must be 4 letters or numbers");
  });

  it("pickWordForRoom is deterministic for a given code", () => {
    const first = pickWordForRoom("ABCD");
    const second = pickWordForRoom("ABCD");

    expect(first).toBe(second);
  });

  it("startGame assigns host as drawer and hides word from guessers", () => {
    const host = createRoom("Host");
    const guest = joinRoom(host.room.code, "Guest");
    const started = startGame(host.room.code, host.participantId)!;

    expect(started.status).toBe("playing");
    expect(started.drawerId).toBe(host.participantId);

    const drawerView = toRoomSnapshot(started, host.participantId);
    const guesserView = toRoomSnapshot(started, guest!.participantId);

    expect(drawerView.secretWord).toBeTruthy();
    expect(guesserView.secretWord).toBeNull();
  });

  it("submitGuess scores correct answers and ends the round", () => {
    const host = createRoom("Host");
    const guest = joinRoom(host.room.code, "Guest");
    const started = startGame(host.room.code, host.participantId)!;
    const word = started.secretWord!;

    const afterGuess = submitGuess(host.room.code, guest!.participantId, word.toUpperCase());

    expect(afterGuess?.status).toBe("result");
    expect(afterGuess?.participants.find((player) => player.id === guest!.participantId)?.score).toBe(
      100
    );
    expect(toRoomSnapshot(afterGuess!, guest!.participantId).correctWord).toBe(word);
  });

  it("restartGame returns everyone to lobby with cleared round state", () => {
    const host = createRoom("Host");
    const guest = joinRoom(host.room.code, "Guest");
    const started = startGame(host.room.code, host.participantId)!;
    submitGuess(host.room.code, guest!.participantId, started.secretWord!);

    const restarted = restartGame(host.room.code, host.participantId)!;

    expect(restarted.status).toBe("lobby");
    expect(restarted.guesses).toHaveLength(0);
    expect(restarted.strokes).toHaveLength(0);
    expect(restarted.participants).toHaveLength(2);
    expect(restarted.participants.every((player) => player.score === 0)).toBe(true);
  });
});
