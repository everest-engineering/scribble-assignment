import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, submitGuess, toRoomSnapshot } from "./roomStore.js";

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

  it("createRoom sets hostId to the creator participant id", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("toRoomSnapshot includes hostId", () => {
    const result = createRoom("Alice");
    const snapshot = toRoomSnapshot(result.room);

    expect(snapshot.hostId).toBe(result.participantId);
  });

  it("joinRoom is case-insensitive for room code", () => {
    const created = createRoom("Alice");
    const lowercaseCode = created.room.code.toLowerCase();
    const joined = joinRoom(lowercaseCode, "Bob");

    expect(joined).not.toBeNull();
    expect(joined!.room.participants).toHaveLength(2);
  });

  it("createRoom initializes drawerId and secretWord as null", () => {
    const result = createRoom("Alice");

    expect(result.room.drawerId).toBeNull();
    expect(result.room.secretWord).toBeNull();
  });

  it("startGame sets drawerId to hostId and secretWord to first word", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const snapshot = startGame(created.room.code, created.participantId);

    expect(snapshot).not.toBeNull();
    expect(snapshot!.drawerId).toBe(created.participantId);
    expect(snapshot!.secretWord).toBe("rocket");
  });

  it("toRoomSnapshot returns secretWord only to the drawer", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);

    const drawerSnapshot = toRoomSnapshot(
      { ...created.room, status: "active", drawerId: created.participantId, secretWord: "rocket" },
      created.participantId
    );
    const guesserSnapshot = toRoomSnapshot(
      { ...created.room, status: "active", drawerId: created.participantId, secretWord: "rocket" },
      joined!.participantId
    );

    expect(drawerSnapshot.secretWord).toBe("rocket");
    expect(guesserSnapshot.secretWord).toBeNull();
  });

  it("startGame is deterministic: always selects the first word", () => {
    const room1 = createRoom("Carol");
    joinRoom(room1.room.code, "Dan");
    const snapshot1 = startGame(room1.room.code, room1.participantId);

    const room2 = createRoom("Eve");
    joinRoom(room2.room.code, "Frank");
    const snapshot2 = startGame(room2.room.code, room2.participantId);

    expect(snapshot1!.secretWord).toBe(snapshot2!.secretWord);
    expect(snapshot1!.secretWord).toBe("rocket");
  });

  it("startGame initializes scores to 0 for all participants", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    const snapshot = startGame(created.room.code, created.participantId);

    expect(snapshot!.scores[created.participantId]).toBe(0);
    expect(snapshot!.scores[joined!.participantId]).toBe(0);
  });

  it("startGame initializes guesses to empty array", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const snapshot = startGame(created.room.code, created.participantId);

    expect(snapshot!.guesses).toEqual([]);
  });

  it("toRoomSnapshot includes scores and guesses for all viewers", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);

    const snapshot = toRoomSnapshot(
      {
        ...created.room,
        status: "active",
        drawerId: created.participantId,
        secretWord: "rocket",
        scores: { [created.participantId]: 0, [joined!.participantId]: 0 },
        guesses: []
      },
      joined!.participantId
    );

    expect(snapshot.scores).toBeDefined();
    expect(snapshot.guesses).toEqual([]);
  });

  it("submitGuess awards 100 points for a correct guess (case-insensitive)", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);

    const result = submitGuess(created.room.code, joined!.participantId, "ROCKET");

    expect(result).not.toBeNull();
    expect(result!.guess.isCorrect).toBe(true);
    expect(result!.scoreAwarded).toBe(100);
    expect(result!.snapshot.scores[joined!.participantId]).toBe(100);
  });

  it("submitGuess awards 0 points for an incorrect guess but records it", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);

    const result = submitGuess(created.room.code, joined!.participantId, "pizza");

    expect(result).not.toBeNull();
    expect(result!.guess.isCorrect).toBe(false);
    expect(result!.scoreAwarded).toBe(0);
    expect(result!.snapshot.scores[joined!.participantId]).toBe(0);
    expect(result!.snapshot.guesses).toHaveLength(1);
    expect(result!.snapshot.guesses[0].text).toBe("pizza");
  });

  it("submitGuess rejects empty text", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);

    const result = submitGuess(created.room.code, joined!.participantId, "");

    expect(result).toBeNull();
  });

  it("submitGuess rejects whitespace-only text", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);

    const result = submitGuess(created.room.code, joined!.participantId, "   ");

    expect(result).toBeNull();
  });

  it("submitGuess accumulates score across multiple correct guesses", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);

    submitGuess(created.room.code, joined!.participantId, "rocket");
    const result = submitGuess(created.room.code, joined!.participantId, "Rocket");

    expect(result!.snapshot.scores[joined!.participantId]).toBe(200);
  });

  it("submitGuess handles mixed-case variations as correct", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);

    const lower = submitGuess(created.room.code, joined!.participantId, "rocket");
    expect(lower!.guess.isCorrect).toBe(true);
  });
});
