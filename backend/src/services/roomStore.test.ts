import { describe, expect, it } from "vitest";
import type { Room } from "../models/game.js";
import { STARTER_WORDS } from "../seed/starterData.js";
import {
  createRoom,
  joinRoom,
  selectWord,
  startRoom,
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
});
