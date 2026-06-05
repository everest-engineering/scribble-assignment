import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, restartGame, startRound, submitGuess } from "./roomStore.js";
import { STARTER_WORDS } from "../seed/starterData.js";

function startedRoom() {
  const host = createRoom("Alice");
  const guest = joinRoom(host.room.code, "Bob");
  startRound(host.room.code, host.participantId);
  return { code: host.room.code, hostId: host.participantId, guestId: guest!.participantId };
}

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

  it("createRoom designates the creator as host and starts the score at 0", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.status).toBe("lobby");
    expect(result.room.round).toBeNull();
    expect(result.room.participants[0].score).toBe(0);
  });

  it("keeps rooms isolated — joining one room does not affect another", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Bob");

    joinRoom(roomA.room.code, "Carol");

    expect(getRoom(roomA.room.code)?.participants).toHaveLength(2);
    expect(getRoom(roomB.room.code)?.participants).toHaveLength(1);
  });

  it("startRound rejects a non-host caller", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");

    const result = startRound(host.room.code, "not-the-host");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
    }
  });

  it("startRound rejects starting with fewer than 2 players", () => {
    const host = createRoom("Alice");

    const result = startRound(host.room.code, host.participantId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("startRound assigns the host as drawer and selects the word deterministically", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");

    const first = startRound(host.room.code, host.participantId);
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.room.status).toBe("active");
      expect(first.room.round?.drawerId).toBe(host.participantId);
      expect(first.room.round?.word).toBe(STARTER_WORDS[0]);
    }

    // Deterministic: same starting conditions → same word.
    const other = createRoom("Carol");
    joinRoom(other.room.code, "Dave");
    const second = startRound(other.room.code, other.participantId);
    if (second.ok) {
      expect(second.room.round?.word).toBe(STARTER_WORDS[0]);
    }
  });

  it("submitGuess rejects empty/whitespace-only guesses", () => {
    const { code, guestId } = startedRoom();

    const result = submitGuess(code, guestId, "   ");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("submitGuess matches the word case- and whitespace-insensitively and scores 100", () => {
    const { code, guestId } = startedRoom();

    const result = submitGuess(code, guestId, `  ${STARTER_WORDS[0].toUpperCase()} `);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const guest = result.room.participants.find((participant) => participant.id === guestId);
      expect(guest?.score).toBe(100);
      expect(result.room.round?.guesses.at(-1)?.correct).toBe(true);
    }
  });

  it("submitGuess records an incorrect guess with no points and keeps it in history", () => {
    const { code, guestId } = startedRoom();

    const result = submitGuess(code, guestId, "definitely-wrong");

    expect(result.ok).toBe(true);
    if (result.ok) {
      const guest = result.room.participants.find((participant) => participant.id === guestId);
      expect(guest?.score).toBe(0);
      expect(result.room.round?.guesses).toHaveLength(1);
      expect(result.room.round?.guesses[0].correct).toBe(false);
    }
  });

  it("transitions the room to the result state on a correct guess", () => {
    const { code, guestId } = startedRoom();

    const result = submitGuess(code, guestId, STARTER_WORDS[0]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.room.status).toBe("result");
    }
  });

  it("restartGame rejects a non-host caller", () => {
    const { code, guestId } = startedRoom();

    const result = restartGame(code, guestId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
    }
  });

  it("restartGame returns to the lobby, clears the round, resets scores, and keeps the roster", () => {
    const { code, hostId, guestId } = startedRoom();
    submitGuess(code, guestId, STARTER_WORDS[0]);

    const result = restartGame(code, hostId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.room.status).toBe("lobby");
      expect(result.room.round).toBeNull();
      expect(result.room.participants).toHaveLength(2);
      expect(result.room.participants.every((participant) => participant.score === 0)).toBe(true);
    }
  });
});
