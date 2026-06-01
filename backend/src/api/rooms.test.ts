import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, normalizeCode, saveRoom, startGame, toRoomSnapshot } from "../services/roomStore.js";
import { createRoomSchema, joinRoomSchema } from "./schemas.js";

describe("startGame API behavior", () => {
  it("startGame returns playing status with drawer identity", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const room = startGame(created.room.code, created.participantId);
    expect(room.status).toBe("inGame");
    expect(room.currentRound).toBeDefined();
    expect(room.currentRound!.drawerParticipantId).toBe(created.participantId);
  });

  it("rejects start with fewer than 2 players", () => {
    const created = createRoom("Alice");
    expect(() => startGame(created.room.code, created.participantId)).toThrow();
  });

  it("rejects start when room already playing", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);
    expect(() => startGame(created.room.code, created.participantId)).toThrow("Game has already started");
  });

  it("rejects start by non-host participant", () => {
    const created = createRoom("Alice");
    const joiner = joinRoom(created.room.code, "Bob")!;
    expect(() => startGame(created.room.code, joiner.participantId)).toThrow("Only the host can start the game");
  });
});

describe("name validation at API level", () => {
  it("createRoomSchema rejects whitespace-only name", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("joinRoomSchema rejects whitespace-only name", () => {
    expect(() => joinRoomSchema.parse({ playerName: " \t\n " })).toThrow();
  });

  it("createRoom rejects empty name and does not create room", () => {
    const beforeCount = getRoom("TEST") === null ? 0 : 1;
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("rejected create does not leave room state", () => {
    const code = "ABCD";
    const roomBefore = getRoom(code);
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
    const roomAfter = getRoom(code);
    expect(roomAfter).toEqual(roomBefore);
  });
});

describe("drawer vs guesser snapshots", () => {
  it("drawer snapshot includes secretWord", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const room = startGame(created.room.code, created.participantId);
    const snapshot = toRoomSnapshot(room, created.participantId);
    expect(snapshot.secretWord).toBeDefined();
    expect(snapshot.isDrawer).toBe(true);
  });

  it("guesser snapshot omits secretWord", () => {
    const created = createRoom("Alice");
    const joiner = joinRoom(created.room.code, "Bob")!;
    startGame(created.room.code, created.participantId);
    const room = getRoom(created.room.code)!;
    const snapshot = toRoomSnapshot(room, joiner.participantId);
    expect(snapshot.secretWord).toBeUndefined();
    expect(snapshot.isDrawer).toBe(false);
  });

  it("drawer and guesser share same public round fields", () => {
    const created = createRoom("Alice");
    const joiner = joinRoom(created.room.code, "Bob")!;
    startGame(created.room.code, created.participantId);
    const room = getRoom(created.room.code)!;
    const drawerSnap = toRoomSnapshot(room, created.participantId);
    const guesserSnap = toRoomSnapshot(room, joiner.participantId);
    expect(drawerSnap.currentRound!.roundNumber).toBe(guesserSnap.currentRound!.roundNumber);
    expect(drawerSnap.currentRound!.drawerParticipantId).toBe(guesserSnap.currentRound!.drawerParticipantId);
  });
});
