import { describe, expect, it } from "vitest";
import {
  appendDrawing,
  clearDrawing,
  createRoom,
  getRoom,
  joinRoom,
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
    expect(restartedRoom.scores[joinResult!.participantId]).toBe(100);
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
});
