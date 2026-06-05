# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-gameplay-interaction/spec.md`

## Summary

Scenario 3 makes the active round interactive. On the backend we add an ordered **guess history**
and per-participant **scores** to the room, a **submit-guess action** (`POST /rooms/:code/guess`)
that validates the guess (trim, non-empty, guesser-only, room playing), evaluates it
case-insensitively against the secret word, records it, and awards **100 for a first correct
guess** (0 otherwise, capped once per player). `toRoomSnapshot` is extended with `guesses` and
`scores`, **withholding correct-guess text from non-drawers** to preserve the hidden word. The
existing ~2s polling syncs history and scores to everyone. On the frontend, the game view wires
the guess form (guessers only), renders the synced history and scoreboard, and gives the **drawer
a drawing canvas with clear** (guessers have no drawing tools).

**Amended 2026-06-05 (clarification):** the drawing is now **shared with guessers via polled
canvas snapshots** rather than drawer-local. The drawer periodically serializes its canvas to an
image and `PUT`s it to a new endpoint (`PUT /rooms/:code/drawing`); the room snapshot gains a
`drawing` field that guessers render read-only from the poll they already run (~2s). This is HTTP
polling only (no push), so it remains within the constitution. No new dependencies; all changes
extend existing files.

## Technical Context

**Language/Version**: TypeScript (ES Modules). Node.js 18+ backend, React 18 frontend.

**Primary Dependencies**: Backend — Express, Zod, `tsx`, `node:crypto`. Frontend — React 18,
React Router 6, Vite, HTML5 Canvas (built-in). No new runtime dependencies.

**Storage**: In-memory only (`Map<string, Room>` in `services/roomStore.ts`).

**Testing**: Vitest. Extend `roomStore.test.ts` (guess validation, case-insensitive match,
scoring 100/0, score-once, drawer-cannot-guess, history order, word secrecy), `schemas.test.ts`
(guess body). Manual two-tab validation per quickstart.

**Target Platform**: Local dev — backend `:3001`, frontend `:5173`.

**Project Type**: Web application (Express backend + React frontend monorepo).

**Performance Goals**: Guess history and scores converge across players within ~2s via polling.

**Constraints**: No WebSockets/DB/auth (constitution II); HTTP polling only. Deterministic scoring
and guess comparison (constitution III). Secret word never sent to non-drawers (incl. via history).

