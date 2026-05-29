import { describe, expect, it } from "vitest";
import { 
  createRoom, 
  joinRoom, 
  removeParticipant, 
  getRoom, 
  startGame, 
  toRoomSnapshot, 
  addGuess, 
  addStrokes,
  finishRound,
  restartGame
} from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code and assigns host", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.participants[0].role).toBeNull();
    expect(result.participantId).toBeDefined();
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.status).toBe("lobby");
    expect(result.room.secretWord).toBeNull();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });
  
  it("removes a participant and transfers host or deletes room", () => {
    const { room: room1, participantId: p1 } = createRoom("Host");
    const joinResult = joinRoom(room1.code, "Guest")!;
    const p2 = joinResult.participantId;
    
    // Test host migration
    removeParticipant(room1.code, p1);
    const updatedRoom = getRoom(room1.code)!;
    expect(updatedRoom.participants).toHaveLength(1);
    expect(updatedRoom.hostId).toBe(p2);
    
    // Test room deletion
    removeParticipant(room1.code, p2);
    expect(getRoom(room1.code)).toBeNull();
  });

  it("startGame assigns drawer role to host and guesser to others", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Alice");
    const joinResult = joinRoom(initialRoom.code, "Bob")!;
    const guestId = joinResult.participantId;

    const startedRoom = startGame(initialRoom.code, hostId)!;

    expect(startedRoom.status).toBe("playing");
    expect(startedRoom.secretWord).toBe("rocket");
    
    const host = startedRoom.participants.find(p => p.id === hostId)!;
    const guest = startedRoom.participants.find(p => p.id === guestId)!;

    expect(host.role).toBe("drawer");
    expect(guest.role).toBe("guesser");
  });

  it("toRoomSnapshot conditionally masks the secretWord based on the viewer's role", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Alice");
    const joinResult = joinRoom(initialRoom.code, "Bob")!;
    const guestId = joinResult.participantId;

    const startedRoom = startGame(initialRoom.code, hostId)!;

    const hostSnapshot = toRoomSnapshot(startedRoom, hostId);
    expect(hostSnapshot.secretWord).toBe("rocket");

    const guestSnapshot = toRoomSnapshot(startedRoom, guestId);
    expect(guestSnapshot.secretWord).toBeNull();
  });

  it("joinRoom throws an error if the room is already playing", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Alice");
    joinRoom(initialRoom.code, "Bob");
    startGame(initialRoom.code, hostId);

    expect(() => joinRoom(initialRoom.code, "Charlie")).toThrow("Room already in progress");
  });

  it("addGuess awards points only for the first correct guess", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Alice");
    const { participantId: guestId } = joinRoom(initialRoom.code, "Bob")!;
    startGame(initialRoom.code, hostId);

    // Correct guess
    let room = addGuess(initialRoom.code, guestId, "rocket")!;
    let guest = room.participants.find(p => p.id === guestId)!;
    expect(guest.score).toBe(100);
    expect(room.guesses[0].isCorrect).toBe(true);

    // Second correct guess should not award more points
    room = addGuess(initialRoom.code, guestId, "ROCKET ")!;
    guest = room.participants.find(p => p.id === guestId)!;
    expect(guest.score).toBe(100);
    expect(room.guesses).toHaveLength(2);
  });

  it("addGuess maintains a rolling history of 50 guesses", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Alice");
    const { participantId: guestId } = joinRoom(initialRoom.code, "Bob")!;
    startGame(initialRoom.code, hostId);

    for (let i = 0; i < 60; i++) {
      addGuess(initialRoom.code, guestId, `guess ${i}`);
    }

    const room = getRoom(initialRoom.code)!;
    expect(room.guesses).toHaveLength(50);
    expect(room.guesses[0].text).toBe("guess 10");
    expect(room.guesses[49].text).toBe("guess 59");
  });

  it("addStrokes blocks non-drawer updates", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Alice");
    const { participantId: guestId } = joinRoom(initialRoom.code, "Bob")!;
    startGame(initialRoom.code, hostId);

    expect(() => addStrokes(initialRoom.code, guestId, [])).toThrow("Only the drawer can update strokes");
  });

  it("lifecycle: finishRound and restartGame", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Alice");
    joinRoom(initialRoom.code, "Bob");
    startGame(initialRoom.code, hostId);

    // Finish round
    const finishedRoom = finishRound(initialRoom.code, hostId)!;
    expect(finishedRoom.status).toBe("results");
    
    const snapshot = toRoomSnapshot(finishedRoom, "any-id");
    expect(snapshot.secretWord).toBe("rocket"); // Revealed to all

    // Restart game
    const restartedRoom = restartGame(initialRoom.code, hostId)!;
    expect(restartedRoom.status).toBe("lobby");
    expect(restartedRoom.secretWord).toBeNull();
    expect(restartedRoom.strokes).toHaveLength(0);
    expect(restartedRoom.guesses).toHaveLength(0);
  });

  it("seniority rotation for drawer role", () => {
    const { room: r, participantId: p1 } = createRoom("1st");
    const { participantId: p2 } = joinRoom(r.code, "2nd")!;
    const { participantId: p3 } = joinRoom(r.code, "3rd")!;

    // 1st Round: 1st player is drawer
    let room = startGame(r.code, p1)!;
    expect(room.participants.find(p => p.id === p1)!.role).toBe("drawer");
    expect(room.secretWord).toBe("rocket");

    finishRound(r.code, p1);
    restartGame(r.code, p1);

    // 2nd Round: 2nd player is drawer
    room = startGame(r.code, p1)!;
    expect(room.participants.find(p => p.id === p2)!.role).toBe("drawer");
    expect(room.secretWord).toBe("pizza");

    finishRound(r.code, p1);
    restartGame(r.code, p1);

    // 3rd Round: 3rd player is drawer
    room = startGame(r.code, p1)!;
    expect(room.participants.find(p => p.id === p3)!.role).toBe("drawer");
    expect(room.secretWord).toBe("castle");

    finishRound(r.code, p1);
    restartGame(r.code, p1);

    // 4th Round: back to 1st
    room = startGame(r.code, p1)!;
    expect(room.participants.find(p => p.id === p1)!.role).toBe("drawer");
  });
});
