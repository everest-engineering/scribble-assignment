import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, restartRoom, saveRoom, startGame, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.hostId).toBe(result.room.participants[0].id);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("startGame transitions a lobby room to playing and assigns drawer/secret word", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const joinResult = joinRoom(room.code, "Bob");

    expect(joinResult).not.toBeNull();
    const guesserId = joinResult?.participantId;

    const startedRoom = startGame(room.code);

    expect(startedRoom).not.toBeNull();
    expect(startedRoom?.status).toBe("playing");
    expect(startedRoom?.drawerId).toBe(room.hostId);
    expect(startedRoom?.secretWord).toBeDefined();

    const drawerSnapshot = toRoomSnapshot(startedRoom!, startedRoom!.drawerId);
    expect(drawerSnapshot.secretWord).toBe(startedRoom?.secretWord);

    const guesserSnapshot = toRoomSnapshot(startedRoom!, guesserId);
    expect(guesserSnapshot.secretWord).toBeUndefined();
  });

  it("toRoomSnapshot exposes secretWord to all viewers when room status is finished", () => {
    const { room, participantId } = createRoom("Alice");
    const joinResult = joinRoom(room.code, "Bob");

    expect(joinResult).not.toBeNull();

    const startedRoom = startGame(room.code);
    expect(startedRoom).not.toBeNull();

    startedRoom!.status = "finished";
    startedRoom!.guessHistory = [];
    startedRoom!.scores = {};
    startedRoom!.endedAt = new Date().toISOString();

    const snapshot = toRoomSnapshot(startedRoom!, participantId);
    expect(snapshot.secretWord).toBe(startedRoom?.secretWord);
    expect(snapshot.endedAt).toBeDefined();
  });

  it("restartRoom rejects restart from non-host participant", () => {
    const { room } = createRoom("Alice");
    const joinResult = joinRoom(room.code, "Bob");

    expect(joinResult).not.toBeNull();

    expect(startGame(room.code)).not.toBeNull();

    const roomFromStore = getRoom(room.code);
    expect(roomFromStore).not.toBeNull();
    roomFromStore!.status = "finished";
    roomFromStore!.endedAt = new Date().toISOString();
    const saved = saveRoom(roomFromStore!);
    expect(saved?.status).toBe("finished");

    const result = restartRoom(room.code, joinResult!.participantId);
    expect(result.success).toBe(false);
    expect(result.status).toBe(403);
  });

  it("restartRoom clears round state and preserves participants on successful restart", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const joinResult = joinRoom(room.code, "Bob");

    expect(joinResult).not.toBeNull();

    expect(startGame(room.code)).not.toBeNull();

    const roomFromStore = getRoom(room.code);
    expect(roomFromStore).not.toBeNull();
    roomFromStore!.status = "finished";
    roomFromStore!.endedAt = new Date().toISOString();
    saveRoom(roomFromStore!);

    const result = restartRoom(room.code, hostId);
    expect(result.success).toBe(true);
    expect(result.room!.status).toBe("lobby");
    expect(result.room!.drawerId).toBeUndefined();
    expect(result.room!.secretWord).toBeUndefined();
    expect(result.room!.guessHistory).toHaveLength(0);
    expect(result.room!.scores).toEqual({});
    expect(result.room!.participants).toHaveLength(2);
  });
});
