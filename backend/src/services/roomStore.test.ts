import { describe, expect, it } from "vitest";
import {
  clearDrawing,
  createRoom,
  getDeterministicWord,
  joinRoom,
  restartGame,
  startGame,
  submitGuess,
  toRoomSnapshot,
  updateDrawing
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

  it("trims player name on createRoom and joinRoom", () => {
    const createResult = createRoom("   Alice   ");
    expect(createResult.room.participants[0].name).toBe("Alice");

    const joinResult = joinRoom(createResult.room.code, "  Bob  ");
    expect(joinResult!.room.participants[1].name).toBe("Bob");
  });

  it("selects secret word deterministically from the room code", () => {
    const word1 = getDeterministicWord("ABCD");
    const word2 = getDeterministicWord("ABCD");
    expect(word1).toBe(word2);

    const word3 = getDeterministicWord("WXYZ");
    // Ensure it picks valid starter words
    expect(["rocket", "pizza", "castle", "guitar", "sunflower"]).toContain(word1);
    expect(["rocket", "pizza", "castle", "guitar", "sunflower"]).toContain(word3);
  });

  it("startGame sets status to active, assigns host as drawer, and sets a secret word", () => {
    const createResult = createRoom("Alice");
    const hostId = createResult.participantId;
    const code = createResult.room.code;

    // Join second player so we can start
    joinRoom(code, "Bob");

    const updatedRoom = startGame(code, hostId);
    expect(updatedRoom.status).toBe("active");
    expect(updatedRoom.drawerId).toBe(hostId);
    expect(updatedRoom.secretWord).toBeDefined();
    expect(updatedRoom.scores[hostId]).toBe(0);
  });

  it("toRoomSnapshot includes secretWord for the drawer but not for guessers", () => {
    const createResult = createRoom("Alice");
    const hostId = createResult.participantId;
    const code = createResult.room.code;

    const joinResult = joinRoom(code, "Bob");
    const guestId = joinResult!.participantId;

    const updatedRoom = startGame(code, hostId);

    const hostSnapshot = toRoomSnapshot(updatedRoom, hostId);
    const guestSnapshot = toRoomSnapshot(updatedRoom, guestId);

    expect(hostSnapshot.drawerId).toBe(hostId);
    expect(hostSnapshot.secretWord).toBe(updatedRoom.secretWord);

    expect(guestSnapshot.drawerId).toBe(hostId);
    expect(guestSnapshot.secretWord).toBeUndefined();
  });

  it("rejects empty or whitespace-only guesses", () => {
    const createResult = createRoom("Alice");
    const code = createResult.room.code;
    const hostId = createResult.participantId;
    const joinResult = joinRoom(code, "Bob")!;
    startGame(code, hostId);

    expect(() => submitGuess(code, joinResult.participantId, "   ")).toThrow("Guess cannot be empty");
  });

  it("matches correct guesses case-insensitively and only scores once", () => {
    const createResult = createRoom("Alice");
    const code = createResult.room.code;
    const hostId = createResult.participantId;
    const joinResult = joinRoom(code, "Bob")!;
    const startedRoom = startGame(code, hostId);

    const firstGuessRoom = submitGuess(code, joinResult.participantId, startedRoom.secretWord!.toUpperCase());
    expect(firstGuessRoom.scores[joinResult.participantId]).toBe(100);
    expect(firstGuessRoom.guesses.at(-1)?.correct).toBe(true);

    const secondGuessRoom = submitGuess(code, joinResult.participantId, startedRoom.secretWord!.toLowerCase());
    expect(secondGuessRoom.scores[joinResult.participantId]).toBe(100);
    expect(secondGuessRoom.guesses.at(-1)?.correct).toBe(true);
    expect(secondGuessRoom.correctGuessers).toContain(joinResult.participantId);
  });

  it("rejects drawer guess attempts", () => {
    const createResult = createRoom("Alice");
    const code = createResult.room.code;
    const hostId = createResult.participantId;
    joinRoom(code, "Bob");
    startGame(code, hostId);

    expect(() => submitGuess(code, hostId, "pizza")).toThrow("Drawer cannot submit guesses");
  });

  it("allows drawer to update and clear drawing while blocking guessers", () => {
    const createResult = createRoom("Alice");
    const code = createResult.room.code;
    const hostId = createResult.participantId;
    const joinResult = joinRoom(code, "Bob")!;
    startGame(code, hostId);

    const updatedRoom = updateDrawing(code, hostId, [{ points: [{ x: 1, y: 2 }, { x: 3, y: 4 }] }]);
    expect(updatedRoom.drawing).toHaveLength(1);

    expect(() =>
      updateDrawing(code, joinResult.participantId, [{ points: [{ x: 5, y: 6 }] }])
    ).toThrow("Only the drawer can update drawing");

    const clearedRoom = clearDrawing(code, hostId);
    expect(clearedRoom.drawing).toEqual([]);
  });

  it("transitions to results when all guessers submit at least one guess", () => {
    const createResult = createRoom("Alice");
    const code = createResult.room.code;
    const hostId = createResult.participantId;
    const guestOne = joinRoom(code, "Bob")!;
    const guestTwo = joinRoom(code, "Carol")!;
    const startedRoom = startGame(code, hostId);

    const afterFirstCorrect = submitGuess(code, guestOne.participantId, startedRoom.secretWord!);
    expect(afterFirstCorrect.status).toBe("active");

    const afterSecondGuess = submitGuess(code, guestTwo.participantId, "wrongword");
    expect(afterSecondGuess.status).toBe("results");
  });

  it("reveals secret word to all viewers during results", () => {
    const createResult = createRoom("Alice");
    const code = createResult.room.code;
    const hostId = createResult.participantId;
    const guest = joinRoom(code, "Bob")!;
    const startedRoom = startGame(code, hostId);
    const resultsRoom = submitGuess(code, guest.participantId, startedRoom.secretWord!);

    const drawerSnapshot = toRoomSnapshot(resultsRoom, hostId);
    const guestSnapshot = toRoomSnapshot(resultsRoom, guest.participantId);

    expect(resultsRoom.status).toBe("results");
    expect(drawerSnapshot.secretWord).toBe(startedRoom.secretWord);
    expect(guestSnapshot.secretWord).toBe(startedRoom.secretWord);
  });

  it("restartGame resets round state and preserves participants", () => {
    const createResult = createRoom("Alice");
    const code = createResult.room.code;
    const hostId = createResult.participantId;
    const guest = joinRoom(code, "Bob")!;
    const startedRoom = startGame(code, hostId);
    const resultsRoom = submitGuess(code, guest.participantId, startedRoom.secretWord!);

    const restartedRoom = restartGame(code, hostId);

    expect(resultsRoom.status).toBe("results");
    expect(restartedRoom.status).toBe("lobby");
    expect(restartedRoom.participants.map((participant) => participant.id)).toEqual(
      resultsRoom.participants.map((participant) => participant.id)
    );
    expect(restartedRoom.drawing).toEqual([]);
    expect(restartedRoom.guesses).toEqual([]);
    expect(restartedRoom.correctGuessers).toEqual([]);
    expect(restartedRoom.secretWord).toBeUndefined();
    expect(restartedRoom.drawerId).toBeUndefined();
    expect(restartedRoom.scores[hostId]).toBe(0);
    expect(restartedRoom.scores[guest.participantId]).toBe(0);
  });

  it("rejects restart when caller is not host", () => {
    const createResult = createRoom("Alice");
    const code = createResult.room.code;
    const hostId = createResult.participantId;
    const guest = joinRoom(code, "Bob")!;
    const startedRoom = startGame(code, hostId);
    submitGuess(code, guest.participantId, startedRoom.secretWord!);

    expect(() => restartGame(code, guest.participantId)).toThrow("Only the host can restart the game");
  });

  it("rejects restart outside results state", () => {
    const createResult = createRoom("Alice");
    const code = createResult.room.code;
    const hostId = createResult.participantId;
    joinRoom(code, "Bob");

    expect(() => restartGame(code, hostId)).toThrow("Game can only be restarted from results");

    startGame(code, hostId);
    expect(() => restartGame(code, hostId)).toThrow("Game can only be restarted from results");
  });
});
