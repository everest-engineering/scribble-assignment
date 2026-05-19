import test from "node:test";
import assert from "node:assert/strict";
import type { Room } from "../models/game.js";
import {
  canParticipantGuess,
  createRestartedLobbyState,
  createInitialScores,
  createStartedRoundState,
  getSecretWord,
  getViewerRole,
  isCorrectGuess,
  saveRoom,
  restartRoom,
  submitGuess,
  normalizeGuessText,
  toRoomSnapshot
} from "./roomStore.js";

function createRoomFixture(): Room {
  return {
    code: "ABCD",
    status: "lobby",
    hostId: "host-1",
    participants: [
      {
        id: "host-1",
        name: "Host",
        joinedAt: "2026-05-19T00:00:00.000Z",
        role: "host"
      },
      {
        id: "guest-1",
        name: "Guest",
        joinedAt: "2026-05-19T00:00:01.000Z",
        role: "player"
      }
    ],
    guesserIds: [],
    guessHistory: [],
    scores: {},
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z"
  };
}

test("createStartedRoundState assigns the host as drawer and everyone else as guessers", () => {
  const room = createRoomFixture();

  assert.deepEqual(createStartedRoundState(room), {
    drawerId: "host-1",
    guesserIds: ["guest-1"],
    secretWord: "rocket",
    guessHistory: [],
    scores: {
      "host-1": 0,
      "guest-1": 0
    },
    winnerId: undefined,
    endedAt: undefined
  });
});

test("createInitialScores sets every participant score to zero", () => {
  const room = createRoomFixture();

  assert.deepEqual(createInitialScores(room), {
    "host-1": 0,
    "guest-1": 0
  });
});

test("getSecretWord selects the first available starter word deterministically", () => {
  assert.equal(getSecretWord(["rocket", "pizza", "castle"]), "rocket");
});

test("normalizeGuessText trims whitespace for storage and comparison", () => {
  assert.equal(normalizeGuessText("  rocket  "), "rocket");
});

test("getViewerRole returns drawer for the assigned drawer and guesser otherwise", () => {
  const room = createRoomFixture();
  room.status = "playing";
  room.drawerId = "host-1";
  room.guesserIds = ["guest-1"];
  room.secretWord = "rocket";
  room.scores = createInitialScores(room);

  assert.equal(getViewerRole(room, "host-1"), "drawer");
  assert.equal(getViewerRole(room, "guest-1"), "guesser");
  assert.equal(getViewerRole(room), "guesser");
});

test("canParticipantGuess only allows assigned guessers", () => {
  const room = createRoomFixture();
  room.status = "playing";
  room.drawerId = "host-1";
  room.guesserIds = ["guest-1"];

  assert.equal(canParticipantGuess(room, "guest-1"), true);
  assert.equal(canParticipantGuess(room, "host-1"), false);
});

test("isCorrectGuess compares guesses case-insensitively", () => {
  assert.equal(isCorrectGuess("rocket", "ROCKET"), true);
  assert.equal(isCorrectGuess("rocket", "  rocket  "), true);
  assert.equal(isCorrectGuess("rocket", "castle"), false);
});

test("toRoomSnapshot omits secretWord for guessers while keeping shared round metadata visible", () => {
  const room = createRoomFixture();
  room.status = "playing";
  room.drawerId = "host-1";
  room.guesserIds = ["guest-1"];
  room.secretWord = "rocket";
  room.scores = createInitialScores(room);

  const drawerView = toRoomSnapshot(room, "host-1");
  const guesserView = toRoomSnapshot(room, "guest-1");

  assert.equal(drawerView.drawerId, "host-1");
  assert.equal(drawerView.viewerRole, "drawer");
  assert.equal(drawerView.secretWord, "rocket");

  assert.equal(guesserView.drawerId, "host-1");
  assert.equal(guesserView.viewerRole, "guesser");
  assert.equal("secretWord" in guesserView, false);
});

test("submitGuess rejects the drawer and blank guesses", () => {
  const room = createRoomFixture();
  room.status = "playing";
  room.drawerId = "host-1";
  room.guesserIds = ["guest-1"];
  room.secretWord = "rocket";
  room.scores = createInitialScores(room);
  saveRoom(room);

  const blankGuess = submitGuess(room.code, "guest-1", "   ");
  const drawerGuess = submitGuess(room.code, "host-1", "rocket");

  assert.deepEqual(blankGuess, {
    ok: false,
    reason: "invalid_guess"
  });
  assert.deepEqual(drawerGuess, {
    ok: false,
    reason: "not_allowed"
  });
});

test("submitGuess records incorrect guesses without changing scores", () => {
  const room = createRoomFixture();
  room.status = "playing";
  room.drawerId = "host-1";
  room.guesserIds = ["guest-1"];
  room.secretWord = "rocket";
  room.scores = createInitialScores(room);
  saveRoom(room);

  const result = submitGuess(room.code, "guest-1", "castle");

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.room.status, "playing");
  assert.equal(result.room.guessHistory.length, 1);
  assert.equal(result.room.guessHistory[0]?.text, "castle");
  assert.equal(result.room.guessHistory[0]?.isCorrect, false);
  assert.equal(result.room.scores["guest-1"], 0);
  assert.equal(result.room.winnerId, undefined);
});

test("submitGuess awards 100 to the first correct guesser and transitions to result", () => {
  const room = createRoomFixture();
  room.status = "playing";
  room.drawerId = "host-1";
  room.guesserIds = ["guest-1"];
  room.secretWord = "rocket";
  room.scores = createInitialScores(room);
  saveRoom(room);

  const result = submitGuess(room.code, "guest-1", "ROCKET");

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.room.status, "result");
  assert.equal(result.room.winnerId, "guest-1");
  assert.equal(result.room.scores["guest-1"], 100);
  assert.equal(result.room.guessHistory[0]?.isCorrect, true);

  const guesserView = toRoomSnapshot(result.room, "guest-1");
  assert.equal(guesserView.status, "result");
  assert.equal(guesserView.winnerId, "guest-1");
  assert.equal(guesserView.secretWord, "rocket");
});

