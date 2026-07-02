import { describe, expect, it } from "vitest";
import {
  clearDrawing,
  createRoom,
  getDeterministicWord,
  joinRoom,
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
});
