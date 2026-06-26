import { describe, expect, it } from "vitest";
import { STARTER_WORDS } from "../seed/starterData.js";
import { createRoom, joinRoom, startGame, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom assigns the creator as host", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("toRoomSnapshot includes hostId", () => {
    const { room, participantId } = createRoom("Alice");
    const snapshot = toRoomSnapshot(room, participantId);

    expect(snapshot.hostId).toBe(participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("startGame returns null for an unknown room code", () => {
    const result = startGame("ZZZZ");

    expect(result).toBeNull();
  });

  it("startGame transitions room status to playing", () => {
    const { room } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updated = startGame(room.code);

    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("playing");
  });

  it("startGame assigns drawerId to host", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updated = startGame(room.code);

    expect(updated!.drawerId).toBe(participantId);
  });

  it("startGame sets currentRound to 1", () => {
    const { room } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updated = startGame(room.code);

    expect(updated!.currentRound).toBe(1);
  });

  it("startGame sets secretWord to STARTER_WORDS[0]", () => {
    const { room } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updated = startGame(room.code);

    expect(updated!.secretWord).toBe(STARTER_WORDS[0]);
  });

  it("toRoomSnapshot includes currentRound and drawerId when playing", () => {
    const { room } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updated = startGame(room.code);
    const snapshot = toRoomSnapshot(updated!);

    expect(snapshot.currentRound).toBe(1);
    expect(snapshot.drawerId).toBe(updated!.drawerId);
  });

  it("toRoomSnapshot includes secretWord when viewer is the drawer", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updated = startGame(room.code);
    const snapshot = toRoomSnapshot(updated!, participantId);

    expect(snapshot.secretWord).toBe(STARTER_WORDS[0]);
  });

  it("toRoomSnapshot omits secretWord for non-drawer viewers", () => {
    const { room, participantId } = createRoom("Alice");
    const second = joinRoom(room.code, "Bob");

    const updated = startGame(room.code);
    const snapshot = toRoomSnapshot(updated!, second!.participantId);

    expect(snapshot.secretWord).toBeUndefined();
  });

  it("toRoomSnapshot omits secretWord when no viewerParticipantId given", () => {
    const { room } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updated = startGame(room.code);
    const snapshot = toRoomSnapshot(updated!);

    expect(snapshot.secretWord).toBeUndefined();
  });

  it("toRoomSnapshot does not include game fields in lobby state", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const snapshot = toRoomSnapshot(room, participantId);

    expect(snapshot.currentRound).toBeUndefined();
    expect(snapshot.drawerId).toBeUndefined();
    expect(snapshot.secretWord).toBeUndefined();
  });
});