test("toRoomSnapshot reveals secret word and full correct guess history to all viewers in result", () => {
  const room = createRoomFixture();
  room.status = "result";
  room.drawerId = "host-1";
  room.guesserIds = ["guest-1"];
  room.secretWord = "rocket";
  room.scores = createInitialScores(room);
  room.winnerId = "guest-1";
  room.guessHistory = [
    {
      id: "guess-1",
      participantId: "guest-1",
      text: "rocket",
      submittedAt: "2026-05-19T00:00:02.000Z",
      isCorrect: true
    }
  ];

  const drawerView = toRoomSnapshot(room, "host-1");
  const guesserView = toRoomSnapshot(room, "guest-1");

  assert.equal(drawerView.guessHistory?.[0]?.text, "rocket");
  assert.equal(guesserView.guessHistory?.[0]?.text, "rocket");
  assert.equal(guesserView.secretWord, "rocket");
});

test("createRestartedLobbyState clears round-owned state while preserving room identity and participants", () => {
  const room = createRoomFixture();
  room.status = "result";
  room.drawerId = "host-1";
  room.guesserIds = ["guest-1"];
  room.secretWord = "rocket";
  room.guessHistory = [
    {
      id: "guess-1",
      participantId: "guest-1",
      text: "rocket",
      submittedAt: "2026-05-19T00:00:02.000Z",
      isCorrect: true
    }
  ];
  room.scores = createInitialScores(room);
  room.scores["guest-1"] = 100;
  room.winnerId = "guest-1";
  room.endedAt = "2026-05-19T00:00:03.000Z";

  const restarted = createRestartedLobbyState(room);

  assert.equal(restarted.code, "ABCD");
  assert.equal(restarted.hostId, "host-1");
  assert.deepEqual(
    restarted.participants.map((participant) => participant.id),
    ["host-1", "guest-1"]
  );
  assert.equal(restarted.status, "lobby");
  assert.equal(restarted.drawerId, undefined);
  assert.deepEqual(restarted.guesserIds, []);
  assert.equal(restarted.secretWord, undefined);
  assert.deepEqual(restarted.guessHistory, []);
  assert.deepEqual(restarted.scores, {});
  assert.equal(restarted.winnerId, undefined);
  assert.equal(restarted.endedAt, undefined);
});

test("restartRoom rejects non-host viewers and rooms that are not in result", () => {
  const playingRoom = createRoomFixture();
  playingRoom.status = "playing";
  playingRoom.drawerId = "host-1";
  playingRoom.guesserIds = ["guest-1"];
  playingRoom.secretWord = "rocket";
  playingRoom.scores = createInitialScores(playingRoom);
  saveRoom(playingRoom);

  assert.deepEqual(restartRoom(playingRoom.code, "guest-1"), {
    ok: false,
    reason: "not_host"
  });

  assert.deepEqual(restartRoom(playingRoom.code, "host-1"), {
    ok: false,
    reason: "not_result"
  });
});

test("restartRoom resets only the targeted finished room back to lobby", () => {
  const roomA = createRoomFixture();
  roomA.status = "result";
  roomA.drawerId = "host-1";
  roomA.guesserIds = ["guest-1"];
  roomA.secretWord = "rocket";
  roomA.guessHistory = [
    {
      id: "guess-1",
      participantId: "guest-1",
      text: "rocket",
      submittedAt: "2026-05-19T00:00:02.000Z",
      isCorrect: true
    }
  ];
  roomA.scores = createInitialScores(roomA);
  roomA.scores["guest-1"] = 100;
  roomA.winnerId = "guest-1";
  roomA.endedAt = "2026-05-19T00:00:03.000Z";
  saveRoom(roomA);

  const roomB = {
    ...createRoomFixture(),
    code: "WXYZ",
    status: "result" as const,
    drawerId: "host-1",
    guesserIds: ["guest-1"],
    secretWord: "rocket",
    guessHistory: [
      {
        id: "guess-2",
        participantId: "guest-1",
        text: "rocket",
        submittedAt: "2026-05-19T00:10:02.000Z",
        isCorrect: true
      }
    ],
    scores: {
      "host-1": 0,
      "guest-1": 100
    },
    winnerId: "guest-1",
    endedAt: "2026-05-19T00:10:03.000Z"
  };
  saveRoom(roomB);

  const result = restartRoom(roomA.code, "host-1");

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.room.status, "lobby");
  assert.equal(result.room.secretWord, undefined);
  assert.equal(result.room.drawerId, undefined);
  assert.deepEqual(result.room.guessHistory, []);
  assert.deepEqual(result.room.scores, {});
  assert.equal(result.room.winnerId, undefined);
  assert.equal(result.room.endedAt, undefined);

  const restartedSnapshot = toRoomSnapshot(result.room, "guest-1");
  assert.equal(restartedSnapshot.status, "lobby");
  assert.equal("secretWord" in restartedSnapshot, false);
  assert.equal("guessHistory" in restartedSnapshot, false);

  const untouchedRoomSnapshot = toRoomSnapshot(roomB, "guest-1");
  assert.equal(untouchedRoomSnapshot.status, "result");
  assert.equal(untouchedRoomSnapshot.secretWord, "rocket");
  assert.equal(untouchedRoomSnapshot.guessHistory?.[0]?.text, "rocket");
});
