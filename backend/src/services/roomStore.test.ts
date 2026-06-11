import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetRoomsForTests,
  createRoom,
  getRoom,
  isGuessCorrect,
  joinRoom,
  selectWordForRound,
  startRoom,
  submitGuess,
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

  // FR-003 (US1)
  describe("isGuessCorrect", () => {
    it.each([
      ["Rocket", "rocket", true],
      ["ROCKET", "rocket", true],
      ["  rocket  ", "rocket", true],
      ["rockets", "rocket", false],
      ["rock et", "rocket", false],
      ["", "rocket", false]
    ] as const)("isGuessCorrect(%j, %j) === %s", (input, secret, expected) => {
      expect(isGuessCorrect(input, secret)).toBe(expected);
    });
  });

  // FR-001..005, FR-009 (US1 + US2)
  describe("submitGuess", () => {
    function freshRound() {
      const host = createRoom("Alice");
      const joined = joinRoom(host.room.code, "Bob");
      if (!joined) throw new Error("expected join to succeed");
      const start = startRoom(host.room.code, host.participantId);
      if (!start.ok) throw new Error("expected start to succeed");
      return { code: host.room.code, hostId: host.participantId, guestId: joined.participantId };
    }

    it("returns not_found for an unknown room code", () => {
      expect(submitGuess("ZZZZ", "anyone", "rocket")).toEqual({
        ok: false,
        reason: "not_found"
      });
    });

    it("returns no_round when called against a lobby-state room", () => {
      const host = createRoom("Alice");
      expect(submitGuess(host.room.code, host.participantId, "rocket")).toEqual({
        ok: false,
        reason: "no_round"
      });
    });

    it("returns not_in_room for an unknown participantId", () => {
      const { code } = freshRound();
      expect(submitGuess(code, "fake-uuid", "rocket")).toEqual({
        ok: false,
        reason: "not_in_room"
      });
    });

    it("returns is_drawer when the caller is the active drawer", () => {
      const { code, hostId } = freshRound();
      expect(submitGuess(code, hostId, "rocket")).toEqual({ ok: false, reason: "is_drawer" });
    });

    it("appends a wrong guess to the round's chronological feed and leaves scores at 0", () => {
      const { code, hostId, guestId } = freshRound();
      const r = submitGuess(code, guestId, "cat");
      if (!r.ok) throw new Error("expected ok");
      expect(r.guess.isCorrect).toBe(false);
      expect(r.guess.text).toBe("cat");
      expect(r.guess.displayName).toBe("Bob");
      expect(r.room.round?.guesses).toHaveLength(1);
      expect(r.room.round?.scores).toEqual({ [hostId]: 0, [guestId]: 0 });
      expect(r.room.round?.lockedParticipantIds).toEqual([]);
    });

    it("on a correct guess: appends, increments score by exactly 100, locks the guesser out", () => {
      const { code, hostId, guestId } = freshRound();
      const r = submitGuess(code, guestId, "  RoCkEt  ");
      if (!r.ok) throw new Error("expected ok");
      expect(r.guess.isCorrect).toBe(true);
      expect(r.guess.text).toBe("RoCkEt"); // trimmed but original case preserved
      expect(r.room.round?.scores).toEqual({ [hostId]: 0, [guestId]: 100 });
      expect(r.room.round?.lockedParticipantIds).toEqual([guestId]);
    });

    it("a second guess from an already-correct guesser is rejected with already_correct (no double score)", () => {
      const { code, guestId } = freshRound();
      submitGuess(code, guestId, "rocket");
      const second = submitGuess(code, guestId, "rocket");
      expect(second).toEqual({ ok: false, reason: "already_correct" });
      const room = getRoom(code);
      expect(room?.round?.scores[guestId]).toBe(100);
      expect(room?.round?.guesses).toHaveLength(1);
    });

    it("preserves chronological ordering across multiple guessers", () => {
      const host = createRoom("Alice");
      const bob = joinRoom(host.room.code, "Bob");
      const carol = joinRoom(host.room.code, "Carol");
      if (!bob || !carol) throw new Error("join failed");
      startRoom(host.room.code, host.participantId);

      submitGuess(host.room.code, bob.participantId, "cat");
      submitGuess(host.room.code, carol.participantId, "rocket");
      submitGuess(host.room.code, bob.participantId, "rocket");

      const room = getRoom(host.room.code);
      expect(room?.round?.guesses.map((g) => `${g.displayName}:${g.isCorrect}`)).toEqual([
        "Bob:false",
        "Carol:true",
        "Bob:true"
      ]);
      expect(room?.round?.scores).toEqual({
        [host.participantId]: 0,
        [bob.participantId]: 100,
        [carol.participantId]: 100
      });
    });
  });

  // FR-006: snapshot exposes the round-scoped fields uniformly to every viewer
  describe("toRoomSnapshot — guess/score fields", () => {
    it("returns empty guesses/scores/locked arrays at round start for every viewer", () => {
      const host = createRoom("Alice");
      const bob = joinRoom(host.room.code, "Bob");
      if (!bob) throw new Error("join failed");
      startRoom(host.room.code, host.participantId);
      const room = getRoom(host.room.code);
      if (!room) throw new Error("expected room");

      for (const viewer of [host.participantId, bob.participantId, undefined]) {
        const snap = toRoomSnapshot(room, viewer);
        expect(snap.round?.guesses).toEqual([]);
        expect(snap.round?.lockedParticipantIds).toEqual([]);
        expect(snap.round?.scores).toEqual({
          [host.participantId]: 0,
          [bob.participantId]: 0
        });
      }
    });

    it("reflects guesses and scores identically to drawer / guesser / anonymous viewers", () => {
      const host = createRoom("Alice");
      const bob = joinRoom(host.room.code, "Bob");
      if (!bob) throw new Error("join failed");
      startRoom(host.room.code, host.participantId);
      submitGuess(host.room.code, bob.participantId, "rocket");
      const room = getRoom(host.room.code);
      if (!room) throw new Error("expected room");

      const drawerSnap = toRoomSnapshot(room, host.participantId);
      const guesserSnap = toRoomSnapshot(room, bob.participantId);
      const anonSnap = toRoomSnapshot(room);

      for (const snap of [drawerSnap, guesserSnap, anonSnap]) {
        expect(snap.round?.guesses).toHaveLength(1);
        expect(snap.round?.guesses[0].isCorrect).toBe(true);
        expect(snap.round?.scores[bob.participantId]).toBe(100);
        expect(snap.round?.lockedParticipantIds).toEqual([bob.participantId]);
      }

      // FR-005 carry-over: secretWord still drawer-only.
      expect(drawerSnap.round?.secretWord).toBe("rocket");
      expect(guesserSnap.round?.secretWord).toBeUndefined();
      expect(anonSnap.round?.secretWord).toBeUndefined();
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
