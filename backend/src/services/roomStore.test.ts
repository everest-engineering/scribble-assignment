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

  it("startRoom assigns the host as the drawer and selects a deterministic secret word", () => {
    const creator = createRoom("Host");
    const guest = joinRoom(creator.room.code, "Guest");

    expect(guest).not.toBeNull();
    const startedRoom = startRoom(creator.room.code, creator.participantId);

    expect(startedRoom).not.toBeNull();
    expect(startedRoom?.status).toBe("active");
    expect(startedRoom?.activeRound).toBeDefined();
    expect(startedRoom?.activeRound?.drawerId).toBe(creator.participantId);
    expect(startedRoom?.activeRound?.secretWord).toBeDefined();

    const snapshot = toRoomSnapshot(startedRoom as any, creator.participantId);
    expect(snapshot.drawerId).toBe(creator.participantId);
    expect(snapshot.viewerRole).toBe("drawer");
    expect(snapshot.secretWord).toBe(startedRoom?.activeRound?.secretWord);

    const guestSnapshot = toRoomSnapshot(startedRoom as any, guest?.participantId);
    expect(guestSnapshot.viewerRole).toBe("guesser");
    expect(guestSnapshot.secretWord).toBeUndefined();
  });
});
