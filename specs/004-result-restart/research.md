# Research: Result, Restart & Final Validation

**Feature**: `004-result-restart` | **Date**: 2026-05-31

## R1 — Round end trigger

**Decision**: Transition `room.status` from `playing` to `result` inside `submitGuess()` when `evaluation.correct === true`, immediately after recording the guess and applying +100 score.

**Rationale**: Spec assumption and Scenario 3 deferral both point to first correct guess. Single server mutation avoids race conditions; subsequent guess/draw requests fail `assertPlaying`.

**Alternatives considered**:
- **Separate host "end round" action**: Out of scope per spec.
- **Async job / delayed transition**: Unnecessary for in-memory lab.

## R2 — Result snapshot visibility

**Decision**: When `status === "result"`, `toRoomSnapshot()` includes `secretWord`, `scores`, `guesses`, and `strokes` for **all** viewers (no drawer-only filter). Omit `availableWords`.

**Rationale**: FR-003 and FR-004 require every participant to see word, scores, and history. Strokes optional for display but preserved for consistency if result UI shows final drawing.

**Alternatives considered**:
- **Hide strokes on result**: Acceptable UX simplification; plan keeps strokes in snapshot for optional read-only canvas on result page.

## R3 — Mutation guards in result state

**Decision**: Reuse existing `assertPlaying()` in `appendStroke`, `clearStrokes`, and `submitGuess`. When status is `result`, return `not_playing` (maps to HTTP 409).

**Rationale**: Minimal change; FR-002 satisfied without new status-specific error types.

## R4 — Restart semantics

**Decision**: New `restartRoom(code, hostParticipantId)` sets `status = "lobby"`, clears `drawerId`, `secretWord`, `scores`, `strokes`, `guesses`; preserves `hostId`, `participants`, and `code`.

**Rationale**: FR-007–FR-009. Next `startGame()` re-initializes round fields per existing Scenario 2/3 logic.

**Alternatives considered**:
- **Delete and recreate room**: Violates FR-008 (preserve code/players).

## R5 — Restart API

**Decision**: `POST /rooms/:code/restart` with body `{ participantId }`. Host-only; allowed only when `status === "result"`.

**Rationale**: Mirrors `POST /rooms/:code/start` pattern from Scenario 1.

## R6 — Frontend routing

**Decision**: Add `/result` route with `ResultPage`. Poll ~2s on result page. `GamePage` redirects to `/result` when `room.status === "result"`. `LobbyPage` and `ResultPage` redirect based on polled status (`playing` → `/game`, `lobby` → `/lobby`, `result` → `/result`).

**Rationale**: FR-010 and FR-011; dedicated page clearer than overloading `GamePage`. Reuse `ResultPanel`, `Scoreboard`, `GuessHistory` components.

**Alternatives considered**:
- **Single `/game` route with mode switch**: Works but mixes active play and read-only result; separate route simplifies guards.

## R7 — Correct guess navigation timing

**Decision**: Guesser tab navigates on successful `submitGuess` response when `room.status === "result"`. Other tabs navigate via poll on `GamePage` or `LobbyPage` (if somehow still in lobby).

**Rationale**: Submitter gets immediate feedback; others within one poll cycle (~2s).

## R8 — Automated tests

**Decision**: Vitest for `submitGuess` → `result` transition, mutation rejection in `result`, and `restartRoom` host guard + field reset.

**Rationale**: Constitution encourages service tests for deterministic rules.

## R9 — Join during result

**Decision**: `joinRoom` returns `in_progress` when status is `result` (same as `playing`).

**Rationale**: Consistent with Scenario 1 late-join rejection; result is not joinable lobby.
