import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, toRoomSnapshot } from "./roomStore.js";

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
});
