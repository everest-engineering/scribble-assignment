import { describe, expect, it } from "vitest";
import {
  createRoom,
  joinRoom,
  getRoom,
  toRoomSnapshot,
  saveRoom,
  startRoom,
  submitGuess,
  updateCanvas,
  restartRoom,
} from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code from allowed alphabet", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z2-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("assigns hostParticipantId on create and preserves it on join", () => {
    const { room, participantId } = createRoom("HostUser");

    const snapshot1 = toRoomSnapshot(room, participantId);
    expect(snapshot1.hostParticipantId).toBe(participantId);
    expect(snapshot1.viewerIsHost).toBe(true);

    const joinResult = joinRoom(room.code, "SecondUser");
    expect(joinResult).not.toBeNull();
    const secondParticipantId = joinResult!.participantId;

    const updatedRoom = getRoom(room.code)!;
    const snapshot2 = toRoomSnapshot(updatedRoom, secondParticipantId);
    expect(snapshot2.hostParticipantId).toBe(participantId);
    expect(snapshot2.viewerIsHost).toBe(false);
  });

  it("promotes earliest joined participant to host if current host is missing", () => {
    const { room, participantId: hostId } = createRoom("HostUser");
    const joinResult = joinRoom(room.code, "SecondUser");
    const secondUserId = joinResult!.participantId;

    const currentRoom = getRoom(room.code)!;
    currentRoom.participants = currentRoom.participants.filter(p => p.id !== hostId);
    saveRoom(currentRoom);

    const updatedRoom = getRoom(room.code)!;
    expect(updatedRoom.hostParticipantId).toBe(secondUserId);
  });

  it("isolates rooms so participants from one do not appear in another", () => {
    const room1 = createRoom("Alice1");
    const room2 = createRoom("Bob2");

    joinRoom(room1.room.code, "Charlie1");
    joinRoom(room2.room.code, "Dave2");

    const state1 = getRoom(room1.room.code)!;
    const state2 = getRoom(room2.room.code)!;

    expect(state1.participants.map(p => p.name)).toEqual(["Alice1", "Charlie1"]);
    expect(state2.participants.map(p => p.name)).toEqual(["Bob2", "Dave2"]);
  });

  describe("startRoom", () => {
    it("starts game successfully with 2+ participants, assigns host as drawer", () => {
      const { room, participantId: hostId } = createRoom("Host");
      joinRoom(room.code, "Player2");

      const started = startRoom(room.code, hostId);

      expect(started.status).toBe("playing");
      expect(started.currentRound).toBeDefined();
      expect(started.currentRound!.drawerParticipantId).toBe(hostId);
      expect(started.currentRound!.roundNumber).toBe(1);
      expect(started.currentRound!.secretWord).toBeTruthy();
      expect(started.currentRound!.scores[hostId]).toBe(0);
      expect(started.currentRound!.guesses).toEqual([]);
      expect(started.currentRound!.isComplete).toBe(false);
    });

    it("throws 403 if caller is not the host", () => {
      const { room } = createRoom("Host");
      const { participantId: guestId } = joinRoom(room.code, "Guest")!;

      expect(() => startRoom(room.code, guestId)).toThrow("Only the host may start");
    });

    it("throws 400 if fewer than 2 participants", () => {
      const { room, participantId: hostId } = createRoom("Host");

      expect(() => startRoom(room.code, hostId)).toThrow("At least 2 players required");
    });

    it("throws 400 if room already started", () => {
      const { room, participantId: hostId } = createRoom("Host");
      joinRoom(room.code, "Player2");

      startRoom(room.code, hostId);

      expect(() => startRoom(room.code, hostId)).toThrow("Game has already started");
    });

    it("throws 404 if room not found", () => {
      expect(() => startRoom("ZZZZ", "p1")).toThrow("Room not found");
    });

    it("selects word deterministically", () => {
      const { room, participantId: hostId } = createRoom("Host");
      joinRoom(room.code, "Player2");

      const started = startRoom(room.code, hostId);
      // With 2 participants + round 1: (2 + 1) % 5 = 3 → "guitar"
      expect(started.currentRound!.secretWord).toBe("guitar");
    });

    it("initialises canvasState to empty", () => {
      const { room, participantId: hostId } = createRoom("Host");
      joinRoom(room.code, "Player2");

      const started = startRoom(room.code, hostId);

      expect(started.canvasState.strokes).toEqual([]);
    });
  });

  describe("toRoomSnapshot word visibility", () => {
    it("hides secret word from non-drawers during playing", () => {
      const { room, participantId: hostId } = createRoom("Host");
      const { participantId: guesserId } = joinRoom(room.code, "Guesser")!;

      const started = startRoom(room.code, hostId);
      const snapshot = toRoomSnapshot(started, guesserId);

      expect(snapshot.currentRound).toBeDefined();
      expect(snapshot.currentRound!.secretWord).toBeNull();
    });

    it("shows secret word to drawer during playing", () => {
      const { room, participantId: hostId } = createRoom("Host");
      joinRoom(room.code, "Guesser");

      const started = startRoom(room.code, hostId);
      const snapshot = toRoomSnapshot(started, hostId);

      expect(snapshot.currentRound!.secretWord).toBeTruthy();
    });

    it("reveals secret word to all in result status", () => {
      const { room, participantId: hostId } = createRoom("Host");
      const { participantId: guesserId } = joinRoom(room.code, "Guesser")!;

      const started = startRoom(room.code, hostId);
      started.status = "result";

      const snapshot = toRoomSnapshot(started, guesserId);
      expect(snapshot.currentRound!.secretWord).toBeTruthy();
    });
  });

  describe("updateCanvas", () => {
    it("updates canvas state for the drawer", () => {
      const { room, participantId: hostId } = createRoom("Host");
      joinRoom(room.code, "Player2");
      startRoom(room.code, hostId);

      const strokes = [[{ x: 0, y: 0 }, { x: 10, y: 10 }]];
      const updated = updateCanvas(room.code, hostId, strokes);

      expect(updated.canvasState.strokes).toEqual(strokes);
    });

    it("throws 403 if non-drawer tries to update canvas", () => {
      const { room, participantId: hostId } = createRoom("Host");
      const { participantId: guesserId } = joinRoom(room.code, "Guesser")!;
      startRoom(room.code, hostId);

      expect(() => updateCanvas(room.code, guesserId, [])).toThrow("Only the drawer may update the canvas");
    });

    it("throws 400 if room not playing", () => {
      const { room, participantId: hostId } = createRoom("Host");

      expect(() => updateCanvas(room.code, hostId, [])).toThrow("Room is not in playing state");
    });
  });

  describe("submitGuess", () => {
    it("records a correct guess, awards 100 points, and keeps status playing if other guessers remain", () => {
      const { room, participantId: hostId } = createRoom("Host");
      const { participantId: guesserId } = joinRoom(room.code, "Guesser")!;
      joinRoom(room.code, "Guesser2");
      const started = startRoom(room.code, hostId);
      const word = started.currentRound!.secretWord!;

      const updated = submitGuess(room.code, guesserId, word);

      const guess = updated.currentRound!.guesses[0];
      expect(guess.text).toBe(word);
      expect(guess.isCorrect).toBe(true);
      expect(guess.participantId).toBe(guesserId);
      expect(updated.currentRound!.scores[guesserId]).toBe(100);
      expect(updated.status).toBe("playing");
    });

    it("transitions to result when all guessers guess correctly", () => {
      const { room, participantId: hostId } = createRoom("Host");
      const { participantId: guesserId } = joinRoom(room.code, "Guesser")!;
      const started = startRoom(room.code, hostId);
      const word = started.currentRound!.secretWord!;

      const updated = submitGuess(room.code, guesserId, word);

      expect(updated.status).toBe("result");
      expect(updated.currentRound!.isComplete).toBe(true);
    });

    it("records an incorrect guess without awarding points", () => {
      const { room, participantId: hostId } = createRoom("Host");
      const { participantId: guesserId } = joinRoom(room.code, "Guesser")!;
      startRoom(room.code, hostId);

      const updated = submitGuess(room.code, guesserId, "wronganswer");

      const guess = updated.currentRound!.guesses[0];
      expect(guess.isCorrect).toBe(false);
      expect(guess.text).toBe("wronganswer");
      expect(updated.currentRound!.scores[guesserId]).toBe(0);
      expect(updated.status).toBe("playing");
    });

    it("rejects drawer's guess with 403", () => {
      const { room, participantId: hostId } = createRoom("Host");
      joinRoom(room.code, "Guesser");
      startRoom(room.code, hostId);

      expect(() => submitGuess(room.code, hostId, "anything")).toThrow("Drawers cannot guess");
    });

    it("rejects duplicate correct guesser", () => {
      const { room, participantId: hostId } = createRoom("Host");
      const { participantId: guesserId } = joinRoom(room.code, "Guesser")!;
      joinRoom(room.code, "Guesser2");
      const started = startRoom(room.code, hostId);
      const word = started.currentRound!.secretWord!;

      submitGuess(room.code, guesserId, word);

      expect(() => submitGuess(room.code, guesserId, word)).toThrow("You already guessed correctly");
    });

    it("rejects empty guess after trim", () => {
      const { room, participantId: hostId } = createRoom("Host");
      const { participantId: guesserId } = joinRoom(room.code, "Guesser")!;
      startRoom(room.code, hostId);

      expect(() => submitGuess(room.code, guesserId, "   ")).toThrow("Guess cannot be empty");
    });

    it("compares case-insensitively", () => {
      const { room, participantId: hostId } = createRoom("Host");
      const { participantId: guesserId } = joinRoom(room.code, "Guesser")!;
      const started = startRoom(room.code, hostId);
      const word = started.currentRound!.secretWord!;

      const updated = submitGuess(room.code, guesserId, word.toUpperCase());

      expect(updated.currentRound!.guesses[0].isCorrect).toBe(true);
    });

    it("trims whitespace from guess", () => {
      const { room, participantId: hostId } = createRoom("Host");
      const { participantId: guesserId } = joinRoom(room.code, "Guesser")!;
      const started = startRoom(room.code, hostId);
      const word = started.currentRound!.secretWord!;

      const updated = submitGuess(room.code, guesserId, `  ${word}  `);

      expect(updated.currentRound!.guesses[0].text).toBe(word);
      expect(updated.currentRound!.guesses[0].isCorrect).toBe(true);
    });
  });

  describe("restartRoom", () => {
    it("restarts the room to lobby, preserves participants, clears round state", () => {
      const { room, participantId: hostId } = createRoom("Host");
      joinRoom(room.code, "Guesser");
      startRoom(room.code, hostId);

      const restarted = restartRoom(room.code, hostId);

      expect(restarted.status).toBe("lobby");
      expect(restarted.participants).toHaveLength(2);
      expect(restarted.currentRound).toBeUndefined();
      expect(restarted.canvasState.strokes).toEqual([]);
      expect(restarted.hostParticipantId).toBe(hostId);
    });

    it("throws 403 if non-host tries to restart", () => {
      const { room, participantId: hostId } = createRoom("Host");
      const { participantId: guesserId } = joinRoom(room.code, "Guesser")!;
      startRoom(room.code, hostId);

      expect(() => restartRoom(room.code, guesserId)).toThrow("Only the host may restart");
    });

    it("throws 400 if room is in lobby state", () => {
      const { room, participantId: hostId } = createRoom("Host");

      expect(() => restartRoom(room.code, hostId)).toThrow("Room is not in a state that can be restarted");
    });
  });
});
