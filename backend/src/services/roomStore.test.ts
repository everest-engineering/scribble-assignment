import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, restartGame, selectWord, startGame, submitGuess, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets the creator as host", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("createRoom rejects empty player name", () => {
    expect(() => createRoom("   ")).toThrow("Player name is required");
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom rejects empty player name", () => {
    const { room } = createRoom("Alice");

    expect(() => joinRoom(room.code, "  ")).toThrow("Player name is required");
  });

  it("startGame rejects non-host participant", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guest = joinRoom(room.code, "Bob");
    expect(guest).not.toBeNull();

    expect(() => startGame(room.code, guest!.participantId)).toThrow(
      "Only the host can start the game"
    );
    void hostId;
  });

  it("startGame rejects when fewer than 2 players", () => {
    const { room, participantId: hostId } = createRoom("Alice");

    expect(() => startGame(room.code, hostId)).toThrow(
      "At least 2 players are required to start"
    );
  });

  it("startGame assigns drawer, word, and zero scores", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guest = joinRoom(room.code, "Bob");
    expect(guest).not.toBeNull();

    const updated = startGame(room.code, hostId);

    expect(updated.status).toBe("playing");
    expect(updated.drawerId).toBe(hostId);
    expect(updated.secretWord).toBeTruthy();
    expect(updated.scores[hostId]).toBe(0);
    expect(updated.scores[guest!.participantId]).toBe(0);
  });

  it("selectWord is deterministic for a given room code", () => {
    const first = selectWord("ABCD");
    const second = selectWord("ABCD");

    expect(first).toBe(second);
    expect(first).toMatch(/^(rocket|pizza|castle|guitar|sunflower)$/);
  });

  it("toRoomSnapshot includes secretWord only for drawer viewer", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guest = joinRoom(room.code, "Bob");
    const playing = startGame(room.code, hostId);

    const drawerView = toRoomSnapshot(playing, hostId);
    const guesserView = toRoomSnapshot(playing, guest!.participantId);

    expect(drawerView.secretWord).toBe(playing.secretWord);
    expect(guesserView.secretWord).toBeUndefined();
  });

  it("toRoomSnapshot assigns participant roles", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    const playing = startGame(room.code, hostId);

    const snapshot = toRoomSnapshot(playing, hostId);
    const drawer = snapshot.participants.find((p) => p.id === hostId);
    const guesser = snapshot.participants.find((p) => p.id !== hostId);

    expect(drawer?.role).toBe("drawer");
    expect(guesser?.role).toBe("guesser");
  });

  it("submitGuess scores correct guess and ends round", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guest = joinRoom(room.code, "Bob");
    const playing = startGame(room.code, hostId);
    const word = playing.secretWord!;

    const updated = submitGuess(room.code, guest!.participantId, word.toUpperCase());

    expect(updated.status).toBe("result");
    expect(updated.scores[guest!.participantId]).toBe(100);
    expect(updated.guesses).toHaveLength(1);
    expect(updated.guesses[0].isCorrect).toBe(true);
  });

  it("submitGuess rejects empty guess", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guest = joinRoom(room.code, "Bob");
    startGame(room.code, hostId);

    expect(() => submitGuess(room.code, guest!.participantId, "   ")).toThrow("Guess is required");
  });

  it("restartGame clears round state and returns to lobby", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guest = joinRoom(room.code, "Bob");
    const playing = startGame(room.code, hostId);
    submitGuess(room.code, guest!.participantId, playing.secretWord!);

    const restarted = restartGame(room.code, hostId);

    expect(restarted.status).toBe("lobby");
    expect(restarted.drawerId).toBeNull();
    expect(restarted.secretWord).toBeNull();
    expect(restarted.participants).toHaveLength(2);
    expect(restarted.guesses).toHaveLength(0);
  });

  it("toRoomSnapshot reveals secret word to all on result", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guest = joinRoom(room.code, "Bob");
    const playing = startGame(room.code, hostId);
    const result = submitGuess(room.code, guest!.participantId, playing.secretWord!);

    const guesserView = toRoomSnapshot(result, guest!.participantId);

    expect(guesserView.secretWord).toBe(playing.secretWord);
  });
});
