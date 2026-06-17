import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, listWords, selectWord, startGame, toRoomSnapshot } from "./roomStore.js";

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

  it("createRoom rejects a blank or whitespace-only name with 400", () => {
    expectHttpStatus(() => createRoom("   "), 400);
    expectHttpStatus(() => createRoom(undefined), 400);
  });

  it("createRoom trims the player name", () => {
    const result = createRoom("  Alice  ");

    expect(result.room.participants[0].name).toBe("Alice");
  });

  it("joinRoom rejects a blank name with 400", () => {
    const created = createRoom("Alice");

    expectHttpStatus(() => joinRoom(created.room.code, "   "), 400);
  });

  it("startGame assigns the host as drawer and snapshot reports role per viewer", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    const result = startGame(created.room.code, created.participantId);

    expect(result.room.drawerId).toBe(result.room.hostId);

    const drawerView = toRoomSnapshot(result.room, created.participantId);
    const guesserView = toRoomSnapshot(result.room, joined?.participantId);

    expect(drawerView.drawerId).toBe(result.room.hostId);
    expect(drawerView.role).toBe("drawer");
    expect(guesserView.role).toBe("guesser");
    expect(guesserView.drawerId).toBe(result.room.hostId);
  });

  it("selectWord is deterministic and returns a starter word", () => {
    const words = listWords();

    expect(words).toContain(selectWord("ABCD"));
    expect(selectWord("ABCD")).toBe(selectWord("ABCD"));
  });

  it("startGame sets a secret word from the starter list", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");

    const result = startGame(created.room.code, created.participantId);

    expect(listWords()).toContain(result.room.secretWord);
    expect(result.room.secretWord).toBe(selectWord(result.room.code));
  });

  it("exposes the secret word only to the drawer", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    const result = startGame(created.room.code, created.participantId);

    const drawerView = toRoomSnapshot(result.room, created.participantId);
    const guesserView = toRoomSnapshot(result.room, joined?.participantId);

    expect(drawerView.word).toBe(result.room.secretWord);
    // The guesser snapshot carries no `word` field, so it never reveals which word is secret.
    // (The public `availableWords` list still contains all candidates by design.)
    expect(guesserView.word).toBeUndefined();
    expect(Object.values(guesserView).includes(result.room.secretWord as string)).toBe(false);
  });
});
