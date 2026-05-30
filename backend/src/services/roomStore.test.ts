import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, getRoom, saveRoom, startGame, toRoomSnapshot, updateDrawing, submitGuess, leaveRoom, restartGame } from "./roomStore.js";
import { HttpError } from "../api/schemas.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code and host assignment", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.participants[0].score).toBe(0);
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.participantId).toBeDefined();
  });

  it("createRoom rejects empty or whitespace-only name", () => {
    expect(() => createRoom("   ")).toThrow(HttpError);
    expect(() => createRoom("")).toThrow(HttpError);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom rejects empty or whitespace-only name", () => {
    const { room } = createRoom("Alice");
    expect(() => joinRoom(room.code, "   ")).toThrow(HttpError);
  });

  it("joinRoom trims names and rejects duplicates (case-insensitive)", () => {
    const { room } = createRoom("Alice");
    
    // Test trimming
    const joinResult = joinRoom(room.code, "  Bob  ");
    expect(joinResult).not.toBeNull();
    const updatedRoom = getRoom(room.code);
    expect(updatedRoom?.participants[1].name).toBe("Bob");

    // Test duplicate name
    expect(() => joinRoom(room.code, "alice")).toThrow(HttpError);
    expect(() => joinRoom(room.code, "Bob")).toThrow(HttpError);
  });

  it("joinRoom rejects joining when room is not in lobby status", () => {
    const { room } = createRoom("Alice");
    
    const fetchedRoom = getRoom(room.code);
    if (fetchedRoom) {
      fetchedRoom.status = "game";
      saveRoom(fetchedRoom);
    }

    expect(() => joinRoom(room.code, "Bob")).toThrow(HttpError);
  });

  it("startGame transitions room status to game, sets host as drawer, and selects secret word", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const joinResult = joinRoom(room.code, "Bob");
    expect(joinResult).not.toBeNull();
    const guestId = joinResult!.participantId;

    const activeRoom = startGame(room.code, hostId);
    expect(activeRoom.status).toBe("game");
    expect(activeRoom.drawerId).toBe(hostId);
    expect(activeRoom.secretWord).toBe("rocket");

    // Verify snapshot visibility
    const hostSnapshot = toRoomSnapshot(activeRoom, hostId);
    expect(hostSnapshot.secretWord).toBe("rocket");

    const guestSnapshot = toRoomSnapshot(activeRoom, guestId);
    expect(guestSnapshot.secretWord).toBeNull();

    // Verify snapshot visibility in result state
    activeRoom.status = "result";
    const resultHostSnapshot = toRoomSnapshot(activeRoom, hostId);
    expect(resultHostSnapshot.secretWord).toBe("rocket");
    const resultGuestSnapshot = toRoomSnapshot(activeRoom, guestId);
    expect(resultGuestSnapshot.secretWord).toBe("rocket");
  });

  it("startGame rejects request if not host or not enough players", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    
    expect(() => startGame(room.code, hostId)).toThrow(HttpError);

    const joinResult = joinRoom(room.code, "Bob");
    const guestId = joinResult!.participantId;

    expect(() => startGame(room.code, guestId)).toThrow(HttpError);
  });

  it("updateDrawing saves drawing data when called by drawer, rejects otherwise", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const joinResult = joinRoom(room.code, "Bob");
    const guestId = joinResult!.participantId;
    startGame(room.code, hostId);

    const testDrawingData = JSON.stringify([{ x: 0.1, y: 0.2 }]);
    const updatedRoom = updateDrawing(room.code, hostId, testDrawingData);
    expect(updatedRoom.drawingData).toBe(testDrawingData);

    // Rejects if drawerId does not match participantId
    expect(() => updateDrawing(room.code, guestId, testDrawingData)).toThrow(HttpError);
  });

  it("submitGuess logs guess, awards points and transitions to result state on correct guess", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const joinResult = joinRoom(room.code, "Bob");
    const guestId = joinResult!.participantId;
    startGame(room.code, hostId);

    // Incorrect guess
    const resultAfterWrong = submitGuess(room.code, guestId, "guitar");
    expect(resultAfterWrong.status).toBe("game");
    expect(resultAfterWrong.guesses).toHaveLength(1);
    expect(resultAfterWrong.guesses[0].text).toBe("guitar");
    expect(resultAfterWrong.guesses[0].correct).toBe(false);
    expect(resultAfterWrong.participants.find(p => p.id === guestId)?.score).toBe(0);

    // Correct guess (case-insensitive & trimmed)
    const resultAfterRight = submitGuess(room.code, guestId, "  RoCkeT  ");
    expect(resultAfterRight.status).toBe("result");
    expect(resultAfterRight.guesses).toHaveLength(2);
    expect(resultAfterRight.guesses[1].text).toBe("RoCkeT");
    expect(resultAfterRight.guesses[1].correct).toBe(true);
    expect(resultAfterRight.participants.find(p => p.id === guestId)?.score).toBe(100);

    // Reject drawer guesses
    expect(() => submitGuess(room.code, hostId, "rocket")).toThrow(HttpError);
  });

  describe("leaveRoom", () => {
    it("removes the participant from the room", () => {
      const { room } = createRoom("Alice");
      const joinResult = joinRoom(room.code, "Bob");
      expect(joinResult).not.toBeNull();
      const bobId = joinResult!.participantId;

      const updated = leaveRoom(room.code, bobId);
      expect(updated).not.toBeNull();
      expect(updated!.participants).toHaveLength(1);
      expect(updated!.participants[0].name).toBe("Alice");
    });

    it("promotes the next participant to host if host leaves", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      const joinResult = joinRoom(room.code, "Bob");
      const bobId = joinResult!.participantId;

      const updated = leaveRoom(room.code, aliceId);
      expect(updated).not.toBeNull();
      expect(updated!.participants).toHaveLength(1);
      expect(updated!.participants[0].id).toBe(bobId);
      expect(updated!.hostId).toBe(bobId);
    });

    it("removes the room if all participants leave", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      const updated = leaveRoom(room.code, aliceId);
      expect(updated).toBeNull();
      expect(getRoom(room.code)).toBeNull();
    });
  });

  describe("restartGame", () => {
    it("resets game status to lobby, clears scores, canvas, and guesses", () => {
      const { room, participantId: hostId } = createRoom("Alice");
      const joinResult = joinRoom(room.code, "Bob");
      const bobId = joinResult!.participantId;
      startGame(room.code, hostId);

      // Submit guesses and score
      submitGuess(room.code, bobId, "rocket");

      const beforeRestart = getRoom(room.code);
      expect(beforeRestart!.status).toBe("result");
      expect(beforeRestart!.participants.find(p => p.id === bobId)!.score).toBe(100);

      const restarted = restartGame(room.code, hostId);
      expect(restarted.status).toBe("lobby");
      expect(restarted.drawingData).toBe("");
      expect(restarted.guesses).toHaveLength(0);
      expect(restarted.drawerId).toBeNull();
      expect(restarted.secretWord).toBeNull();
      expect(restarted.participants.find(p => p.id === bobId)!.score).toBe(0);
      expect(restarted.participants.find(p => p.id === hostId)!.score).toBe(0);
    });

    it("rejects restart by non-host", () => {
      const { room, participantId: hostId } = createRoom("Alice");
      const joinResult = joinRoom(room.code, "Bob");
      const bobId = joinResult!.participantId;
      startGame(room.code, hostId);

      expect(() => restartGame(room.code, bobId)).toThrow(HttpError);
    });
  });
});
