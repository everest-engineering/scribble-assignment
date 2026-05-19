import test from "node:test";
import assert from "node:assert/strict";
import type { Room } from "../models/game.js";
import {
  createStartedRoundState,
  getSecretWord,
  getViewerRole,
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
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z"
  };
}

test("createStartedRoundState assigns the host as drawer and everyone else as guessers", () => {
  const room = createRoomFixture();

  assert.deepEqual(createStartedRoundState(room), {
    drawerId: "host-1",
    guesserIds: ["guest-1"],
    secretWord: "rocket"
  });
});

test("getSecretWord selects the first available starter word deterministically", () => {
  assert.equal(getSecretWord(["rocket", "pizza", "castle"]), "rocket");
});

test("getViewerRole returns drawer for the assigned drawer and guesser otherwise", () => {
  const room = createRoomFixture();
  room.status = "playing";
  room.drawerId = "host-1";
  room.guesserIds = ["guest-1"];
  room.secretWord = "rocket";

  assert.equal(getViewerRole(room, "host-1"), "drawer");
  assert.equal(getViewerRole(room, "guest-1"), "guesser");
  assert.equal(getViewerRole(room), "guesser");
});

test("toRoomSnapshot omits secretWord for guessers while keeping shared round metadata visible", () => {
  const room = createRoomFixture();
  room.status = "playing";
  room.drawerId = "host-1";
  room.guesserIds = ["guest-1"];
  room.secretWord = "rocket";

  const drawerView = toRoomSnapshot(room, "host-1");
  const guesserView = toRoomSnapshot(room, "guest-1");

  assert.equal(drawerView.drawerId, "host-1");
  assert.equal(drawerView.viewerRole, "drawer");
  assert.equal(drawerView.secretWord, "rocket");

  assert.equal(guesserView.drawerId, "host-1");
  assert.equal(guesserView.viewerRole, "guesser");
  assert.equal("secretWord" in guesserView, false);
});
