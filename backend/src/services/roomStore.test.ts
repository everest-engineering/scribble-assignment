import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, toRoomSnapshot, startGame, leaveRoom, updateDrawing, clearDrawing, submitGuess, endRound, restartGame } from "./roomStore.js";

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
  });

  it("toRoomSnapshot sets isHost to true for host, false for guest", () => {
    const created = createRoom("Alice");
    const aliceId = created.participantId;
    const room = created.room;

    const aliceSnapshot = toRoomSnapshot(room, aliceId).participants[0];
    expect(aliceSnapshot.isHost).toBe(true);

    const joined = joinRoom(room.code, "Bob");
    expect(joined.success).toBe(true);
    const bobId = joined!.participantId;
    const updatedRoom = getRoom(room.code)!;

    const bobSnapshot = toRoomSnapshot(updatedRoom, bobId).participants.find(p => p.id === bobId);
    expect(bobSnapshot!.isHost).toBe(false);
  });

  it("createRoom trims the player name", () => {
    const result = createRoom("  Charlie  ");
    expect(result.room.participants[0].name).toBe("Charlie");
  });

  it("createRoom falls back to Player if name is empty or undefined", () => {
    const result = createRoom();
    expect(result.room.participants[0].name).toBe("Player");
  });

  it("joinRoom returns error for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Room not found");
  });

  it("joinRoom adds a participant with a trimmed custom name to an existing room", () => {
    const created = createRoom("Alice");
    const result = joinRoom(created.room.code, "  Bob  ");

    expect(result.success).toBe(true);
    expect(result.room!.participants).toHaveLength(2);
    expect(result.room!.participants[1].name).toBe("Bob");
  });

  it("roomStore isolates different rooms", () => {
    const room1 = createRoom("Alice");
    const room2 = createRoom("Bob");

    expect(room1.room.code).not.toBe(room2.room.code);
    expect(room1.room.participants).toHaveLength(1);
    expect(room2.room.participants).toHaveLength(1);
    expect(room1.room.participants[0].name).toBe("Alice");
    expect(room2.room.participants[0].name).toBe("Bob");

    joinRoom(room1.room.code, "Charlie");
    const r1Updated = getRoom(room1.room.code);
    const r2Updated = getRoom(room2.room.code);

    expect(r1Updated!.participants).toHaveLength(2);
    expect(r2Updated!.participants).toHaveLength(1);
  });

  it("roomStore isolates rooms and handles lowercase/untrimmed codes in joinRoom and getRoom", () => {
    const created = createRoom("Alice");
    const code = created.room.code;

    const result = joinRoom(" " + code.toLowerCase() + " ", "Bob");
    expect(result.success).toBe(true);
    expect(result.room!.participants).toHaveLength(2);

    const room = getRoom(code.toLowerCase())!;
    expect(room.participants).toHaveLength(2);
    expect(room.participants[1].name).toBe("Bob");
  });

  it("startGame changes room status to game if caller is host and player count >= 2", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const hostId = created.participantId;

    // Try starting with 1 player (fails)
    const result1 = startGame(code, hostId);
    expect(result1.success).toBe(false);
    expect(result1.error).toBe("At least 2 players are required to start the game");

    // Add guest
    const joined = joinRoom(code, "Bob");
    expect(joined.success).toBe(true);
    const guestId = joined.participantId as string;

    // Try starting as guest (fails)
    const result2 = startGame(code, guestId);
    expect(result2.success).toBe(false);
    expect(result2.error).toBe("Only the host can start the game");

    // Start as host (succeeds)
    const result3 = startGame(code, hostId);
    expect(result3.success).toBe(true);

    const room = getRoom(code)!;
    expect(room.status).toBe("game");
  });

  it("leaveRoom removes guest, or deletes room if host leaves", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const hostId = created.participantId;

    const joined = joinRoom(code, "Bob");
    expect(joined.success).toBe(true);
    const guestId = joined.participantId as string;

    // Guest leaves (removed, room still exists)
    const leaveGuestResult = leaveRoom(code, guestId);
    expect(leaveGuestResult.success).toBe(true);
    expect(getRoom(code)!.participants).toHaveLength(1);

    // Host leaves (room deleted)
    const leaveHostResult = leaveRoom(code, hostId);
    expect(leaveHostResult.success).toBe(true);
    expect(getRoom(code)).toBeNull();
  });
  it("joinRoom returns error when room is already in game", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const hostId = created.participantId;

    // Add a guest
    const joined = joinRoom(code, "Bob");
    expect(joined.success).toBe(true);

    // Start the game
    const startResult = startGame(code, hostId);
    expect(startResult.success).toBe(true);

    // Try to join after game has started
    const joinAfterStart = joinRoom(code, "Charlie");
    expect(joinAfterStart.success).toBe(false);
    expect(joinAfterStart.error).toBe("Room is already in game");

    // Verify room still has only 2 participants
    const room = getRoom(code)!;
    expect(room.participants).toHaveLength(2);
  });

  it("startGame assigns roles and selects first word deterministically", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const hostId = created.participantId;
    const joined = joinRoom(code, "Bob");
    const guestId = joined.participantId as string;

    const startResult = startGame(code, hostId);
    expect(startResult.success).toBe(true);

    const room = getRoom(code)!;
    expect(room.round).toBeDefined();
    expect(room.round!.secretWord).toBe("rocket");

    const host = room.participants.find((p) => p.id === hostId);
    const guest = room.participants.find((p) => p.id === guestId);
    expect(host!.role).toBe("drawer");
    expect(guest!.role).toBe("guesser");
  });

  it("toRoomSnapshot filters secretWord based on requester role", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const hostId = created.participantId;
    const joined = joinRoom(code, "Bob");
    const guestId = joined.participantId as string;

    startGame(code, hostId);
    const room = getRoom(code)!;

    // Drawer viewer snapshot: should contain secretWord
    const drawerSnapshot = toRoomSnapshot(room, hostId);
    expect(drawerSnapshot.secretWord).toBe("rocket");

    // Guesser viewer snapshot: should not contain secretWord
    const guesserSnapshot = toRoomSnapshot(room, guestId);
    expect(guesserSnapshot.secretWord).toBeUndefined();

    // Anonymous viewer snapshot: should not contain secretWord
    const anonSnapshot = toRoomSnapshot(room);
    expect(anonSnapshot.secretWord).toBeUndefined();
  });

  it("initializes participant score to 0 on creation", () => {
    const created = createRoom("Alice");
    expect(created.room.participants[0].score).toBe(0);

    const joined = joinRoom(created.room.code, "Bob");
    expect(joined.room!.participants[1].score).toBe(0);
  });

  it("updates and clears drawing data on a game room", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const hostId = created.participantId;
    joinRoom(code, "Bob");

    // Before game starts, updateDrawing should fail or room shouldn't be in game
    const preUpdateResult = updateDrawing(code, "data:image/png;base64,123");
    expect(preUpdateResult.success).toBe(false);

    startGame(code, hostId);

    // After starting, drawing is initially empty
    let room = getRoom(code)!;
    expect(room.round!.drawingData).toBe("");

    // Update drawing
    const updateResult = updateDrawing(code, "data:image/png;base64,123");
    expect(updateResult.success).toBe(true);

    room = getRoom(code)!;
    expect(room.round!.drawingData).toBe("data:image/png;base64,123");

    // toRoomSnapshot should include drawingData
    const snapshot = toRoomSnapshot(room, hostId);
    expect(snapshot.drawingData).toBe("data:image/png;base64,123");

    // Clear drawing
    const clearResult = clearDrawing(code);
    expect(clearResult.success).toBe(true);

    room = getRoom(code)!;
    expect(room.round!.drawingData).toBe("");
  });

  it("submitGuess validates and processes guesses, awarding score once", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const hostId = created.participantId;
    const joined = joinRoom(code, "Bob");
    const guestId = joined.participantId as string;
    joinRoom(code, "Charlie");

    startGame(code, hostId);

    // Host (drawer) attempts to guess (rejected)
    const hostGuessResult = submitGuess(code, hostId, "rocket");
    expect(hostGuessResult.success).toBe(false);
    expect(hostGuessResult.error).toBe("Drawer cannot submit guesses");

    // Guest submits incorrect guess
    let result = submitGuess(code, guestId, "pizza");
    expect(result.success).toBe(true);
    expect(result.guess!.isCorrect).toBe(false);
    expect(result.guess!.scoreAwarded).toBe(0);
    expect(result.guess!.text).toBe("pizza");

    let room = getRoom(code)!;
    expect(room.round!.guesses).toHaveLength(1);
    expect(room.participants.find((p) => p.id === guestId)!.score).toBe(0);

    // Guest submits correct guess with spaces and casing
    result = submitGuess(code, guestId, "   RoCkeT  ");
    expect(result.success).toBe(true);
    expect(result.guess!.isCorrect).toBe(true);
    expect(result.guess!.scoreAwarded).toBe(100);
    expect(result.guess!.text).toBe("RoCkeT");

    room = getRoom(code)!;
    expect(room.round!.guesses).toHaveLength(2);
    expect(room.participants.find((p) => p.id === guestId)!.score).toBe(100);

    // Guest submits correct guess again (double scoring prevented)
    result = submitGuess(code, guestId, "rocket");
    expect(result.success).toBe(true);
    expect(result.guess!.isCorrect).toBe(true);
    expect(result.guess!.scoreAwarded).toBe(0);

    room = getRoom(code)!;
    expect(room.round!.guesses).toHaveLength(3);
    expect(room.participants.find((p) => p.id === guestId)!.score).toBe(100);
  });

  it("allows host to end round, blocks non-host, and auto-ends when guessers are correct", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const hostId = created.participantId;
    const joined = joinRoom(code, "Bob");
    const guestId = joined.participantId as string;

    startGame(code, hostId);

    // Guest attempts to end round (blocked)
    const guestEnd = endRound(code, guestId);
    expect(guestEnd.success).toBe(false);

    // Host ends round (succeeds)
    const hostEnd = endRound(code, hostId);
    expect(hostEnd.success).toBe(true);

    let room = getRoom(code)!;
    expect(room.status).toBe("result");

    // Check snapshot reveals secret word to everyone on results status
    const guestSnapshot = toRoomSnapshot(room, guestId);
    expect(guestSnapshot.secretWord).toBe("rocket");

    // Restart game back to lobby and test auto-ending
    restartGame(code, hostId);
    startGame(code, hostId);

    // Now guess correctly as Bob. Since Bob is the only guesser, the round should automatically end.
    const guessResult = submitGuess(code, guestId, "rocket");
    expect(guessResult.success).toBe(true);

    room = getRoom(code)!;
    expect(room.status).toBe("result"); // Auto ended!
  });

  it("allows host to restart game, blocks non-host, and resets states", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const hostId = created.participantId;
    const joined = joinRoom(code, "Bob");
    const guestId = joined.participantId as string;

    startGame(code, hostId);
    submitGuess(code, guestId, "rocket"); // Bob gets 100 points
    endRound(code, hostId);

    // Guest tries to restart (blocked)
    const guestRestart = restartGame(code, guestId);
    expect(guestRestart.success).toBe(false);

    // Host restarts (succeeds)
    const hostRestart = restartGame(code, hostId);
    expect(hostRestart.success).toBe(true);

    const room = getRoom(code)!;
    expect(room.status).toBe("lobby");
    expect(room.round).toBeUndefined();

    // Scores and roles reset to lobby defaults
    const host = room.participants.find(p => p.id === hostId);
    const guest = room.participants.find(p => p.id === guestId);
    expect(host!.score).toBe(0);
    expect(host!.role).toBeUndefined();
    expect(guest!.score).toBe(0);
    expect(guest!.role).toBeUndefined();
  });
});
