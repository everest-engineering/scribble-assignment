# Implementation Plan: Gameplay Interaction (Scenario 3)

**Branch**: `scribble-lab` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Scenario 3 — Gameplay Interaction. Frontend: React + Vite + TypeScript. Backend: Node.js + Express + TypeScript + Zod.

**Scope boundary**: Implement FR-001–FR-017 only. Extends Scenario 2 active round with scores, interactive drawing, guess submission, synced history, and scoring. No round-end, result reveal, or restart (Scenario 4).

**Prerequisite**: Scenarios 1–2 complete — lobby/start, drawer assignment, secret word visibility, game-view polling (`specs/001-room-setup-lobby/`, `specs/002-game-start-drawer-flow/`).

## Summary

Extend the brownfield game so that (1) all participant scores initialize to 0 at round start and display on the scoreboard, (2) the drawer draws and clears an HTML canvas with strokes persisted server-side and synced to all clients via existing ~2s polling, (3) guessers submit trimmed guesses with empty rejection and case-insensitive evaluation, (4) guess history appears in a shared activity panel via polling, and (5) correct guesses award +100 points and incorrect guesses award +0.

## Technical Context

**Language/Version**: TypeScript (ES modules) — Node.js backend, React 18 frontend  
**Primary Dependencies**: Express, Zod, React Router v6, Vite, HTML `<canvas>` (no new canvas library)  
**Storage**: In-memory `Map<string, Room>` — strokes, guesses, and scores live on the room  
**Testing**: Vitest for guess scoring/validation; manual two-tab validation for canvas sync and guess history  
**Target Platform**: Local dev — backend `:3001`, frontend `:5173`  
**Performance Goals**: Game poll cadence ~2s; drawing/history/scores visible on guesser tabs within one poll cycle  
**Constraints**: HTTP polling only; server-authoritative strokes and scoring; Zod on mutating routes  
**Scale/Scope**: Single active round; ~15 files touched

## Constitution Check

| Principle | Requirement | Plan compliance |
|-----------|-------------|-----------------|
| II — Architecture | No WebSockets, DB, auth | ✅ REST + existing ~2s `useGamePolling` only |
| III — Deterministic rules | Server-authoritative scoring; Zod validation | ✅ Pure `evaluateGuess`; no client-side score mutation |
| V — Minimal diffs | Brownfield extension of Scenario 2 | ✅ Targeted edits listed below |
| VI — Validation | Two-tab manual + build both apps | ✅ Testing Strategy below |
| VII — Testing | Vitest for scoring/validation | ✅ Unit tests planned |

