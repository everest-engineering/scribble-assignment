# Implementation Plan: Gameplay Interaction

**Feature**: Group 3 — Scenario 3 (Gameplay Interaction)

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Status**: Draft

**Constitution**: Compliant with `.specify/memory/constitution.md` — brownfield extension, HTTP polling
only, in-memory store, no auth, Zod at the boundary, deterministic game rules (pure guess/score logic),
server-side viewer projection.

## Summary

Make the game screen interactive: the drawer draws strokes (each an ordered `{x,y}` point list) via
`POST /rooms/:code/strokes` and can clear via `POST /rooms/:code/canvas/clear`; guessers submit guesses
via `POST /rooms/:code/guess`. Guesses are trimmed and compared case-insensitively to the secret word;
scores start at 0, correct = +100, incorrect = +0; the first correct guess sets `round.ended = true` and
locks further play. Strokes, guesses, and scores are added to the room's `round` state and returned in
the snapshot to every participant (the secret word stays drawer-only from Group 2). The game screen polls
`GET /rooms/:code` ~2s to converge strokes/scores/history across tabs. Extends Group 2's `round`, the
store, schemas, `rooms` router, snapshot projection, and the game-screen components — no new
dependencies, no rewrites.

> **Builds on Group 2**: `Room.round: RoundState | null` (`drawerId`, `secretWord`, `roles`), viewer-aware
> `toRoomSnapshot`, and `/game` navigation already exist. Group 3 extends `RoundState` with `strokes`,
> `guesses`, `scores`, and `ended`.

## 1. Technical Context

### Tech stack (unchanged — no new dependencies)

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router v6, Vite, TypeScript (strict) |
| Frontend state | Custom `RoomStore` via `useSyncExternalStore` (`frontend/src/state/roomStore.ts`) |
| Backend | Node.js, Express, TypeScript (ESM), `tsx` for dev |
| Validation | Zod (`backend/src/api/schemas.ts`) |
| Storage | In-memory `Map<string, Room>` (`backend/src/services/roomStore.ts`) |
| Sync | HTTP polling every ~2s (`GET /rooms/:code`) — reused from Groups 1–2 |
| Canvas | Native HTML `<canvas>` 2D context (no new library) |

**Target Platform**: Local dev — backend `http://localhost:3001`, frontend `http://localhost:5173`.

**Testing**: Extend `roomStore.test.ts`, `schemas.test.ts`, `api.test.ts`; add pure unit tests for guess
evaluation + scoring (`gameRules.test.ts`).

**Scale/Scope**: Classroom-scale rooms; modest stroke counts per room.

### Constraints (from constitution)

- **No WebSockets** — drawing/guess sync is snapshot polling only.
- **No database** — strokes/guesses/scores live in the in-memory `round`.
- **No auth** — drawer/guesser gating derives from `round.roles`, not credentials.
- **Deterministic game rules** — guess normalization, evaluation, and scoring are pure functions, unit-tested.
- **Validate at the boundary** — stroke and guess payloads validated with Zod; size limits enforced.
- **Server is source of truth** — round end, scores, and strokes are authoritative server-side.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Extend, Don't Replace | Reuse Group 2 `round`/store/router/components; no new deps | PASS |
| II. Spec-Driven & Traceable | Every change maps to FR-033…FR-048 | PASS |
| III. Deterministic Game Rules | Pure `normalizeGuess`/`isCorrectGuess`/scoring, unit-tested | PASS |
| IV. Validation at Edge | Zod stroke/guess schemas with size limits; drawer/round-ended gates server-side | PASS |
| V. Stay In Scope | No result/restart UI (Group 4); no timers/rounds/rotation | PASS |

No violations. Complexity Tracking omitted.

## 2. Findings (current state after Group 2)

| Finding | Evidence | Implication for Group 3 |
|---------|----------|-------------------------|
| Round has no gameplay state | `RoundState = { drawerId, secretWord, roles }` | Add `strokes`, `guesses`, `scores`, `ended` |
| No draw/guess/clear endpoints | `rooms.ts` has create/join/start/get | Add `POST /:code/strokes`, `/:code/canvas/clear`, `/:code/guess` |
| Canvas is placeholder | `GamePage.tsx` shows a static div | Render real `<canvas>`; drawer draws, all redraw from snapshot |
| Guess form is inert | `GuessForm.tsx` only `preventDefault()` | Wire submit → `roomStore.submitGuess()` |
| Scoreboard hard-coded "0" | `Scoreboard.tsx` static | Render per-participant scores from snapshot |
| ResultPanel static | `ResultPanel.tsx` placeholder text | Render ordered guess history from snapshot |
| Game screen has no polling | only LobbyPage polls | Add ~2s poll on `/game`, cleared on unmount |