**Scale/Scope**: Small rooms, single round. ~4 backend files and ~5 frontend files touched.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. TypeScript-First & Type Safety | Fully typed; no `any`; Zod at boundaries; centralized errors; UI tolerant | PASS — `Guess`/`scores` typed; guess uses Zod body; history strips text server-side |
| II. Architectural Constraints | No WebSockets/DB/auth; polling; in-memory | PASS — history/scores/**drawing** ride HTTP polling (drawer `PUT`s a canvas image; guessers read it from the polled snapshot — no push/WebSocket/SSE); state in `Map` |
| III. Deterministic Game Rules | Exact scoring + normalized compare | PASS — correct=100/incorrect=0, capped once; trim + case-insensitive compare |
| IV. Spec-Driven Workflow | Traces to spec | PASS — see Requirements Traceability |
| V. Disciplined AI Usage & Self-Review | Granular commits, consistent structure | PASS — confined to api/services/models + pages/components |
| VI. Testing & Validation Discipline | Unit tests for deterministic logic; two-tab; builds | PASS — see Testing Strategy |

**Out-of-scope guard**: No round end / result / restart (Scenario 4), no timers/multiple rounds.
Drawing now syncs via polled snapshots (per the 2026-06-05 clarification); sub-second live
streaming of strokes remains out of scope. Confirmed against README "Explicitly Out Of Scope".

**Result**: PASS. No violations; Complexity Tracking not required.

## Findings (Discovery)

Building on Scenario 2:

1. **No guess state** — `Room` has no guess history; nothing records or evaluates guesses.
2. **No scores** — there is no per-participant score; the `Scoreboard` component shows a static
   "Waiting for players... 0" placeholder.
3. **GuessForm is inert** — `components/GuessForm.tsx` has an empty `handleSubmit` (no submission,
   no validation, no wiring to the store).
4. **Canvas is a placeholder** — `GamePage` shows a static canvas box; there is no drawing
   interaction or clear action. (Amendment: guessers must also be able to see the drawing.)
5. **Secret word already drawer-only** — Scenario 2's `toRoomSnapshot` strips the word for
   non-drawers; the new guess history must not reintroduce a leak.
6. **No drawing transport** — there is no way to carry the drawer's canvas to guessers; the room
   has no drawing field and no endpoint to update one.

Relevant files: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`,
`backend/src/api/rooms.ts`, `backend/src/api/schemas.ts`, `frontend/src/services/api.ts`,
`frontend/src/state/roomStore.ts`, `frontend/src/pages/GamePage.tsx`,
`frontend/src/components/GuessForm.tsx`, `frontend/src/components/Scoreboard.tsx`,
plus a new `frontend/src/components/DrawingCanvas.tsx` and guess-history rendering.

## State Model Changes

**Backend `Guess`** (new type): `{ id: string; participantId: string; participantName: string;
correct: boolean; text: string; createdAt: string }`.

**Backend `Room`** (add): `guesses: Guess[]` (ordered), `scores: Record<string, number>`
(participantId → points), **`drawing: string | null`** (the drawer's serialized canvas image, or
`null` when empty/cleared). All initialized empty/zeroed/null when the round starts.

**Backend `RoomSnapshot`** (add): `guesses: GuessView[]`, `scores: ScoreView[]`, and **`drawing:
string | null`** (the current drawing, visible to all viewers). `GuessView` mirrors `Guess` but
`text` is `string | null` (withheld when the guess is correct and the viewer is neither the drawer
nor the author), and `ScoreView = { participantId, name, score }`.

**Frontend `RoomSnapshot`** (`services/api.ts`): mirror `guesses`/`scores`/`drawing`. Add
`api.submitGuess(code, participantId, text)`/`store.submitGuess(text)` and
`api.updateDrawing(code, participantId, drawing)`/`store.updateDrawing(drawing)`.

## Data Flow

1. **Start** (Scenario 2) now also zeroes `scores` for all participants and empties `guesses`.
2. **Guess** → guesser submits → `POST /rooms/:code/guess { participantId, text }` → backend
   validates (playing, participant, not drawer, non-empty after trim) → evaluates
   `normalize(text) === normalize(secretWord)` → appends a `Guess` → if correct and the player's
   score `< 100`, sets it to `100` → returns the viewer's snapshot.
3. **Sync** → every ~2s poll returns the latest `guesses` (text-stripped per viewer) and `scores`
   → all game views render the shared history and scoreboard within ~2s.
4. **Drawing (drawer)** → the drawer draws/clears the canvas locally; on a ~2s cadence (and on
   clear) the drawer serializes the canvas to an image and `PUT /rooms/:code/drawing
   { participantId, drawing }` → backend verifies the requester is the drawer and the room is
   playing → stores `room.drawing` (or `null` on clear).
5. **Drawing (guessers)** → the ~2s snapshot poll returns `drawing`; guessers render it read-only.
   A new stroke or clear becomes visible to guessers within ~2s.

## Requirements Traceability

| Spec | Plan element |
|------|--------------|
| FR-001, FR-006 | `POST /rooms/:code/guess`, rejected unless `status === "playing"` |
| FR-002, FR-004 | `normalize = trim + toLowerCase`; compare to secret word |
| FR-003 | Zod `text` `.trim().min(1)` + store guard; rejected, not recorded |
| FR-005 | guess refused when `participantId === drawerId` |
| FR-007, FR-010 | append `Guess` with author + `correct`; array order = submission order |
| FR-008, FR-015 | history + scores in snapshot, carried by existing ~2s poll |
| FR-009 | snapshot withholds correct-guess `text` from non-drawer non-authors |
| FR-011 | `scores` zeroed for all participants at start |
| FR-012, FR-013, FR-014 | first correct → 100; incorrect → 0; capped at 100 once |
| FR-016, FR-017, FR-018 | `DrawingCanvas` (drawer-only) with draw + clear; guessers render read-only |
| FR-021, SC-009 | `PUT /rooms/:code/drawing`; `Room.drawing` + snapshot `drawing`; drawer pushes ~2s/on clear; guessers render from poll |
| FR-019, FR-020 | state in `Map`; room stays `"playing"` |

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md            # This file
├── spec.md            # Feature spec
├── research.md        # Phase 0 output
├── data-model.md      # Phase 1 output
├── quickstart.md      # Phase 1 output
├── contracts/
│   └── rooms-api.md   # guess endpoint + extended snapshot
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── models/game.ts          # Guess type; Room.guesses/scores/drawing; snapshot guesses/scores/drawing
    ├── services/roomStore.ts   # init at start; submitGuess(); scoring; per-viewer history; updateDrawing()
    ├── api/schemas.ts          # guessSchema; drawingSchema (participantId, drawing nullable)
    └── api/rooms.ts            # POST /rooms/:code/guess; PUT /rooms/:code/drawing

frontend/
└── src/
    ├── services/api.ts         # snapshot guesses/scores/drawing; api.submitGuess; api.updateDrawing
    ├── state/roomStore.ts      # submitGuess(text); updateDrawing(drawing)
    ├── components/
    │   ├── GuessForm.tsx       # wire submit + empty validation + error
    │   ├── Scoreboard.tsx      # render scores prop
    │   └── DrawingCanvas.tsx   # drawer: draw + clear + periodic push; guesser: render snapshot read-only
    └── pages/GamePage.tsx      # guesser guess form; synced history; scoreboard; shared drawing
```

**Structure Decision**: Web-application layout (Option 2). One new presentational component
(`DrawingCanvas`, now handling both the drawer's canvas and the guesser's read-only view);
everything else extends existing files per `AGENTS.md`.

## Testing Strategy

- **Backend unit** (`roomStore.test.ts`): empty/whitespace guess rejected; "  CASTLE " matches
  "castle"; wrong guess recorded incorrect; drawer guess rejected; guess outside `playing`
  rejected; first correct → score 100; repeat correct → still 100; incorrect → 0; history order
  preserved; guesser's snapshot withholds another player's correct-guess text; drawer sees text.
- **Backend unit** (`schemas.test.ts`): `guessSchema` rejects empty/whitespace text, requires
  `participantId`, trims valid text; `drawingSchema` requires `participantId` and accepts a string
  or `null` for `drawing`.
- **Backend unit** (`roomStore.test.ts`): `updateDrawing` stores the image only for the drawer;
  a non-drawer / non-playing room is rejected; the stored value appears in the snapshot for all
  viewers; clearing (`null`) is reflected.
- **Manual two-tab**: drawer draws + clears; the guesser sees the drawing appear/update within ~2s;
  guesser submits guesses, sees them and scores sync within ~2s; correct guess scores 100 once;
  word never shown to guessers.
- **Builds**: backend and frontend `npm run build` both pass.

## Risks & Mitigations

- **Word leakage via history**: a correct guess equals the word. Mitigation: strip correct-guess
  `text` server-side for non-drawer non-authors (FR-009); unit-test the guesser snapshot.
- **Double scoring / farming**: Mitigation: award only when current score `< 100`; cap at 100;
  unit-test repeat correct guesses.
- **Drawer guessing**: Mitigation: refuse guesses where `participantId === drawerId` (403).
- **Drawing payload size**: a serialized canvas image (data URL) can be tens of KB per push/poll.
  Mitigation: keep a modest canvas size, push on a ~2s cadence (not per stroke), and cap the
  accepted `drawing` length in the schema; acceptable for a small lab room. Note this is the cost
  of HTTP-polling the drawing instead of pushing deltas.
- **Drawing authorization**: only the drawer may update the drawing. Mitigation: `updateDrawing`
  rejects unless `participantId === drawerId` and the room is `playing` (403/409).
- **Stale drawing on poll lag**: guessers may be up to ~2s behind. Mitigation: acceptable per the
  clarified spec (SC-009 allows ~2s); the value is last-write-wins from the drawer.
- **Polling continuity**: GamePage already polls (Scenario 2); history/scores/drawing piggyback.
- **Snapshot growth**: guess history is bounded by play length in one round; the `drawing` is a
  single replaced image (not accumulated). Acceptable in memory.

## Complexity Tracking

No constitutional violations. Section intentionally empty.
