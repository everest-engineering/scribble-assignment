import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, toRoomSnapshot, updateCanvas, submitGuess } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code and assigns hostId", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
    expect(result.room.hostId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom throws an error for duplicate playerName (case-insensitive)", () => {
    const creator = createRoom("Alice");
    const code = creator.room.code;

    expect(() => joinRoom(code, "Alice")).toThrow("Player name already taken in this room");
    expect(() => joinRoom(code, "  alice  ")).toThrow("Player name already taken in this room");
  });

  describe("startGame", () => {
    it("throws an error if non-host tries to start the game", () => {
      const creator = createRoom("Alice");
      const code = creator.room.code;
      const guest = joinRoom(code, "Bob");

      expect(() => startGame(code, guest!.participantId)).toThrow("Only the host can start the game");
    });

    it("throws an error if host tries to start the game with less than 2 players", () => {
      const creator = createRoom("Alice");
      const code = creator.room.code;

      expect(() => startGame(code, creator.participantId)).toThrow("Cannot start game: at least 2 players are required");
    });

    it("successfully sets room status to active if host starts and there are >= 2 players", () => {
      const creator = createRoom("Alice");
      const code = creator.room.code;
      const guest = joinRoom(code, "Bob");

      const startedRoom = startGame(code, creator.participantId);
      expect(startedRoom).toBeDefined();
      expect(startedRoom!.status).toBe("active");
      expect(startedRoom!.drawerId).toBe(creator.participantId);
      expect(startedRoom!.currentWord).toBe("rocket");
      
      const hostParticipant = startedRoom!.participants.find(p => p.id === creator.participantId);
      const guestParticipant = startedRoom!.participants.find(p => p.id === guest!.participantId);
      expect(hostParticipant?.role).toBe("drawer");
      expect(guestParticipant?.role).toBe("guesser");

      const hostSnapshot = toRoomSnapshot(startedRoom!, creator.participantId);
      const guestSnapshot = toRoomSnapshot(startedRoom!, guest!.participantId);

      expect(hostSnapshot.drawerId).toBe(creator.participantId);
      expect(hostSnapshot.wordTemplate).toBe("rocket");
      expect(guestSnapshot.wordTemplate).toBe("______");
    });
  });

  describe("updateCanvas", () => {
    it("allows drawer to update canvas data", () => {
      const creator = createRoom("Alice");
      const code = creator.room.code;
      joinRoom(code, "Bob");
      startGame(code, creator.participantId);

      const updated = updateCanvas(code, creator.participantId, "stroke-data");
      expect(updated).toBeDefined();
      expect(updated!.drawingData).toBe("stroke-data");
    });

    it("throws an error if non-drawer tries to update canvas data", () => {
      const creator = createRoom("Alice");
      const code = creator.room.code;
      const guest = joinRoom(code, "Bob");
      startGame(code, creator.participantId);

      expect(() => updateCanvas(code, guest!.participantId, "stroke-data")).toThrow("Only the active drawer can draw on the canvas");
    });
  });

  describe("submitGuess", () => {
    it("throws an error if drawer tries to guess", () => {
      const creator = createRoom("Alice");
      const code = creator.room.code;
      joinRoom(code, "Bob");
      startGame(code, creator.participantId);

      expect(() => submitGuess(code, creator.participantId, "rocket")).toThrow("Drawer cannot submit guesses");
    });

    it("handles correct guesses case-insensitively and trims input", () => {
      const creator = createRoom("Alice");
      const code = creator.room.code;
      const guest = joinRoom(code, "Bob");
      startGame(code, creator.participantId);

      const updated = submitGuess(code, guest!.participantId, "  RoCkEt  ");
      expect(updated).toBeDefined();
      
      const guestParticipant = updated!.participants.find(p => p.id === guest!.participantId);
      expect(guestParticipant?.score).toBe(100);
      expect(guestParticipant?.hasGuessedCorrectly).toBe(true);
      expect(updated!.guesses[0].isCorrect).toBe(true);
      expect(updated!.guesses[0].text).toBe("RoCkEt");
    });

    it("handles incorrect guesses and logs them", () => {
      const creator = createRoom("Alice");
      const code = creator.room.code;
      const guest = joinRoom(code, "Bob");
      startGame(code, creator.participantId);

      const updated = submitGuess(code, guest!.participantId, "pizza");
      expect(updated).toBeDefined();

      const guestParticipant = updated!.participants.find(p => p.id === guest!.participantId);
      expect(guestParticipant?.score).toBe(0);
      expect(guestParticipant?.hasGuessedCorrectly).toBe(false);
      expect(updated!.guesses[0].isCorrect).toBe(false);
      expect(updated!.guesses[0].text).toBe("pizza");
    });

    it("prevents scoring multiple times in the same round", () => {
      const creator = createRoom("Alice");
      const code = creator.room.code;
      const guest = joinRoom(code, "Bob");
      startGame(code, creator.participantId);

      submitGuess(code, guest!.participantId, "rocket");
      const updated = submitGuess(code, guest!.participantId, "rocket");
      
      const guestParticipant = updated!.participants.find(p => p.id === guest!.participantId);
      expect(guestParticipant?.score).toBe(100); // remains 100, not 200
    });
  });
});
