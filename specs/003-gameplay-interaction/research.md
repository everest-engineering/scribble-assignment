# Phase 0 Research: Gameplay Interaction

Open decisions were resolved in `/speckit.clarify` (Session 2026-06-17). Decisions with rationale and rejected alternatives.

## D1 — Drawing surface (drawer-local)

**Decision**: Render an interactive native HTML5 `<canvas>` for the drawer (freehand via pointer events) with
a Clear button. Strokes live only in the drawer's browser; **not** sent to the server or guessers.

**Rationale**: The clarification fixed drawing as drawer-local. Native canvas needs no library (Principle IV).
Syncing pixels over a 2s poll would be heavy and borders on the out-of-scope real-time transport.

**Alternatives considered**: Sync serialized strokes via polling — large scope, laggy at 2s, out of scope.
A drawing library — unnecessary dependency.

## D2 — Guess submission & validation (server-authoritative)

**Decision**: New `POST /rooms/:code/guess { participantId, text }`. Server trims; rejects empty (400),
a drawer guess (403), and a guesser who already guessed correctly (409). Otherwise compares
`text.trim().toLowerCase()` to `secretWord.toLowerCase()` for correctness.

**Rationale**: Matches the Group 1–2 pattern (server authoritative + client guard). Trim + case-insensitive
satisfies FR-005/FR-006. Server enforcement means UI state can't be bypassed.

**Alternatives considered**: Client-only validation — bypassable. Exact-match (case-sensitive) — fails FR-006.

## D3 — Shared guess history (verbatim, on the room)

**Decision**: Store an ordered `guesses[]` on the `Room`; each entry `{ id, participantId, name, text, correct, at }`.
Include `guesses` in the snapshot for **all** viewers (verbatim, per clarification). Synced via the existing poll.

**Rationale**: One array on the room is the smallest change and rides the existing `GET /rooms/:code` poll
(FR-007/FR-008). Verbatim history was the clarified choice; the word is revealed at round end anyway.

**Alternatives considered**: Per-viewer masking of correct guesses — extra projection scope, rejected in
clarification. A separate guesses store/endpoint to fetch — unnecessary; the snapshot already polls.

## D4 — Scoring (100 once, then lock)

**Decision**: `Participant.score` (default 0). On a correct guess by a guesser whose score is 0, set it to 100.
A guesser who already scored is refused further guesses (409) — implementing FR-011/FR-011a. Scores ride the
snapshot to all players.

**Rationale**: Deriving "already scored" from `score === 100` avoids an extra flag. Server refusal + client
disable together implement disable-after-correct.

**Alternatives considered**: Separate `hasGuessed` boolean — redundant with score. Allowing repeat guesses
with no points — rejected in clarification (input is disabled after correct).

## D5 — Wiring the scaffolded components

**Decision**: Finally connect the placeholder components to room state: `GuessForm` (guesser-only, disabled
for drawer and after a correct guess, empty-guard), `Scoreboard` (participants + scores), `ResultPanel`
("Activity" → shared guess history). `GamePage` mounts a new `DrawingCanvas`.

**Rationale**: The starter already scaffolds these; wiring them (vs. new files) is the brownfield path
(Principle III). Only `DrawingCanvas` is new because no drawing surface exists.

**Alternatives considered**: One mega game component — worse separation; the scaffolded components already
exist for these roles.

## Summary of resulting changes

| Decision | Backend | Frontend | FRs |
|----------|---------|----------|-----|
| D1 canvas | — | `DrawingCanvas.tsx`, `GamePage.tsx` | FR-001/002/003 |
| D2 guess validate | `schemas.ts`, `roomStore.ts`, `rooms.ts` | `api.ts`, `roomStore.ts`, `GuessForm.tsx` | FR-004/005/006 |
| D3 history | `models/game.ts`, `roomStore.ts` | `api.ts`, `ResultPanel.tsx` | FR-007/008 |
| D4 scoring | `models/game.ts`, `roomStore.ts` | `Scoreboard.tsx`, `GuessForm.tsx` | FR-009/010/011/011a/012 |
| D5 wiring | — | GuessForm/Scoreboard/ResultPanel/GamePage | FR-001..012 |
