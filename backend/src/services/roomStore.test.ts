import { describe, expect, it } from "vitest";
import {
  createRoom,
  joinRoom,
  restartGame,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom marks the creator as the host", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("joinRoom preserves the original host", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");

    expect(joined).not.toBeNull();
    expect(joined?.room.hostId).toBe(created.participantId);
    expect(joined?.participantId).not.toBe(created.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  describe("startGame", () => {
    function roomWithTwoPlayers() {
      const created = createRoom("Alice");
      joinRoom(created.room.code, "Bob");
      return created;
    }

    it("assigns the host as drawer and selects a secret word", () => {
      const created = roomWithTwoPlayers();
      const result = startGame(created.room.code, created.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.status).toBe("playing");
        expect(result.room.drawerId).toBe(created.participantId);
        expect(result.room.secretWord).not.toBeNull();
      }
    });

    it("reveals the word only to the drawer", () => {
      const created = roomWithTwoPlayers();
      const result = startGame(created.room.code, created.participantId);
      if (!result.ok) throw new Error("expected start to succeed");

      const drawerView = toRoomSnapshot(result.room, created.participantId);
      const guesserView = toRoomSnapshot(result.room, "someone-else");

      expect(drawerView.word).toBe(result.room.secretWord);
      expect(guesserView.word).toBeNull();
    });

    it("rejects a non-host requester", () => {
      const created = roomWithTwoPlayers();
      const result = startGame(created.room.code, "not-the-host");

      expect(result).toEqual({ ok: false, error: "forbidden" });
    });

    it("rejects starting with fewer than 2 players", () => {
      const created = createRoom("Alice");
      const result = startGame(created.room.code, created.participantId);

      expect(result).toEqual({ ok: false, error: "too_few_players" });
    });

    it("rejects starting a room that is already playing", () => {
      const created = roomWithTwoPlayers();
      startGame(created.room.code, created.participantId);
      const second = startGame(created.room.code, created.participantId);

      expect(second).toEqual({ ok: false, error: "not_lobby" });
    });
  });

  describe("submitGuess", () => {
    function playingRoom() {
      const created = createRoom("Alice");
      const guest = joinRoom(created.room.code, "Bob");
      if (!guest) throw new Error("join failed");
      const started = startGame(created.room.code, created.participantId);
      if (!started.ok) throw new Error("start failed");
      return {
        code: created.room.code,
        hostId: created.participantId,
        guestId: guest.participantId,
        word: started.room.secretWord as string
      };
    }

    it("awards 100 for a correct guess, ignoring case and spaces", () => {
      const game = playingRoom();
      const result = submitGuess(game.code, game.guestId, `  ${game.word.toUpperCase()}  `);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.guess.correct).toBe(true);
        const guesser = result.room.participants.find((p) => p.id === game.guestId);
        expect(guesser?.score).toBe(100);
      }
    });

    it("awards 0 and records an incorrect guess", () => {
      const game = playingRoom();
      const result = submitGuess(game.code, game.guestId, "definitely-wrong");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.guess.correct).toBe(false);
        const guesser = result.room.participants.find((p) => p.id === game.guestId);
        expect(guesser?.score).toBe(0);
      }
    });

    it("rejects a guess from the drawer", () => {
      const game = playingRoom();
      const result = submitGuess(game.code, game.hostId, game.word);

      expect(result).toEqual({ ok: false, error: "drawer_cannot_guess" });
    });

    it("rejects a guess when the room is not playing", () => {
      const created = createRoom("Alice");
      const guest = joinRoom(created.room.code, "Bob");
      const result = submitGuess(created.room.code, guest!.participantId, "rocket");

      expect(result).toEqual({ ok: false, error: "not_playing" });
    });

    it("accumulates guesses in order in the history", () => {
      const game = playingRoom();
      submitGuess(game.code, game.guestId, "first");
      const second = submitGuess(game.code, game.guestId, "second");

      if (!second.ok) throw new Error("expected guess to be recorded");
      expect(second.room.guesses.map((g) => g.text)).toEqual(["first", "second"]);
    });

    it("ends the round on a correct guess and reveals the word to everyone", () => {
      const game = playingRoom();
      const result = submitGuess(game.code, game.guestId, game.word);

      if (!result.ok) throw new Error("expected guess to succeed");
      expect(result.room.status).toBe("ended");
      expect(toRoomSnapshot(result.room, game.guestId).word).toBe(game.word);
      expect(toRoomSnapshot(result.room, "any-viewer").word).toBe(game.word);
    });

    it("rejects further guesses once the round has ended", () => {
      const game = playingRoom();
      submitGuess(game.code, game.guestId, game.word);
      const after = submitGuess(game.code, game.guestId, "late");

      expect(after).toEqual({ ok: false, error: "not_playing" });
    });
  });

  describe("restartGame", () => {
    function endedRoom() {
      const created = createRoom("Alice");
      const guest = joinRoom(created.room.code, "Bob");
      if (!guest) throw new Error("join failed");
      const started = startGame(created.room.code, created.participantId);
      if (!started.ok) throw new Error("start failed");
      submitGuess(created.room.code, guest.participantId, started.room.secretWord as string);
      return { code: created.room.code, hostId: created.participantId, guestId: guest.participantId };
    }

    it("resets round state and preserves participants", () => {
      const game = endedRoom();
      const result = restartGame(game.code, game.hostId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.status).toBe("lobby");
        expect(result.room.drawerId).toBeNull();
        expect(result.room.secretWord).toBeNull();
        expect(result.room.guesses).toEqual([]);
        expect(result.room.participants).toHaveLength(2);
        expect(result.room.participants.every((p) => p.score === 0)).toBe(true);
      }
    });

    it("rejects a non-host requester", () => {
      const game = endedRoom();
      const result = restartGame(game.code, game.guestId);

      expect(result).toEqual({ ok: false, error: "forbidden" });
    });

    it("returns not_found for an unknown room", () => {
      expect(restartGame("ZZZZ", "whoever")).toEqual({ ok: false, error: "not_found" });
    });
  });
});
