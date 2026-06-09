import { describe, expect, it } from "vitest";
import { createRoom, endRound, joinRoom, restartGame, startGame, submitGuess, toRoomSnapshot } from "./roomStore.js";
import { STARTER_WORDS } from "../seed/starterData.js";

function createRoomWithParticipants(count: number) {
  const host = createRoom("Host");
  const participants = [host];

  for (let i = 1; i < count; i++) {
    const joiner = joinRoom(host.room.code, `Player${i}`);
    if (joiner) {
      participants.push(joiner);
    }
  }

  return participants[0];
}

describe("roomStore", () => {
  describe("createRoom", () => {
    it("returns a room with a 4-character uppercase code", () => {
      const result = createRoom("Alice");

      expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
      expect(result.room.participants).toHaveLength(1);
      expect(result.room.participants[0].name).toBe("Alice");
      expect(result.participantId).toBeDefined();
    });

    it("sets the creator as host", () => {
      const result = createRoom("Alice");

      expect(result.room.hostId).toBe(result.participantId);
    });

    it("uses the trimmed playerName", () => {
      const result = createRoom("  Alice  ");

      expect(result.room.participants[0].name).toBe("Alice");
    });
  });

  describe("joinRoom", () => {
    it("returns null for an unknown room code", () => {
      const result = joinRoom("ZZZZ", "Bob");

      expect(result).toBeNull();
    });

    it("adds a participant to an existing room", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "Bob");

      expect(result).not.toBeNull();
      expect(result!.room.participants).toHaveLength(2);
      expect(result!.room.participants[1].name).toBe("Bob");
    });

    it("does not affect existing participants when joining", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "Bob");

      expect(result!.room.participants[0].name).toBe("Alice");
    });
  });

  describe("startGame", () => {
    it("starts the game for the host with 2+ participants", () => {
      const host = createRoomWithParticipants(2);
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
    });

    it("transitions room status to playing", () => {
      const host = createRoomWithParticipants(2);
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.status).toBe("playing");
      }
    });

    it("assigns the host as drawer", () => {
      const host = createRoomWithParticipants(2);
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.drawerId).toBe(host.participantId);
      }
    });

    it("selects the first starter word as secret word", () => {
      const host = createRoomWithParticipants(2);
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.secretWord).toBe(STARTER_WORDS[0]);
      }
    });

    it("fails for non-host participant (403)", () => {
      const host = createRoom("Alice");
      const joiner = joinRoom(host.room.code, "Bob");

      const result = startGame(host.room.code, joiner!.participantId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(403);
      }
    });

    it("fails with fewer than 2 participants (400)", () => {
      const host = createRoom("Alice");
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
      }
    });

    it("fails for unknown room code (404)", () => {
      const result = startGame("ZZZZ", "some-id");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(404);
      }
    });
  });

  describe("toRoomSnapshot", () => {
    it("includes drawerId in snapshot", () => {
      const host = createRoomWithParticipants(2);
      const startResult = startGame(host.room.code, host.participantId);

      expect(startResult.ok).toBe(true);
      if (!startResult.ok) return;

      const snapshot = toRoomSnapshot(startResult.room, host.participantId);

      expect(snapshot.drawerId).toBe(host.participantId);
    });

    it("includes secretWord when viewer is the drawer", () => {
      const host = createRoomWithParticipants(2);
      const startResult = startGame(host.room.code, host.participantId);

      expect(startResult.ok).toBe(true);
      if (!startResult.ok) return;

      const snapshot = toRoomSnapshot(startResult.room, host.participantId);

      expect(snapshot.secretWord).toBe(STARTER_WORDS[0]);
    });

    it("omits secretWord when viewer is not the drawer", () => {
      const host = createRoomWithParticipants(2);
      const joiner = joinRoom(host.room.code, "Bob");
      const startResult = startGame(host.room.code, host.participantId);

      expect(startResult.ok).toBe(true);
      if (!startResult.ok) return;

      const snapshot = toRoomSnapshot(startResult.room, joiner!.participantId);

      expect(snapshot.secretWord).toBeUndefined();
    });

    it("omits secretWord when viewerParticipantId is undefined", () => {
      const host = createRoomWithParticipants(2);
      const startResult = startGame(host.room.code, host.participantId);

      expect(startResult.ok).toBe(true);
      if (!startResult.ok) return;

      const snapshot = toRoomSnapshot(startResult.room);

      expect(snapshot.secretWord).toBeUndefined();
    });

    it("does not include availableWords or roles", () => {
      const host = createRoom("Alice");
      const snapshot = toRoomSnapshot(host.room, host.participantId);

      expect(snapshot).not.toHaveProperty("availableWords");
      expect(snapshot).not.toHaveProperty("roles");
    });
  });

  describe("startGame initialization", () => {
    it("initializes guesses as an empty array", () => {
      const host = createRoomWithParticipants(2);
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.guesses).toEqual([]);
    });

    it("sets all participants' score to 0", () => {
      const host = createRoomWithParticipants(2);
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      result.room.participants.forEach((p) => {
        expect(p.score).toBe(0);
      });
    });
  });

  describe("toRoomSnapshot includes new fields", () => {
    it("includes guesses array in snapshot", () => {
      const host = createRoomWithParticipants(2);
      const startResult = startGame(host.room.code, host.participantId);

      expect(startResult.ok).toBe(true);
      if (!startResult.ok) return;

      const snapshot = toRoomSnapshot(startResult.room, host.participantId);

      expect(snapshot).toHaveProperty("guesses");
      expect(Array.isArray(snapshot.guesses)).toBe(true);
    });

    it("includes score on each participant in snapshot", () => {
      const host = createRoomWithParticipants(2);
      const snapshot = toRoomSnapshot(host.room, host.participantId);

      snapshot.participants.forEach((p) => {
        expect(p).toHaveProperty("score");
        expect(typeof p.score).toBe("number");
      });
    });
  });

  describe("submitGuess", () => {
    function createPlayingRoom() {
      const host = createRoomWithParticipants(2);
      const startResult = startGame(host.room.code, host.participantId);
      if (!startResult.ok) throw new Error("Failed to start game");
      const joinerId = startResult.room.participants.find((p) => p.id !== host.participantId)!.id;

      return { host, joinerId, room: startResult.room };
    }

    it("accepts a correct guess and awards 100 points", () => {
      const { joinerId, room } = createPlayingRoom();
      const result = submitGuess(room.code, joinerId, STARTER_WORDS[0]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const guess = result.room.guesses[0];
      expect(guess.isCorrect).toBe(true);
      expect(guess.text).toBe(STARTER_WORDS[0]);
      expect(guess.participantId).toBe(joinerId);
      const guesser = result.room.participants.find((p) => p.id === joinerId);
      expect(guesser!.score).toBe(100);
    });

    it("accepts a correct guess with different casing and awards 100 points", () => {
      const { joinerId, room } = createPlayingRoom();
      const result = submitGuess(room.code, joinerId, STARTER_WORDS[0].toLowerCase());

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.guesses[0].isCorrect).toBe(true);
      const guesser = result.room.participants.find((p) => p.id === joinerId);
      expect(guesser!.score).toBe(100);
    });

    it("matches case-insensitively: UPPERCASE 'ROCKET'", () => {
      const { joinerId, room } = createPlayingRoom();
      const result = submitGuess(room.code, joinerId, "ROCKET");

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.guesses[0].isCorrect).toBe(true);
      expect(result.room.guesses[0].text).toBe("ROCKET");
    });

    it("matches case-insensitively: Title Case 'Rocket'", () => {
      const { joinerId, room } = createPlayingRoom();
      const result = submitGuess(room.code, joinerId, "Rocket");

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.guesses[0].isCorrect).toBe(true);
    });

    it("matches case-insensitively: Mixed Case 'rOcKeT'", () => {
      const { joinerId, room } = createPlayingRoom();
      const result = submitGuess(room.code, joinerId, "rOcKeT");

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.guesses[0].isCorrect).toBe(true);
    });

    it("rejects an incorrect guess and does not award points", () => {
      const { joinerId, room } = createPlayingRoom();
      const result = submitGuess(room.code, joinerId, "wrongword");

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.guesses[0].isCorrect).toBe(false);
      const guesser = result.room.participants.find((p) => p.id === joinerId);
      expect(guesser!.score).toBe(0);
    });

    it("trims whitespace from guess text before comparison", () => {
      const { joinerId, room } = createPlayingRoom();
      const result = submitGuess(room.code, joinerId, `  ${STARTER_WORDS[0]}  `);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.guesses[0].isCorrect).toBe(true);
      expect(result.room.guesses[0].text).toBe(STARTER_WORDS[0]);
    });

    it("rejects empty guess after trim with 400", () => {
      const { joinerId, room } = createPlayingRoom();
      const result = submitGuess(room.code, joinerId, "   ");

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.status).toBe(400);
    });

    it("rejects drawer submitting a guess with 403", () => {
      const { host, room } = createPlayingRoom();
      const result = submitGuess(room.code, host.participantId, "guess");

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.status).toBe(403);
    });

    it("returns 404 for unknown room code", () => {
      const result = submitGuess("ZZZZ", "some-id", "guess");

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.status).toBe(404);
    });

    it("returns 400 when room is not in playing state", () => {
      const host = createRoom("Alice");
      const joiner = joinRoom(host.room.code, "Bob");
      const result = submitGuess(host.room.code, joiner!.participantId, "guess");

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.status).toBe(400);
    });

    it("allows multiple correct guesses by the same guesser (each awards 100)", () => {
      const { joinerId, room } = createPlayingRoom();
      submitGuess(room.code, joinerId, STARTER_WORDS[0]);
      const result = submitGuess(room.code, joinerId, STARTER_WORDS[0]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.guesses).toHaveLength(2);
      const guesser = result.room.participants.find((p) => p.id === joinerId);
      expect(guesser!.score).toBe(200);
    });

    it("isolates guesses between different rooms", () => {
      const room1 = createPlayingRoom();
      const room2 = createPlayingRoom();
      submitGuess(room1.room.code, room1.joinerId, STARTER_WORDS[0]);
      const result = submitGuess(room2.room.code, room2.joinerId, "wrong");

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.guesses).toHaveLength(1);
      expect(result.room.guesses[0].isCorrect).toBe(false);
    });
  });

  describe("endRound", () => {
    function createPlayingRoom() {
      const host = createRoomWithParticipants(2);
      const startResult = startGame(host.room.code, host.participantId);
      if (!startResult.ok) throw new Error("Failed to start game");
      return { host, room: startResult.room };
    }

    it("transitions a playing room to result status", () => {
      const { host, room } = createPlayingRoom();
      const result = endRound(room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.status).toBe("result");
    });

    it("preserves secretWord after ending round", () => {
      const { host, room } = createPlayingRoom();
      const result = endRound(room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.secretWord).toBe(STARTER_WORDS[0]);
    });

    it("preserves guesses after ending round", () => {
      const { host, room } = createPlayingRoom();
      const joinerId = room.participants.find((p) => p.id !== host.participantId)!.id;
      submitGuess(room.code, joinerId, "test");
      const result = endRound(room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.guesses).toHaveLength(1);
    });

    it("preserves scores after ending round", () => {
      const { host, room } = createPlayingRoom();
      const joinerId = room.participants.find((p) => p.id !== host.participantId)!.id;
      submitGuess(room.code, joinerId, STARTER_WORDS[0]);
      const result = endRound(room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const guesser = result.room.participants.find((p) => p.id === joinerId);
      expect(guesser!.score).toBe(100);
    });

    it("returns 403 when non-host tries to end the round", () => {
      const { host, room } = createPlayingRoom();
      const joinerId = room.participants.find((p) => p.id !== host.participantId)!.id;
      const result = endRound(room.code, joinerId);

      expect(result.ok).toBe(false);
      if (!result.ok) return;
      expect(result.status).toBe(403);
    });

    it("returns 400 when room is not in playing state", () => {
      const host = createRoomWithParticipants(2);
      const result = endRound(host.room.code, host.participantId);

      expect(result.ok).toBe(false);
      if (!result.ok) return;
      expect(result.status).toBe(400);
    });

    it("returns 404 for unknown room code", () => {
      const result = endRound("ZZZZ", "some-id");

      expect(result.ok).toBe(false);
      if (!result.ok) return;
      expect(result.status).toBe(404);
    });
  });

  describe("restartGame", () => {
    function createResultRoom() {
      const host = createRoomWithParticipants(2);
      const startResult = startGame(host.room.code, host.participantId);
      if (!startResult.ok) throw new Error("Failed to start game");
      const joinerId = startResult.room.participants.find((p) => p.id !== host.participantId)!.id;
      submitGuess(host.room.code, joinerId, STARTER_WORDS[0]);
      const endResult = endRound(host.room.code, host.participantId);
      if (!endResult.ok) throw new Error("Failed to end round");
      return { host, joinerId, room: endResult.room };
    }

    it("transitions a result room back to lobby status", () => {
      const { host, room } = createResultRoom();
      const result = restartGame(room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.status).toBe("lobby");
    });

    it("clears secretWord on restart", () => {
      const { host, room } = createResultRoom();
      const result = restartGame(room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.secretWord).toBe("");
    });

    it("clears guesses on restart", () => {
      const { host, room } = createResultRoom();
      const result = restartGame(room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.guesses).toEqual([]);
    });

    it("clears drawerId on restart", () => {
      const { host, room } = createResultRoom();
      const result = restartGame(room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.drawerId).toBe("");
    });

    it("resets all participant scores to 0 on restart", () => {
      const { host, room } = createResultRoom();
      const result = restartGame(room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      result.room.participants.forEach((p) => {
        expect(p.score).toBe(0);
      });
    });

    it("preserves all participants after restart", () => {
      const { host, room } = createResultRoom();
      const participantIds = room.participants.map((p) => p.id).sort();
      const result = restartGame(room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const newIds = result.room.participants.map((p) => p.id).sort();
      expect(newIds).toEqual(participantIds);
      expect(result.room.participants).toHaveLength(2);
    });

    it("preserves participant names after restart", () => {
      const { host, room } = createResultRoom();
      const names = room.participants.map((p) => p.name).sort();
      const result = restartGame(room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const newNames = result.room.participants.map((p) => p.name).sort();
      expect(newNames).toEqual(names);
    });

    it("returns 403 when non-host tries to restart", () => {
      const { host, joinerId } = createResultRoom();
      const result = restartGame(host.room.code, joinerId);

      expect(result.ok).toBe(false);
      if (!result.ok) return;
      expect(result.status).toBe(403);
    });

    it("returns 400 when room is not in result state", () => {
      const host = createRoomWithParticipants(2);
      const result = restartGame(host.room.code, host.participantId);

      expect(result.ok).toBe(false);
      if (!result.ok) return;
      expect(result.status).toBe(400);
    });

    it("returns 404 for unknown room code", () => {
      const result = restartGame("ZZZZ", "some-id");

      expect(result.ok).toBe(false);
      if (!result.ok) return;
      expect(result.status).toBe(404);
    });
  });

  describe("toRoomSnapshot result state", () => {
    function createResultRoom() {
      const host = createRoomWithParticipants(2);
      const startResult = startGame(host.room.code, host.participantId);
      if (!startResult.ok) throw new Error("Failed to start game");
      const joinerId = startResult.room.participants.find((p) => p.id !== host.participantId)!.id;
      const endResult = endRound(host.room.code, host.participantId);
      if (!endResult.ok) throw new Error("Failed to end round");
      return { host, joinerId, room: endResult.room };
    }

    it("reveals secretWord to drawer when status is result", () => {
      const { host, room } = createResultRoom();
      const snapshot = toRoomSnapshot(room, host.participantId);

      expect(snapshot.secretWord).toBe(STARTER_WORDS[0]);
    });

    it("reveals secretWord to non-drawer when status is result", () => {
      const { host, room, joinerId } = createResultRoom();
      const snapshot = toRoomSnapshot(room, joinerId);

      expect(snapshot.secretWord).toBe(STARTER_WORDS[0]);
    });

    it("reveals secretWord when no viewerParticipantId in result state", () => {
      const { host, room } = createResultRoom();
      const snapshot = toRoomSnapshot(room);

      expect(snapshot.secretWord).toBe(STARTER_WORDS[0]);
    });

    it("still hides secretWord from non-drawer when status is playing (regression)", () => {
      const host = createRoomWithParticipants(2);
      const startResult = startGame(host.room.code, host.participantId);
      if (!startResult.ok) return;
      const joinerId = startResult.room.participants.find((p) => p.id !== host.participantId)!.id;
      const snapshot = toRoomSnapshot(startResult.room, joinerId);

      expect(snapshot.secretWord).toBeUndefined();
    });

    it("hides secretWord from all when status is lobby (regression)", () => {
      const host = createRoomWithParticipants(2);
      const snapshot = toRoomSnapshot(host.room, host.participantId);

      expect(snapshot.secretWord).toBeUndefined();
    });
  });
});
