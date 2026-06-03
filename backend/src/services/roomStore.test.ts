import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDrawing,
  createRoom,
  joinRoom,
  resetRoomsForTest,
  startGame,
  submitGuess,
  toRoomSnapshot,
  updateDrawing
} from "./roomStore.js";

describe("roomStore", () => {
  beforeEach(() => {
    resetRoomsForTest();
  });

  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
    expect(result.room.hostParticipantId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("rejects empty player names", () => {
    expect(() => createRoom("   ")).toThrow("Player name is required");
  });

  it("keeps rooms isolated", () => {
    const first = createRoom("Alice");
    const second = createRoom("Bob");

    joinRoom(first.room.code, "Carol");

    expect(toRoomSnapshot(first.room, first.participantId).participants).toHaveLength(1);
    expect(toRoomSnapshot(second.room, second.participantId).participants).toHaveLength(1);
  });

  it("starts only when host has at least two players", () => {
    const room = createRoom("Alice");

    expect(() => startGame(room.room.code, room.participantId)).toThrow("At least 2 players are required to start");

    const joined = joinRoom(room.room.code, "Bob");
    if (!joined) {
      throw new Error("Expected Bob to join");
    }

    expect(() => startGame(room.room.code, joined.participantId)).toThrow("Only the host can perform this action");

    const started = startGame(room.room.code, room.participantId);

    expect(started.room.status).toBe("active");
    expect(started.room.round?.drawerParticipantId).toBe(room.participantId);
  });

  it("hides the secret word from non-drawers after start", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    if (!guest) {
      throw new Error("Expected Bob to join");
    }
    const started = startGame(host.room.code, host.participantId);

    expect(toRoomSnapshot(started.room, host.participantId).secretWord).toBe("rocket");
    expect(toRoomSnapshot(started.room, guest.participantId).secretWord).toBeUndefined();
  });

  it("initializes an active round with deterministic drawer, word, drawing, guesses, and scores", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    if (!guest) {
      throw new Error("Expected Bob to join");
    }

    const started = startGame(host.room.code, host.participantId);
    const hostSnapshot = toRoomSnapshot(started.room, host.participantId);
    const guestSnapshot = toRoomSnapshot(started.room, guest.participantId);

    expect(hostSnapshot.status).toBe("active");
    expect(hostSnapshot.drawerParticipantId).toBe(host.participantId);
    expect(hostSnapshot.viewerRole).toBe("drawer");
    expect(guestSnapshot.viewerRole).toBe("guesser");
    expect(hostSnapshot.secretWord).toBe("rocket");
    expect(guestSnapshot.secretWord).toBeUndefined();
    expect(hostSnapshot.drawing.strokes).toEqual([]);
    expect(hostSnapshot.guesses).toEqual([]);
    expect(hostSnapshot.scores).toEqual({
      [host.participantId]: 0,
      [guest.participantId]: 0
    });
  });

  it("allows only the drawer to update and clear drawing state", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    if (!guest) {
      throw new Error("Expected Bob to join");
    }
    startGame(host.room.code, host.participantId);

    expect(() => updateDrawing(host.room.code, guest.participantId, [])).toThrow("Only the drawer can perform this action");

    const drawnRoom = updateDrawing(host.room.code, host.participantId, [
      { id: "stroke-1", points: [{ x: 10, y: 20 }, { x: 30, y: 40 }] }
    ]);

    expect(toRoomSnapshot(drawnRoom, guest.participantId).drawing.strokes).toHaveLength(1);
    expect(toRoomSnapshot(clearDrawing(host.room.code, host.participantId), guest.participantId).drawing.strokes).toEqual([]);
  });

  it("rejects empty guesses and drawer guesses", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    if (!guest) {
      throw new Error("Expected Bob to join");
    }
    startGame(host.room.code, host.participantId);

    expect(() => submitGuess(host.room.code, guest.participantId, "   ")).toThrow("Guess is required");
    expect(() => submitGuess(host.room.code, host.participantId, "rocket")).toThrow("Drawer cannot submit guesses");
  });

  it("records incorrect guesses with 0 points and keeps the round active", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    if (!guest) {
      throw new Error("Expected Bob to join");
    }
    startGame(host.room.code, host.participantId);

    const room = submitGuess(host.room.code, guest.participantId, " comet ");
    const snapshot = toRoomSnapshot(room, guest.participantId);

    expect(snapshot.status).toBe("active");
    expect(snapshot.guesses).toMatchObject([{ text: "comet", isCorrect: false, scoreDelta: 0 }]);
    expect(snapshot.scores[guest.participantId]).toBe(0);
  });

  it("scores case-insensitive correct guesses and moves the room to result", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    if (!guest) {
      throw new Error("Expected Bob to join");
    }
    startGame(host.room.code, host.participantId);

    const room = submitGuess(host.room.code, guest.participantId, "ROCKET");
    const snapshot = toRoomSnapshot(room, guest.participantId);

    expect(snapshot.status).toBe("result");
    expect(snapshot.secretWord).toBe("rocket");
    expect(snapshot.guesses).toMatchObject([{ text: "ROCKET", isCorrect: true, scoreDelta: 100 }]);
    expect(snapshot.scores[guest.participantId]).toBe(100);
  });
});
