import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  resetRoomStore,
  startRoom,
  getStarterWordForRoomCode,
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
    expect(result.room.currentDrawerId).toBeNull();
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
      expect(started.room.currentDrawerId).toBe(created.participantId);
    }
  });

  it("assigns the host as drawer, derives the word deterministically, and hides it from guessers", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");

    expect(joined).not.toBeNull();
    const expectedWord = getStarterWordForRoomCode(created.room.code);
    const started = startRoom(created.room.code, created.participantId);

    expect("room" in started).toBe(true);
    if ("room" in started) {
      const drawerSnapshot = toRoomSnapshot(started.room, created.participantId);
      const guesserSnapshot = toRoomSnapshot(started.room, joined!.participantId);

      expect(started.room.participants).toEqual([
        expect.objectContaining({
          id: created.participantId,
          role: "drawer"
        }),
        expect.objectContaining({
          id: joined!.participantId,
          role: "guesser"
        })
      ]);
      expect(drawerSnapshot.currentWord).toBe(expectedWord);
      expect(drawerSnapshot.participants[0].role).toBe("drawer");
      expect(guesserSnapshot).not.toHaveProperty("currentWord");
    }
  });

  it("deletes the room when the host leaves during the game", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");

    expect(joined).not.toBeNull();
    const started = startRoom(created.room.code, created.participantId);

    expect("room" in started).toBe(true);
    if (!("room" in started)) {
      return;
    }

    const outcome = leaveRoom(created.room.code, created.participantId);

    expect("deleted" in outcome).toBe(true);
    if ("deleted" in outcome) {
      expect(outcome.deleted).toBe(true);
      expect(outcome.room).toBeNull();
    }

    expect(getRoom(created.room.code)).toBeNull();
  });
});
