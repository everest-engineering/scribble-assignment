import test from "node:test";
import assert from "node:assert/strict";
import type { Room } from "../models/game.js";
import {
  canParticipantGuess,
  createInitialScores,
  createStartedRoundState,
  getSecretWord,
  getViewerRole,
  isCorrectGuess,
  saveRoom,
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
  assert.equal("secretWord" in guesserView, false);
});

test("toRoomSnapshot redacts correct guess text for guessers while preserving drawer history", () => {
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
  assert.equal(guesserView.guessHistory?.[0]?.text, "[correct guess]");
  assert.equal("secretWord" in guesserView, false);
});
