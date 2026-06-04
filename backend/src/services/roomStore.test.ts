import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  resetRoomStore,
  startRoom,
  toRoomSnapshot
} from "./roomStore.js";

describe("roomStore", () => {
  beforeEach(() => {
    resetRoomStore();
  });

  afterEach(() => {
    resetRoomStore();
  });

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

  it("keeps rooms isolated and snapshots immutable", () => {
    const first = createRoom("Alice");
    const second = createRoom("Bob");
    const joined = joinRoom(first.room.code, "Charlie");

    expect(joined).not.toBeNull();
    expect(getRoom(first.room.code)?.participants).toHaveLength(2);
    expect(getRoom(second.room.code)?.participants).toHaveLength(1);

    const snapshot = toRoomSnapshot(getRoom(first.room.code)!, first.participantId);
    snapshot.participants[0].name = "Mutated";

    expect(getRoom(first.room.code)?.participants[0].name).toBe("Alice");
  });

  it("prevents non-hosts from starting and requires at least 2 players", () => {
    const created = createRoom("Alice");
    expect(startRoom(created.room.code, created.participantId)).toEqual({
      error: "too_few_players"
    });

    const joined = joinRoom(created.room.code, "Bob");
    expect(joined).not.toBeNull();
    expect(startRoom(created.room.code, joined!.participantId)).toEqual({
      error: "forbidden"
    });

    const started = startRoom(created.room.code, created.participantId);
    expect("room" in started).toBe(true);
    if ("room" in started) {
      expect(started.room.status).toBe("game");
      expect(started.room.hostParticipantId).toBe(created.participantId);
    }
  });

  it("deletes the room when the host leaves before the game starts", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");

    expect(joined).not.toBeNull();

    const outcome = leaveRoom(created.room.code, created.participantId);

    expect("deleted" in outcome).toBe(true);
    if ("deleted" in outcome) {
      expect(outcome.deleted).toBe(true);
      expect(outcome.room).toBeNull();
    }

    expect(getRoom(created.room.code)).toBeNull();
  });
});
