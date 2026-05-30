import { beforeEach, describe, expect, it } from "vitest";
import { clearRoomsForTest, createRoom, getRoom, joinRoom, startGame, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  beforeEach(() => {
    clearRoomsForTest();
  });

  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("assigns the room creator as host", () => {
    const result = createRoom("Alice");

    expect(result.room.hostParticipantId).toBe(result.participantId);
    expect(result.room.participants[0].id).toBe(result.participantId);
  });

  it("includes hostParticipantId in room snapshots", () => {
    const result = createRoom("Alice");
    const snapshot = toRoomSnapshot(result.room, result.participantId);

    expect(snapshot.hostParticipantId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("keeps participants isolated by room code", () => {
    const firstRoom = createRoom("Alice");
    const secondRoom = createRoom("Carol");

    joinRoom(firstRoom.room.code, "Bob");
    joinRoom(secondRoom.room.code, "Dana");

    const firstSnapshot = getRoom(firstRoom.room.code);
    const secondSnapshot = getRoom(secondRoom.room.code);

    expect(firstSnapshot?.participants.map((participant) => participant.name)).toEqual(["Alice", "Bob"]);
    expect(secondSnapshot?.participants.map((participant) => participant.name)).toEqual(["Carol", "Dana"]);
  });

  it("starts a room only for the host when at least two participants are present", () => {
    const created = createRoom("Host");
    const joined = joinRoom(created.room.code, "Guest");

    expect(joined).not.toBeNull();

    const result = startGame(created.room.code, created.participantId);

    expect(result.ok).toBe(true);
    expect(result.ok ? result.room.status : null).toBe("in-game");
  });

  it("rejects startGame for non-host participants", () => {
    const created = createRoom("Host");
    const joined = joinRoom(created.room.code, "Guest");

    expect(joined).not.toBeNull();

    const result = startGame(created.room.code, joined?.participantId ?? "");

    expect(result).toEqual({ ok: false, reason: "participant-not-host" });
  });

  it("rejects startGame until at least two participants are present", () => {
    const created = createRoom("Host");
    const result = startGame(created.room.code, created.participantId);

    expect(result).toEqual({ ok: false, reason: "not-enough-players" });
  });
});
