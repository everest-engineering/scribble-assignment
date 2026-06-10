import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetRoomsForTests,
  createRoom,
  getRoom,
  joinRoom,
  startRoom,
  toRoomSnapshot
} from "./roomStore.js";

describe("roomStore", () => {
  beforeEach(() => {
    __resetRoomsForTests();
  });

  describe("createRoom", () => {
    it("returns a room with a 4-character code, the creator as the only participant, and host bound to the creator", () => {
      const result = createRoom("Alice");

      expect(result.room.code).toMatch(/^[A-Z2-9]{4}$/);
      expect(result.room.participants).toHaveLength(1);
      expect(result.room.participants[0].name).toBe("Alice");
      expect(result.room.hostParticipantId).toBe(result.participantId);
      expect(result.room.participants[0].id).toBe(result.participantId);
    });

    it("trims the player's display name", () => {
      const result = createRoom("  Alice  ");
      expect(result.room.participants[0].name).toBe("Alice");
    });

    it("produces unique codes across many rooms", () => {
      const codes = new Set<string>();
      for (let i = 0; i < 25; i += 1) {
        codes.add(createRoom(`P${i}`).room.code);
      }
      expect(codes.size).toBe(25);
    });
  });

  describe("toRoomSnapshot", () => {
    it("reports viewerIsHost true only for the host id and exposes per-participant isHost", () => {
      const created = createRoom("Alice");
      const joined = joinRoom(created.room.code, "Bob");
      if (!joined) throw new Error("expected join to succeed");

      const hostView = toRoomSnapshot(getRoom(created.room.code)!, created.participantId);
      const guestView = toRoomSnapshot(getRoom(created.room.code)!, joined.participantId);

      expect(hostView.viewerIsHost).toBe(true);
      expect(hostView.canStart).toBe(true);
      expect(hostView.hostParticipantId).toBe(created.participantId);
      expect(hostView.participants.find((p) => p.id === created.participantId)?.isHost).toBe(true);
      expect(hostView.participants.find((p) => p.id === joined.participantId)?.isHost).toBe(false);

      expect(guestView.viewerIsHost).toBe(false);
      expect(guestView.canStart).toBe(false);
    });

    it("reports canStart false for the host while participants.length < 2", () => {
      const created = createRoom("Alice");
      const view = toRoomSnapshot(getRoom(created.room.code)!, created.participantId);
      expect(view.viewerIsHost).toBe(true);
      expect(view.canStart).toBe(false);
    });

    it("treats an absent viewerParticipantId as a non-host viewer", () => {
      const created = createRoom("Alice");
      const view = toRoomSnapshot(getRoom(created.room.code)!);
      expect(view.viewerIsHost).toBe(false);
      expect(view.canStart).toBe(false);
    });
  });

  describe("joinRoom", () => {
    it("returns null for an unknown code", () => {
      expect(joinRoom("ZZZZ", "Bob")).toBeNull();
    });

    it("finds a room regardless of case or surrounding whitespace", () => {
      const created = createRoom("Alice");
      const lower = joinRoom(created.room.code.toLowerCase(), "Bob");
      const padded = joinRoom(`  ${created.room.code}  `, "Carol");

      expect(lower).not.toBeNull();
      expect(padded).not.toBeNull();
      const fresh = getRoom(created.room.code);
      expect(fresh?.participants).toHaveLength(3);
    });

    it("appends a non-host participant whose snapshot reports viewerIsHost false", () => {
      const created = createRoom("Alice");
      const joined = joinRoom(created.room.code, "Bob");
      if (!joined) throw new Error("expected join to succeed");

      const snapshot = toRoomSnapshot(getRoom(created.room.code)!, joined.participantId);
      expect(snapshot.viewerIsHost).toBe(false);
      expect(snapshot.participants.at(-1)?.id).toBe(joined.participantId);
    });

    it("isolates participants between distinct rooms", () => {
      const a = createRoom("Alice");
      const b = createRoom("Beth");
      joinRoom(a.room.code, "Carol");
      joinRoom(b.room.code, "Dan");

      const aIds = new Set(getRoom(a.room.code)!.participants.map((p) => p.id));
      const bIds = new Set(getRoom(b.room.code)!.participants.map((p) => p.id));

      for (const id of aIds) expect(bIds.has(id)).toBe(false);
      expect(getRoom(a.room.code)!.participants.map((p) => p.name)).toEqual(["Alice", "Carol"]);
      expect(getRoom(b.room.code)!.participants.map((p) => p.name)).toEqual(["Beth", "Dan"]);
    });
  });

  describe("startRoom", () => {
    it("returns ok when the host requests with at least 2 participants", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const outcome = startRoom(host.room.code, host.participantId);
      expect(outcome.ok).toBe(true);
    });

    it("returns not_host when a non-host requests", () => {
      const host = createRoom("Alice");
      const joined = joinRoom(host.room.code, "Bob");
      if (!joined) throw new Error("expected join to succeed");
      const outcome = startRoom(host.room.code, joined.participantId);
      expect(outcome).toEqual({ ok: false, reason: "not_host" });
    });

    it("returns not_enough_players when only the host is present", () => {
      const host = createRoom("Alice");
      const outcome = startRoom(host.room.code, host.participantId);
      expect(outcome).toEqual({ ok: false, reason: "not_enough_players" });
    });

    it("returns not_found for unknown codes", () => {
      const outcome = startRoom("ZZZZ", "anything");
      expect(outcome).toEqual({ ok: false, reason: "not_found" });
    });
  });
});