**Post-design re-check**: No violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── spec.md
├── plan.md              # This file
└── tasks.md             # (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/game.ts                 # + Stroke, Guess, scores on Room/snapshot
│   ├── services/guessScoring.ts       # NEW — evaluateGuess (case-insensitive +100/0)
│   ├── services/guessScoring.test.ts
│   ├── services/roomStore.ts          # scores init, addStroke, clearCanvas, submitGuess
│   ├── services/roomStore.test.ts
│   ├── api/schemas.ts                 # guess, stroke, clear schemas
│   ├── api/schemas.test.ts
│   └── api/rooms.ts                   # POST guesses, strokes, clear canvas
frontend/
├── src/
│   ├── services/api.ts                # extended types + new API methods
│   ├── state/roomStore.ts             # submitGuess, addStroke, clearCanvas actions
│   ├── components/DrawingCanvas.tsx   # NEW — interactive/read-only canvas
│   ├── components/GuessForm.tsx       # wire submit; disable for drawer
│   ├── components/Scoreboard.tsx      # live scores from snapshot
│   ├── components/ResultPanel.tsx     # guess history list
│   ├── pages/GamePage.tsx             # wire canvas, scoreboard, history
│   └── styles/app.css                 # canvas + history styles
```

**Not modified for Scenario 3**: Round-end transition, result reveal, restart to lobby (Scenario 4 placeholders may remain).

## Starter Gaps (Discovery)

| Area | Current behavior | Required for Scenario 3 |
|------|------------------|-------------------------|
| Scores | Not tracked | Init 0 per participant at `startGame`; expose in snapshot (FR-001–FR-002) |
| Canvas | Static placeholder div | Interactive `<canvas>` for drawer; read-only render for guessers (FR-003–FR-007) |
| Strokes | None server-side | `strokes[]` on room; drawer POST; included in GET snapshot (FR-005–FR-007) |
| Guesses | `GuessForm` no-op | POST guess; trim; reject empty; case-insensitive eval (FR-008–FR-011) |
| Guess history | `ResultPanel` placeholder | Ordered list from snapshot `guesses[]` (FR-012–FR-013) |
| Scoring | None | +100 correct, +0 incorrect via server (FR-014–FR-016) |
| `Scoreboard` | Hardcoded placeholder | Render participant scores from snapshot |

## Data Model

### Backend types (`backend/src/models/game.ts`)

**DrawingStroke** (new):

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | UUID per stroke |
| `points` | `{ x: number; y: number }[]` | Normalized 0–1 coords relative to canvas size |

Using normalized coordinates keeps strokes resolution-independent when re-rendered.

**Guess** (new, server-only):

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | UUID |
| `participantId` | `string` | Submitter |
| `participantName` | `string` | Denormalized for snapshot display |
| `text` | `string` | Trimmed guess text |
| `isCorrect` | `boolean` | Case-insensitive match vs `secretWord` |
| `submittedAt` | `string` | ISO timestamp |

**GuessSnapshot** (client-visible):

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | |
| `participantId` | `string` | |
| `participantName` | `string` | |
| `text` | `string` | |
| `isCorrect` | `boolean` | |
| `submittedAt` | `string` | |

**Room** (extend):

| Field | Type | When set |
|-------|------|----------|
| `scores` | `Record<string, number>` | `startGame` — all participants → 0 |
| `strokes` | `DrawingStroke[]` | `startGame` → `[]`; append on drawer stroke |
| `guesses` | `Guess[]` | `startGame` → `[]`; append on valid guess |

**ParticipantSnapshot** (extend when `playing`):

| Field | Type | Notes |
|-------|------|-------|
| `score` | `number` | From `room.scores[id]` |

**RoomSnapshot** (extend when `playing`):

| Field | Type | Notes |
|-------|------|-------|
| `strokes` | `DrawingStroke[]` | Full drawing state |
| `guesses` | `GuessSnapshot[]` | Ordered submission history |

### Guess evaluation (pure function)

`backend/src/services/guessScoring.ts`:

```text
evaluateGuess(guess: string, secretWord: string): { isCorrect: boolean; points: number }
  → isCorrect = guess.toLowerCase() === secretWord.toLowerCase()
  → points = isCorrect ? 100 : 0
```

Export for Vitest (SC-004–SC-006).

### State transition (extends Scenario 2)

```text
startGame (existing):
  + scores[each participantId] = 0
  + strokes = []
  + guesses = []

playing + drawer POST stroke:
  + append stroke to strokes[]

playing + drawer POST clear:
  + strokes = []

playing + guesser POST guess:
  + validate trim/min(1)
  + reject if participantId === drawerId
  + evaluateGuess → update scores[participantId] += points
  + append to guesses[]
  (status remains "playing" — no round end in Scenario 3)
```

## API Behavior

New routes (Zod-validated):

| Route | Body | Auth rule | Effect |
|-------|------|-----------|--------|
| `POST /rooms/:code/strokes` | `{ participantId, stroke }` | Must be drawer; room `playing` | Append stroke |
| `POST /rooms/:code/canvas/clear` | `{ participantId }` | Must be drawer; room `playing` | Clear `strokes` |
| `POST /rooms/:code/guesses` | `{ participantId, guessText }` | Must be guesser; room `playing` | Record guess + score |

Extended existing route:

| Route | Scenario 3 change |
|-------|-------------------|
| `GET /rooms/:code?participantId=` | Snapshot includes `strokes`, `guesses`, participant `score` when `playing` |
| `POST /rooms/:code/start` | Initialize scores/strokes/guesses |

**Validation errors**:

- Empty guess: 400 `"Guess is required"`
- Drawer submits guess: 403 `"Drawer cannot guess"`
- Non-drawer submits stroke/clear: 403 `"Only the drawer can draw"`
- Room not playing: 400 `"Game is not active"`

Response shape: return updated `toRoomSnapshot(room, participantId)` on mutating routes (same pattern as start/join).

## Data Flow

### Flow 1 — Score init (P1)

```text
startGame (extend Scenario 2)
  → scores = { [id]: 0 for each participant }
  → snapshot.participants[].score = 0
  → Scoreboard renders from snapshot
