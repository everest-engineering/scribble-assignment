import { describe, expect, it } from "vitest";
import type { Room } from "../models/game.js";
import { STARTER_WORDS } from "../seed/starterData.js";
import {
  createRoom,
  endRound,
  joinRoom,
  selectWord,
  startRoom,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";

function unwrapJoin(
  result: ReturnType<typeof joinRoom>
): { room: Room; participantId: string } {
  if (result === null || "error" in result) {
    throw new Error(`expected join success, got ${JSON.stringify(result)}`);
  }
  return result;
}

function unwrapStart(
  result: ReturnType<typeof startRoom>
): { room: Room; participantId: string } {
  if (result === null || "error" in result) {
    throw new Error(`expected start success, got ${JSON.stringify(result)}`);
  }
  return result;
}

function unwrapGuess(
  result: ReturnType<typeof submitGuess>
): { room: Room; guessId: string } {
  if (result === null || "error" in result) {
    throw new Error(`expected guess success, got ${JSON.stringify(result)}`);
  }
  return result;
}

function unwrapEndRound(
  result: ReturnType<typeof endRound>
): { room: Room } {
  if (result === null || "error" in result) {
    throw new Error(`expected endRound success, got ${JSON.stringify(result)}`);
  }
  return result;
}


function setupActiveRoom(): {
  hostId: string;
  guestId: string;
  code: string;
  secretWord: string;
} {
  const host = createRoom("Alice");
  const guest = (joinRoom(host.room.code, "Bob") as unknown) as {
    room: Room;
    participantId: string;
  };
  const started = unwrapStart(startRoom(host.room.code, host.participantId));
  return {
    hostId: host.participantId,
    guestId: guest.participantId,
    code: host.room.code,
    secretWord: started.room.currentRound!.secretWord
  };
}

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code and host designation", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
    expect(result.room.hostParticipantId).toBe(result.participantId);
    expect(result.room.currentRound).toBeNull();
    expect(result.room.status).toBe("lobby");
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("two rooms created in sequence have isolated participant lists", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Carol");

    expect(roomA.room.code).not.toBe(roomB.room.code);

    const idsInA = roomA.room.participants.map((p) => p.id);
    const idsInB = roomB.room.participants.map((p) => p.id);

    expect(idsInA).not.toContain(roomB.participantId);
    expect(idsInB).not.toContain(roomA.participantId);
    expect(roomA.room.hostParticipantId).not.toBe(roomB.room.hostParticipantId);
  });

  it("joinRoom appends a non-host participant and keeps the original host", () => {
    const created = createRoom("Alice");
    const joined = unwrapJoin(joinRoom(created.room.code, "Bob"));

    expect(joined.participantId).not.toBe(created.participantId);
    expect(joined.room.hostParticipantId).toBe(created.participantId);
    expect(joined.room.participants.map((p) => p.id)).toEqual([
      created.participantId,
      joined.participantId
    ]);
  });

  it("two rooms joined by different players keep their participant lists isolated", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Carol");

    const aJoiner = unwrapJoin(joinRoom(roomA.room.code, "Bob"));
    const bJoiner = unwrapJoin(joinRoom(roomB.room.code, "Dave"));

    const aIds = aJoiner.room.participants.map((p) => p.id);
    const bIds = bJoiner.room.participants.map((p) => p.id);

    expect(aIds).not.toContain(bJoiner.participantId);
    expect(bIds).not.toContain(aJoiner.participantId);
    expect(aIds).not.toContain(roomB.participantId);
    expect(bIds).not.toContain(roomA.participantId);
  });

  describe("selectWord (T003 a)", () => {
    it("returns the same word for the same code across many invocations", () => {
      const first = selectWord("ABCD");
      for (let i = 0; i < 50; i += 1) {
        expect(selectWord("ABCD")).toBe(first);
      }
    });

    it("always returns a STARTER_WORDS member for any 4-letter A-Z code", () => {
      const sample = ["AAAA", "ABCD", "ZZZZ", "MNOP", "QRST"];
      for (const code of sample) {
        expect(STARTER_WORDS).toContain(selectWord(code));
      }
    });
  });

  describe("startRoom (T003 b-e)", () => {
    it("with 2+ players transitions to playing with the host as drawer", () => {
      const host = createRoom("Alice");
      unwrapJoin(joinRoom(host.room.code, "Bob"));

      const started = unwrapStart(startRoom(host.room.code, host.participantId));

      expect(started.room.status).toBe("playing");
      expect(started.room.currentRound).not.toBeNull();
      expect(started.room.currentRound!.drawerParticipantId).toBe(host.participantId);
      expect(STARTER_WORDS).toContain(started.room.currentRound!.secretWord);
    });

    it("rejects a non-host caller with a not-host sentinel; room stays in lobby", () => {
      const host = createRoom("Alice");
      const guest = unwrapJoin(joinRoom(host.room.code, "Bob"));

      const result = startRoom(host.room.code, guest.participantId);

      expect(result).toEqual({ error: "not-host" });
    });

    it("rejects a single-player room with a needs-quorum sentinel", () => {
      const host = createRoom("Alice");

      const result = startRoom(host.room.code, host.participantId);

      expect(result).toEqual({ error: "needs-quorum" });
    });

    it("is idempotent: re-calling as host on a playing room returns the same currentRound", () => {
      const host = createRoom("Alice");
      unwrapJoin(joinRoom(host.room.code, "Bob"));

      const first = unwrapStart(startRoom(host.room.code, host.participantId));
      const second = unwrapStart(startRoom(host.room.code, host.participantId));

      expect(second.room.status).toBe("playing");
      expect(second.room.currentRound).toEqual(first.room.currentRound);
    });

    it("returns null for an unknown room code", () => {
      const result = startRoom("ZZZZ", "anything");

      expect(result).toBeNull();
    });
  });

  describe("toRoomSnapshot visibility filter (T003 f-g)", () => {
    it("delivers the real secretWord to the drawer's snapshot", () => {
      const host = createRoom("Alice");
      unwrapJoin(joinRoom(host.room.code, "Bob"));
      const started = unwrapStart(startRoom(host.room.code, host.participantId));

      const snapshot = toRoomSnapshot(started.room, host.participantId);

      expect(snapshot.currentRound).not.toBeNull();
      expect(snapshot.currentRound!.secretWord).toBe(started.room.currentRound!.secretWord);
      expect(STARTER_WORDS).toContain(snapshot.currentRound!.secretWord!);
    });

    it("filters secretWord to null for non-drawer viewers", () => {
      const host = createRoom("Alice");
      const guest = unwrapJoin(joinRoom(host.room.code, "Bob"));
      const started = unwrapStart(startRoom(host.room.code, host.participantId));

      const guestSnapshot = toRoomSnapshot(started.room, guest.participantId);
      const unknownSnapshot = toRoomSnapshot(started.room, "no-such-id");
      const anonSnapshot = toRoomSnapshot(started.room, undefined);

      expect(guestSnapshot.currentRound!.secretWord).toBeNull();
      expect(unknownSnapshot.currentRound!.secretWord).toBeNull();
      expect(anonSnapshot.currentRound!.secretWord).toBeNull();
    });

    it("reports currentRound as null when the room is still in lobby", () => {
      const host = createRoom("Alice");

      const snapshot = toRoomSnapshot(host.room, host.participantId);

      expect(snapshot.currentRound).toBeNull();
    });
  });

  describe("joinRoom rejection while playing (T003 h)", () => {
    it("returns a room-not-open sentinel when joining a playing room", () => {
      const host = createRoom("Alice");
      unwrapJoin(joinRoom(host.room.code, "Bob"));
      unwrapStart(startRoom(host.room.code, host.participantId));

      const lateJoin = joinRoom(host.room.code, "Carol");

      expect(lateJoin).toEqual({ error: "room-not-open" });
    });
  });

  describe("submitGuess scoring + cap (T006 a-h)", () => {
    it("appends a correct guess and bumps the guesser's score to 100", () => {
      const { code, guestId, secretWord } = setupActiveRoom();

      const result = unwrapGuess(submitGuess(code, guestId, secretWord));

      expect(result.room.guesses).toHaveLength(1);
      const entry = result.room.guesses[0];
      expect(entry.guesserParticipantId).toBe(guestId);
      expect(entry.text).toBe(secretWord);
      expect(entry.isCorrect).toBe(true);
      expect(entry.order).toBe(0);

      const guesser = result.room.participants.find((p) => p.id === guestId);
      expect(guesser?.score).toBe(100);
    });

    it("caps score at 100: a second correct guess by the same participant does not bump the score", () => {
      const { code, guestId, secretWord } = setupActiveRoom();

      unwrapGuess(submitGuess(code, guestId, secretWord));
      const second = unwrapGuess(submitGuess(code, guestId, secretWord));

      expect(second.room.guesses).toHaveLength(2);
      expect(second.room.guesses[1].isCorrect).toBe(true);
      expect(second.room.guesses[1].order).toBe(1);

      const guesser = second.room.participants.find((p) => p.id === guestId);
      expect(guesser?.score).toBe(100);
    });

    it("trims surrounding whitespace, preserves original casing, and matches case-insensitively", () => {
      const { code, guestId, secretWord } = setupActiveRoom();
      const mixedCase = secretWord
        .split("")
        .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
        .join("");
      const padded = `  ${mixedCase}  `;

      const result = unwrapGuess(submitGuess(code, guestId, padded.trim()));

      expect(result.room.guesses[0].text).toBe(mixedCase);
      expect(result.room.guesses[0].isCorrect).toBe(true);
    });

    it("records an incorrect guess without changing the score", () => {
      const { code, guestId } = setupActiveRoom();

      const result = unwrapGuess(submitGuess(code, guestId, "definitely-wrong"));

      expect(result.room.guesses[0].isCorrect).toBe(false);
      const guesser = result.room.participants.find((p) => p.id === guestId);
      expect(guesser?.score).toBe(0);
    });

    it("rejects a guess from the drawer with an is-drawer sentinel", () => {
      const { code, hostId, secretWord } = setupActiveRoom();

      const result = submitGuess(code, hostId, secretWord);

      expect(result).toEqual({ error: "is-drawer" });
    });

    it("rejects a guess against a lobby-state room with a not-playing sentinel", () => {
      const host = createRoom("Alice");
      unwrapJoin(joinRoom(host.room.code, "Bob"));

      const result = submitGuess(host.room.code, host.participantId, "rocket");

      expect(result).toEqual({ error: "not-playing" });
    });

    it("returns null for an unknown room code", () => {
      const result = submitGuess("ZZZZ", "anyone", "rocket");

      expect(result).toBeNull();
    });

    it("startRoom resets every participant's score to 0 and initializes guesses to []", () => {
      const { code, guestId, secretWord, hostId } = setupActiveRoom();
      unwrapGuess(submitGuess(code, guestId, secretWord));

      const replayed = unwrapStart(startRoom(code, hostId));
      expect(replayed.room.guesses.length).toBeGreaterThan(0);
      expect(
        replayed.room.participants.find((p) => p.id === guestId)?.score
      ).toBe(100);

      const freshHost = createRoom("Carol");
      const freshGuest = unwrapJoin(joinRoom(freshHost.room.code, "Dave"));
      const freshStart = unwrapStart(
        startRoom(freshHost.room.code, freshHost.participantId)
      );
      expect(freshStart.room.guesses).toEqual([]);
      expect(
        freshStart.room.participants.every((p) => p.score === 0)
      ).toBe(true);
      expect(freshGuest.room.code).toBe(freshHost.room.code);
    });
  });

  describe("toRoomSnapshot guess-text redaction filter (T006 i-l)", () => {
    it("delivers the real text to the original guesser for their own correct entries", () => {
      const { code, guestId, secretWord } = setupActiveRoom();
      const result = unwrapGuess(submitGuess(code, guestId, secretWord));

      const snapshot = toRoomSnapshot(result.room, guestId);

      expect(snapshot.guesses[0].text).toBe(secretWord);
      expect(snapshot.guesses[0].isCorrect).toBe(true);
    });

    it("delivers the real text to the drawer for every correct entry, regardless of guesser", () => {
      const { code, hostId, guestId, secretWord } = setupActiveRoom();
      const result = unwrapGuess(submitGuess(code, guestId, secretWord));

      const snapshot = toRoomSnapshot(result.room, hostId);

      expect(snapshot.guesses[0].text).toBe(secretWord);
    });

    it("redacts correct-guess text for third-party viewers and preserves incorrect text", () => {
      const { code, guestId, secretWord } = setupActiveRoom();
      unwrapGuess(submitGuess(code, guestId, secretWord));
      const result = unwrapGuess(submitGuess(code, guestId, "wrong-guess"));

      const thirdPartyId = "no-such-id";
      const snapshot = toRoomSnapshot(result.room, thirdPartyId);

      expect(snapshot.guesses[0].text).toBeNull();
      expect(snapshot.guesses[0].isCorrect).toBe(true);
      expect(snapshot.guesses[1].text).toBe("wrong-guess");
      expect(snapshot.guesses[1].isCorrect).toBe(false);
    });

    it("treats an undefined viewer as non-privileged and redacts correct entries", () => {
      const { code, guestId, secretWord } = setupActiveRoom();
      const result = unwrapGuess(submitGuess(code, guestId, secretWord));

      const snapshot = toRoomSnapshot(result.room, undefined);

      expect(snapshot.guesses[0].text).toBeNull();
    });
  });

  describe("endRound state transition (T003 a-e)", () => {
    it("from playing state transitions to result and preserves currentRound + guesses + scores", () => {
      const { code, hostId, guestId, secretWord } = setupActiveRoom();
      unwrapGuess(submitGuess(code, guestId, secretWord));

      const ended = unwrapEndRound(endRound(code, hostId));

      expect(ended.room.status).toBe("result");
      expect(ended.room.currentRound).not.toBeNull();
      expect(ended.room.currentRound!.secretWord).toBe(secretWord);
      expect(ended.room.guesses).toHaveLength(1);
      const guesser = ended.room.participants.find((p) => p.id === guestId);
      expect(guesser?.score).toBe(100);
    });

    it("rejects a non-host caller with a not-host sentinel", () => {
      const { code, guestId } = setupActiveRoom();

      const result = endRound(code, guestId);

      expect(result).toEqual({ error: "not-host" });
    });

    it("rejects a call against a lobby-state room with a wrong-state sentinel", () => {
      const host = createRoom("Alice");

      const result = endRound(host.room.code, host.participantId);

      expect(result).toEqual({ error: "wrong-state" });
    });

    it("rejects a call against an already-result room with a wrong-state sentinel", () => {
      const { code, hostId } = setupActiveRoom();
      unwrapEndRound(endRound(code, hostId));

      const second = endRound(code, hostId);

      expect(second).toEqual({ error: "wrong-state" });
    });

    it("returns null for an unknown room code", () => {
      const result = endRound("ZZZZ", "anyone");

      expect(result).toBeNull();
    });
  });

  describe("toRoomSnapshot result-state reveal (T003 f-h)", () => {
    it("delivers the real secretWord to every viewer when status is result", () => {
      const { code, hostId, guestId, secretWord } = setupActiveRoom();
      unwrapGuess(submitGuess(code, guestId, secretWord));
      const ended = unwrapEndRound(endRound(code, hostId));

      const hostSnap = toRoomSnapshot(ended.room, hostId);
      const guestSnap = toRoomSnapshot(ended.room, guestId);
      const unknownSnap = toRoomSnapshot(ended.room, "no-such-id");
      const anonSnap = toRoomSnapshot(ended.room, undefined);

      expect(hostSnap.currentRound!.secretWord).toBe(secretWord);
      expect(guestSnap.currentRound!.secretWord).toBe(secretWord);
      expect(unknownSnap.currentRound!.secretWord).toBe(secretWord);
      expect(anonSnap.currentRound!.secretWord).toBe(secretWord);
    });

    it("delivers the real guess text to every viewer when status is result, including for correct entries", () => {
      const { code, hostId, guestId, secretWord } = setupActiveRoom();
      unwrapGuess(submitGuess(code, guestId, secretWord));
      unwrapGuess(submitGuess(code, guestId, "wrong-guess"));
      const ended = unwrapEndRound(endRound(code, hostId));

      const thirdPartyId = "no-such-id";
      const thirdPartySnap = toRoomSnapshot(ended.room, thirdPartyId);

      expect(thirdPartySnap.guesses[0].text).toBe(secretWord);
      expect(thirdPartySnap.guesses[0].isCorrect).toBe(true);
      expect(thirdPartySnap.guesses[1].text).toBe("wrong-guess");
      expect(thirdPartySnap.guesses[1].isCorrect).toBe(false);
    });

    it("REGRESSION: playing-state Scenarios 2 + 3 redactions remain unchanged after the result-state override is added", () => {
      const { code, guestId, secretWord } = setupActiveRoom();
      const result = unwrapGuess(submitGuess(code, guestId, secretWord));

      const thirdPartyId = "no-such-id";
      const snapshot = toRoomSnapshot(result.room, thirdPartyId);

      expect(snapshot.status).toBe("playing");
      expect(snapshot.currentRound!.secretWord).toBeNull();
      expect(snapshot.guesses[0].text).toBeNull();
      expect(snapshot.guesses[0].isCorrect).toBe(true);
    });
  });

});
