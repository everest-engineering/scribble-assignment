import { describe, expect, it } from "vitest";
import {
  addStroke,
  clearStrokes,
  createRoom,
  getRoom,
  joinRoom,
  restartGame,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";

describe("roomStore", () => {
  describe("room creation", () => {
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
  });

  describe("name validation", () => {
    it("rejects empty name on createRoom", () => {
      expect(() => createRoom("")).toThrow("Name cannot be empty");
    });

    it("rejects whitespace-only name on createRoom", () => {
      expect(() => createRoom("   ")).toThrow("Name cannot be empty");
    });

    it("trims whitespace from names", () => {
      const result = createRoom("  Alice  ");
      expect(result.room.participants[0].name).toBe("Alice");
    });

    it("rejects empty name on joinRoom", () => {
      const { room } = createRoom("Alice");
      expect(() => joinRoom(room.code, "")).toThrow("Name cannot be empty");
    });

    it("rejects whitespace-only name on joinRoom", () => {
      const { room } = createRoom("Alice");
      expect(() => joinRoom(room.code, "   ")).toThrow("Name cannot be empty");
    });
  });

  describe("game start", () => {
    it("requires at least 2 players to start", () => {
      const { room, participantId } = createRoom("Alice");
      expect(() => startGame(room.code, participantId)).toThrow("Need at least 2 players");
    });

    it("only allows the host to start", () => {
      const { room } = createRoom("Alice");
      const bob = joinRoom(room.code, "Bob");
      expect(() => startGame(room.code, bob!.participantId)).toThrow("Only the host can start");
    });

    it("rejects start for non-existent room", () => {
      expect(() => startGame("ZZZZ", "any-id")).toThrow("Room not found");
    });

    it("rejects duplicate start", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      startGame(room.code, participantId);
      expect(() => startGame(room.code, participantId)).toThrow("Game has already started");
    });
  });

  describe("secret word gating", () => {
    it("hides secret word from non-drawer viewer", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const { room: started } = startGame(room.code, aliceId);

      const guesserView = toRoomSnapshot(started, "non-drawer-id");
      expect(guesserView.secretWord).toBeUndefined();

      const drawerView = toRoomSnapshot(started, aliceId);
      expect(drawerView.secretWord).toBe("rocket");
    });

    it("reveals secret word to everyone on result", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      const bob = joinRoom(room.code, "Bob")!;
      startGame(room.code, aliceId);
      submitGuess(room.code, bob.participantId, "rocket");

      const roomData = getRoom(room.code)!;
      const view = toRoomSnapshot(roomData, "any-viewer");
      expect(view.secretWord).toBe("rocket");
      expect(view.status).toBe("result");
    });
  });

  describe("drawing", () => {
    it("allows drawer to add strokes", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      startGame(room.code, aliceId);

      const stroke = { x1: 0, y1: 0, x2: 100, y2: 100, color: "#000", width: 3 };
      addStroke(room.code, aliceId, stroke);

      const roomData = getRoom(room.code)!;
      expect(roomData.strokes).toHaveLength(1);
      expect(roomData.strokes[0].x2).toBe(100);
    });

    it("rejects stroke from non-drawer", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      const bob = joinRoom(room.code, "Bob")!;
      startGame(room.code, aliceId);

      const stroke = { x1: 0, y1: 0, x2: 100, y2: 100, color: "#000", width: 3 };
      expect(() => addStroke(room.code, bob.participantId, stroke)).toThrow("Only the drawer can draw");
    });

    it("allows drawer to clear canvas", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      startGame(room.code, aliceId);

      const stroke = { x1: 0, y1: 0, x2: 100, y2: 100, color: "#000", width: 3 };
      addStroke(room.code, aliceId, stroke);
      clearStrokes(room.code, aliceId);

      const roomData = getRoom(room.code)!;
      expect(roomData.strokes).toHaveLength(0);
    });

    it("rejects clear from non-drawer", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      const bob = joinRoom(room.code, "Bob")!;
      startGame(room.code, aliceId);

      expect(() => clearStrokes(room.code, bob.participantId)).toThrow("Only the drawer can clear");
    });
  });

  describe("guessing and scoring", () => {
    it("marks correct guess case-insensitively", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      const bob = joinRoom(room.code, "Bob")!;
      startGame(room.code, aliceId);

      const result = submitGuess(room.code, bob.participantId, "ROCKET");
      expect(result.guess.correct).toBe(true);
    });

    it("marks incorrect guess", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      const bob = joinRoom(room.code, "Bob")!;
      startGame(room.code, aliceId);

      const result = submitGuess(room.code, bob.participantId, "wrong");
      expect(result.guess.correct).toBe(false);
    });

    it("awards 100 points for correct guess", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      const bob = joinRoom(room.code, "Bob")!;
      startGame(room.code, aliceId);

      submitGuess(room.code, bob.participantId, "rocket");

      const roomData = getRoom(room.code)!;
      const bobParticipant = roomData.participants.find((p) => p.id === bob.participantId);
      expect(bobParticipant!.score).toBe(100);
    });

    it("ends round on correct guess", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      const bob = joinRoom(room.code, "Bob")!;
      startGame(room.code, aliceId);

      submitGuess(room.code, bob.participantId, "rocket");

      const roomData = getRoom(room.code)!;
      expect(roomData.status).toBe("result");
    });

    it("rejects empty guess", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      const bob = joinRoom(room.code, "Bob")!;
      startGame(room.code, aliceId);

      expect(() => submitGuess(room.code, bob.participantId, "")).toThrow("Guess cannot be empty");
    });

    it("rejects whitespace-only guess", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      const bob = joinRoom(room.code, "Bob")!;
      startGame(room.code, aliceId);

      expect(() => submitGuess(room.code, bob.participantId, "   ")).toThrow("Guess cannot be empty");
    });

    it("prevents drawer from submitting guesses", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      startGame(room.code, aliceId);

      expect(() => submitGuess(room.code, aliceId, "rocket")).toThrow("Drawer cannot submit guesses");
    });
  });

  describe("restart", () => {
    it("resets scores to 0 on restart", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      const bob = joinRoom(room.code, "Bob")!;
      startGame(room.code, aliceId);
      submitGuess(room.code, bob.participantId, "rocket");

      restartGame(room.code, aliceId);

      const roomData = getRoom(room.code)!;
      for (const p of roomData.participants) {
        expect(p.score).toBe(0);
      }
    });

    it("preserves participants on restart", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      startGame(room.code, aliceId);

      const bob2 = joinRoom(room.code, "Charlie")!;
      restartGame(room.code, aliceId);

      const roomData = getRoom(room.code)!;
      expect(roomData.participants).toHaveLength(3);
    });

    it("clears strokes on restart", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      startGame(room.code, aliceId);
      addStroke(room.code, aliceId, { x1: 0, y1: 0, x2: 100, y2: 100, color: "#000", width: 3 });

      restartGame(room.code, aliceId);

      const roomData = getRoom(room.code)!;
      expect(roomData.strokes).toHaveLength(0);
    });

    it("clears guesses on restart", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      const bob = joinRoom(room.code, "Bob")!;
      startGame(room.code, aliceId);
      submitGuess(room.code, bob.participantId, "rocket");

      restartGame(room.code, aliceId);

      const roomData = getRoom(room.code)!;
      expect(roomData.guesses).toHaveLength(0);
    });

    it("only allows host to restart", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      const bob = joinRoom(room.code, "Bob")!;
      startGame(room.code, aliceId);

      expect(() => restartGame(room.code, bob.participantId)).toThrow("Only the host can restart");
    });

    it("sets status back to lobby", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      startGame(room.code, aliceId);

      restartGame(room.code, aliceId);

      const roomData = getRoom(room.code)!;
      expect(roomData.status).toBe("lobby");
    });
  });

  describe("snapshot fields", () => {
    it("includes hostId in snapshot", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const snap = toRoomSnapshot(room, participantId);
      expect(snap.hostId).toBe(participantId);
    });

    it("includes scores in snapshot", () => {
      const { room, participantId } = createRoom("Alice");
      const snap = toRoomSnapshot(room, participantId);
      expect(snap.scores[participantId]).toBe(0);
    });

    it("includes drawerId in snapshot", () => {
      const { room, participantId: aliceId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const { room: started } = startGame(room.code, aliceId);
      const snap = toRoomSnapshot(started, aliceId);
      expect(snap.drawerId).toBe(aliceId);
    });
  });

  describe("multi-room isolation", () => {
    it("rooms have unique codes", () => {
      const r1 = createRoom("Alice");
      const r2 = createRoom("Bob");
      expect(r1.room.code).not.toBe(r2.room.code);
    });

    it("participants are isolated to their own room", () => {
      const r1 = createRoom("Alice");
      const r2 = createRoom("Bob");

      expect(r1.room.participants).toHaveLength(1);
      expect(r1.room.participants[0].name).toBe("Alice");
      expect(r2.room.participants[0].name).toBe("Bob");
    });

    it("joining one room does not affect others", () => {
      const r1 = createRoom("Alice");
      const r2 = createRoom("Bob");

      joinRoom(r1.room.code, "Charlie");

      const r1Snap = getRoom(r1.room.code)!;
      const r2Snap = getRoom(r2.room.code)!;

      expect(r1Snap.participants).toHaveLength(2);
      expect(r2Snap.participants).toHaveLength(1);
    });
  });
});
