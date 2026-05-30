import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, getRoom, saveRoom, startGame, toRoomSnapshot, updateDrawing, submitGuess, leaveRoom, restartGame } from "./roomStore.js";
import { HttpError } from "../api/schemas.js";
import { STARTER_WORDS } from "../seed/starterData.js";

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
    expect(STARTER_WORDS).toContain(activeRoom.secretWord);

    const secret = activeRoom.secretWord!;

    // Verify snapshot visibility
    const hostSnapshot = toRoomSnapshot(activeRoom, hostId);
    expect(hostSnapshot.secretWord).toBe(secret);

    const guestSnapshot = toRoomSnapshot(activeRoom, guestId);
    expect(guestSnapshot.secretWord).toBeNull();

    // Verify snapshot visibility in result state
    activeRoom.status = "result";
    const resultHostSnapshot = toRoomSnapshot(activeRoom, hostId);
    expect(resultHostSnapshot.secretWord).toBe(secret);
    const resultGuestSnapshot = toRoomSnapshot(activeRoom, guestId);
    expect(resultGuestSnapshot.secretWord).toBe(secret);
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
    const activeRoom = startGame(room.code, hostId);
    const secret = activeRoom.secretWord!;
    const wrongWord = secret.toLowerCase() === "guitar" ? "pizza" : "guitar";

    // Incorrect guess
    const resultAfterWrong = submitGuess(room.code, guestId, wrongWord);
    expect(resultAfterWrong.status).toBe("game");
    expect(resultAfterWrong.guesses).toHaveLength(1);
    expect(resultAfterWrong.guesses[0].text).toBe(wrongWord);
    expect(resultAfterWrong.guesses[0].correct).toBe(false);
    expect(resultAfterWrong.participants.find(p => p.id === guestId)?.score).toBe(0);

    // Correct guess (case-insensitive & trimmed)
    const guessInput = `  ${secret.toUpperCase()}  `;
    const resultAfterRight = submitGuess(room.code, guestId, guessInput);
    expect(resultAfterRight.status).toBe("result");
    expect(resultAfterRight.guesses).toHaveLength(2);
    expect(resultAfterRight.guesses[1].text).toBe(secret.toUpperCase());
    expect(resultAfterRight.guesses[1].correct).toBe(true);
    expect(resultAfterRight.participants.find(p => p.id === guestId)?.score).toBe(100);

    // Reject drawer guesses
    expect(() => submitGuess(room.code, hostId, secret)).toThrow(HttpError);
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
      const activeRoom = startGame(room.code, hostId);

      // Submit guesses and score
      submitGuess(room.code, bobId, activeRoom.secretWord!);

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

  it("randomizes secret word and avoids repeating recently used words in consecutive games", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const joinResult = joinRoom(room.code, "Bob");
    const guestId = joinResult!.participantId;

    const chosenWords = new Set<string>();

    for (let i = 0; i < 5; i++) {
      const activeRoom = startGame(room.code, hostId);
      const word = activeRoom.secretWord;
      expect(word).not.toBeNull();
      expect(STARTER_WORDS).toContain(word);
      expect(chosenWords.has(word!)).toBe(false);
      chosenWords.add(word!);

      // Complete the game by correct guess to transition status, then restart
      submitGuess(room.code, guestId, word!);
      restartGame(room.code, hostId);
    }

    // After 5 games, all 5 words should have been used exactly once
    expect(chosenWords.size).toBe(5);

    // Starting the 6th game should reset the history and pick one of the words again
    const activeRoom6 = startGame(room.code, hostId);
    expect(STARTER_WORDS).toContain(activeRoom6.secretWord);
  });

  it("scenario: Player 3 leaves, then Host restarts, then Host starts game again", () => {
    const { room, participantId: hostId } = createRoom("Player 1");
    const join2 = joinRoom(room.code, "Player 2");
    const join3 = joinRoom(room.code, "Player 3");
    
    expect(join2).not.toBeNull();
    expect(join3).not.toBeNull();
    
    const p2Id = join2!.participantId;
    const p3Id = join3!.participantId;
    
    // Start game
    const active = startGame(room.code, hostId);
    expect(active.status).toBe("game");
    
    // Player 2 guesses correctly to transition to result
    const result = submitGuess(room.code, p2Id, active.secretWord!);
    expect(result.status).toBe("result");
    
    // Player 3 leaves
    const afterP3Leaves = leaveRoom(room.code, p3Id);
    expect(afterP3Leaves).not.toBeNull();
    expect(afterP3Leaves!.participants).toHaveLength(2);
    expect(afterP3Leaves!.participants.map(p => p.name)).toContain("Player 1");
    expect(afterP3Leaves!.participants.map(p => p.name)).toContain("Player 2");
    
    // Host restarts game
    const restarted = restartGame(room.code, hostId);
    expect(restarted.status).toBe("lobby");
    expect(restarted.participants).toHaveLength(2);
    
    // Host starts game again
    const restartedActive = startGame(room.code, hostId);
    expect(restartedActive.status).toBe("game");
    expect(restartedActive.participants).toHaveLength(2);
  });
});