## 3. State Model

### 3.1 Backend model changes (`backend/src/models/game.ts`)

```typescript
export interface StrokePoint { x: number; y: number; }
export interface Stroke { points: StrokePoint[]; }   // one completed stroke

export interface GuessRecord {
  participantId: string;
  name: string;          // denormalized for easy history rendering
  guess: string;         // trimmed, original casing preserved for display
  correct: boolean;
  at: string;            // ISO timestamp (also provides ordering)
}

export interface RoundState {
  drawerId: string;
  secretWord: string;
  roles: Record<string, ParticipantRole>;
  strokes: Stroke[];                 // NEW — append-only
  guesses: GuessRecord[];            // NEW — append-only
  scores: Record<string, number>;    // NEW — participantId -> score (start 0)
  ended: boolean;                    // NEW — set true on first correct guess
}

export interface RoomSnapshot {
  // ...existing: code, status, hostId, drawerId, participants, availableWords, roles, secretWord?
  strokes: Stroke[];                          // NEW — visible to all
  guesses: GuessRecord[];                     // NEW — visible to all
  roundEnded: boolean;                        // NEW — drives UI lock + (Group 4) result
  // participants[].score added below
}
```

Snapshot participants gain `score: number` (from `round.scores`, default 0 in lobby).

### 3.2 Backend pure rules (`backend/src/services/gameRules.ts` — NEW)

```typescript
export function normalizeGuess(text: string): string;       // trim + toLowerCase
export function isCorrectGuess(guess: string, secret: string): boolean; // normalized equality
export const CORRECT_SCORE = 100;
export const INCORRECT_SCORE = 0;
```

Pure, no HTTP/React, unit-tested (Constitution III).

### 3.3 Backend store changes (`backend/src/services/roomStore.ts`)

- **`initializeRound`** (extend): set `strokes: []`, `guesses: []`, `ended: false`, and `scores` with
  every participant at `0`.
- **New `addStroke(code, participantId, stroke)`** → discriminated result:
  - `not-found` (404), `forbidden` (not drawer, 403), `round-ended` (409/conflict), else append + `ok`.
