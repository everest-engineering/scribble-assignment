import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetRoomsForTests,
  createRoom,
  getRoom,
  joinRoom,
  selectWordForRound,
  startRoom,
  toRoomSnapshot
} from "./roomStore.js";
import { STARTER_WORDS } from "../seed/starterData.js";

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

    // FR-001, FR-002 (US1)
    it("assigns the host as the drawer of round 1 on a successful start", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const outcome = startRoom(host.room.code, host.participantId);
      if (!outcome.ok) throw new Error("expected ok start");

      expect(outcome.room.status).toBe("round");
      expect(outcome.room.round).not.toBeNull();
      expect(outcome.room.round?.roundNumber).toBe(1);
      expect(outcome.room.round?.drawerParticipantId).toBe(host.participantId);
      expect(outcome.room.round?.drawerParticipantId).toBe(outcome.room.hostParticipantId);
    });

    // FR-007 (US1) — idempotent during a round
    it("is idempotent for the host once a round exists", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const first = startRoom(host.room.code, host.participantId);
      const second = startRoom(host.room.code, host.participantId);
      if (!first.ok || !second.ok) throw new Error("expected both starts to succeed");

      expect(second.room.round).toEqual(first.room.round);
      expect(second.room.status).toBe("round");
    });

    it("still returns not_host for a non-host caller during an active round", () => {
      const host = createRoom("Alice");
      const joined = joinRoom(host.room.code, "Bob");
      if (!joined) throw new Error("expected join to succeed");
      startRoom(host.room.code, host.participantId);

      const outcome = startRoom(host.room.code, joined.participantId);
      expect(outcome).toEqual({ ok: false, reason: "not_host" });
    });

    // FR-004 (US3) — two independent rooms share the same round-1 word
    it("picks the same round-1 word for two independent rooms", () => {
      const a = createRoom("Alice");
      joinRoom(a.room.code, "Bob");
      const b = createRoom("Beth");
      joinRoom(b.room.code, "Carol");

      const oa = startRoom(a.room.code, a.participantId);
      const ob = startRoom(b.room.code, b.participantId);
      if (!oa.ok || !ob.ok) throw new Error("expected both starts to succeed");

      expect(oa.room.round?.secretWord).toBe(STARTER_WORDS[0]);
      expect(ob.room.round?.secretWord).toBe(STARTER_WORDS[0]);
    });
  });

  // FR-005, FR-006 (US2)
  describe("toRoomSnapshot — in-round viewer-aware filtering", () => {
    it("exposes secretWord only to the drawer; emits maskedWord with correct length to all", () => {
      const host = createRoom("Alice");
      const joined = joinRoom(host.room.code, "Bob");
      if (!joined) throw new Error("expected join to succeed");
      startRoom(host.room.code, host.participantId);
      const room = getRoom(host.room.code);
      if (!room) throw new Error("expected room to exist");

      const drawerView = toRoomSnapshot(room, host.participantId);
      const guesserView = toRoomSnapshot(room, joined.participantId);
      const anonView = toRoomSnapshot(room);

      expect(drawerView.round?.secretWord).toBe(STARTER_WORDS[0]);
      expect(drawerView.round?.maskedWord).toBe("_".repeat(STARTER_WORDS[0].length));
      expect(guesserView.round?.secretWord).toBeUndefined();
      expect(guesserView.round?.maskedWord.length).toBe(STARTER_WORDS[0].length);
      expect(anonView.round?.secretWord).toBeUndefined();
    });

    it("reports isDrawer=true only on the drawer's participant entry across all viewer perspectives", () => {
      const host = createRoom("Alice");
      const joined = joinRoom(host.room.code, "Bob");
      if (!joined) throw new Error("expected join to succeed");
      startRoom(host.room.code, host.participantId);
      const room = getRoom(host.room.code);
      if (!room) throw new Error("expected room to exist");

      for (const viewer of [host.participantId, joined.participantId, undefined]) {
        const snap = toRoomSnapshot(room, viewer);
        const drawer = snap.participants.find((p) => p.id === host.participantId);
        const guesser = snap.participants.find((p) => p.id === joined.participantId);
        expect(drawer?.isDrawer).toBe(true);
        expect(guesser?.isDrawer).toBe(false);
      }
    });

    it("returns round=null and isDrawer=false everywhere while in the lobby", () => {
      const host = createRoom("Alice");
      const room = getRoom(host.room.code);
      if (!room) throw new Error("expected room to exist");
      const snap = toRoomSnapshot(room, host.participantId);
      expect(snap.round).toBeNull();
      expect(snap.participants.every((p) => p.isDrawer === false)).toBe(true);
      expect(snap.status).toBe("lobby");
    });
  });

  // FR-004, FR-010 (US3)
  describe("selectWordForRound", () => {
    it("returns the word at index (n-1) mod len for various rounds", () => {
      expect(selectWordForRound(["a", "b", "c"], 1)).toBe("a");
      expect(selectWordForRound(["a", "b", "c"], 2)).toBe("b");
      expect(selectWordForRound(["a", "b", "c"], 3)).toBe("c");
      expect(selectWordForRound(["a", "b", "c"], 4)).toBe("a");
      expect(selectWordForRound(["a", "b", "c"], 100)).toBe("a");
    });

    it("throws when the list is empty", () => {
      expect(() => selectWordForRound([], 1)).toThrow("No words available");
    });

    it("picks 'rocket' (the first STARTER_WORDS entry) for round 1", () => {
      expect(selectWordForRound(STARTER_WORDS, 1)).toBe(STARTER_WORDS[0]);
      expect(STARTER_WORDS[0]).toBe("rocket");
    });
  });
});
