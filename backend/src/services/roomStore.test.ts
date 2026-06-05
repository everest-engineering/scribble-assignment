import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startRoom, toRoomSnapshot } from "./roomStore.js";

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

  // T005 [US1]
  it("createRoom assigns the creator as host and starts in the lobby", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.status).toBe("lobby");
  });

  // T006 [US1]
  it("toRoomSnapshot exposes hostId and flags the creator as host", () => {
    const { room } = createRoom("Alice");
    const snapshot = toRoomSnapshot(room);

    expect(snapshot.hostId).toBe(room.hostId);
    const host = snapshot.participants.find((participant) => participant.id === room.hostId);
    expect(host?.isHost).toBe(true);
  });

  // T013 [US2]
  it("joinRoom appends a non-host participant to an existing room", () => {
    const { room } = createRoom("Alice");
    const joined = joinRoom(room.code, "Bob");

    expect(joined).not.toBeNull();
    expect(joined?.room.participants).toHaveLength(2);

    const snapshot = toRoomSnapshot(joined!.room);
    const newcomer = snapshot.participants.find((participant) => participant.id === joined!.participantId);
    expect(newcomer?.isHost).toBe(false);
  });

  // T019 [US4]
  it("startRoom rejects non-host, too-few-players, and unknown codes", () => {
    const { room, participantId } = createRoom("Alice");

    expect(startRoom("ZZZZ", participantId)).toEqual({ ok: false, reason: "not-found" });
    expect(startRoom(room.code, participantId)).toEqual({ ok: false, reason: "too-few-players" });

    const joined = joinRoom(room.code, "Bob");
    expect(startRoom(room.code, joined!.participantId)).toEqual({ ok: false, reason: "forbidden" });
  });

  // T020 [US4]
  it("startRoom marks the room started, is idempotent, and assigns no role or word", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const first = startRoom(room.code, participantId);
    expect(first.ok).toBe(true);
    expect(first.ok && first.room.status).toBe("started");

    const second = startRoom(room.code, participantId);
    expect(second.ok).toBe(true);
    expect(second.ok && second.room.status).toBe("started");

    const snapshot = toRoomSnapshot(first.ok ? first.room : room);
    snapshot.participants.forEach((participant) => {
      expect(participant).not.toHaveProperty("role");
      expect(participant).not.toHaveProperty("word");
    });
  });

  // T021 [US4]
  it("starting one room does not affect another room", () => {
    const roomA = createRoom("Alice");
    joinRoom(roomA.room.code, "Bob");
    const roomB = createRoom("Carol");
    joinRoom(roomB.room.code, "Dave");

    startRoom(roomA.room.code, roomA.participantId);

    const snapshotB = toRoomSnapshot(joinRoom(roomB.room.code, "Eve")!.room);
    expect(snapshotB.status).toBe("lobby");
  });
});
