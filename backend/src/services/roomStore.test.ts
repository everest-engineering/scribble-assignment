import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, toRoomSnapshot } from "./roomStore.js";

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

  it("startGame assigns the host as drawer and masks the secret word for guessers", () => {
    const hostSession = createRoom("Alice");
    const guestSession = joinRoom(hostSession.room.code, "Bob");

    expect(guestSession).not.toBeNull();

    const result = startGame(hostSession.room.code, hostSession.participantId);

    expect(result.ok).toBe(true);

    if (!result.ok || !guestSession) {
      return;
    }

    const drawerSnapshot = toRoomSnapshot(result.room, hostSession.participantId);
    const guesserSnapshot = toRoomSnapshot(result.room, guestSession.participantId);

    expect(drawerSnapshot.status).toBe("game");
    expect(drawerSnapshot.drawerId).toBe(hostSession.participantId);
    expect(drawerSnapshot.secretWord).toBeTruthy();
    expect(guesserSnapshot.secretWord).toBeNull();
  });
});
