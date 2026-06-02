import { describe, expect, it } from "vitest";
import {
  appendDrawing,
  clearDrawing,
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  restartRoom,
  startRoom,
  submitGuess,
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

  it("startRoom assigns the host as drawer and reveals the word only to the drawer", () => {
    const hostSession = createRoom("Alice");
    const roomCode = hostSession.room.code;

    const joinResult = joinRoom(roomCode, "Bob");
    expect(joinResult).not.toBeNull();

    const currentRoom = getRoom(roomCode);
    expect(currentRoom).not.toBeNull();

    const savedRoom = startRoom(currentRoom!, hostSession.participantId);

    expect(savedRoom.status).toBe("active");
    expect(savedRoom.drawerId).toBe(hostSession.participantId);
    expect(savedRoom.secretWord).toBeDefined();

    const reloaded = getRoom(roomCode);
    expect(reloaded?.drawerId).toBe(hostSession.participantId);
    expect(reloaded?.secretWord).toBe(savedRoom.secretWord);
  });

  it("submitGuess records a guess and awards points for a correct guess", () => {
    const hostSession = createRoom("Alice");
    const roomCode = hostSession.room.code;
    const joinResult = joinRoom(roomCode, "Bob");
    expect(joinResult).not.toBeNull();

    const currentRoom = getRoom(roomCode);
    expect(currentRoom).not.toBeNull();

    const startedRoom = startRoom(currentRoom!, hostSession.participantId);
    expect(startedRoom.secretWord).toBeDefined();

    const guessResult = submitGuess(
      startedRoom,
      joinResult!.participantId,
      startedRoom.secretWord!,
    );

    expect(guessResult.guesses).toHaveLength(1);
    expect(guessResult.guesses[0].correct).toBe(true);
    expect(guessResult.scores[joinResult!.participantId]).toBe(100);
    expect(guessResult.status).toBe("results");
  });

  it("restartRoom resets round state while preserving participants and scores", () => {
    const hostSession = createRoom("Alice");
    const roomCode = hostSession.room.code;
    const joinResult = joinRoom(roomCode, "Bob");
    expect(joinResult).not.toBeNull();

    const currentRoom = getRoom(roomCode);
    expect(currentRoom).not.toBeNull();

    const startedRoom = startRoom(currentRoom!, hostSession.participantId);
    expect(startedRoom.status).toBe("active");
    expect(startedRoom.secretWord).toBeDefined();

    const guessedRoom = submitGuess(
      startedRoom,
      joinResult!.participantId,
      startedRoom.secretWord!,
    );
    expect(guessedRoom.status).toBe("results");
    expect(guessedRoom.guesses).toHaveLength(1);

    const restartedRoom = restartRoom(guessedRoom, hostSession.participantId);

    expect(restartedRoom.status).toBe("lobby");
    expect(restartedRoom.drawerId).toBeUndefined();
    expect(restartedRoom.secretWord).toBeUndefined();
    expect(restartedRoom.guesses).toHaveLength(0);
    expect(restartedRoom.drawingPaths).toHaveLength(0);
    expect(restartedRoom.participants).toHaveLength(2);
    expect(restartedRoom.scores[joinResult!.participantId]).toBe(0);
  });

  it("clearDrawing removes stored drawing paths for the active drawer", () => {
    const hostSession = createRoom("Alice");
    const roomCode = hostSession.room.code;
    const joinResult = joinRoom(roomCode, "Bob");
    expect(joinResult).not.toBeNull();

    const currentRoom = getRoom(roomCode);
    expect(currentRoom).not.toBeNull();

    const startedRoom = startRoom(currentRoom!, hostSession.participantId);
    const path = {
      points: [
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ],
      color: "#000000",
      width: 2,
    };

    const drawnRoom = appendDrawing(
      startedRoom,
      hostSession.participantId,
      path,
    );
    expect(drawnRoom.drawingPaths).toHaveLength(1);

    const clearedRoom = clearDrawing(drawnRoom, hostSession.participantId);
    expect(clearedRoom.drawingPaths).toHaveLength(0);
  });

  it("appendDrawing correctly adds a path with properties", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    const currentRoom = getRoom(room.code)!;
    const startedRoom = startRoom(currentRoom, hostId);

    const path = {
      points: [{ x: 1, y: 1 }, { x: 2, y: 2 }],
      color: "#FF0000",
      width: 5,
    };

    const updatedRoom = appendDrawing(startedRoom, hostId, path);
    expect(updatedRoom.drawingPaths).toHaveLength(1);
    expect(updatedRoom.drawingPaths[0]).toEqual(path);
  });

  it("submitGuess records an incorrect guess and does not award points", () => {
    const hostSession = createRoom("Alice");
    const { participantId: bobId } = joinRoom(hostSession.room.code, "Bob")!;
    const startedRoom = startRoom(getRoom(hostSession.room.code)!, hostSession.participantId);

    const result = submitGuess(startedRoom, bobId, "wrongguess");
    expect(result.guesses).toHaveLength(1);
    expect(result.guesses[0].correct).toBe(false);
    expect(result.scores[bobId]).toBe(0);
    expect(result.status).toBe("active");
  });

  it("handles case-insensitive room codes during lookup", () => {
    const { room } = createRoom("Alice");
    const lowerCode = room.code.toLowerCase();

    expect(getRoom(lowerCode)).not.toBeNull();
    expect(joinRoom(lowerCode, "Bob")).not.toBeNull();
  });

  it("reassigns host when the current host leaves", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const { participantId: bobId } = joinRoom(room.code, "Bob")!;

    const updatedRoom = leaveRoom(room.code, hostId);
    expect(updatedRoom?.participants).toHaveLength(1);
    expect(updatedRoom?.participants[0].id).toBe(bobId);
    expect(updatedRoom?.participants[0].isHost).toBe(true);
  });

  it("deletes the room when the last player leaves", () => {
    const { room, participantId } = createRoom("Alice");

    const result = leaveRoom(room.code, participantId);
    expect(result).toBeNull();
    expect(getRoom(room.code)).toBeNull();
  });

  it("rejects starting a room with fewer than two players", () => {
    const { room, participantId } = createRoom("Alice");

    expect(() => startRoom(room, participantId)).toThrow(
      "At least two players are required to start the game",
    );
  });

  it("rejects starting a room by a non-host participant", () => {
    const { room } = createRoom("Alice");
    const { participantId: bobId } = joinRoom(room.code, "Bob")!;
    const currentRoom = getRoom(room.code)!;

    expect(() => startRoom(currentRoom, bobId)).toThrow(
      "Only the host may start the game",
    );
  });
});