- **New `clearCanvas(code, participantId)`** → same gates; sets `round.strokes = []`.
- **New `submitGuess(code, participantId, guessText)`** → discriminated result:
  - `not-found` (404), `forbidden` (drawer can't guess / non-participant, 403), `round-ended` (409),
    else: evaluate with `gameRules`, append `GuessRecord`, add score (100/0), set `ended = true` on first
    correct, return `ok` with the updated room.
- **`toRoomSnapshot`** (extend): include `strokes`, `guesses`, `roundEnded`, and per-participant `score`.
  Keep `secretWord` drawer-only (unchanged from Group 2).

### 3.4 Backend validation (`backend/src/api/schemas.ts`)

```typescript
const pointSchema = z.object({ x: z.number(), y: z.number() });
export const strokeSchema = z.object({
  participantId: z.string().min(1),
  stroke: z.object({ points: z.array(pointSchema).min(1).max(2000) })  // size guard
});
export const clearCanvasSchema = z.object({ participantId: z.string().min(1) });
export const guessSchema = z.object({
  participantId: z.string().min(1),
  guess: z.string().transform((s) => s.trim()).pipe(z.string().min(1, "Guess is required"))
});
```

### 3.5 Frontend changes

- **`frontend/src/services/api.ts`**: extend `RoomSnapshot` (`strokes`, `guesses`, `roundEnded`,
  participant `score`); add `submitStroke`, `clearCanvas`, `submitGuess` methods.
- **`frontend/src/state/roomStore.ts`**: add `submitStroke`, `clearCanvas`, `submitGuess` actions
  (each posts then stores the returned snapshot); mirror the extended type.
- **`frontend/src/pages/GamePage.tsx`**: add ~2s polling (mirroring LobbyPage); render `<canvas>`;
  pass drawer/round-ended state to children.
- **`frontend/src/components/DrawingCanvas.tsx` (NEW)**: native `<canvas>`; drawer captures pointer
  strokes and calls `submitStroke` on stroke end; everyone redraws from `snapshot.strokes`; "Clear"
  button for the drawer; read-only for guessers / when `roundEnded`.
- **`frontend/src/components/GuessForm.tsx`**: wire submit → `submitGuess`; block empty client-side;
  disable for drawer and when `roundEnded`.
- **`frontend/src/components/Scoreboard.tsx`**: render per-participant `score` from snapshot.
- **`frontend/src/components/ResultPanel.tsx`**: render ordered `guesses` (name, guess, correct?).

## 4. Data Flow

### 4.1 Drawing

Drawer draws on `<canvas>` → on stroke end, `roomStore.submitStroke(points)` →
`POST /rooms/:code/strokes { participantId, stroke }` → store appends to `round.strokes` → returns
snapshot. Other tabs pick up the stroke on their next ~2s poll and redraw from `snapshot.strokes`.

### 4.2 Clear

Drawer clicks Clear → `POST /rooms/:code/canvas/clear { participantId }` → `round.strokes = []` →
snapshot. Other tabs converge on next poll (empty canvas).

### 4.3 Guessing + scoring

Guesser submits → client blocks empty → `POST /rooms/:code/guess { participantId, guess }` → server
trims + compares case-insensitively → appends `GuessRecord`, adds 100/0 to `scores`, sets `ended = true`
on first correct → snapshot. All tabs show updated history + scores on next poll; once `roundEnded`,
guess/draw controls lock everywhere.

### 4.4 Game-screen polling

`GamePage` mounts → `setInterval(fetchRoom, 2000)`; cleared on unmount. Each tick refreshes strokes,
scores, history. Transient failures set a readable error but the loop continues (mirrors LobbyPage).

## 5. File-Level Plan

### Backend

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add `StrokePoint`, `Stroke`, `GuessRecord`; extend `RoundState` (`strokes`, `guesses`, `scores`, `ended`); extend snapshot (`strokes`, `guesses`, `roundEnded`, participant `score`) |
| `backend/src/services/gameRules.ts` | **NEW** — `normalizeGuess`, `isCorrectGuess`, score constants |
| `backend/src/services/roomStore.ts` | Init round gameplay state; add `addStroke`, `clearCanvas`, `submitGuess`; extend `toRoomSnapshot` |
| `backend/src/api/schemas.ts` | Add `strokeSchema`, `clearCanvasSchema`, `guessSchema` |
| `backend/src/api/rooms.ts` | Add `POST /:code/strokes`, `POST /:code/canvas/clear`, `POST /:code/guess`; map results to 200/400/403/404/409 |
| `backend/src/services/gameRules.test.ts` | **NEW** — guess normalize/compare + scoring |
| `backend/src/services/roomStore.test.ts` | Stroke append + drawer gate; clear; guess correct/incorrect/score; round-ended lock; isolation |
| `backend/src/api/schemas.test.ts` | Stroke/guess schema validation (empty guess, point limits) |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/services/api.ts` | Extend snapshot type; add `submitStroke`, `clearCanvas`, `submitGuess` |
| `frontend/src/state/roomStore.ts` | Mirror type; add the three actions |
| `frontend/src/pages/GamePage.tsx` | ~2s polling; wire canvas + scoreboard + history + guess form |
| `frontend/src/components/DrawingCanvas.tsx` | **NEW** — canvas draw/redraw/clear, role + ended gating |
| `frontend/src/components/GuessForm.tsx` | Wire submit; block empty; disable for drawer/ended |
| `frontend/src/components/Scoreboard.tsx` | Render per-participant scores |
| `frontend/src/components/ResultPanel.tsx` | Render guess history |
| `frontend/src/services/api.test.ts` | `submitGuess` URL/body |

## 6. API Contract (Group 3)

See [contracts/rooms-api.md](./contracts/rooms-api.md). New endpoints:

- `POST /rooms/:code/strokes` — `{ participantId, stroke }`; drawer-only; appends stroke.
- `POST /rooms/:code/canvas/clear` — `{ participantId }`; drawer-only; empties strokes.
- `POST /rooms/:code/guess` — `{ participantId, guess }`; guesser-only; evaluates + scores.
- `GET /rooms/:code` — snapshot now includes `strokes`, `guesses`, `roundEnded`, participant `score`.

Unchanged route paths from Groups 1–2; existing `HttpError` + `errorHandler` for messages.

## 7. Implementation Sequence

1. **Model** — `Stroke`/`GuessRecord`; extend `RoundState` + snapshot.
2. **Game rules** — pure `normalizeGuess`/`isCorrectGuess`/scores + unit tests.
3. **Store (init)** — initialize `strokes`/`guesses`/`scores`/`ended` in `initializeRound`.
4. **Store (actions)** — `addStroke`, `clearCanvas`, `submitGuess` with gates + tests.
5. **Snapshot** — include strokes/guesses/roundEnded/score; keep word drawer-only.
6. **Schemas + routes** — stroke/clear/guess schemas + three endpoints with status mapping.
7. **Frontend types + state** — extend snapshot type; add three actions.
8. **Canvas** — `DrawingCanvas` draw/redraw/clear with role + ended gating.
9. **Guess/score/history UI** — wire `GuessForm`, `Scoreboard`, `ResultPanel`.
10. **Game polling** — ~2s poll on `/game`, cleared on unmount.
11. **Validate** — two-tab quickstart; `npm test` + `npm run build`.

## 8. Testing Strategy

### Automated

- **`gameRules.test.ts`**: `normalizeGuess` trims + lowercases; `isCorrectGuess` case-insensitive + trimmed; scores are 100/0.
- **`roomStore.test.ts`**: `addStroke` appends for drawer, rejects non-drawer + after ended; `clearCanvas` empties; `submitGuess` records incorrect (+0) and correct (+100, sets `ended`), rejects drawer + empty + after ended; starting room A does not change room B's round.
- **`schemas.test.ts`**: `guessSchema` rejects empty/whitespace + trims; `strokeSchema` requires ≥1 point and rejects oversized.
- **`api.test.ts`**: `submitGuess` posts correct path/body.

### Manual (two browser tabs)

1. Drawer draws → guesser sees stroke within ~2s.
2. Drawer clears → both canvases empty within ~2s.
3. Guesser empty guess → blocked, no history.
4. Guesser wrong guess → +0, appears in history; right guess (any casing) → +100, round ends.
5. After end → guess + draw controls disabled in all tabs.
6. Second room in parallel → no stroke/guess/score leakage.

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Stroke chatter under polling | One POST per completed stroke (not per point); redraw from snapshot |
| Large stroke payload | Zod `max` points guard; reject with clear 400 |
| Lost local strokes between polls | Append returned snapshot immediately after POST; canvas redraws from authoritative list |
| Race: two correct guesses near-simultaneously | First correct sets `ended`; subsequent guesses rejected (409) |
| Word leak via new fields | Snapshot adds only strokes/guesses/scores; `secretWord` stays drawer-only (Group 2 logic untouched) |
| Canvas coordinate scaling across devices | Use fixed canvas dimensions; store raw `{x,y}`; document as starter-simple |
| Scope creep into results/restart | FR-048 guard: only set `ended` + lock; no reveal-to-all/restart UI |

## 10. Out of Scope

Per constitution §V and FR-048: full result presentation (reveal word to everyone, final results layout),
restart → lobby with state reset (all Group 4), WebSockets, databases, auth, timers, multiple rounds,
drawer rotation, bonuses, new libraries, unrelated refactors.

## Project Structure (documentation)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/rooms-api.md  # Phase 1 output
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks (next)
```

## Implementation Notes & Deviations (post-execution)

Recorded during `/speckit-implement` on 2026-06-05. All 33 tasks except T032 (manual two-tab
validation) are complete; automated suites pass (backend 42 tests, frontend 4 tests; both builds green).

- **I1 reconciliation (FR-038 "clear message" vs generic 400)**: Mirrors the Group 2 decision. The
  backend keeps the generic Zod `400 { "message": "Invalid request payload" }` for empty guesses; the
  user-facing clear message is delivered **client-side** in `GuessForm.tsx` ("Enter a guess before
  submitting."), which blocks the request before it is sent. FR-038's "or equivalent client-side block"
  is satisfied; the server 400 is the backstop and stays consistent with Groups 1–2.
- **`submitGuess` not split across two commits**: The plan split guess gating (T020) and scoring/history
  side effects (T026) into separate tasks. They were implemented together in a single `submitGuess`
  function for cohesion (one authoritative mutation path), still covered by both the US2 gating tests and
  the US3 scoring/history tests. No behavioral deviation.
- **Guess/clear "round-ended" maps to HTTP 409**: As designed in `contracts/rooms-api.md`. Drawer/guesser
  role violations map to 403; unknown room/round to 404.
- **`submitGuess` forbidden cases**: Drawer (role !== "guesser") and unknown participants both return
  `forbidden` (403), matching the contract.
- **Canvas implementation detail**: `DrawingCanvas.tsx` uses a fixed internal resolution (640×480) and
  scales pointer coordinates from the rendered element, storing raw `{x,y}` in canvas space so all clients
  redraw consistently from `snapshot.strokes`. One `POST /strokes` is sent per completed pointer stroke
  (on pointer up/leave), keeping request volume polling-friendly. Stroke point cap is 2000 (Zod guard).
- **Scoreboard ordering**: Scores render sorted descending for readability; the drawer is shown with a
  "(drawer)" tag and starts at 0. History (`ResultPanel`) renders newest-first while the authoritative
  `guesses` array stays in submission order (verified by a unit test).
- **No new dependencies**: Native HTML `<canvas>` only; constitution I/V upheld.