```

### Flow 2 — Drawing (P2)

```text
Drawer pointer down/move/up on DrawingCanvas
  → collect normalized points for one stroke
  → POST /rooms/:code/strokes { participantId, stroke }
  → render locally immediately + server authoritative

Guesser GamePage + useGamePolling
  → GET snapshot includes strokes[]
  → DrawingCanvas read-only re-renders strokes

Drawer clicks Clear
  → POST /rooms/:code/canvas/clear { participantId }
  → local canvas cleared; guessers sync on next poll
```

### Flow 3 — Guess submission (P3, P5)

```text
Guesser GuessForm → trim text → [empty? show error]
  → POST /rooms/:code/guesses { participantId, guessText }
  → server: evaluateGuess → scores += points → guesses.push
  → return snapshot with updated score + history
```

### Flow 4 — History & score sync (P4, P5)

```text
useGamePolling (existing, unchanged interval)
  → fetchRoomSilent
  → ResultPanel reads guesses[]
  → Scoreboard reads participants[].score
  → all tabs converge within one poll cycle
```

## Implementation Sequence

Ordered by user story priority.

### Slice 1 — P1: Scores at zero (FR-001–FR-002)

**Backend**

1. `game.ts`: Add `scores` map type; `score` on `ParticipantSnapshot`.
2. `roomStore.ts`: In `startGame`, init `scores[id] = 0` for each participant; include in `toRoomSnapshot`.
3. `roomStore.test.ts`: Assert all scores 0 after start.

**Frontend**

4. `api.ts`: Mirror `score` on participant snapshot.
5. `Scoreboard.tsx`: Render participant names and scores from `room.participants`.
6. `GamePage.tsx`: Pass `room` into `Scoreboard`.

**Verify**: After start, scoreboard shows 0 for all players on all tabs.

### Slice 2 — P2: Canvas draw and clear (FR-003–FR-007)

**Backend**

7. `game.ts`: Add `DrawingStroke` type; `strokes` on `Room` and snapshot.
8. `schemas.ts`: `strokeSchema`, `addStrokeSchema`, `clearCanvasSchema`.
9. `roomStore.ts`: `addStroke`, `clearCanvas` — drawer-only guards.
10. `rooms.ts`: `POST /:code/strokes`, `POST /:code/canvas/clear`.
11. `roomStore.test.ts`: Drawer can stroke/clear; guesser rejected.

**Frontend**

12. `DrawingCanvas.tsx`: Canvas with pointer handlers; normalized coords; `readOnly` prop for guessers; `onStrokeComplete` callback for drawer.
13. `api.ts` + `roomStore.ts`: `addStroke`, `clearCanvas` methods.
14. `GamePage.tsx`: Replace placeholder with `DrawingCanvas`; Clear button for drawer; optimistic local render + POST on stroke end.

**Verify**: Drawer draws; guesser sees strokes within one poll cycle; clear removes strokes for all.

### Slice 3 — P3 + P5: Guess submission and scoring (FR-008–FR-011, FR-014–FR-016)

**Backend**

15. `guessScoring.ts` + `guessScoring.test.ts`: Case-insensitive +100/0 logic.
16. `game.ts`: Add `Guess` / `GuessSnapshot`; `guesses` on room; extend `scores` mutation.
17. `schemas.ts`: `submitGuessSchema` with trim/min(1).
18. `roomStore.ts`: `submitGuess` — guesser-only, evaluate, update score, append history.
19. `rooms.ts`: `POST /:code/guesses`.
20. `roomStore.test.ts`: Empty rejected; case-insensitive correct; drawer blocked; +100/0 scoring.

**Frontend**

21. `api.ts` + `roomStore.ts`: `submitGuess`.
22. `GuessForm.tsx`: Trim, client empty check, call store, show errors; `disabled` when drawer.
23. `GamePage.tsx`: Pass `disabled={isDrawer}` to `GuessForm`.

**Verify**: Empty guess rejected; `Rocket` scores +100 for word `rocket`; wrong guess +0.

### Slice 4 — P4: Guess history UI (FR-012–FR-013, FR-017)

**Frontend**

24. `ResultPanel.tsx`: Render ordered `room.guesses` with name, text, correct/incorrect indicator.
25. `app.css`: History list styles.
26. Confirm `useGamePolling` picks up new guesses without changes (already polls snapshot).

**Verify**: Two-tab — guess in Tab B appears in Tab A history within one poll cycle.

### Slice 5 — Polish

27. Update `api.test.ts` mocks for new snapshot fields and API methods.
28. Run Vitest + builds; manual two-tab validation per Testing Strategy.

## File Change Reference

| File | Changes |
|------|---------|
| `backend/src/models/game.ts` | Stroke, Guess types; scores/strokes/guesses on Room; snapshot fields |
| `backend/src/services/guessScoring.ts` | **new** — evaluateGuess |
| `backend/src/services/guessScoring.test.ts` | **new** |
| `backend/src/services/roomStore.ts` | Score init; addStroke; clearCanvas; submitGuess; snapshot |
| `backend/src/services/roomStore.test.ts` | Gameplay tests |
| `backend/src/api/schemas.ts` | Stroke, guess, clear schemas |
| `backend/src/api/schemas.test.ts` | Schema tests |
| `backend/src/api/rooms.ts` | Three new POST routes |
| `frontend/src/services/api.ts` | Types + API methods |
| `frontend/src/state/roomStore.ts` | submitGuess, addStroke, clearCanvas |
| `frontend/src/components/DrawingCanvas.tsx` | **new** |
| `frontend/src/components/GuessForm.tsx` | Wire submit |
| `frontend/src/components/Scoreboard.tsx` | Live scores |
| `frontend/src/components/ResultPanel.tsx` | Guess history |
| `frontend/src/pages/GamePage.tsx` | Wire canvas, clear, forms |
| `frontend/src/styles/app.css` | Canvas + history styles |
| `frontend/src/services/api.test.ts` | Extended mocks |

## Testing Strategy

| Layer | What | Maps to |
|-------|------|---------|
| Vitest | `evaluateGuess` case-insensitivity; guess schema trim; score init; drawer/guesser guards | FR-008–FR-011, FR-014–FR-015, SC-003–SC-006 |
| Manual two-tab | Flows below | P1–P5, SC-001–SC-008 |
| Build | `npm run build` both apps | Constitution VI |

**Manual validation** (two tabs):

1. **P1**: After start, both tabs show all scores at 0.
2. **P2**: Drawer draws and clears; guesser canvas updates within ~2s.
3. **P3**: Empty guess rejected; trimmed case-variant correct guess accepted.
4. **P4**: Guess history syncs across tabs on poll.
5. **P5**: Correct guess +100 on scoreboard; incorrect +0; totals match on both tabs.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Stroke payload size | Normalized points; one stroke per pointer gesture; no per-point POST |
| Canvas out of sync | Server authoritative; guessers render only from snapshot strokes |
| Client-side score drift | Scores mutated server-side only; poll refreshes snapshot |
| Drawer guesses | Disable UI + 403 server-side |
| Scope creep into Scenario 4 | Do not add round-end status or result screen |

## Out of Scope Reminders

- Round end, result reveal, restart to lobby (Scenario 4)
- Multiple rounds, drawer rotation, timers, speed/drawer bonuses
- WebSockets, DB, auth, custom word packs
- New npm dependencies for canvas (use native `<canvas>` API)

**Next step**: Run `/speckit-tasks` to generate ordered `tasks.md` from this plan.
