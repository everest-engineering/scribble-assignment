import { describe, expect, it } from "vitest";
import {
  addStroke,
  clearCanvas,
  createRoom,
  getRoom,
  joinRoom,
  listWords,
  restartRoom,
  startRoom,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";

function startedRoom() {
  const host = createRoom("Alice");
  const guesser = joinRoom(host.room.code, "Bob")!;
  const started = startRoom(host.room.code, host.participantId);
  if (!started.ok) throw new Error("expected room to start");
  return {
    code: host.room.code,
    drawerId: host.participantId,
    guesserId: guesser.participantId,
    secretWord: started.room.round!.secretWord
  };
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

  // T005 [US1]
  it("createRoom assigns the creator as host and starts in the lobby", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.status).toBe("lobby");
  });

  // T006 [US1]
  it("toRoomSnapshot exposes hostId and flags the creator as host", () => {
    const { room } = createRoom("Alice");
    const snapshot = toRoomSnapshot(room);

    expect(snapshot.hostId).toBe(room.hostId);
    const host = snapshot.participants.find((participant) => participant.id === room.hostId);
    expect(host?.isHost).toBe(true);
  });

  // T013 [US2]
  it("joinRoom appends a non-host participant to an existing room", () => {
    const { room } = createRoom("Alice");
    const joined = joinRoom(room.code, "Bob");

    expect(joined).not.toBeNull();
    expect(joined?.room.participants).toHaveLength(2);

    const snapshot = toRoomSnapshot(joined!.room);
    const newcomer = snapshot.participants.find((participant) => participant.id === joined!.participantId);
    expect(newcomer?.isHost).toBe(false);
  });

  // T019 [US4]
  it("startRoom rejects non-host, too-few-players, and unknown codes", () => {
    const { room, participantId } = createRoom("Alice");

    expect(startRoom("ZZZZ", participantId)).toEqual({ ok: false, reason: "not-found" });
    expect(startRoom(room.code, participantId)).toEqual({ ok: false, reason: "too-few-players" });

    const joined = joinRoom(room.code, "Bob");
    expect(startRoom(room.code, joined!.participantId)).toEqual({ ok: false, reason: "forbidden" });
  });

  // (Group 1) startRoom marks the room started and is idempotent.
  // NOTE: Group 2 supersedes Group 1 FR-018 — start now DOES assign role/word
  // (covered by the Group 2 round-state tests below).
  it("startRoom marks the room started and is idempotent", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const first = startRoom(room.code, participantId);
    expect(first.ok).toBe(true);
    expect(first.ok && first.room.status).toBe("started");

    const second = startRoom(room.code, participantId);
    expect(second.ok).toBe(true);
    expect(second.ok && second.room.status).toBe("started");
  });

  // (Group 1) starting one room does not affect another room
  it("starting one room does not affect another room", () => {
    const roomA = createRoom("Alice");
    joinRoom(roomA.room.code, "Bob");
    const roomB = createRoom("Carol");
    joinRoom(roomB.room.code, "Dave");

    startRoom(roomA.room.code, roomA.participantId);

    const snapshotB = toRoomSnapshot(joinRoom(roomB.room.code, "Eve")!.room);
    expect(snapshotB.status).toBe("lobby");
  });

  // --- Group 2 ---

  // T008 [US1]
  it("createRoom/joinRoom store the provided name without a Player default", () => {
    const created = createRoom("Alice");
    expect(created.room.participants[0].name).toBe("Alice");

    const joined = joinRoom(created.room.code, "Bob");
    const bob = joined!.room.participants.find((p) => p.id === joined!.participantId);
    expect(bob?.name).toBe("Bob");
  });

  // T015 [US2]
  it("startRoom assigns host=drawer, others=guesser, and selects a starter word", () => {
    const { room, participantId } = createRoom("Alice");
    const joined = joinRoom(room.code, "Bob");

    const result = startRoom(room.code, participantId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.room.round?.drawerId).toBe(participantId);
    expect(result.room.round?.roles[participantId]).toBe("drawer");
    expect(result.room.round?.roles[joined!.participantId]).toBe("guesser");
    expect(listWords()).toContain(result.room.round?.secretWord);
  });

  // T016 [US2]
  it("round initialization is idempotent (re-start keeps same word and roles)", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const first = startRoom(room.code, participantId);
    const second = startRoom(room.code, participantId);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(second.room.round?.secretWord).toBe(first.room.round?.secretWord);
    expect(second.room.round?.roles).toEqual(first.room.round?.roles);
  });

  // T017 [US2]
  it("starting room A creates no round state in room B", () => {
    const roomA = createRoom("Alice");
    joinRoom(roomA.room.code, "Bob");
    const roomB = createRoom("Carol");
    const bobJoin = joinRoom(roomB.room.code, "Dave");

    startRoom(roomA.room.code, roomA.participantId);

    const snapshotB = toRoomSnapshot(getRoom(roomB.room.code)!, bobJoin!.participantId);
    expect(snapshotB.status).toBe("lobby");
    expect(snapshotB.drawerId).toBeNull();
    expect(snapshotB.secretWord).toBeUndefined();
  });

  // T020 [US4]
  it("toRoomSnapshot includes secretWord for the drawer and omits it for guessers", () => {
    const { room, participantId } = createRoom("Alice");
    const joined = joinRoom(room.code, "Bob");
    startRoom(room.code, participantId);

    const live = getRoom(room.code)!;
    const drawerView = toRoomSnapshot(live, participantId);
    const guesserView = toRoomSnapshot(live, joined!.participantId);

    expect(drawerView.secretWord).toBeDefined();
    expect(Object.prototype.hasOwnProperty.call(guesserView, "secretWord")).toBe(false);
  });

  // T021 [US4]
  it("toRoomSnapshot omits secretWord for missing/unknown viewer id", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startRoom(room.code, participantId);

    const live = getRoom(room.code)!;
    const anonView = toRoomSnapshot(live);
    const unknownView = toRoomSnapshot(live, "not-a-real-id");

    expect(Object.prototype.hasOwnProperty.call(anonView, "secretWord")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(unknownView, "secretWord")).toBe(false);
  });

  // --- Group 3 ---

  // T008 [US1]
  it("addStroke appends for the drawer and exposes strokes to all viewers", () => {
    const game = startedRoom();
    const stroke = { points: [{ x: 1, y: 2 }, { x: 3, y: 4 }] };

    const result = addStroke(game.code, game.drawerId, stroke);
    expect(result.ok).toBe(true);

    const guesserView = toRoomSnapshot(getRoom(game.code)!, game.guesserId);
    expect(guesserView.strokes).toHaveLength(1);
    expect(guesserView.strokes[0].points).toHaveLength(2);
  });

  // T008 [US1]
  it("addStroke rejects non-drawers", () => {
    const game = startedRoom();
    const result = addStroke(game.code, game.guesserId, { points: [{ x: 0, y: 0 }] });
    expect(result).toEqual({ ok: false, reason: "forbidden" });
  });

  // T008 [US1]
  it("clearCanvas empties strokes for the drawer and is idempotent", () => {
    const game = startedRoom();
    addStroke(game.code, game.drawerId, { points: [{ x: 1, y: 1 }] });

    const first = clearCanvas(game.code, game.drawerId);
    expect(first.ok).toBe(true);
    expect(toRoomSnapshot(getRoom(game.code)!, game.drawerId).strokes).toHaveLength(0);

    const second = clearCanvas(game.code, game.drawerId);
    expect(second.ok).toBe(true);
  });

  // T008 [US1]
  it("addStroke and clearCanvas are rejected after the round ends", () => {
    const game = startedRoom();
    submitGuess(game.code, game.guesserId, game.secretWord);

    expect(addStroke(game.code, game.drawerId, { points: [{ x: 0, y: 0 }] })).toEqual({
      ok: false,
      reason: "round-ended"
    });
    expect(clearCanvas(game.code, game.drawerId)).toEqual({ ok: false, reason: "round-ended" });
  });

  // T008 [US1]
  it("drawing in room A leaves room B strokes unchanged", () => {
    const gameA = startedRoom();
    const gameB = startedRoom();

    addStroke(gameA.code, gameA.drawerId, { points: [{ x: 5, y: 5 }] });

    expect(toRoomSnapshot(getRoom(gameB.code)!, gameB.drawerId).strokes).toHaveLength(0);
  });

  // T018 [US2]
  it("submitGuess rejects the drawer and unknown participants", () => {
    const game = startedRoom();
    expect(submitGuess(game.code, game.drawerId, "anything")).toEqual({
      ok: false,
      reason: "forbidden"
    });
    expect(submitGuess(game.code, "not-real", "anything")).toEqual({
      ok: false,
      reason: "forbidden"
    });
    expect(submitGuess("ZZZZ", game.guesserId, "anything")).toEqual({
      ok: false,
      reason: "not-found"
    });
  });

  // T018 [US2]
  it("submitGuess is rejected after the round has ended", () => {
    const game = startedRoom();
    submitGuess(game.code, game.guesserId, game.secretWord);

    expect(submitGuess(game.code, game.guesserId, game.secretWord)).toEqual({
      ok: false,
      reason: "round-ended"
    });
  });

  // T025 [US3]
  it("a newly started round has all scores at 0 and no guesses", () => {
    const game = startedRoom();
    const view = toRoomSnapshot(getRoom(game.code)!, game.guesserId);

    expect(view.guesses).toHaveLength(0);
    expect(view.roundEnded).toBe(false);
    view.participants.forEach((participant) => expect(participant.score).toBe(0));
  });

  // T025 [US3]
  it("an incorrect guess adds 0 and records history as incorrect", () => {
    const game = startedRoom();
    const wrong = `${game.secretWord}-definitely-wrong`;

    const result = submitGuess(game.code, game.guesserId, wrong);
    expect(result.ok && result.correct).toBe(false);

    const view = toRoomSnapshot(getRoom(game.code)!, game.guesserId);
    const guesser = view.participants.find((participant) => participant.id === game.guesserId);
    expect(guesser?.score).toBe(0);
    expect(view.guesses.at(-1)?.correct).toBe(false);
    expect(view.roundEnded).toBe(false);
  });

  // T025 [US3]
  it("a correct guess (case-insensitive) adds 100, marks correct, and ends the round", () => {
    const game = startedRoom();

    const result = submitGuess(game.code, game.guesserId, `  ${game.secretWord.toUpperCase()} `);
    expect(result.ok && result.correct).toBe(true);

    const view = toRoomSnapshot(getRoom(game.code)!, game.guesserId);
    const guesser = view.participants.find((participant) => participant.id === game.guesserId);
    expect(guesser?.score).toBe(100);
    expect(view.guesses.at(-1)?.correct).toBe(true);
    expect(view.roundEnded).toBe(true);
  });

  // T025 [US3]
  it("guess history preserves submission order", () => {
    const game = startedRoom();
    submitGuess(game.code, game.guesserId, "first");
    submitGuess(game.code, game.guesserId, "second");

    const view = toRoomSnapshot(getRoom(game.code)!, game.guesserId);
    expect(view.guesses.map((entry) => entry.guess)).toEqual(["first", "second"]);
  });

  // --- Group 4 ---

  // T002 [US1]
  it("toRoomSnapshot hides secretWord from a guesser while active but reveals it once ended", () => {
    const game = startedRoom();

    const activeView = toRoomSnapshot(getRoom(game.code)!, game.guesserId);
    expect(Object.prototype.hasOwnProperty.call(activeView, "secretWord")).toBe(false);

    submitGuess(game.code, game.guesserId, game.secretWord);

    const endedView = toRoomSnapshot(getRoom(game.code)!, game.guesserId);
    expect(endedView.roundEnded).toBe(true);
    expect(endedView.secretWord).toBe(game.secretWord);
  });

  // T002 [US1]
  it("revealing room A's word when ended does not affect room B", () => {
    const gameA = startedRoom();
    const gameB = startedRoom();

    submitGuess(gameA.code, gameA.guesserId, gameA.secretWord);

    const viewB = toRoomSnapshot(getRoom(gameB.code)!, gameB.guesserId);
    expect(viewB.roundEnded).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(viewB, "secretWord")).toBe(false);
  });

  // T005 [US2]
  it("restartRoom returns an ended round to the lobby and clears round state", () => {
    const game = startedRoom();
    submitGuess(game.code, game.guesserId, game.secretWord);

    const result = restartRoom(game.code, game.drawerId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.room.status).toBe("lobby");
    expect(result.room.round).toBeNull();
    expect(result.room.participants).toHaveLength(2);
    expect(result.room.hostId).toBe(game.drawerId);

    const view = toRoomSnapshot(getRoom(game.code)!, game.guesserId);
    expect(view.drawerId).toBeNull();
    expect(view.strokes).toHaveLength(0);
    expect(view.guesses).toHaveLength(0);
    expect(Object.prototype.hasOwnProperty.call(view, "secretWord")).toBe(false);
  });

  // T005 [US2]
  it("restartRoom rejects non-host and active-round attempts without mutating state", () => {
    const game = startedRoom();

    expect(restartRoom(game.code, game.guesserId)).toEqual({ ok: false, reason: "forbidden" });
    expect(restartRoom(game.code, game.drawerId)).toEqual({ ok: false, reason: "not-ended" });
    expect(restartRoom("ZZZZ", game.drawerId)).toEqual({ ok: false, reason: "not-found" });

    expect(getRoom(game.code)!.status).toBe("started");
  });

  // T005 [US2]
  it("restartRoom is idempotent when already in the lobby", () => {
    const game = startedRoom();
    submitGuess(game.code, game.guesserId, game.secretWord);

    const first = restartRoom(game.code, game.drawerId);
    const second = restartRoom(game.code, game.drawerId);
    expect(first.ok && second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.room.status).toBe("lobby");
    expect(second.room.round).toBeNull();
  });

  // T005 [US2]
  it("a fresh start after restart re-initializes a clean round", () => {
    const game = startedRoom();
    submitGuess(game.code, game.guesserId, game.secretWord);
    restartRoom(game.code, game.drawerId);

    const restarted = startRoom(game.code, game.drawerId);
    expect(restarted.ok).toBe(true);
    if (!restarted.ok) return;

    expect(restarted.room.round?.ended).toBe(false);
    expect(restarted.room.round?.strokes).toHaveLength(0);
    expect(restarted.room.round?.guesses).toHaveLength(0);
    Object.values(restarted.room.round!.scores).forEach((score) => expect(score).toBe(0));
  });

  // T005 [US2]
  it("restarting room A does not change room B", () => {
    const gameA = startedRoom();
    const gameB = startedRoom();
    submitGuess(gameA.code, gameA.guesserId, gameA.secretWord);

    restartRoom(gameA.code, gameA.drawerId);

    const roomB = getRoom(gameB.code)!;
    expect(roomB.status).toBe("started");
    expect(roomB.round).not.toBeNull();
  });
});
