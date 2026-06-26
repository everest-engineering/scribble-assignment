import { describe, expect, it } from "vitest";
import { STARTER_WORDS } from "../seed/starterData.js";
import { addStrokes, advanceRound, clearStrokes, createRoom, getRoom, joinRoom, startGame, submitGuess, toRoomSnapshot } from "./roomStore.js";

function setupPlayingRoom() {
  const host = createRoom("Alice");
  const joiner = joinRoom(host.room.code, "Bob");
  const started = startGame(host.room.code);
  return { host, joiner: joiner!, started: started!, code: host.room.code, hostParticipantId: host.participantId, joinerParticipantId: joiner!.participantId };
}

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom assigns the creator as host", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("toRoomSnapshot includes hostId", () => {
    const { room, participantId } = createRoom("Alice");
    const snapshot = toRoomSnapshot(room, participantId);

    expect(snapshot.hostId).toBe(participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("startGame returns null for an unknown room code", () => {
    const result = startGame("ZZZZ");

    expect(result).toBeNull();
  });

  it("startGame transitions room status to playing", () => {
    const { room } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updated = startGame(room.code);

    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("playing");
  });

  it("startGame assigns drawerId to host", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updated = startGame(room.code);

    expect(updated!.drawerId).toBe(participantId);
  });

  it("startGame sets currentRound to 1", () => {
    const { room } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updated = startGame(room.code);

    expect(updated!.currentRound).toBe(1);
  });

  it("startGame sets secretWord to STARTER_WORDS[0]", () => {
    const { room } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updated = startGame(room.code);

    expect(updated!.secretWord).toBe(STARTER_WORDS[0]);
  });

  it("toRoomSnapshot includes currentRound and drawerId when playing", () => {
    const { room } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updated = startGame(room.code);
    const snapshot = toRoomSnapshot(updated!);

    expect(snapshot.currentRound).toBe(1);
    expect(snapshot.drawerId).toBe(updated!.drawerId);
  });

  it("toRoomSnapshot includes secretWord when viewer is the drawer", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updated = startGame(room.code);
    const snapshot = toRoomSnapshot(updated!, participantId);

    expect(snapshot.secretWord).toBe(STARTER_WORDS[0]);
  });

  it("toRoomSnapshot omits secretWord for non-drawer viewers", () => {
    const { room, participantId } = createRoom("Alice");
    const second = joinRoom(room.code, "Bob");

    const updated = startGame(room.code);
    const snapshot = toRoomSnapshot(updated!, second!.participantId);

    expect(snapshot.secretWord).toBeUndefined();
  });

  it("toRoomSnapshot omits secretWord when no viewerParticipantId given", () => {
    const { room } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updated = startGame(room.code);
    const snapshot = toRoomSnapshot(updated!);

    expect(snapshot.secretWord).toBeUndefined();
  });

  it("toRoomSnapshot does not include game fields in lobby state", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const snapshot = toRoomSnapshot(room, participantId);

    expect(snapshot.currentRound).toBeUndefined();
    expect(snapshot.drawerId).toBeUndefined();
    expect(snapshot.secretWord).toBeUndefined();
  });

  describe("addStrokes", () => {
    it("appends strokes to a playing room", () => {
      const { code, hostParticipantId } = setupPlayingRoom();
      const stroke = { id: "s1", points: [{ x: 0, y: 0 }, { x: 10, y: 10 }], color: "#000", width: 3 };

      const result = addStrokes(code, hostParticipantId, [stroke]);

      expect(result).not.toBeNull();
      expect(result!.strokes).toHaveLength(1);
      expect(result!.strokes[0].id).toBe("s1");
    });

    it("returns null for unknown room", () => {
      const result = addStrokes("ZZZZ", "p1", []);
      expect(result).toBeNull();
    });

    it("returns null when non-drawer tries to add strokes", () => {
      const { code, joinerParticipantId } = setupPlayingRoom();
      const result = addStrokes(code, joinerParticipantId, []);
      expect(result).toBeNull();
    });
  });

  describe("clearStrokes", () => {
    it("clears all strokes from a playing room", () => {
      const { code, hostParticipantId } = setupPlayingRoom();
      const stroke = { id: "s1", points: [{ x: 0, y: 0 }], color: "#000", width: 3 };
      addStrokes(code, hostParticipantId, [stroke]);

      const result = clearStrokes(code, hostParticipantId);

      expect(result).not.toBeNull();
      expect(result!.strokes).toEqual([]);
    });

    it("returns null for unknown room", () => {
      const result = clearStrokes("ZZZZ", "p1");
      expect(result).toBeNull();
    });

    it("returns null when non-drawer tries to clear", () => {
      const { code, joinerParticipantId } = setupPlayingRoom();
      const result = clearStrokes(code, joinerParticipantId);
      expect(result).toBeNull();
    });
  });

  describe("submitGuess", () => {
    it("returns correct for a matching guess (case-insensitive)", () => {
      const { code, joinerParticipantId } = setupPlayingRoom();
      const result = submitGuess(code, joinerParticipantId, STARTER_WORDS[0].toUpperCase());

      expect(result).not.toHaveProperty("error");
      if ("error" in result) return;
      expect(result.correct).toBe(true);
      expect(result.message).toBe("Correct!");
    });

    it("returns wrong for an incorrect guess", () => {
      const { code, joinerParticipantId } = setupPlayingRoom();
      const result = submitGuess(code, joinerParticipantId, "wrongguess");

      expect(result).not.toHaveProperty("error");
      if ("error" in result) return;
      expect(result.correct).toBe(false);
      expect(result.message).toBe("Wrong guess");
    });

    it("rejects empty guess", () => {
      const { code, joinerParticipantId } = setupPlayingRoom();
      const result = submitGuess(code, joinerParticipantId, "   ");

      expect(result).toHaveProperty("error");
    });

    it("rejects guess from drawer", () => {
      const { code, hostParticipantId } = setupPlayingRoom();
      const result = submitGuess(code, hostParticipantId, "anything");

      expect(result).toHaveProperty("error");
    });

    it("rejects subsequent correct guess after round ended", () => {
      const { code, joinerParticipantId } = setupPlayingRoom();
      submitGuess(code, joinerParticipantId, STARTER_WORDS[0]);

      const result = submitGuess(code, joinerParticipantId, STARTER_WORDS[0]);
      expect(result).toHaveProperty("error");
    });

    it("records a GuessEntry with correct score values", () => {
      const { code, joinerParticipantId } = setupPlayingRoom();
      const result = submitGuess(code, joinerParticipantId, STARTER_WORDS[0]);

      if ("error" in result) return;
      expect(result.guessEntry.correct).toBe(true);
      expect(result.guessEntry.roundScoreAfter).toBe(100);
      expect(result.guessEntry.cumulativeScoreAfter).toBe(100);
    });

    it("advances round on correct guess", () => {
      const { code, joinerParticipantId, hostParticipantId } = setupPlayingRoom();
      submitGuess(code, joinerParticipantId, STARTER_WORDS[0]);

      const room = toRoomSnapshot(getRoom(code)!, hostParticipantId);
      if (!("currentRound" in room)) return;
      expect(room.currentRound).toBe(2);
    });
  });

  describe("advanceRound", () => {
    it("increments currentRound", () => {
      const { code } = setupPlayingRoom();

      advanceRound(code);
      const room = getRoom(code);

      expect(room!.currentRound).toBe(2);
    });

    it("sets next drawer via round-robin", () => {
      const { code, hostParticipantId, joinerParticipantId } = setupPlayingRoom();

      advanceRound(code);
      const room = getRoom(code);

      expect(room!.drawerId).toBe(joinerParticipantId);
    });

    it("selects next word from STARTER_WORDS", () => {
      const { code } = setupPlayingRoom();

      advanceRound(code);
      const room = getRoom(code);

      expect(room!.secretWord).toBe(STARTER_WORDS[1]);
    });

    it("clears strokes after advancing", () => {
      const { code, hostParticipantId } = setupPlayingRoom();
      addStrokes(code, hostParticipantId, [{ id: "s1", points: [{ x: 0, y: 0 }], color: "#000", width: 3 }]);

      advanceRound(code);
      const room = getRoom(code);

      expect(room!.strokes).toEqual([]);
    });

    it("resets roundScore to 0 for all participants", () => {
      const { code, joinerParticipantId } = setupPlayingRoom();
      submitGuess(code, joinerParticipantId, STARTER_WORDS[0]);

      const room = getRoom(code);
      expect(room!.scores[joinerParticipantId].roundScore).toBe(0);
    });

    it("sets lastRoundResult with correct round data", () => {
      const { code, hostParticipantId } = setupPlayingRoom();

      advanceRound(code);
      const room = getRoom(code);

      expect(room!.lastRoundResult).toBeDefined();
      expect(room!.lastRoundResult!.roundNumber).toBe(1);
      expect(room!.lastRoundResult!.drawerId).toBe(hostParticipantId);
    });
  });
});
