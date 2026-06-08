import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRoom,
  endRound,
  joinRoom,
  pollRoom,
  restartRoom,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";

// Start a 2-player room and return ids plus the secret word for guessing tests.
function startedRoomWithGuesser() {
  const { room, participantId: hostId } = createRoom("Host");
  const joined = joinRoom(room.code, "Guest");
  const guestId = "participantId" in joined ? joined.participantId : "";
  const started = startGame(room.code, hostId);
  const startedRoom = "room" in started ? started.room : room;
  const word = startedRoom.round?.word ?? "";

  return { code: room.code, hostId, guestId, word };
}

describe("roomStore", () => {
  it("createRoom returns a 4-character uppercase code and assigns the creator as host", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.hostId).toBe(result.participantId);
  });

  it("joinRoom reports not_found for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toEqual({ failure: "not_found" });
  });

  it("joinRoom disambiguates duplicate display names within a room", () => {
    const { room } = createRoom("Sam");
    const joined = joinRoom(room.code, "Sam");

    expect("room" in joined).toBe(true);
    if ("room" in joined) {
      expect(joined.room.participants.map((participant) => participant.name)).toEqual([
        "Sam",
        "Sam (2)"
      ]);
    }
  });

  it("joinRoom rejects a full room (max 8 players)", () => {
    const { room } = createRoom("Host");
    for (let index = 0; index < 7; index += 1) {
      joinRoom(room.code, `Player ${index}`);
    }

    expect(joinRoom(room.code, "Late")).toEqual({ failure: "full" });
  });

  it("joinRoom rejects a room whose game has already started", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Second");
    startGame(room.code, participantId);

    expect(joinRoom(room.code, "Late")).toEqual({ failure: "started" });
  });

  describe("startGame guards", () => {
    it("rejects a non-host requester", () => {
      const { room } = createRoom("Host");
      const joined = joinRoom(room.code, "Guest");
      const guestId = "participantId" in joined ? joined.participantId : "";

      expect(startGame(room.code, guestId)).toEqual({ failure: "not_host" });
    });

    it("rejects starting with fewer than two players", () => {
      const { room, participantId } = createRoom("Solo");

      expect(startGame(room.code, participantId)).toEqual({ failure: "too_few" });
    });

    it("starts when the host has at least two players", () => {
      const { room, participantId } = createRoom("Host");
      joinRoom(room.code, "Second");

      const result = startGame(room.code, participantId);

      expect("room" in result).toBe(true);
      if ("room" in result) {
        expect(result.room.status).toBe("playing");
      }
    });
  });

  describe("presence pruning", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("prunes a player who has not polled within the timeout", () => {
      vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
      const { room, participantId } = createRoom("Host");
      joinRoom(room.code, "Guest");

      vi.setSystemTime(new Date("2026-01-01T00:00:11.000Z"));
      const polled = pollRoom(room.code, participantId);

      expect(polled?.participants.map((participant) => participant.name)).toEqual(["Host"]);
    });

    it("closes the room when the host departs", () => {
      vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
      const { room } = createRoom("Host");
      const joined = joinRoom(room.code, "Guest");
      const guestId = "participantId" in joined ? joined.participantId : "";

      vi.setSystemTime(new Date("2026-01-01T00:00:11.000Z"));
      const polled = pollRoom(room.code, guestId);

      expect(polled).toBeNull();
    });
  });

  describe("round start, drawer and word reveal", () => {
    it("creates round 1 with the host as the drawer when the game starts", () => {
      const { room, participantId } = createRoom("Host");
      joinRoom(room.code, "Second");

      const result = startGame(room.code, participantId);

      expect("room" in result).toBe(true);
      if ("room" in result) {
        expect(result.room.round?.number).toBe(1);
        expect(result.room.round?.drawerId).toBe(participantId);
      }
    });

    it("reports round: null while the room is still in the lobby", () => {
      const { room, participantId } = createRoom("Host");

      const snapshot = toRoomSnapshot(room, participantId);

      expect(snapshot.round).toBeNull();
    });

    it("reveals the secret word to the drawer but not to guessers", () => {
      const { room, participantId } = createRoom("Host");
      const joined = joinRoom(room.code, "Guest");
      const guestId = "participantId" in joined ? joined.participantId : "";
      const started = startGame(room.code, participantId);
      const startedRoom = "room" in started ? started.room : room;
      const word = startedRoom.round?.word ?? "";

      const drawerView = toRoomSnapshot(startedRoom, participantId);
      const guesserView = toRoomSnapshot(startedRoom, guestId);

      // Drawer sees the full word (FR-006).
      expect(drawerView.round?.word).toBe(word);
      // Guesser never receives the word (FR-007), only the concealed form.
      expect(guesserView.round?.word).toBeUndefined();
      expect(guesserView.round?.wordLength).toBe(word.length);
      expect(guesserView.round?.maskedWord.replace(/\s/g, "")).toBe("_".repeat(word.length));
    });
  });

  describe("guessing and scoring", () => {
    it("awards 100 for a correct guess (trimmed, case-insensitive) and records it", () => {
      const { code, guestId, word } = startedRoomWithGuesser();

      const result = submitGuess(code, guestId, `  ${word.toUpperCase()} `);

      expect("room" in result).toBe(true);
      if ("room" in result) {
        const guesser = result.room.participants.find((participant) => participant.id === guestId);
        expect(guesser?.score).toBe(100);
        const last = result.room.round?.guesses.at(-1);
        expect(last?.correct).toBe(true);
        expect(last?.playerId).toBe(guestId);
      }
    });

    it("leaves the score at 0 for an incorrect guess and records the verbatim text", () => {
      const { code, guestId, word } = startedRoomWithGuesser();
      const wrong = `${word}xyz`;

      const result = submitGuess(code, guestId, wrong);

      expect("room" in result).toBe(true);
      if ("room" in result) {
        const guesser = result.room.participants.find((participant) => participant.id === guestId);
        expect(guesser?.score).toBe(0);
        const last = result.room.round?.guesses.at(-1);
        expect(last?.correct).toBe(false);
        expect(last?.text).toBe(wrong);
      }
    });

    it("awards the 100-point bonus at most once per player per round (FR-007)", () => {
      const { code, guestId, word } = startedRoomWithGuesser();

      submitGuess(code, guestId, word);
      const result = submitGuess(code, guestId, word);

      expect("room" in result).toBe(true);
      if ("room" in result) {
        const guesser = result.room.participants.find((participant) => participant.id === guestId);
        expect(guesser?.score).toBe(100);
      }
    });

    it("does not end the round on a correct guess — others can still score (FR-016)", () => {
      const { code, guestId, word } = startedRoomWithGuesser();

      const result = submitGuess(code, guestId, word);

      expect("room" in result).toBe(true);
      if ("room" in result) {
        expect(result.room.status).toBe("playing");
        expect(result.room.round).not.toBeNull();
      }
    });

    it("rejects a guess from the drawer (FR-014)", () => {
      const { code, hostId, word } = startedRoomWithGuesser();

      expect(submitGuess(code, hostId, word)).toEqual({ failure: "drawer" });
    });

    it("rejects a guess when the room is still in the lobby (FR-001)", () => {
      const { room } = createRoom("Host");
      const joined = joinRoom(room.code, "Guest");
      const guestId = "participantId" in joined ? joined.participantId : "";

      expect(submitGuess(room.code, guestId, "anything")).toEqual({ failure: "not_active" });
    });

    it("returns the same ordered guess history to every viewer (FR-010, SC-005)", () => {
      const { code, hostId, guestId, word } = startedRoomWithGuesser();
      submitGuess(code, guestId, "first");
      submitGuess(code, guestId, "second");
      submitGuess(code, guestId, word);
      const polled = pollRoom(code, hostId);

      const drawerIds = toRoomSnapshot(polled ?? ({} as never), hostId).round?.guesses.map((g) => g.id);
      const guesserIds = toRoomSnapshot(polled ?? ({} as never), guestId).round?.guesses.map((g) => g.id);

      expect(drawerIds).toEqual(guesserIds);
      expect(drawerIds).toHaveLength(3);
    });

    it("masks correct guesses in the snapshot for every viewer (FR-011, SC-008)", () => {
      const { code, hostId, guestId, word } = startedRoomWithGuesser();
      submitGuess(code, guestId, word);
      const polled = pollRoom(code, hostId);

      const drawerView = toRoomSnapshot(polled ?? ({} as never), hostId);
      const guesserView = toRoomSnapshot(polled ?? ({} as never), guestId);
      const correctInDrawer = drawerView.round?.guesses.find((guess) => guess.correct);
      const correctInGuesser = guesserView.round?.guesses.find((guess) => guess.correct);

      expect(correctInDrawer?.text).toBeUndefined();
      expect(correctInGuesser?.text).toBeUndefined();
    });
  });

  describe("ending the round (feature 004)", () => {
    it("moves the room to 'ended' and keeps the round when the host ends it (FR-001, FR-002)", () => {
      const { code, hostId } = startedRoomWithGuesser();

      const result = endRound(code, hostId);

      expect("room" in result).toBe(true);
      if ("room" in result) {
        expect(result.room.status).toBe("ended");
        expect(result.room.round).not.toBeNull();
      }
    });

    it("rejects ending the round for a non-host (FR-001)", () => {
      const { code, guestId } = startedRoomWithGuesser();

      expect(endRound(code, guestId)).toEqual({ failure: "not_host" });
    });

    it("rejects ending when there is no active round (FR-001)", () => {
      const { room, participantId } = createRoom("Host");

      expect(endRound(room.code, participantId)).toEqual({ failure: "not_active" });
    });

    it("reveals the word and full guess history to every viewer once ended (FR-003, FR-005, FR-006)", () => {
      const { code, hostId, guestId, word } = startedRoomWithGuesser();
      submitGuess(code, guestId, "wrong");
      submitGuess(code, guestId, word); // correct — masked while playing
      endRound(code, hostId);
      const polled = pollRoom(code, guestId);

      const guesserView = toRoomSnapshot(polled ?? ({} as never), guestId);
      // The non-drawer now sees the actual word (FR-003).
      expect(guesserView.round?.word).toBe(word);
      // Every guess, including the correct one, now carries its text (FR-005/6).
      const correct = guesserView.round?.guesses.find((guess) => guess.correct);
      expect(correct?.text).toBe(word);
    });
  });

  describe("restarting the game (feature 004)", () => {
    it("returns to a fresh lobby, clears the round and resets scores, preserving players + host (FR-009–FR-013)", () => {
      const { code, hostId, guestId, word } = startedRoomWithGuesser();
      submitGuess(code, guestId, word); // guest scores 100
      endRound(code, hostId);

      const result = restartRoom(code, hostId);

      expect("room" in result).toBe(true);
      if ("room" in result) {
        expect(result.room.status).toBe("lobby");
        expect(result.room.round).toBeNull();
        expect(result.room.participants.every((participant) => participant.score === 0)).toBe(true);
        expect(result.room.hostId).toBe(hostId);
        expect(result.room.participants.map((participant) => participant.id).sort()).toEqual(
          [hostId, guestId].sort()
        );
      }
    });

    it("rejects a restart from a non-host (FR-008)", () => {
      const { code, guestId, hostId } = startedRoomWithGuesser();
      endRound(code, hostId);

      expect(restartRoom(code, guestId)).toEqual({ failure: "not_host" });
    });

    it("is idempotent — restarting an already-lobby room is a no-op success (FR-014)", () => {
      const { code, hostId, guestId, word } = startedRoomWithGuesser();
      submitGuess(code, guestId, word);
      endRound(code, hostId);
      restartRoom(code, hostId);

      const result = restartRoom(code, hostId);

      expect("room" in result).toBe(true);
      if ("room" in result) {
        expect(result.room.status).toBe("lobby");
        expect(result.room.round).toBeNull();
        expect(result.room.participants.every((participant) => participant.score === 0)).toBe(true);
      }
    });
  });

  it("keeps rooms isolated from one another", () => {
    const a = createRoom("Alice");
    const b = createRoom("Bob");
    joinRoom(a.room.code, "Anna");

    const roomA = pollRoom(a.room.code, a.participantId);
    const roomB = pollRoom(b.room.code, b.participantId);

    expect(roomA?.participants.map((participant) => participant.name)).toEqual(["Alice", "Anna"]);
    expect(roomB?.participants.map((participant) => participant.name)).toEqual(["Bob"]);
  });
});
