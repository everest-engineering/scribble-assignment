import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, toRoomSnapshot, getDeterministicWord } from "./roomStore.js";

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

  it("trims player name on createRoom and joinRoom", () => {
    const createResult = createRoom("   Alice   ");
    expect(createResult.room.participants[0].name).toBe("Alice");

    const joinResult = joinRoom(createResult.room.code, "  Bob  ");
    expect(joinResult!.room.participants[1].name).toBe("Bob");
  });

  it("selects secret word deterministically from the room code", () => {
    const word1 = getDeterministicWord("ABCD");
    const word2 = getDeterministicWord("ABCD");
    expect(word1).toBe(word2);

    const word3 = getDeterministicWord("WXYZ");
    // Ensure it picks valid starter words
    expect(["rocket", "pizza", "castle", "guitar", "sunflower"]).toContain(word1);
    expect(["rocket", "pizza", "castle", "guitar", "sunflower"]).toContain(word3);
  });

  it("startGame sets status to active, assigns host as drawer, and sets a secret word", () => {
    const createResult = createRoom("Alice");
    const hostId = createResult.participantId;
    const code = createResult.room.code;

    // Join second player so we can start
    joinRoom(code, "Bob");

    const updatedRoom = startGame(code, hostId);
    expect(updatedRoom.status).toBe("active");
    expect(updatedRoom.drawerId).toBe(hostId);
    expect(updatedRoom.secretWord).toBeDefined();
  });

  it("toRoomSnapshot includes secretWord for the drawer but not for guessers", () => {
    const createResult = createRoom("Alice");
    const hostId = createResult.participantId;
    const code = createResult.room.code;

    const joinResult = joinRoom(code, "Bob");
    const guestId = joinResult!.participantId;

    const updatedRoom = startGame(code, hostId);

    const hostSnapshot = toRoomSnapshot(updatedRoom, hostId);
    const guestSnapshot = toRoomSnapshot(updatedRoom, guestId);

    expect(hostSnapshot.drawerId).toBe(hostId);
    expect(hostSnapshot.secretWord).toBe(updatedRoom.secretWord);

    expect(guestSnapshot.drawerId).toBe(hostId);
    expect(guestSnapshot.secretWord).toBeUndefined();
  });
});
