import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, restartRoom, startGame, submitDraw, submitGuess, toRoomSnapshot } from "./roomStore.js";

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

  it("createRoom assigns hostId, trims name, and sets initial score to 0", () => {
    const result = createRoom("  Alice  ");
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.scores[result.participantId]).toBe(0);
  });

  it("joinRoom adds player, trims name, sets score to 0, and keeps hostId", () => {
    const creatorResult = createRoom("Alice");
    const code = creatorResult.room.code;

    const joinResult = joinRoom(code, "  Bob  ");
    expect(joinResult).not.toBeNull();
    if (joinResult) {
      expect(joinResult.room.participants).toHaveLength(2);
      expect(joinResult.room.participants[1].name).toBe("Bob");
      expect(joinResult.room.scores[joinResult.participantId]).toBe(0);
      expect(joinResult.room.hostId).toBe(creatorResult.participantId);
    }
  });

  it("startGame requires at least 2 players", () => {
    const result = createRoom("Alice");
    expect(() => startGame(result.room.code)).toThrow("Cannot start game with fewer than 2 players");
  });

  it("startGame sets status to playing, assigns drawer to host, and selects deterministic word", () => {
    const creatorResult = createRoom("Alice");
    const code = creatorResult.room.code;
    joinRoom(code, "Bob");

    const room = startGame(code);
    expect(room).not.toBeNull();
    if (room) {
      expect(room.status).toBe("playing");
      expect(room.drawerId).toBe(creatorResult.participantId);
      expect(room.secretWord).toBeDefined();
      expect(room.secretWord).not.toBeNull();
    }
  });

  it("toRoomSnapshot masks secretWord for guessers and reveals for drawer", () => {
    const creatorResult = createRoom("Alice");
    const code = creatorResult.room.code;
    const joinResult = joinRoom(code, "Bob");
    expect(joinResult).not.toBeNull();

    if (joinResult) {
      const room = startGame(code);
      expect(room).not.toBeNull();
      if (room) {
        // Drawer snapshot (Alice)
        const drawerSnapshot = toRoomSnapshot(room, creatorResult.participantId);
        expect(drawerSnapshot.viewerRole).toBe("drawer");
        expect(drawerSnapshot.secretWord).toBe(room.secretWord);

        // Guesser snapshot (Bob)
        const guesserSnapshot = toRoomSnapshot(room, joinResult.participantId);
        expect(guesserSnapshot.viewerRole).toBe("guesser");
        expect(guesserSnapshot.secretWord).toBeNull();
      }
    }
  });

  it("submitDraw saves canvasData", () => {
    const creatorResult = createRoom("Alice");
    const code = creatorResult.room.code;
    const canvasData = '[{"color":"red","width":5,"points":[{"x":10,"y":20}]}]';

    const room = submitDraw(code, canvasData);
    expect(room).not.toBeNull();
    if (room) {
      expect(room.canvasData).toBe(canvasData);
    }
  });

  it("submitGuess logs incorrect guess and does not award score", () => {
    const creatorResult = createRoom("Alice");
    const code = creatorResult.room.code;
    const joinResult = joinRoom(code, "Bob");
    expect(joinResult).not.toBeNull();

    if (joinResult) {
      startGame(code);
      const room = submitGuess(code, joinResult.participantId, "wrongguess");
      expect(room).not.toBeNull();
      if (room) {
        expect(room.guesses).toHaveLength(1);
        expect(room.guesses[0].text).toBe("wrongguess");
        expect(room.guesses[0].isCorrect).toBe(false);
        expect(room.scores[joinResult.participantId]).toBe(0);
        expect(room.status).toBe("playing");
      }
    }
  });

  it("submitGuess handles correct guess case-insensitively, awards score, and transitions status to result", () => {
    const creatorResult = createRoom("Alice");
    const code = creatorResult.room.code;
    const joinResult = joinRoom(code, "Bob");
    expect(joinResult).not.toBeNull();

    if (joinResult) {
      const playingRoom = startGame(code);
      expect(playingRoom).not.toBeNull();
      if (playingRoom) {
        const secret = playingRoom.secretWord || "";
        const guessText = `  ${secret.toUpperCase()}  `;

        const room = submitGuess(code, joinResult.participantId, guessText);
        expect(room).not.toBeNull();
        if (room) {
          expect(room.guesses).toHaveLength(1);
          expect(room.guesses[0].text).toBe(secret.toUpperCase());
          expect(room.guesses[0].isCorrect).toBe(true);
          expect(room.scores[joinResult.participantId]).toBe(100);
          expect(room.status).toBe("result");
        }
      }
    }
  });

  it("restartRoom resets game state, resets player scores to 0, and clears guesses/canvas", () => {
    const creatorResult = createRoom("Alice");
    const code = creatorResult.room.code;
    const joinResult = joinRoom(code, "Bob");
    expect(joinResult).not.toBeNull();

    if (joinResult) {
      const playingRoom = startGame(code);
      expect(playingRoom).not.toBeNull();
      if (playingRoom) {
        submitDraw(code, "[]");
        submitGuess(code, joinResult.participantId, playingRoom.secretWord || "");

        const room = restartRoom(code);
        expect(room).not.toBeNull();
        if (room) {
          expect(room.status).toBe("lobby");
          expect(room.drawerId).toBeNull();
          expect(room.secretWord).toBeNull();
          expect(room.canvasData).toBe("[]");
          expect(room.guesses).toHaveLength(0);
          expect(room.scores[creatorResult.participantId]).toBe(0);
          expect(room.scores[joinResult.participantId]).toBe(0);
          expect(room.participants).toHaveLength(2);
        }
      }
    }
  });
});
