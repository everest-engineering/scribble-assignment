# Implementation Plan: Gameplay Interaction

**Branch**: `scribble-assignment` (single-branch lab) | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

**Feature Group**: 3 of 4 — Scenario 3 — builds on Groups 1 & 2

## Summary

Make the active round playable: give the drawer an interactive HTML canvas (freehand draw + clear, local to
the drawer), let guessers submit validated guesses (trim, reject empty, case-insensitive match) via a new
`POST /rooms/:code/guess`, record each guess in a shared `guesses[]` history on the room, award 100 points
once per correct guesser (then lock their input), and sync the history + scores to all players through the
existing ~2s snapshot poll. Brownfield: extend the Group 1–2 model/store/snapshot and the scaffolded
GuessForm/Scoreboard/Activity components; native `<canvas>` only — no new dependencies, polling-only.

## Technical Context

**Language/Version**: TypeScript (backend Node 18+ / ESM; frontend React 18 + Vite) — unchanged.

**Primary Dependencies**: Express, Zod (backend); React, React Router, `useSyncExternalStore` (frontend). Drawing uses the native HTML5 `<canvas>` API. **No new dependencies.**

**Storage**: In-memory `Map<string, Room>` (no DB).

**Testing**: Vitest service-level tests (`roomStore.test.ts`, `schemas.test.ts`); manual two-browser validation per quickstart.

**Target Platform**: Local dev — backend `:3001`, frontend `:5173`.

**Performance Goals**: Guess + score appear on other players within ~2s (poll interval).

**Constraints**: Polling-only (no real-time); drawing strokes are NOT synced (drawer-local, per clarification); no auth/DB/persistence; reuse Group 1–2 state; touch only files related to this group.

**Scale/Scope**: A few players per room; single active round; bounded guess history.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Specification Before Implementation | Spec + clarifications committed | ✅ |
| II. Incremental Delivery | Scoped to Group 3; Group 4 deferred | ✅ |
| III. Brownfield Enhancement | Extend model/store/snapshot + scaffolded components; one new canvas component | ✅ |
| IV. Simplicity Over Expansion | Native canvas, no libs; drawing drawer-local (no transport-heavy sync); polling only | ✅ |
| V. Validation First | Two-browser quickstart for draw/guess/history/score | ✅ |
| VI. AI Responsibility | Plan reviewed + `/speckit.analyze` before implement | ✅ |
| VII. Traceability | Design cites FR IDs | ✅ |
| VIII. Commit Discipline | Per-story `feat(group3):` commits | ✅ |

**Result: PASS** — no violations; Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md, spec.md, research.md, data-model.md, quickstart.md
├── contracts/rooms-api.md      # guess endpoint + snapshot delta
└── checklists/requirements.md
```

### Source Code (repository root)

```text
backend/src/
├── models/game.ts            # EDIT: Participant += score; new Guess type; Room += guesses[]; RoomSnapshot += guesses[]
├── services/roomStore.ts     # EDIT: createParticipant score=0; add submitGuess() (trim/validate, drawer-refused, case-insensitive match, award 100 once, lock after correct); include guesses in snapshot
├── api/schemas.ts            # EDIT: add submitGuessSchema ({ participantId, text })
└── api/rooms.ts              # EDIT: add POST /:code/guess handler

frontend/src/
├── services/api.ts           # EDIT: Participant += score; RoomSnapshot += guesses; add submitGuess()
├── state/roomStore.ts        # EDIT: add submitGuess() action
├── components/DrawingCanvas.tsx  # NEW: interactive freehand <canvas> + Clear (drawer-only); static for guessers
├── components/GuessForm.tsx  # EDIT: wire to store; guesser-only; reject empty; disable after correct
├── components/Scoreboard.tsx # EDIT: render participants + scores from room state
├── components/ResultPanel.tsx# EDIT: render shared guess history (Activity feed) from room state
└── pages/GamePage.tsx        # EDIT: mount DrawingCanvas; pass room state to Scoreboard/Activity/GuessForm
```

**Structure Decision**: Web-app layout reused. All edits extend existing files; the single new file is
`DrawingCanvas.tsx` (a focused component for the drawing surface) — not a rewrite. The scaffolded
GuessForm/Scoreboard/ResultPanel placeholders are finally wired to real data.

## Phase 0 — Research

See [research.md](./research.md). Clarifications fixed the open decisions (drawer-local canvas, verbatim
history, disable-after-correct). Research records these plus: native-canvas approach, server-authoritative
guess validation/scoring, and storing the guess history + scores on the room (synced via existing poll).

## Phase 1 — Design & Contracts

- **Data model**: [data-model.md](./data-model.md) — `Participant += score`; new `Guess`; `Room += guesses[]`;
  `RoomSnapshot += guesses[]`. Guess-handling and scoring rules, all FR-traced.
- **Contracts**: [contracts/rooms-api.md](./contracts/rooms-api.md) — new `POST /rooms/:code/guess`
  (200 / 400 empty / 403 drawer / 409 already-correct), snapshot additions (`guesses`, participant `score`),
  contract-test checklist.
- **Quickstart**: [quickstart.md](./quickstart.md) — two-browser draw/clear, guess validation, synced history,
  scoring (start 0, correct=100 once, input locked).
- **Agent context**: `CLAUDE.md` SPECKIT block updated to point at this plan.

## Data Flow (summary)

1. **Draw** (drawer) → strokes painted on the local `<canvas>`; Clear empties it. Not sent to the server.
2. **Guess** (guesser) → client trims; empty → message (no call). Else `POST /rooms/:code/guess { participantId, text }`.
3. **Server** → reject empty (400) / drawer (403) / already-correct (409). Record `{name,text,correct}` in
   `room.guesses`. If correct and guesser score is 0 → set score 100.
4. **Poll** → `GET /rooms/:code?participantId=…` now returns `guesses[]` and participant `score`s to everyone;
   the drawer view still includes `word`, guessers still excluded. Scoreboard + Activity render from this.

## Complexity Tracking

*No constitution violations — section intentionally empty.*
