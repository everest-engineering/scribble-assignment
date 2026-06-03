import { describe, expect, it } from "vitest";
import { STARTER_WORDS } from "../seed/starterData.js";
import {
  createRoom,
  getRoom,
  joinRoom,
  startRoom,
  toRoomSnapshot,
  updateCanvas,
} from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom snapshot hostId equals the returned participantId", () => {
    const result = createRoom("Alice");
    const snapshot = toRoomSnapshot(result.room);

    expect(snapshot.hostId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom throws 409 HttpError when room status is playing", () => {
    const { room } = createRoom("Alice");
    startRoom(room.code);

    expect(() => joinRoom(room.code, "Bob")).toThrowError(
      "Game already in progress",
    );
  });

  it("startRoom changes status to playing and returns snapshot", () => {
    const { room } = createRoom("Alice");
    const snapshot = startRoom(room.code);

    expect(snapshot.status).toBe("playing");
    expect(snapshot.code).toBe(room.code);
  });

  it("startRoom throws 404 HttpError for an unknown room code", () => {
    expect(() => startRoom("ZZZZ")).toThrowError("Room not found");
  });

  it("startRoom sets currentDrawerId equal to the room hostId", () => {
    const { room, participantId } = createRoom("Alice");
    startRoom(room.code);
    const stored = getRoom(room.code);
    expect(stored?.currentDrawerId).toBe(participantId);
  });

  it("startRoom sets roundNumber to 1", () => {
    const { room } = createRoom("Alice");
    startRoom(room.code);
    const stored = getRoom(room.code);
    expect(stored?.roundNumber).toBe(1);
  });

  it("startRoom snapshot includes currentDrawerId", () => {
    const { room, participantId } = createRoom("Alice");
    const snapshot = startRoom(room.code);
    expect(snapshot.currentDrawerId).toBe(participantId);
  });

  it("toRoomSnapshot includes currentWord for the drawer", () => {
    const { room, participantId } = createRoom("Alice");
    startRoom(room.code);
    const stored = getRoom(room.code)!;
    const snapshot = toRoomSnapshot(stored, participantId);
    expect(snapshot.currentWord).toBe("rocket");
  });

  it("toRoomSnapshot returns currentWord null for a guesser", () => {
    const { room } = createRoom("Alice");
    const join = joinRoom(room.code, "Bob");
    startRoom(room.code);
    const stored = getRoom(room.code)!;
    const snapshot = toRoomSnapshot(stored, join!.participantId);
    expect(snapshot.currentWord).toBeNull();
  });

  it("toRoomSnapshot returns currentWord null when no participantId provided", () => {
    const { room } = createRoom("Alice");
    startRoom(room.code);
    const stored = getRoom(room.code)!;
    const snapshot = toRoomSnapshot(stored);
    expect(snapshot.currentWord).toBeNull();
  });

  it("startRoom assigns a currentWord that is a member of STARTER_WORDS", () => {
    const { room, participantId } = createRoom("Alice");
    startRoom(room.code);
    const stored = getRoom(room.code)!;
    const snapshot = toRoomSnapshot(stored, participantId);
    expect(
      (STARTER_WORDS as readonly string[]).includes(snapshot.currentWord!),
    ).toBe(true);
  });

  it("startRoom always produces the same currentWord for the same roundNumber", () => {
    const first = createRoom("Alice");
    startRoom(first.room.code);
    const firstStored = getRoom(first.room.code)!;
    const firstSnapshot = toRoomSnapshot(firstStored, first.participantId);

    const second = createRoom("Bob");
    startRoom(second.room.code);
    const secondStored = getRoom(second.room.code)!;
    const secondSnapshot = toRoomSnapshot(secondStored, second.participantId);

    expect(firstSnapshot.currentWord).toBe(secondSnapshot.currentWord);
  });
});

describe("multi-room isolation", () => {
  it("getRoom for two codes returns distinct rooms with their own participants", () => {
    const a = createRoom("Alice");
    const b = createRoom("Bob");

    const roomA = getRoom(a.room.code)!;
    const roomB = getRoom(b.room.code)!;

    expect(roomA.code).toBe(a.room.code);
    expect(roomB.code).toBe(b.room.code);
    expect(roomA.code).not.toBe(roomB.code);
    expect(roomA.hostId).not.toBe(roomB.hostId);
  });

  it("joining room A does not add a participant to room B", () => {
    const a = createRoom("Alice");
    const b = createRoom("Bob");

    joinRoom(a.room.code, "Charlie");

    const roomB = getRoom(b.room.code)!;
    expect(roomB.participants).toHaveLength(1);
    expect(roomB.participants[0].name).toBe("Bob");
  });

  it("starting room A does not change the status of room B", () => {
    const a = createRoom("Alice");
    const b = createRoom("Bob");

    startRoom(a.room.code);

    const roomB = getRoom(b.room.code)!;
    expect(roomB.status).toBe("lobby");
  });

  it("canvas updates in room A do not affect strokes in room B", () => {
    const a = createRoom("Alice");
    const b = createRoom("Bob");

    startRoom(a.room.code);
    startRoom(b.room.code);

    updateCanvas(a.room.code, a.participantId, [
      [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ],
    ]);

    const roomB = getRoom(b.room.code)!;
    expect(roomB.strokes).toHaveLength(0);
  });
});
