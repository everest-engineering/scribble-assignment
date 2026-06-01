import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, restartGame, startGame, submitGuess, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.participants[0].role).toBe("guesser");
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("startGame assigns drawer role to host and guesser to others", () => {
    const host = createRoom("Host");
    const guest = joinRoom(host.room.code, "Guest");

    const result = startGame(host.room.code, host.participantId);

    expect(result.ok).toBe(true);
    const drawer = result.room!.participants.find((p) => p.role === "drawer");
    const guessers = result.room!.participants.filter((p) => p.role === "guesser");
    expect(drawer?.id).toBe(host.participantId);
    expect(drawer?.name).toBe("Host");
    expect(guessers).toHaveLength(1);
    expect(guessers[0].name).toBe("Guest");
  });

  it("startGame sets status to playing and selects first word", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guest");

    const result = startGame(host.room.code, host.participantId);

    expect(result.room!.status).toBe("playing");
    expect(result.room!.currentWord).toBe("rocket");
    expect(result.room!.currentRound).toBe(1);
  });

  it("startGame rejects non-host player", () => {
    const host = createRoom("Host");
    const guest = joinRoom(host.room.code, "Guest");

    const result = startGame(host.room.code, guest!.participantId);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Only the host can start the game");
  });

  it("startGame rejects when less than 2 players", () => {
    const host = createRoom("Host");

    const result = startGame(host.room.code, host.participantId);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("At least 2 players are required to start");
  });

  it("startGame rejects if game is already started", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guest");
    startGame(host.room.code, host.participantId);

    const result = startGame(host.room.code, host.participantId);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Game has already started");
  });

  it("toRoomSnapshot shows word to drawer and hides from guesser", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guest");
    const started = startGame(host.room.code, host.participantId);

    const drawerSnapshot = toRoomSnapshot(started.room!, host.participantId);
    expect(drawerSnapshot.currentWord).toBe("rocket");
    expect(drawerSnapshot.currentWordLength).toBe(6);

    const guestId = started.room!.participants.find((p) => p.name === "Guest")!.id;
    const guesserSnapshot = toRoomSnapshot(started.room!, guestId);
    expect(guesserSnapshot.currentWord).toBeNull();
    expect(guesserSnapshot.currentWordLength).toBe(6);
  });

  it("toRoomSnapshot includes currentRound in snapshot", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guest");
    const started = startGame(host.room.code, host.participantId);
    const snapshot = toRoomSnapshot(started.room!, host.participantId);

    expect(snapshot.currentRound).toBe(1);
  });

  it("toRoomSnapshot includes guesses and scores", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guest");
    const started = startGame(host.room.code, host.participantId);
    const snapshot = toRoomSnapshot(started.room!, host.participantId);

    expect(snapshot.guesses).toEqual([]);
    expect(snapshot.participants[0].score).toBe(0);
  });

  describe("submitGuess", () => {
    function setupGame() {
      const host = createRoom("Host");
      joinRoom(host.room.code, "Guest");
      const started = startGame(host.room.code, host.participantId);
      return { host, game: started.room! };
    }

    it("correct guess awards 100 points", () => {
      const { host, game } = setupGame();
      const guestId = game.participants.find((p) => p.name === "Guest")!.id;
      const result = submitGuess(host.room.code, guestId, "rocket");
      expect(result.ok).toBe(true);

      const guest = result.room!.participants.find((p) => p.id === guestId);
      expect(guest!.score).toBe(100);
    });

    it("incorrect guess awards 0 points", () => {
      const { host, game } = setupGame();
      const guestId = game.participants.find((p) => p.name === "Guest")!.id;
      const result = submitGuess(host.room.code, guestId, "wrong");
      expect(result.ok).toBe(true);

      const guest = result.room!.participants.find((p) => p.id === guestId);
      expect(guest!.score).toBe(0);
    });

    it("two different players guessing correctly each get 100 points", () => {
      const host = createRoom("Host");
      joinRoom(host.room.code, "Guest1");
      joinRoom(host.room.code, "Guest2");
      const started = startGame(host.room.code, host.participantId);
      const game = started.room!;

      const guest1Id = game.participants.find((p) => p.name === "Guest1")!.id;
      const guest2Id = game.participants.find((p) => p.name === "Guest2")!.id;
      const r1 = submitGuess(host.room.code, guest1Id, "rocket");
      const r2 = submitGuess(host.room.code, guest2Id, "rocket");

      expect(r1.room!.participants.find((p) => p.id === guest1Id)!.score).toBe(100);
      expect(r2.room!.participants.find((p) => p.id === guest2Id)!.score).toBe(100);
    });

    it("same player guessing correctly twice only gets 100 once", () => {
      const { host, game } = setupGame();
      const guestId = game.participants.find((p) => p.name === "Guest")!.id;
      submitGuess(host.room.code, guestId, "rocket");
      const result = submitGuess(host.room.code, guestId, "rocket");

      const guest = result.room!.participants.find((p) => p.id === guestId);
      expect(guest!.score).toBe(100);
    });

    it("empty guess is rejected", () => {
      const { host, game } = setupGame();
      const guestId = game.participants.find((p) => p.name === "Guest")!.id;
      const result = submitGuess(host.room.code, guestId, "");

      expect(result.ok).toBe(false);
    });

    it("whitespace-only guess is rejected", () => {
      const { host, game } = setupGame();
      const guestId = game.participants.find((p) => p.name === "Guest")!.id;
      const result = submitGuess(host.room.code, guestId, "   ");

      expect(result.ok).toBe(false);
    });

    it.each(["rocket", "ROCKET", "Rocket"])("case-insensitive matching: %s matches", (guess) => {
      const { host, game } = setupGame();
      const guestId = game.participants.find((p) => p.name === "Guest")!.id;
      const result = submitGuess(host.room.code, guestId, guess);

      expect(result.ok).toBe(true);
      expect(result.room!.guesses[0].correct).toBe(true);
    });

    it('" rocket " with surrounding spaces is trimmed and matches', () => {
      const { host, game } = setupGame();
      const guestId = game.participants.find((p) => p.name === "Guest")!.id;
      const result = submitGuess(host.room.code, guestId, "  rocket  ");

      expect(result.ok).toBe(true);
      expect(result.room!.guesses[0].correct).toBe(true);
    });

    it("drawer submitting a guess is rejected", () => {
      const { host, game } = setupGame();
      const result = submitGuess(host.room.code, host.participantId, "rocket");

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Drawer cannot submit guesses");
    });

    describe("restartGame", () => {
    function setupGame() {
      const host = createRoom("Host");
      joinRoom(host.room.code, "Guest");
      const started = startGame(host.room.code, host.participantId);
      const game = started.room!;
      const guestId = game.participants.find((p) => p.name === "Guest")!.id;
      submitGuess(host.room.code, guestId, "rocket");
      return { host, game };
    }

    it("restart clears current word, guesses, scores, and roles", () => {
      const { host } = setupGame();
      const result = restartGame(host.room.code, host.participantId);
      expect(result.ok).toBe(true);

      const room = result.room!;
      expect(room.status).toBe("lobby");
      expect(room.currentWord).toBeUndefined();
      expect(room.currentRound).toBeUndefined();
      expect(room.guesses).toEqual([]);
      for (const p of room.participants) {
        expect(p.score).toBe(0);
        expect(p.role).toBe("guesser");
      }
    });

    it("all players remain in the room after restart", () => {
      const { host } = setupGame();
      const result = restartGame(host.room.code, host.participantId);

      expect(result.room!.participants).toHaveLength(2);
      expect(result.room!.participants[0].name).toBe("Host");
      expect(result.room!.participants[1].name).toBe("Guest");
    });

    it("non-host cannot restart", () => {
      const { host, game } = setupGame();
      const guestId = game.participants.find((p) => p.name === "Guest")!.id;
      const result = restartGame(host.room.code, guestId);

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Only the host can restart the game");
    });

    it("restart works a second time", () => {
      const { host } = setupGame();
      restartGame(host.room.code, host.participantId);

      const result = restartGame(host.room.code, host.participantId);
      expect(result.ok).toBe(true);
      expect(result.room!.status).toBe("lobby");
    });

    it("toRoomSnapshot shows word to all when status is results", () => {
      const host = createRoom("Host");
      joinRoom(host.room.code, "Guest");
      const started = startGame(host.room.code, host.participantId);
      const room = started.room!;
      room.status = "results";

      const guestId = room.participants.find((p) => p.name === "Guest")!.id;
      const snapshot = toRoomSnapshot(room, guestId);
      expect(snapshot.currentWord).toBe("rocket");
    });
  });

  it("guess history is returned in snapshot", () => {
      const { host, game } = setupGame();
      const guestId = game.participants.find((p) => p.name === "Guest")!.id;
      submitGuess(host.room.code, guestId, "wrong");
      const result = submitGuess(host.room.code, guestId, "rocket");

      const snapshot = toRoomSnapshot(result.room!, host.participantId);
      expect(snapshot.guesses).toHaveLength(2);
      expect(snapshot.guesses[0].correct).toBe(false);
      expect(snapshot.guesses[1].correct).toBe(true);
      expect(snapshot.guesses[1].text).toBe("rocket");
      expect(snapshot.guesses[1].participantName).toBe("Guest");
    });
  });
});
