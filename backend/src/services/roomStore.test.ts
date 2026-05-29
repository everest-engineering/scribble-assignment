import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, startRoom, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.hostParticipantId).toBe(result.participantId);
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom updates only the targeted room and returns a new room session", () => {
    const firstRoom = createRoom("Alice");
    const secondRoom = createRoom("Cara");

    const joined = joinRoom(firstRoom.room.code, "Bob");

    expect(joined).not.toBeNull();
    expect(joined?.room.code).toBe(firstRoom.room.code);
    expect(joined?.room.participants).toHaveLength(2);

    const untouchedRoom = getRoom(secondRoom.room.code);
    expect(untouchedRoom?.participants).toHaveLength(1);
    expect(untouchedRoom?.participants[0].name).toBe("Cara");
  });

  it("toRoomSnapshot exposes host-aware start metadata", () => {
    const result = createRoom("Alice");

    const snapshot = toRoomSnapshot(result.room, result.participantId);

    expect(snapshot.hostParticipantId).toBe(result.participantId);
    expect(snapshot.viewerIsHost).toBe(true);
    expect(snapshot.canStartGame).toBe(false);
    expect(snapshot.minimumPlayersToStart).toBe(2);
  });

  it("toRoomSnapshot enables start for the host once a second player joins but not for the guest", () => {
    const host = createRoom("Alice");
    const joined = joinRoom(host.room.code, "Bob");

    expect(joined).not.toBeNull();

    const updatedRoom = getRoom(host.room.code);
    expect(updatedRoom).not.toBeNull();

    const hostSnapshot = toRoomSnapshot(updatedRoom!, host.participantId);
    const guestSnapshot = toRoomSnapshot(updatedRoom!, joined!.participantId);

    expect(hostSnapshot.canStartGame).toBe(true);
    expect(hostSnapshot.viewerIsHost).toBe(true);
    expect(guestSnapshot.canStartGame).toBe(false);
    expect(guestSnapshot.viewerIsHost).toBe(false);
  });

  it("startRoom rejects the host when fewer than two players are present", () => {
    const result = createRoom("Alice");

    const started = startRoom(result.room.code, result.participantId);

    expect(started).toEqual({
      ok: false,
      reason: "conflict",
      message: "At least 2 players are required to start the game"
    });
  });

  it("startRoom rejects non-host participants", () => {
    const result = createRoom("Alice");
    const joined = joinRoom(result.room.code, "Bob");

    expect(joined).not.toBeNull();

    const started = startRoom(result.room.code, joined!.participantId);

    expect(started).toEqual({
      ok: false,
      reason: "forbidden",
      message: "Only the host can start the game"
    });
  });

  it("startRoom allows the host to start once two players are present", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");

    const started = startRoom(result.room.code, result.participantId);

    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }

    expect(started.room.status).toBe("playing");

    const snapshot = toRoomSnapshot(started.room, result.participantId);
    expect(snapshot.viewerIsHost).toBe(true);
    expect(snapshot.canStartGame).toBe(false);
  });

  it("starting one room does not affect other active rooms", () => {
    const firstRoom = createRoom("Alice");
    const secondRoom = createRoom("Cara");
    joinRoom(firstRoom.room.code, "Bob");

    const started = startRoom(firstRoom.room.code, firstRoom.participantId);

    expect(started.ok).toBe(true);

    const untouchedRoom = getRoom(secondRoom.room.code);
    expect(untouchedRoom?.status).toBe("lobby");
    expect(untouchedRoom?.participants).toHaveLength(1);
  });
});
