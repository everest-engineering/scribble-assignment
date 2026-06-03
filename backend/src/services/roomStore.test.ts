import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startRoom, toRoomSnapshot, getRoom, submitGuess, endRound, restartRoom, addStroke } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostId to the creator participantId", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.hostId).toBe(result.room.participants[0].id);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom preserves hostId from the original creator", () => {
    const host = createRoom("Alice");
    const joiner = joinRoom(host.room.code, "Bob");

    expect(joiner).not.toBeNull();
    expect(joiner!.room.hostId).toBe(host.participantId);
  });

  it("startRoom transitions status to active", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const snapshot = startRoom(host.room.code);

    expect(snapshot).not.toBeNull();
    expect(snapshot!.status).toBe("active");
  });

  it("startRoom returns null for an unknown room code", () => {
    const snapshot = startRoom("ZZZZ");

    expect(snapshot).toBeNull();
  });

  it("startRoom assigns drawerId to hostId", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const snapshot = startRoom(host.room.code);

    expect(snapshot).not.toBeNull();
    expect(snapshot!.drawerId).toBe(host.participantId);
    expect(snapshot!.drawerId).toBe(snapshot!.hostId);
  });

  it("startRoom selects a non-null currentWord for the drawer", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const drawerSnapshot = startRoom(host.room.code);

    expect(drawerSnapshot).not.toBeNull();
    expect(drawerSnapshot!.currentWord).not.toBeNull();
    expect(drawerSnapshot!.currentWord).toMatch(/^[a-z]+$/);
  });

  it("toRoomSnapshot hides currentWord from non-drawer viewers", () => {
    const host = createRoom("Alice");
    const joinResult = joinRoom(host.room.code, "Bob");
    startRoom(host.room.code);

    const guesserSnapshot = toRoomSnapshot(getRoom(host.room.code)!, joinResult!.participantId);
    expect(guesserSnapshot.currentWord).toBeNull();
  });

  it("toRoomSnapshot includes drawerId for guesser viewers", () => {
    const host = createRoom("Alice");
    const joinResult = joinRoom(host.room.code, "Bob");
    startRoom(host.room.code);

    const guesserSnapshot = toRoomSnapshot(getRoom(host.room.code)!, joinResult!.participantId);
    expect(guesserSnapshot.drawerId).toBe(host.participantId);
    expect(guesserSnapshot.drawerId).not.toBeNull();
  });

  it("toRoomSnapshot shows currentWord to the drawer", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startRoom(host.room.code);

    const room = getRoom(host.room.code)!;
    const drawerSnapshot = toRoomSnapshot(room, room.drawerId!);

    expect(drawerSnapshot.currentWord).not.toBeNull();
  });

  it("createRoom initializes drawerId and currentWord as null", () => {
    const result = createRoom("Alice");

    expect(result.room.drawerId).toBeNull();
    expect(result.room.currentWord).toBeNull();
  });

  it("submitGuess awards 100 points for a correct guess", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startRoom(host.room.code);

    const room = getRoom(host.room.code)!;
    const bobId = room.participants[1].id;
    const result = submitGuess(host.room.code, bobId, "Bob", "rocket");

    expect(result.correct).toBe(true);
    expect(result.snapshot).not.toBeNull();
    expect(result.snapshot!.playerScores.find((p) => p.playerId === bobId)?.score).toBe(100);
  });

  it("submitGuess awards 0 points for an incorrect guess", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startRoom(host.room.code);

    const room = getRoom(host.room.code)!;
    const bobId = room.participants[1].id;
    const result = submitGuess(host.room.code, bobId, "Bob", "car");

    expect(result.correct).toBe(false);
    expect(result.snapshot!.playerScores.find((p) => p.playerId === bobId)?.score).toBe(0);
  });

  it("submitGuess prevents double-scoring for the same player", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startRoom(host.room.code);

    const room = getRoom(host.room.code)!;
    const bobId = room.participants[1].id;
    submitGuess(host.room.code, bobId, "Bob", "rocket");
    const result2 = submitGuess(host.room.code, bobId, "Bob", "rocket");

    expect(result2.correct).toBe(true);
    expect(result2.snapshot!.playerScores.find((p) => p.playerId === bobId)?.score).toBe(100);
  });

  it("submitGuess matches guesses case-insensitively", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startRoom(host.room.code);

    const room = getRoom(host.room.code)!;
    const bobId = room.participants[1].id;
    const result = submitGuess(host.room.code, bobId, "Bob", "ROCKET");

    expect(result.correct).toBe(true);
  });

  it("endRound transitions status to results", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startRoom(host.room.code);
    const snapshot = endRound(host.room.code);

    expect(snapshot).not.toBeNull();
    expect(snapshot!.status).toBe("results");
  });

  it("endRound returns null for an unknown room code", () => {
    const snapshot = endRound("ZZZZ");
    expect(snapshot).toBeNull();
  });

  it("endRound returns null if room is not active", () => {
    const host = createRoom("Alice");
    const snapshot = endRound(host.room.code);

    expect(snapshot).toBeNull();
  });

  it("endRound reveals currentWord to all viewers", () => {
    const host = createRoom("Alice");
    const joinResult = joinRoom(host.room.code, "Bob");
    startRoom(host.room.code);
    endRound(host.room.code);

    const room = getRoom(host.room.code)!;
    const bobSnapshot = toRoomSnapshot(room, joinResult!.participantId);

    expect(bobSnapshot.currentWord).not.toBeNull();
  });

  it("restartRoom transitions status to lobby", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startRoom(host.room.code);
    endRound(host.room.code);
    const snapshot = restartRoom(host.room.code);

    expect(snapshot).not.toBeNull();
    expect(snapshot!.status).toBe("lobby");
  });

  it("restartRoom preserves all participants", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startRoom(host.room.code);
    restartRoom(host.room.code);

    const room = getRoom(host.room.code)!;
    expect(room.participants).toHaveLength(2);
    expect(room.participants.map((p) => p.name)).toContain("Alice");
    expect(room.participants.map((p) => p.name)).toContain("Bob");
  });

  it("restartRoom clears all round state", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startRoom(host.room.code);
    addStroke(host.room.code, { points: [{ x: 0, y: 0 }], color: "#000", lineWidth: 4 }, host.participantId);
    submitGuess(host.room.code, joinRoom("ZZZZ", "Temp")?.participantId ?? "dummy", "Bob", "wrong");
    endRound(host.room.code);
    restartRoom(host.room.code);

    const room = getRoom(host.room.code)!;
    expect(room.strokes).toHaveLength(0);
    expect(room.guesses).toHaveLength(0);
    expect(room.currentWord).toBeNull();
    expect(room.drawerId).toBeNull();
    expect(room.hasScored).toHaveLength(0);
  });

  it("restartRoom resets playerScores to 0", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startRoom(host.room.code);

    const room = getRoom(host.room.code)!;
    const bobId = room.participants[1].id;
    submitGuess(host.room.code, bobId, "Bob", "rocket");

    restartRoom(host.room.code);

    const restartedRoom = getRoom(host.room.code)!;
    expect(restartedRoom.playerScores.get(bobId)).toBe(0);
    expect(restartedRoom.playerScores.get(host.participantId)).toBe(0);
  });

  it("restartRoom returns null for an unknown room code", () => {
    const snapshot = restartRoom("ZZZZ");
    expect(snapshot).toBeNull();
  });
});
