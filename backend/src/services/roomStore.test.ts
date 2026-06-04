import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, restartGame, saveDrawing, startGame, submitGuess, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.participants[0].isHost).toBe(true);
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("toRoomSnapshot canStart is false with 1 player", () => {
    const result = createRoom("Alice");
    const snapshot = toRoomSnapshot(result.room);

    expect(snapshot.canStart).toBe(false);
  });

  it("toRoomSnapshot canStart is true with 2+ players", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");
    const room = getRoom(result.room.code);
    const snapshot = toRoomSnapshot(room!);

    expect(snapshot.canStart).toBe(true);
  });

  it("startGame returns null for non-host participant", () => {
    const result = createRoom("Alice");
    const joinResult = joinRoom(result.room.code, "Bob");

    expect(startGame(result.room.code, joinResult!.participantId)).toBeNull();
  });

  it("startGame returns null with fewer than 2 players", () => {
    const result = createRoom("Alice");

    expect(startGame(result.room.code, result.participantId)).toBeNull();
  });

  it("startGame returns room with status playing for host with 2+ players", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");
    const gameRoom = startGame(result.room.code, result.participantId);

    expect(gameRoom).not.toBeNull();
    expect(gameRoom!.status).toBe("playing");
  });

  it("startGame assigns first participant as drawer", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");
    const gameRoom = startGame(result.room.code, result.participantId);

    expect(gameRoom!.participants[0].isDrawer).toBe(true);
    expect(gameRoom!.participants[1].isDrawer).toBe(false);
  });

  it("startGame sets a word on the room", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");
    const gameRoom = startGame(result.room.code, result.participantId);

    expect(gameRoom!.word).not.toBeNull();
    expect(typeof gameRoom!.word).toBe("string");
  });

  it("toRoomSnapshot shows word only to drawer", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");
    const hostId = result.participantId;
    const joinResult = joinRoom(result.room.code, "Charlie");
    const gameRoom = startGame(result.room.code, hostId);

    const drawerSnap = toRoomSnapshot(gameRoom!, hostId);
    const guesserSnap = toRoomSnapshot(gameRoom!, joinResult!.participantId);

    expect(drawerSnap.word).toBe(gameRoom!.word);
    expect(guesserSnap.word).toBeNull();
  });

  it("saveDrawing allows only drawer to save", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");
    const hostId = result.participantId;
    const joinResult = joinRoom(result.room.code, "Charlie");
    startGame(result.room.code, hostId);

    const drawerSave = saveDrawing(result.room.code, hostId, "data:image/png;base64,abc");
    const guesserSave = saveDrawing(result.room.code, joinResult!.participantId, "data:image/png;base64,xyz");

    expect(drawerSave).not.toBeNull();
    expect(drawerSave!.drawingData).toBe("data:image/png;base64,abc");
    expect(guesserSave).toBeNull();
  });

  it("submitGuess rejects empty guesses", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");
    startGame(result.room.code, result.participantId);
    const joinResult = joinRoom(result.room.code, "Charlie");

    const emptyGuess = submitGuess(result.room.code, joinResult!.participantId, "  ");

    expect(emptyGuess).toBeNull();
  });

  it("submitGuess rejects guesses from drawer", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");
    startGame(result.room.code, result.participantId);

    const drawerGuess = submitGuess(result.room.code, result.participantId, "test");

    expect(drawerGuess).toBeNull();
  });

  it("submitGuess scores 100 for correct guess and ends round", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");
    const gameRoom = startGame(result.room.code, result.participantId);
    const joinResult = joinRoom(result.room.code, "Charlie");
    const word = gameRoom!.word!;

    const guessResult = submitGuess(result.room.code, joinResult!.participantId, word);

    expect(guessResult).not.toBeNull();
    expect(guessResult!.status).toBe("finished");
    expect(guessResult!.guesses[0].correct).toBe(true);
    const guesser = guessResult!.participants.find((p) => p.id === joinResult!.participantId);
    expect(guesser!.score).toBe(100);
  });

  it("submitGuess is case-insensitive", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");
    const gameRoom = startGame(result.room.code, result.participantId);
    const joinResult = joinRoom(result.room.code, "Charlie");
    const word = gameRoom!.word!;

    const guessResult = submitGuess(result.room.code, joinResult!.participantId, word.toUpperCase());

    expect(guessResult!.guesses[0].correct).toBe(true);
  });

  it("submitGuess scores 0 for incorrect guess", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");
    startGame(result.room.code, result.participantId);
    const joinResult = joinRoom(result.room.code, "Charlie");

    const guessResult = submitGuess(result.room.code, joinResult!.participantId, "wronganswer");

    expect(guessResult!.guesses[0].correct).toBe(false);
    const guesser = guessResult!.participants.find((p) => p.id === joinResult!.participantId);
    expect(guesser!.score).toBe(0);
  });

  it("restartGame returns null if room not finished", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");

    expect(restartGame(result.room.code, result.participantId)).toBeNull();
  });

  it("restartGame returns null if non-host tries", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");
    const gameRoom = startGame(result.room.code, result.participantId);
    const joinResult = joinRoom(result.room.code, "Charlie");
    const word = gameRoom!.word!;
    submitGuess(result.room.code, joinResult!.participantId, word);

    const guesserRestart = restartGame(result.room.code, joinResult!.participantId);

    expect(guesserRestart).toBeNull();
  });

  it("restartGame resets to lobby with players preserved", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");
    const gameRoom = startGame(result.room.code, result.participantId);
    const charlieJoin = joinRoom(result.room.code, "Charlie");
    const word = gameRoom!.word!;
    submitGuess(result.room.code, charlieJoin!.participantId, word);

    const restarted = restartGame(result.room.code, result.participantId);

    expect(restarted).not.toBeNull();
    expect(restarted!.status).toBe("lobby");
    expect(restarted!.participants).toHaveLength(3);
    expect(restarted!.word).toBeNull();
    expect(restarted!.drawingData).toBeNull();
    expect(restarted!.guesses).toHaveLength(0);
    restarted!.participants.forEach((p) => {
      expect(p.score).toBe(0);
      expect(p.isDrawer).toBe(false);
    });
  });
});
