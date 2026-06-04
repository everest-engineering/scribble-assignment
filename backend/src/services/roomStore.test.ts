import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, restartGame, startGame, submitGuess, toRoomSnapshot } from "./roomStore.js";

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

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("startGame succeeds when host calls with at least 2 players", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const result = startGame(created.room.code, created.participantId);

    expect(result.room.status).toBe("playing");
  });

  it("startGame throws for non-host participant", () => {
    const created = createRoom("Alice");
    const joiner = joinRoom(created.room.code, "Bob");

    expect(() => startGame(created.room.code, joiner!.participantId)).toThrow(
      "Only the host can start the game"
    );
  });

  it("startGame throws when fewer than 2 players", () => {
    const created = createRoom("Alice");

    expect(() => startGame(created.room.code, created.participantId)).toThrow(
      "At least 2 players are required to start"
    );
  });

  it("startGame throws for unknown room", () => {
    expect(() => startGame("ZZZZ", "some-id")).toThrow("Room not found");
  });

  it("getRoom includes hostId in snapshot", () => {
    const created = createRoom("Alice");
    const room = getRoom(created.room.code);

    expect(room).not.toBeNull();
    expect(room!.hostId).toBe(created.participantId);
  });

  it("startGame assigns host as drawer", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const result = startGame(created.room.code, created.participantId);

    expect(result.room.drawerId).toBe(created.participantId);
  });

  it("startGame sets round to 1", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const result = startGame(created.room.code, created.participantId);

    expect(result.room.round).toBe(1);
  });

  it("startGame selects a word from the starter list", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const result = startGame(created.room.code, created.participantId);

    expect(["rocket", "pizza", "castle", "guitar", "sunflower"]).toContain(result.room.secretWord);
  });

  it("startGame selects the same word for the same room code", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const first = startGame(created.room.code, created.participantId);

    const snapshot1 = toRoomSnapshot(first.room, created.participantId);
    const snapshot2 = toRoomSnapshot(first.room, created.participantId);

    expect(snapshot1.secretWord).toBe(snapshot2.secretWord);
  });

  it("toRoomSnapshot shows secret word to the drawer", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const result = startGame(created.room.code, created.participantId);
    const snapshot = toRoomSnapshot(result.room, created.participantId);

    expect(snapshot.secretWord).toBeDefined();
    expect(snapshot.secretWord).toBe(result.room.secretWord);
  });

  it("toRoomSnapshot hides secret word from non-drawer", () => {
    const created = createRoom("Alice");
    const joiner = joinRoom(created.room.code, "Bob");
    const result = startGame(created.room.code, created.participantId);
    const snapshot = toRoomSnapshot(result.room, joiner!.participantId);

    expect(snapshot.secretWord).toBeUndefined();
  });

  it("toRoomSnapshot hides secret word when no viewer", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const result = startGame(created.room.code, created.participantId);
    const snapshot = toRoomSnapshot(result.room);

    expect(snapshot.secretWord).toBeUndefined();
  });

  it("submitGuess records a correct guess and awards 100 points", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const game = startGame(created.room.code, created.participantId);
    const bobId = game.room.participants[1].id;

    const result = submitGuess(created.room.code, bobId, game.room.secretWord);

    expect(result.room.guesses).toHaveLength(1);
    expect(result.room.guesses[0].isCorrect).toBe(true);
    expect(result.room.guesses[0].playerName).toBe("Bob");
    expect(result.room.scores[bobId]).toBe(100);
  });

  it("submitGuess records an incorrect guess and awards 0 points", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const game = startGame(created.room.code, created.participantId);
    const bobId = game.room.participants[1].id;

    const result = submitGuess(created.room.code, bobId, "wronganswer");

    expect(result.room.guesses).toHaveLength(1);
    expect(result.room.guesses[0].isCorrect).toBe(false);
    expect(result.room.scores[bobId]).toBe(0);
  });

  it("submitGuess is case-insensitive", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const game = startGame(created.room.code, created.participantId);
    const bobId = game.room.participants[1].id;

    const result = submitGuess(created.room.code, bobId, game.room.secretWord.toUpperCase());

    expect(result.room.guesses[0].isCorrect).toBe(true);
  });

  it("submitGuess trims whitespace before comparing", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const game = startGame(created.room.code, created.participantId);
    const bobId = game.room.participants[1].id;

    const result = submitGuess(created.room.code, bobId, `  ${game.room.secretWord}  `);

    expect(result.room.guesses[0].isCorrect).toBe(true);
    expect(result.room.guesses[0].text).toBe(`  ${game.room.secretWord}  `);
  });

  it("submitGuess prevents drawer from guessing", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const game = startGame(created.room.code, created.participantId);

    expect(() => submitGuess(created.room.code, created.participantId, "anything")).toThrow(
      "Drawer cannot submit guesses"
    );
  });

  it("submitGuess transitions to result and prevents further guesses on duplicate correct", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const game = startGame(created.room.code, created.participantId);
    const bobId = game.room.participants[1].id;

    const first = submitGuess(created.room.code, bobId, game.room.secretWord);
    expect(first.room.scores[bobId]).toBe(100);
    expect(first.room.status).toBe("result");

    expect(() => submitGuess(created.room.code, bobId, game.room.secretWord)).toThrow(
      "Game is not in progress"
    );
  });

  it("submitGuess throws for unknown room", () => {
    expect(() => submitGuess("ZZZZ", "some-id", "test")).toThrow("Room not found");
  });

  it("submitGuess throws when game not playing", () => {
    const created = createRoom("Alice");

    expect(() => submitGuess(created.room.code, created.participantId, "test")).toThrow(
      "Game is not in progress"
    );
  });

  it("submitGuess includes guesses and scores in snapshot", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const game = startGame(created.room.code, created.participantId);
    const bobId = game.room.participants[1].id;

    const result = submitGuess(created.room.code, bobId, "wrong");

    expect(result.room.guesses).toHaveLength(1);
    expect(result.room.scores[bobId]).toBe(0);
  });

  it("submitGuess transitions to result on correct guess", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const game = startGame(created.room.code, created.participantId);
    const bobId = game.room.participants[1].id;

    const result = submitGuess(created.room.code, bobId, game.room.secretWord);

    expect(result.room.status).toBe("result");
  });

  it("toRoomSnapshot includes correctWord in result state for all viewers", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const game = startGame(created.room.code, created.participantId);
    const bobId = game.room.participants[1].id;

    const afterGuess = submitGuess(created.room.code, bobId, game.room.secretWord);
    const snapshotForDrawer = toRoomSnapshot(afterGuess.room, created.participantId);
    const snapshotForGuesser = toRoomSnapshot(afterGuess.room, bobId);

    expect(snapshotForDrawer.correctWord).toBe(game.room.secretWord);
    expect(snapshotForGuesser.correctWord).toBe(game.room.secretWord);
  });

  it("toRoomSnapshot does not include correctWord in playing state", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const game = startGame(created.room.code, created.participantId);

    const snapshot = toRoomSnapshot(game.room, created.participantId);

    expect(snapshot.correctWord).toBeUndefined();
  });

  it("restartGame resets round state and preserves participants", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const game = startGame(created.room.code, created.participantId);
    const bobId = game.room.participants[1].id;
    submitGuess(created.room.code, bobId, game.room.secretWord);

    const result = restartGame(created.room.code, created.participantId);

    expect(result.room.status).toBe("lobby");
    expect(result.room.drawerId).toBe("");
    expect(result.room.secretWord).toBe("");
    expect(result.room.round).toBe(0);
    expect(result.room.guesses).toHaveLength(0);
    expect(result.room.scores).toEqual({});
    expect(result.room.participants).toHaveLength(2);
  });

  it("restartGame throws for non-host", () => {
    const created = createRoom("Alice");
    const joiner = joinRoom(created.room.code, "Bob");
    const game = startGame(created.room.code, created.participantId);
    const bobId = game.room.participants[1].id;
    submitGuess(created.room.code, bobId, game.room.secretWord);

    expect(() => restartGame(created.room.code, joiner!.participantId)).toThrow(
      "Only the host can restart the game"
    );
  });

  it("restartGame throws for unknown room", () => {
    expect(() => restartGame("ZZZZ", "some-id")).toThrow("Room not found");
  });

  it("restartGame works with only one participant", () => {
    const created = createRoom("Alice");

    const result = restartGame(created.room.code, created.participantId);

    expect(result.room.status).toBe("lobby");
    expect(result.room.participants).toHaveLength(1);
  });
});
