import { describe, expect, it } from "vitest";
import {
  createRoom,
  getRoom,
  joinRoom,
  selectWord,
  startRound,
  submitGuess,
  toRoomSnapshot,
  updateDrawing
} from "./roomStore.js";
import { STARTER_WORDS } from "../seed/starterData.js";

function startedRoom() {
  const { room, participantId: hostId } = createRoom("Alice");
  const joined = joinRoom(room.code, "Bob");
  const guesserId = joined!.participantId;
  const started = startRound(room.code, hostId);
  if (!started.ok) {
    throw new Error("expected start to succeed");
  }
  return { room: started.room, hostId, guesserId };
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

  it("makes the creator the host (US1)", () => {
    const { room, participantId } = createRoom("Alice");

    expect(room.hostId).toBe(participantId);
    expect(room.hostId).toBe(room.participants[0].id);
  });

  it("snapshot marks the creator as host and cannot start alone (US1)", () => {
    const { room, participantId } = createRoom("Alice");
    const snapshot = toRoomSnapshot(room, participantId);

    expect(snapshot.isHost).toBe(true);
    expect(snapshot.canStart).toBe(false);
    expect(snapshot.hostId).toBe(participantId);
  });

  it("a joiner is not the host (US2)", () => {
    const { room } = createRoom("Alice");
    const joined = joinRoom(room.code, "Bob");

    expect(joined).not.toBeNull();
    const snapshot = toRoomSnapshot(joined!.room, joined!.participantId);
    expect(snapshot.isHost).toBe(false);
    expect(snapshot.hostId).toBe(room.hostId);
  });

  it("resolves a room code case-insensitively (US2)", () => {
    const { room } = createRoom("Alice");
    const joined = joinRoom(room.code.toLowerCase(), "Bob");

    expect(joined).not.toBeNull();
    expect(joined!.room.code).toBe(room.code);
    expect(joined!.room.participants).toHaveLength(2);
  });

  it("keeps two rooms fully isolated (US2)", () => {
    const a = createRoom("Alice");
    joinRoom(a.room.code, "Bob");
    const b = createRoom("Carol");

    expect(a.room.code).not.toBe(b.room.code);
    expect(b.room.participants).toHaveLength(1);
    expect(b.room.participants[0].name).toBe("Carol");
  });

  it("host can only start once two players are present (US5)", () => {
    const { room, participantId } = createRoom("Alice");
    expect(toRoomSnapshot(room, participantId).canStart).toBe(false);

    const joined = joinRoom(room.code, "Bob");
    expect(toRoomSnapshot(joined!.room, participantId).canStart).toBe(true);
  });

  it("a non-host can never start, even with two players (US5)", () => {
    const { room } = createRoom("Alice");
    const joined = joinRoom(room.code, "Bob");

    const snapshot = toRoomSnapshot(joined!.room, joined!.participantId);
    expect(snapshot.isHost).toBe(false);
    expect(snapshot.canStart).toBe(false);
  });

  it("startRound sets playing status and assigns the host as drawer (US1)", () => {
    const { room, hostId } = startedRoom();

    expect(room.status).toBe("playing");
    expect(room.drawerId).toBe(hostId);
    expect(room.secretWord).not.toBeNull();
  });

  it("startRound rejects a non-host requester and a one-player room (US1)", () => {
    const { room, participantId: hostId } = createRoom("Alice");

    expect(startRound(room.code, hostId)).toEqual({ ok: false, reason: "too_few_players" });

    const joined = joinRoom(room.code, "Bob");
    expect(startRound(room.code, joined!.participantId)).toEqual({
      ok: false,
      reason: "not_host"
    });

    expect(startRound("ZZZZ", hostId)).toEqual({ ok: false, reason: "not_found" });
  });

  it("identifies exactly one drawer and the viewer's own role (US2)", () => {
    const { room, hostId, guesserId } = startedRoom();

    const hostView = toRoomSnapshot(room, hostId);
    const guesserView = toRoomSnapshot(room, guesserId);

    expect(hostView.isDrawer).toBe(true);
    expect(guesserView.isDrawer).toBe(false);
    expect(hostView.drawerId).toBe(hostId);
    expect(room.participants.filter((p) => p.id === room.drawerId)).toHaveLength(1);
  });

  it("selects a deterministic starter word (US3)", () => {
    const { room } = createRoom("Alice");
    const word = selectWord(room.code);

    expect(STARTER_WORDS).toContain(word);
    expect(selectWord(room.code)).toBe(word);
    expect(selectWord(room.code.toLowerCase())).toBe(word);
  });

  it("reveals the secret word only to the drawer (US3)", () => {
    const { room, hostId, guesserId } = startedRoom();

    const hostView = toRoomSnapshot(room, hostId);
    const guesserView = toRoomSnapshot(room, guesserId);

    expect(hostView.secretWord).toBe(room.secretWord);
    expect(STARTER_WORDS).toContain(hostView.secretWord);
    expect(guesserView.secretWord).toBeNull();
  });

  it("rejects invalid, drawer, and not-playing guesses (US1)", () => {
    const lobby = createRoom("Alice");
    joinRoom(lobby.room.code, "Bob");
    // Not playing yet.
    expect(submitGuess(lobby.room.code, lobby.participantId, "pizza").ok).toBe(false);

    const { room, hostId, guesserId } = startedRoom();
    expect(submitGuess(room.code, guesserId, "   ")).toEqual({ ok: false, reason: "invalid" });
    expect(submitGuess(room.code, hostId, room.secretWord!)).toEqual({
      ok: false,
      reason: "not_guesser"
    });
    expect(submitGuess("ZZZZ", guesserId, "pizza")).toEqual({ ok: false, reason: "not_found" });
  });

  it("matches the word case-insensitively and records history in order (US1/US2)", () => {
    const { room, guesserId } = startedRoom();
    const word = room.secretWord!;

    submitGuess(room.code, guesserId, "definitely-wrong");
    const after = submitGuess(room.code, guesserId, `  ${word.toUpperCase()} `);
    if (!after.ok) throw new Error("expected guess to succeed");

    expect(after.room.guesses).toHaveLength(2);
    expect(after.room.guesses[0].correct).toBe(false);
    expect(after.room.guesses[1].correct).toBe(true);
  });

  it("withholds a correct guess's text from other guessers but not the drawer/author (US2)", () => {
    const { room, hostId, guesserId } = startedRoom();
    const carol = joinRoom(room.code, "Carol")!.participantId;
    const word = room.secretWord!;
    const result = submitGuess(room.code, guesserId, word);
    if (!result.ok) throw new Error("expected guess to succeed");

    const drawerView = toRoomSnapshot(result.room, hostId);
    const authorView = toRoomSnapshot(result.room, guesserId);
    const otherView = toRoomSnapshot(result.room, carol);

    expect(drawerView.guesses[0].text).toBe(word);
    expect(authorView.guesses[0].text).toBe(word);
    expect(otherView.guesses[0].text).toBeNull();
    expect(otherView.guesses[0].correct).toBe(true);
  });

  it("scores 100 once for a correct guess and 0 for incorrect (US3)", () => {
    const { room, hostId, guesserId } = startedRoom();
    const word = room.secretWord!;

    const scoreOf = (snapRoom: typeof room, id: string) =>
      toRoomSnapshot(snapRoom, id).scores.find((s) => s.participantId === id)!.score;

    // All start at 0.
    expect(scoreOf(room, guesserId)).toBe(0);
    expect(scoreOf(room, hostId)).toBe(0);

    submitGuess(room.code, guesserId, "wrong");
    const wrong = getRoomOrThrow(room.code);
    expect(scoreOf(wrong, guesserId)).toBe(0);

    submitGuess(room.code, guesserId, word);
    const right = getRoomOrThrow(room.code);
    expect(scoreOf(right, guesserId)).toBe(100);

    // Repeat correct guess does not exceed 100.
    submitGuess(room.code, guesserId, word);
    const again = getRoomOrThrow(room.code);
    expect(scoreOf(again, guesserId)).toBe(100);
  });

  it("stores the drawing only for the drawer and shows it to everyone (US4 amended)", () => {
    const { room, hostId, guesserId } = startedRoom();

    // A non-drawer cannot update the drawing.
    expect(updateDrawing(room.code, guesserId, "data:image/png;base64,AAA")).toEqual({
      ok: false,
      reason: "not_drawer"
    });

    const updated = updateDrawing(room.code, hostId, "data:image/png;base64,AAA");
    if (!updated.ok) throw new Error("expected drawing update to succeed");

    // Visible to both the drawer and a guesser.
    expect(toRoomSnapshot(updated.room, hostId).drawing).toBe("data:image/png;base64,AAA");
    expect(toRoomSnapshot(updated.room, guesserId).drawing).toBe("data:image/png;base64,AAA");

    // Clearing sets it back to null for everyone.
    const cleared = updateDrawing(room.code, hostId, null);
    if (!cleared.ok) throw new Error("expected clear to succeed");
    expect(toRoomSnapshot(cleared.room, guesserId).drawing).toBeNull();
  });

  it("rejects drawing updates when the round is not active (US4 amended)", () => {
    const { room } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    expect(updateDrawing(room.code, room.hostId, "data:image/png;base64,AAA")).toEqual({
      ok: false,
      reason: "not_playing"
    });
  });
});

function getRoomOrThrow(code: string) {
  const room = getRoom(code);
  if (!room) throw new Error("room missing");
  return room;
}
