import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, toRoomSnapshot } from "./roomStore.js";

function expectHttpStatus(fn: () => unknown, statusCode: number) {
  try {
    fn();
  } catch (error) {
    expect((error as { statusCode?: number }).statusCode).toBe(statusCode);
    return;
  }

  throw new Error(`expected an error with status ${statusCode}, but none was thrown`);
}

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom records the creator as host and starts in lobby", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.status).toBe("lobby");

    const snapshot = toRoomSnapshot(result.room);
    expect(snapshot.hostId).toBe(result.participantId);
    expect(snapshot.status).toBe("lobby");
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom adds a participant to an existing room", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");

    expect(joined).not.toBeNull();
    expect(joined?.room.participants).toHaveLength(2);
    expect(joined?.room.participants[1].name).toBe("Bob");
    expect(joined?.participantId).toBeDefined();
  });

  it("startGame rejects a non-host with 403", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");

    expectHttpStatus(() => startGame(created.room.code, "intruder-id"), 403);
  });

  it("startGame rejects fewer than 2 players with 409", () => {
    const created = createRoom("Alice");

    expectHttpStatus(() => startGame(created.room.code, created.participantId), 409);
  });

  it("startGame activates the room for the host with 2+ players", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");

    const result = startGame(created.room.code, created.participantId);

    expect(result.room.status).toBe("active");
  });
});
