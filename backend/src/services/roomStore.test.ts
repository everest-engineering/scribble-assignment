import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, listWords, startRoom, toRoomSnapshot } from "./roomStore.js";

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
});
