import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, startGame, toRoomSnapshot } from "./roomStore.js";
import { STARTER_WORDS } from "../seed/starterData.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom makes the creator the host", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.hostId).toBe(result.room.participants[0].id);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("keeps rooms fully isolated from one another", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Carol");

    expect(roomA.room.code).not.toBe(roomB.room.code);

    const joined = joinRoom(roomA.room.code, "Bob");

    expect(joined).not.toBeNull();
    expect(joined?.room.participants.map((p) => p.name)).toEqual(["Alice", "Bob"]);
    // Bob never appears in room B, and room B's host is unchanged.
    expect(roomB.room.participants).toHaveLength(1);
    expect(roomB.room.hostId).toBe(roomB.participantId);
  });

  it("selects words deterministically in creation order (no randomness)", () => {
    // Two rooms created back-to-back advance the word index by exactly one.
    const first = createRoom("Alice");
    const second = createRoom("Carol");

    const firstWord = STARTER_WORDS[first.room.wordIndex];
    const expectedSecond = STARTER_WORDS[(first.room.wordIndex + 1) % STARTER_WORDS.length];

    expect(firstWord).toBe(STARTER_WORDS[first.room.wordIndex]);
    expect(STARTER_WORDS[second.room.wordIndex]).toBe(expectedSecond);
  });

  it("reveals the word only to the drawer while playing", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    expect(guest).not.toBeNull();

    const started = startGame(host.room.code, host.participantId);
    expect("room" in started).toBe(true);

    const room = getRoom(host.room.code)!;
    const drawerView = toRoomSnapshot(room, host.participantId);
    const guesserView = toRoomSnapshot(room, guest!.participantId);

    expect(room.status).toBe("playing");
    expect(room.drawerId).toBe(host.participantId);
    expect(drawerView.word).toBe(STARTER_WORDS[room.wordIndex]);
    expect(guesserView.word).toBeUndefined();
  });

  it("startGame rejects a non-host requester", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob")!;

    const result = startGame(host.room.code, guest.participantId);

    expect(result).toEqual({ error: "not-host" });
  });

  it("startGame rejects a room with fewer than 2 players", () => {
    const host = createRoom("Alice");

    const result = startGame(host.room.code, host.participantId);

    expect(result).toEqual({ error: "not-enough-players" });
  });
});
