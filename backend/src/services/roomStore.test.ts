import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, leaveRoom, getRoom, startGame, checkAutomaticCompletion } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code and assigns host", () => {
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

  it("joinRoom enforces name uniqueness in room", () => {
    const initial = createRoom("Alice");
    const code = initial.room.code;

    expect(() => joinRoom(code, "Alice")).toThrow("Name already taken in this room");
    expect(() => joinRoom(code, "alice ")).toThrow("Name already taken in this room");
  });

  it("joinRoom enforces maximum capacity of 8 players", () => {
    const initial = createRoom("P1");
    const code = initial.room.code;

    for (let i = 2; i <= 8; i++) {
      joinRoom(code, `P${i}`);
    }

    expect(() => joinRoom(code, "P9")).toThrow("Room is full (max 8 players)");
  });

  it("leaveRoom closes room if host leaves", () => {
    const result = createRoom("Alice");
    const code = result.room.code;
    const hostId = result.participantId;

    leaveRoom(code, hostId);

    expect(getRoom(code)).toBeNull();
  });

  it("leaveRoom just removes participant if not host", () => {
    const result = createRoom("Alice");
    const code = result.room.code;
    const playerResult = joinRoom(code, "Bob")!;
    const playerId = playerResult.participantId;

    leaveRoom(code, playerId);

    const room = getRoom(code)!;
    expect(room.participants).toHaveLength(1);
    expect(room.participants[0].name).toBe("Alice");
  });

  it("startGame sets room to in-game, assigns host as drawer, and selects a word", () => {
    const result = createRoom("Alice");
    const code = result.room.code;
    const hostId = result.participantId;

    const room = startGame(code, hostId);
    if (!room) throw new Error("Room not found");

    expect(room.status).toBe("in-game");
    expect(room.drawerId).toBe(hostId);
    expect(room.currentWord).toBeDefined();
    expect(typeof room.currentWord).toBe("string");
  });

  it("startGame throws error if not called by host", () => {
    const result = createRoom("Alice");
    const code = result.room.code;
    const playerResult = joinRoom(code, "Bob")!;
    const notHostId = playerResult.participantId;

    expect(() => startGame(code, notHostId)).toThrow("Cannot start game");
  });

  it("checkAutomaticCompletion should end game when all guessers have guessed correctly", () => {
    const result = createRoom("Alice"); // Drawer
    const code = result.room.code;
    const g1 = joinRoom(code, "Bob")!.participantId;
    const g2 = joinRoom(code, "Charlie")!.participantId;
    const room = getRoom(code)!;

    const roomAfterStart = startGame(code, result.participantId);
    if (!roomAfterStart) throw new Error("Room not found");

    // Initial state: in-game
    expect(roomAfterStart.status).toBe("in-game");

    // Bob guesses correctly
    roomAfterStart.guessHistory.push({ playerId: g1, text: "word", isCorrect: true, timestamp: new Date().toISOString() });
    checkAutomaticCompletion(roomAfterStart);
    expect(roomAfterStart.status).toBe("in-game");

    // Charlie guesses correctly
    roomAfterStart.guessHistory.push({ playerId: g2, text: "word", isCorrect: true, timestamp: new Date().toISOString() });
    checkAutomaticCompletion(roomAfterStart);
    expect(roomAfterStart.status).toBe("ended");
  });
});
