import { beforeEach, describe, expect, it } from "vitest";
import {
  clearRooms,
  createRoom,
  getRoom,
  joinRoom,
  removeParticipant,
  startGame,
  toRoomSnapshot,
  GameError,
  addStroke,
  clearCanvas,
  submitGuess,
  saveRoom
} from "./roomStore.js";

describe("roomStore", () => {
  beforeEach(() => {
    clearRooms();
  });

  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
    expect(result.room.drawerId).toBeNull();
    expect(result.room.currentWord).toBeNull();
  });

  it("createRoom sets the creator as host", () => {
    const result = createRoom("Alice");

    expect(result.room.hostParticipantId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom rejects playing rooms", () => {
    const { room, participantId } = createRoom("Alice");
    createRoom("Charlie"); // ensure another room exists for join
    const secondPlayer = joinRoom(room.code, "Bob")!;
    startGame(room.code, participantId);

    const result = joinRoom(room.code, "Carol");
    expect(result).toBeNull();
  });

  it("toRoomSnapshot includes hostId", () => {
    const { room, participantId } = createRoom("Alice");
    const snapshot = toRoomSnapshot(room);

    expect(snapshot.hostId).toBe(participantId);
    expect(snapshot.scores).toEqual({});
    expect(snapshot.guessHistory).toEqual([]);
    expect(snapshot.canvasStrokes).toEqual([]);
  });

  it("removeParticipant transfers host to next-joined participant (FIFO)", () => {
    const { room: aliceRoom, participantId: aliceId } = createRoom("Alice");
    const bobResult = joinRoom(aliceRoom.code, "Bob")!;
    joinRoom(aliceRoom.code, "Carol");

    removeParticipant(aliceRoom.code, aliceId);
    const updatedRoom = getRoom(aliceRoom.code)!;

    expect(updatedRoom.hostParticipantId).toBe(bobResult.participantId);
  });

  it("removeParticipant resets room to lobby when host leaves during playing", () => {
    const { room: aliceRoom, participantId: aliceId } = createRoom("Alice");
    joinRoom(aliceRoom.code, "Bob");
    startGame(aliceRoom.code, aliceId);

    removeParticipant(aliceRoom.code, aliceId);
    const updatedRoom = getRoom(aliceRoom.code)!;

    expect(updatedRoom.status).toBe("lobby");
    expect(updatedRoom.drawerId).toBeNull();
    expect(updatedRoom.currentWord).toBeNull();
    expect(updatedRoom.scores.size).toBe(0);
    expect(updatedRoom.guessHistory).toHaveLength(0);
    expect(updatedRoom.canvasStrokes).toHaveLength(0);
  });

  it("removeParticipant deletes room when last participant leaves", () => {
    const { room } = createRoom("Alice");

    removeParticipant(room.code, room.participants[0].id);
    const deletedRoom = getRoom(room.code);

    expect(deletedRoom).toBeNull();
  });

  it("startGame changes room status to playing, sets drawerId and currentWord", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updatedRoom = startGame(room.code, participantId);

    expect(updatedRoom.status).toBe("playing");
    expect(updatedRoom.drawerId).toBe(participantId);
    expect(updatedRoom.currentWord).toBe("rocket");
    expect(updatedRoom.scores.get(participantId)).toBe(0);
    expect(updatedRoom.guessHistory).toHaveLength(0);
    expect(updatedRoom.canvasStrokes).toHaveLength(0);
  });

  it("startGame throws FORBIDDEN for non-host", () => {
    const { room } = createRoom("Alice");
    const bobResult = joinRoom(room.code, "Bob")!;

    expect(() => startGame(room.code, bobResult.participantId)).toThrow(GameError);
    expect(() => startGame(room.code, bobResult.participantId)).toThrow("Only the host can start the game");
  });

  it("startGame throws CONFLICT when fewer than 2 players", () => {
    const { room, participantId } = createRoom("Alice");

    expect(() => startGame(room.code, participantId)).toThrow(GameError);
    expect(() => startGame(room.code, participantId)).toThrow("At least 2 players are required");
  });

  it("startGame throws CONFLICT when room is already playing", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, participantId);

    expect(() => startGame(room.code, participantId)).toThrow(GameError);
    expect(() => startGame(room.code, participantId)).toThrow("Game already started");
  });

  it("startGame throws NOT_FOUND for unknown room", () => {
    expect(() => startGame("ZZZZ", "some-id")).toThrow(GameError);
    expect(() => startGame("ZZZZ", "some-id")).toThrow("Unable to load room");
  });

  it("createRoom throws for empty or whitespace-only name", () => {
    expect(() => createRoom("")).toThrow("Player name is required");
    expect(() => createRoom("   ")).toThrow("Player name is required");
  });

  it("joinRoom throws for empty or whitespace-only name", () => {
    const { room } = createRoom("Alice");
    expect(() => joinRoom(room.code, "")).toThrow("Player name is required");
    expect(() => joinRoom(room.code, "   ")).toThrow("Player name is required");
  });

  it("toRoomSnapshot includes drawerId and currentWord", () => {
    const { room, participantId } = createRoom("Alice");
    const snapshot = toRoomSnapshot(room);

    expect(snapshot.drawerId).toBeNull();
    expect(snapshot.currentWord).toBeNull();
    expect(snapshot.hostId).toBe(participantId);
  });

  it("toRoomSnapshot reveals currentWord only to drawer", () => {
    const { room, participantId: aliceId } = createRoom("Alice");
    const bobResult = joinRoom(room.code, "Bob")!;
    startGame(room.code, aliceId);
    const updatedRoom = getRoom(room.code)!;

    const drawerSnapshot = toRoomSnapshot(updatedRoom, aliceId);
    expect(drawerSnapshot.currentWord).toBe("rocket");

    const guesserSnapshot = toRoomSnapshot(updatedRoom, bobResult.participantId);
    expect(guesserSnapshot.currentWord).toBeNull();
  });

  it("removeParticipant resets room to lobby when drawer (non-host) leaves during playing", () => {
    const { room: aliceRoom, participantId: aliceId } = createRoom("Alice");
    const bobResult = joinRoom(aliceRoom.code, "Bob")!;
    startGame(aliceRoom.code, aliceId);

    const roomAfterStart = getRoom(aliceRoom.code)!;
    roomAfterStart.drawerId = bobResult.participantId;
    saveRoom(roomAfterStart);

    removeParticipant(aliceRoom.code, bobResult.participantId);
    const updatedRoom = getRoom(aliceRoom.code)!;

    expect(updatedRoom.status).toBe("lobby");
    expect(updatedRoom.drawerId).toBeNull();
    expect(updatedRoom.currentWord).toBeNull();
    expect(updatedRoom.scores.size).toBe(0);
    expect(updatedRoom.guessHistory).toHaveLength(0);
    expect(updatedRoom.canvasStrokes).toHaveLength(0);
  });

  it("addStroke appends stroke and returns updated room", () => {
    const { room, participantId: aliceId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, aliceId);

    const stroke = { points: [{ x: 10, y: 10 }, { x: 20, y: 20 }], color: "#000000", width: 4 };
    const updatedRoom = addStroke(room.code, aliceId, stroke);

    expect(updatedRoom.canvasStrokes).toHaveLength(1);
    expect(updatedRoom.canvasStrokes[0].points).toEqual(stroke.points);
  });

  it("addStroke throws FORBIDDEN for non-drawer", () => {
    const { room, participantId: aliceId } = createRoom("Alice");
    const bobResult = joinRoom(room.code, "Bob")!;
    startGame(room.code, aliceId);

    expect(() => addStroke(room.code, bobResult.participantId, { points: [{ x: 1, y: 1 }], color: "#000", width: 2 })).toThrow(GameError);
  });

  it("addStroke throws CONFLICT when room is not playing", () => {
    const { room, participantId: aliceId } = createRoom("Alice");
    expect(() => addStroke(room.code, aliceId, { points: [{ x: 1, y: 1 }], color: "#000", width: 2 })).toThrow(GameError);
  });

  it("clearCanvas removes all strokes", () => {
    const { room, participantId: aliceId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, aliceId);
    addStroke(room.code, aliceId, { points: [{ x: 10, y: 10 }], color: "#000000", width: 4 });

    const updatedRoom = clearCanvas(room.code, aliceId);
    expect(updatedRoom.canvasStrokes).toHaveLength(0);
  });

  it("clearCanvas throws FORBIDDEN for non-drawer", () => {
    const { room, participantId: aliceId } = createRoom("Alice");
    const bobResult = joinRoom(room.code, "Bob")!;
    startGame(room.code, aliceId);

    expect(() => clearCanvas(room.code, bobResult.participantId)).toThrow(GameError);
  });

  it("addStroke discards oldest strokes when exceeding 500 strokes", () => {
    const { room, participantId: aliceId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, aliceId);

    for (let i = 0; i < 505; i++) {
      addStroke(room.code, aliceId, { points: [{ x: i, y: i }, { x: i + 1, y: i + 1 }], color: "#000000", width: 4 });
    }

    const updatedRoom = getRoom(room.code)!;
    expect(updatedRoom.canvasStrokes).toHaveLength(500);
    expect(updatedRoom.canvasStrokes[0].points[0].x).toBe(5);
  });

  it("submitGuess trims guess and awards 100 for first correct guess", () => {
    const { room, participantId: aliceId } = createRoom("Alice");
    const bobResult = joinRoom(room.code, "Bob")!;
    startGame(room.code, aliceId);

    const result = submitGuess(room.code, bobResult.participantId, "  Rocket  ");

    expect(result.guess.guess).toBe("Rocket");
    expect(result.guess.isCorrect).toBe(true);
    expect(result.scoreAwarded).toBe(100);
    expect(result.room.scores.get(bobResult.participantId)).toBe(100);
    expect(result.room.guessHistory).toHaveLength(1);
  });

  it("submitGuess auto-transitions room to results on first correct guess", () => {
    const { room, participantId: aliceId } = createRoom("Alice");
    const bobResult = joinRoom(room.code, "Bob")!;
    startGame(room.code, aliceId);
    const result = submitGuess(room.code, bobResult.participantId, "rocket");

    expect(result.guess.isCorrect).toBe(true);
    expect(result.scoreAwarded).toBe(100);
    expect(result.room.status).toBe("results");
    expect(() => submitGuess(room.code, bobResult.participantId, "rocket")).toThrow(GameError);
  });

  it("submitGuess awards 0 for incorrect guess and records it", () => {
    const { room, participantId: aliceId } = createRoom("Alice");
    const bobResult = joinRoom(room.code, "Bob")!;
    startGame(room.code, aliceId);

    const result = submitGuess(room.code, bobResult.participantId, "castle");

    expect(result.guess.isCorrect).toBe(false);
    expect(result.scoreAwarded).toBe(0);
    expect(result.room.scores.get(bobResult.participantId)).toBe(0);
  });

  it("submitGuess throws CONFLICT for empty guess", () => {
    const { room, participantId: aliceId } = createRoom("Alice");
    const bobResult = joinRoom(room.code, "Bob")!;
    startGame(room.code, aliceId);

    expect(() => submitGuess(room.code, bobResult.participantId, "   ")).toThrow(GameError);
    expect(() => submitGuess(room.code, bobResult.participantId, "")).toThrow(GameError);
  });

  it("submitGuess throws FORBIDDEN for drawer", () => {
    const { room, participantId: aliceId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, aliceId);

    expect(() => submitGuess(room.code, aliceId, "rocket")).toThrow(GameError);
  });

  it("submitGuess throws CONFLICT when room is not playing", () => {
    const { room, participantId: aliceId } = createRoom("Alice");
    const bobResult = joinRoom(room.code, "Bob")!;

    expect(() => submitGuess(room.code, bobResult.participantId, "rocket")).toThrow(GameError);
  });
});
