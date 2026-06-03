import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createRoom, getRoom, joinRoom, startRoom, toRoomSnapshot, updateCanvas, clearCanvas, submitGuess, checkRoundExpiry } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  // T009: hostId is set on room creation
  it("createRoom sets hostId to the creator's participantId", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("joinRoom returns not_found result for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toMatchObject({ ok: false, reason: "not_found" });
  });

  // T018: max player enforcement
  it("joinRoom returns full error when room already has 4 participants", () => {
    const { room } = createRoom("P1");
    joinRoom(room.code, "P2");
    joinRoom(room.code, "P3");
    joinRoom(room.code, "P4");
    const result = joinRoom(room.code, "P5");

    expect(result).not.toBeNull();
    expect(result).toMatchObject({ ok: false, reason: "full" });
  });

  // T027: startRoom transitions status and guards access
  it("startRoom transitions room status to in-progress when host starts with 2+ players", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");

    const result = startRoom(room.code, participantId);

    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.room.status).toBe("in-progress");
    }
  });

  it("startRoom returns not_host when called by a non-host participant", () => {
    const { room } = createRoom("Host");
    const joinResult = joinRoom(room.code, "Guest");

    expect(joinResult).toMatchObject({ ok: true });
    if (!joinResult || !joinResult.ok) return;

    const result = startRoom(room.code, joinResult.participantId);
    expect(result).toMatchObject({ ok: false, reason: "not_host" });
  });

  it("startRoom returns too_few_players when only 1 participant is present", () => {
    const { room, participantId } = createRoom("Host");

    const result = startRoom(room.code, participantId);
    expect(result).toMatchObject({ ok: false, reason: "too_few_players" });
  });

  it("startRoom returns not_found for an unknown room code", () => {
    const result = startRoom("ZZZZ", "any-id");
    expect(result).toMatchObject({ ok: false, reason: "not_found" });
  });

  // T004: drawer assignment
  it("startRoom sets drawerId to hostId on success", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");

    const result = startRoom(room.code, participantId);
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.room.drawerId).toBe(participantId);
    }
  });

  it("startRoom sets currentWord to 'rocket' on success", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");

    const result = startRoom(room.code, participantId);
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.room.currentWord).toBe("rocket");
    }
  });

  it("startRoom returns already_started when room is already in-progress", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");
    startRoom(room.code, participantId);

    const result = startRoom(room.code, participantId);
    expect(result).toMatchObject({ ok: false, reason: "already_started" });
  });

  it("createRoom initializes drawerId and currentWord to null", () => {
    const { room } = createRoom("Alice");
    expect(room.drawerId).toBeNull();
    expect(room.currentWord).toBeNull();
  });

  // T004: toRoomSnapshot viewer-based word filtering
  it("toRoomSnapshot returns currentWord for the drawer", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");
    const result = startRoom(room.code, participantId);
    if (!result.ok) throw new Error("expected ok");

    const snapshot = toRoomSnapshot(result.room, participantId);
    expect(snapshot.drawerId).toBe(participantId);
    expect(snapshot.currentWord).toBe("rocket");
  });

  it("toRoomSnapshot returns null currentWord for non-drawer", () => {
    const { room, participantId } = createRoom("Host");
    const joinResult = joinRoom(room.code, "Guest");
    if (!joinResult || !joinResult.ok) throw new Error("expected join ok");
    const result = startRoom(room.code, participantId);
    if (!result.ok) throw new Error("expected ok");

    const snapshot = toRoomSnapshot(result.room, joinResult.participantId);
    expect(snapshot.drawerId).toBe(participantId);
    expect(snapshot.currentWord).toBeNull();
  });

  it("toRoomSnapshot returns null currentWord when no viewerParticipantId provided", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");
    const result = startRoom(room.code, participantId);
    if (!result.ok) throw new Error("expected ok");

    const snapshot = toRoomSnapshot(result.room);
    expect(snapshot.drawerId).toBe(participantId);
    expect(snapshot.currentWord).toBeNull();
  });

  // T012: name trimming and empty-name rejection
  it("createRoom stores trimmed name when name has leading/trailing whitespace", () => {
    const { room } = createRoom("  Alice  ");
    expect(room.participants[0].name).toBe("Alice");
  });

  it("createRoom returns an error for empty name", () => {
    const result = createRoom("   ");
    expect(result).toMatchObject({ ok: false, reason: "invalid_name" });
  });

  it("joinRoom stores trimmed name when name has leading/trailing whitespace", () => {
    const { room } = createRoom("Host");
    const result = joinRoom(room.code, "  Bob  ");
    expect(result).not.toBeNull();
    if (!result || !result.ok) throw new Error("expected ok");
    expect(result.room.participants[1].name).toBe("Bob");
  });

  it("joinRoom returns an error for empty name", () => {
    const { room } = createRoom("Host");
    const result = joinRoom(room.code, "   ");
    expect(result).toMatchObject({ ok: false, reason: "invalid_name" });
  });

  // T008: startRoom initializes new gameplay fields
  it("startRoom initializes canvasDataUrl to null", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");
    const result = startRoom(room.code, participantId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.room.canvasDataUrl).toBeNull();
  });

  it("startRoom initializes guesses to empty array", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");
    const result = startRoom(room.code, participantId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.room.guesses).toEqual([]);
  });

  it("startRoom initializes scores to 0 for all participants", () => {
    const { room, participantId } = createRoom("Host");
    const joinResult = joinRoom(room.code, "Guest");
    expect(joinResult).toMatchObject({ ok: true });
    if (!joinResult || !joinResult.ok) return;
    const result = startRoom(room.code, participantId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.room.scores[participantId]).toBe(0);
    expect(result.room.scores[joinResult.participantId]).toBe(0);
  });

  it("startRoom initializes roundStartedAt to a valid ISO timestamp", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");
    const before = new Date().toISOString();
    const result = startRoom(room.code, participantId);
    const after = new Date().toISOString();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.room.roundStartedAt).not.toBeNull();
    expect(result.room.roundStartedAt! >= before).toBe(true);
    expect(result.room.roundStartedAt! <= after).toBe(true);
  });

  // T009: checkRoundExpiry transitions status
  describe("checkRoundExpiry", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("transitions status to 'finished' when time has expired", () => {
      const { room, participantId } = createRoom("Host");
      joinRoom(room.code, "Guest");
      const startResult = startRoom(room.code, participantId);
      expect(startResult.ok).toBe(true);
      if (!startResult.ok) return;

      // Advance time past 90 seconds
      vi.advanceTimersByTime(91 * 1000);

      const fakeRoom = { ...startResult.room, correctGuessers: new Set<string>() };
      checkRoundExpiry(fakeRoom);
      expect(fakeRoom.status).toBe("finished");
    });

    it("does not change status when round has not yet expired", () => {
      const { room, participantId } = createRoom("Host");
      joinRoom(room.code, "Guest");
      const startResult = startRoom(room.code, participantId);
      expect(startResult.ok).toBe(true);
      if (!startResult.ok) return;

      // Only 30 seconds have passed
      vi.advanceTimersByTime(30 * 1000);

      const fakeRoom = { ...startResult.room, correctGuessers: new Set<string>() };
      checkRoundExpiry(fakeRoom);
      expect(fakeRoom.status).toBe("in-progress");
    });

    it("does not change status when room is in lobby", () => {
      const { room } = createRoom("Host");
      const fakeRoom = { ...room, correctGuessers: new Set<string>() };
      checkRoundExpiry(fakeRoom);
      expect(fakeRoom.status).toBe("lobby");
    });
  });

  // T010: toRoomSnapshot includes new gameplay fields
  it("toRoomSnapshot includes canvasDataUrl from room", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");
    const result = startRoom(room.code, participantId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const snapshot = toRoomSnapshot(result.room, participantId);
    expect(snapshot.canvasDataUrl).toBeNull();
  });

  it("toRoomSnapshot includes empty guesses array initially", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");
    const result = startRoom(room.code, participantId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const snapshot = toRoomSnapshot(result.room, participantId);
    expect(snapshot.guesses).toEqual([]);
  });

  it("toRoomSnapshot includes scores for all participants", () => {
    const { room, participantId } = createRoom("Host");
    const joinResult = joinRoom(room.code, "Guest");
    expect(joinResult).toMatchObject({ ok: true });
    if (!joinResult || !joinResult.ok) return;
    const result = startRoom(room.code, participantId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const snapshot = toRoomSnapshot(result.room, participantId);
    expect(snapshot.scores[participantId]).toBe(0);
    expect(snapshot.scores[joinResult.participantId]).toBe(0);
  });

  it("toRoomSnapshot computes roundEndsAt as roundStartedAt + 90s", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");
    const result = startRoom(room.code, participantId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const snapshot = toRoomSnapshot(result.room, participantId);
    expect(snapshot.roundEndsAt).not.toBeNull();
    const startMs = new Date(result.room.roundStartedAt!).getTime();
    const endsMs = new Date(snapshot.roundEndsAt!).getTime();
    expect(endsMs - startMs).toBe(90 * 1000);
  });

  it("toRoomSnapshot returns roundEndsAt as null when status is lobby", () => {
    const { room } = createRoom("Host");
    const snapshot = toRoomSnapshot(room);
    expect(snapshot.roundEndsAt).toBeNull();
  });

  it("toRoomSnapshot returns hasGuessedCorrectly false for viewer not in correctGuessers", () => {
    const { room, participantId } = createRoom("Host");
    const joinResult = joinRoom(room.code, "Guest");
    expect(joinResult).toMatchObject({ ok: true });
    if (!joinResult || !joinResult.ok) return;
    const result = startRoom(room.code, participantId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const snapshot = toRoomSnapshot(result.room, joinResult.participantId);
    expect(snapshot.hasGuessedCorrectly).toBe(false);
  });

  it("toRoomSnapshot resolves participantName in guess snapshots", () => {
    const { room, participantId } = createRoom("Host");
    const joinResult = joinRoom(room.code, "Bob");
    expect(joinResult).toMatchObject({ ok: true });
    if (!joinResult || !joinResult.ok) return;
    startRoom(room.code, participantId);

    const submitResult = submitGuess(room.code, joinResult.participantId, "wrong-answer");
    expect(submitResult.ok).toBe(true);
    if (!submitResult.ok) return;

    // Use live room state from store, not the stale clone from startRoom
    const liveRoom = getRoom(room.code);
    expect(liveRoom).not.toBeNull();
    if (!liveRoom) return;

    const snapshot = toRoomSnapshot(liveRoom, joinResult.participantId);
    expect(snapshot.guesses[0].participantName).toBe("Bob");
  });

  // T014: updateCanvas
  describe("updateCanvas", () => {
    it("sets canvasDataUrl when drawer calls with valid data", () => {
      const { room, participantId } = createRoom("Host");
      joinRoom(room.code, "Guest");
      startRoom(room.code, participantId);
      const result = updateCanvas(room.code, participantId, "data:image/png;base64,abc");
      expect(result).toMatchObject({ ok: true });
    });

    it("returns not_found when room code does not exist", () => {
      const result = updateCanvas("ZZZZ", "any-id", "data:image/png;base64,abc");
      expect(result).toMatchObject({ ok: false, reason: "not_found" });
    });

    it("returns not_active when room is in lobby", () => {
      const { room, participantId } = createRoom("Host");
      const result = updateCanvas(room.code, participantId, "data:image/png;base64,abc");
      expect(result).toMatchObject({ ok: false, reason: "not_active" });
    });

    it("returns not_drawer when non-drawer attempts to update canvas", () => {
      const { room, participantId } = createRoom("Host");
      const joinResult = joinRoom(room.code, "Guest");
      expect(joinResult).toMatchObject({ ok: true });
      if (!joinResult || !joinResult.ok) return;
      startRoom(room.code, participantId);
      const result = updateCanvas(room.code, joinResult.participantId, "data:image/png;base64,abc");
      expect(result).toMatchObject({ ok: false, reason: "not_drawer" });
    });
  });

  // T015: clearCanvas
  describe("clearCanvas", () => {
    it("sets canvasDataUrl to null when drawer clears", () => {
      const { room, participantId } = createRoom("Host");
      joinRoom(room.code, "Guest");
      startRoom(room.code, participantId);
      updateCanvas(room.code, participantId, "data:image/png;base64,abc");
      const result = clearCanvas(room.code, participantId);
      expect(result).toMatchObject({ ok: true });
    });

    it("returns not_found when room code does not exist", () => {
      const result = clearCanvas("ZZZZ", "any-id");
      expect(result).toMatchObject({ ok: false, reason: "not_found" });
    });

    it("returns not_active when room is in lobby", () => {
      const { room, participantId } = createRoom("Host");
      const result = clearCanvas(room.code, participantId);
      expect(result).toMatchObject({ ok: false, reason: "not_active" });
    });

    it("returns not_drawer when non-drawer attempts to clear canvas", () => {
      const { room, participantId } = createRoom("Host");
      const joinResult = joinRoom(room.code, "Guest");
      expect(joinResult).toMatchObject({ ok: true });
      if (!joinResult || !joinResult.ok) return;
      startRoom(room.code, participantId);
      const result = clearCanvas(room.code, joinResult.participantId);
      expect(result).toMatchObject({ ok: false, reason: "not_drawer" });
    });
  });

  // T031: submitGuess
  describe("submitGuess", () => {
    it("returns not_found when room code does not exist", () => {
      const result = submitGuess("ZZZZ", "any-id", "rocket");
      expect(result).toMatchObject({ ok: false, reason: "not_found" });
    });

    it("returns not_active when room is in lobby", () => {
      const { room } = createRoom("Host");
      const joinResult = joinRoom(room.code, "Guest");
      expect(joinResult).toMatchObject({ ok: true });
      if (!joinResult || !joinResult.ok) return;
      const result = submitGuess(room.code, joinResult.participantId, "rocket");
      expect(result).toMatchObject({ ok: false, reason: "not_active" });
    });

    it("returns is_drawer when drawer attempts to submit a guess", () => {
      const { room, participantId } = createRoom("Host");
      joinRoom(room.code, "Guest");
      startRoom(room.code, participantId);
      const result = submitGuess(room.code, participantId, "rocket");
      expect(result).toMatchObject({ ok: false, reason: "is_drawer" });
    });

    it("returns empty_guess when text is empty after trimming", () => {
      const { room, participantId } = createRoom("Host");
      const joinResult = joinRoom(room.code, "Guest");
      expect(joinResult).toMatchObject({ ok: true });
      if (!joinResult || !joinResult.ok) return;
      startRoom(room.code, participantId);
      const result = submitGuess(room.code, joinResult.participantId, "   ");
      expect(result).toMatchObject({ ok: false, reason: "empty_guess" });
    });

    it("awards 100 points for a correct case-insensitive match", () => {
      const { room, participantId } = createRoom("Host");
      const joinResult = joinRoom(room.code, "Guest");
      expect(joinResult).toMatchObject({ ok: true });
      if (!joinResult || !joinResult.ok) return;
      startRoom(room.code, participantId);
      const result = submitGuess(room.code, joinResult.participantId, "ROCKET");
      expect(result).toMatchObject({ ok: true });
      if (!result.ok) return;
      expect(result.guess.correct).toBe(true);
    });

    it("awards 0 points for an incorrect guess", () => {
      const { room, participantId } = createRoom("Host");
      const joinResult = joinRoom(room.code, "Guest");
      expect(joinResult).toMatchObject({ ok: true });
      if (!joinResult || !joinResult.ok) return;
      startRoom(room.code, participantId);
      const result = submitGuess(room.code, joinResult.participantId, "pizza");
      expect(result).toMatchObject({ ok: true });
      if (!result.ok) return;
      expect(result.guess.correct).toBe(false);
    });

    it("trims whitespace from submitted text before comparison", () => {
      const { room, participantId } = createRoom("Host");
      const joinResult = joinRoom(room.code, "Guest");
      expect(joinResult).toMatchObject({ ok: true });
      if (!joinResult || !joinResult.ok) return;
      startRoom(room.code, participantId);
      const result = submitGuess(room.code, joinResult.participantId, "  rocket  ");
      expect(result).toMatchObject({ ok: true });
      if (!result.ok) return;
      expect(result.guess.correct).toBe(true);
      expect(result.guess.text).toBe("rocket");
    });

    it("returns already_correct when guesser has already guessed correctly", () => {
      const { room, participantId } = createRoom("Host");
      const joinResult = joinRoom(room.code, "Guest1");
      const joinResult2 = joinRoom(room.code, "Guest2");
      expect(joinResult).toMatchObject({ ok: true });
      expect(joinResult2).toMatchObject({ ok: true });
      if (!joinResult || !joinResult.ok) return;
      if (!joinResult2 || !joinResult2.ok) return;
      startRoom(room.code, participantId);
      // First correct guess — room stays in-progress because Guest2 hasn't guessed yet
      submitGuess(room.code, joinResult.participantId, "rocket");
      // Second attempt by same guesser
      const result = submitGuess(room.code, joinResult.participantId, "rocket");
      expect(result).toMatchObject({ ok: false, reason: "already_correct" });
    });

    it("transitions room to finished when all guessers have guessed correctly", () => {
      const { room, participantId } = createRoom("Host");
      const joinResult = joinRoom(room.code, "Guest");
      expect(joinResult).toMatchObject({ ok: true });
      if (!joinResult || !joinResult.ok) return;
      startRoom(room.code, participantId);
      submitGuess(room.code, joinResult.participantId, "rocket");

      const currentRoom = getRoom(room.code);
      expect(currentRoom?.status).toBe("finished");
    });
  });
});
