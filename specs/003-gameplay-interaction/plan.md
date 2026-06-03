# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-gameplay-interaction/spec.md`

## Summary

Add server-authoritative guess submission, per-participant scoring (capped
at one correct guess per round per participant), and a viewer-aware synced
guess history. Extend the existing `toRoomSnapshot` filter so the text of
correct-guess entries is delivered only to the original guesser and the
current drawer; every other viewer receives a fixed placeholder. Add a
drawer-only freehand canvas with a Clear control; the canvas is fully
client-local with no server involvement.

Primary technical levers:

- Extend `Participant` with `score: number` (initialized 0 at create/join; reset to 0 at round start).
- Add `Guess { id, guesserParticipantId, text, isCorrect, submittedAt }` on `Room.guesses[]` (server-authoritative, append-only per round).
- Add `SnapshotGuess { id, guesserParticipantId, text: string \| null, isCorrect, submittedAt }` on `RoomSnapshot.guesses[]`. `text === null` is the redaction carrier (parallel to Scenario 2's `secretWord: null` rule).
- Add `POST /rooms/:code/guess` with body `{ participantId, text }`. Server trims, validates non-empty, blocks drawer + non-playing rooms, compares case-insensitively against `currentRound.secretWord`, appends to `guesses`, and bumps the guesser's `score` by 100 IFF this is their first correct guess in the round.
- Filter logic in `toRoomSnapshot`: for each guess entry, if `viewerParticipantId === entry.guesserParticipantId` OR `viewerParticipantId === currentRound.drawerParticipantId`, deliver real `text`; otherwise deliver `text: null` ONLY for correct entries (incorrect entries always carry the real text).
- Frontend: extend `RoomSnapshot` mirror; new `api.submitGuess`; wire `GuessForm` to call it with client-side trim + empty guard + drawer disable; render `Scoreboard` from participants' scores; render guess history from `currentRound`-scoped snapshot list; the GamePage `<Canvas>` placeholder is replaced with a new `CanvasBoard` component, drawer-only.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js 18+, ES Modules
**Primary Dependencies**: Express 4, Zod 3 (backend); React 18, React Router 6, Vite 5 (frontend). No additions.
**Storage**: In-memory `Map<string, Room>` on the backend; `Room.guesses[]` is the per-round, append-only list. Browser `localStorage` for identity (carried from Scenario 1). Canvas pixel state is in-memory only on the drawer's client.
**Testing**: Vitest 3 in both `backend/` and `frontend/`; jsdom on the frontend.
**Target Platform**: localhost development; modern evergreen browser with `HTMLCanvasElement` and 2D context support.
**Project Type**: Web application — `backend/` + `frontend/`.
**Performance Goals**: Polling cadence remains 2 s; new history entries observable within 3 s on all peers (Spec SC-001); 0% non-privileged leakage of correct-guess text (SC-010); 1 s drawer-canvas clear feedback (SC-008).
**Constraints**: No DB, no WS, no auth/sessions, no new top-level deps. Strict TS; no `any`. Zod at every API boundary. Constitution Principle IV: case-insensitive equality after `String.prototype.trim()` is the only correctness rule; no fuzzy matching.
**Scale/Scope**: Lab-scale — single round per room; guess histories bounded by player attention spans (no pagination).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Gate | Source | Status (Phase 0) | Status (Phase 1) |
|---|---|---|---|---|
| G1 | Every planned change traces to a US/FR/SC | Principle I | PASS — all changes map to US1–US3, FR-001…FR-016, SC-001…SC-010 | PASS |
| G2 | No out-of-scope items present | Principle II + Tech & Scope | PASS — no round-end trigger (Scenario 4 owns it), no rate limit, no length cap, no profanity filter, no canvas sync | PASS |
| G3 | No new top-level deps | Principle II | PASS — Express, Zod, React, Router, Vite only | PASS |
| G4 | All API boundaries Zod-validated; no `any` | Principle III | PASS — new submitGuessSchema; existing patterns reused for drawer/non-playing checks | PASS |
| G5 | Deterministic / observable behavior across clients | Principle IV | PASS — case-insensitive equality after trim is the single correctness rule; no `Math.random()` at draw; first-correct-per-participant rule is deterministic per submission order | PASS |
| G6 | Self-review hooks in place | Principle V | PASS — granular commits per US, two-tab gate (with Network-tab inspection for SC-010), both builds + tests | PASS |

No violations → Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── POST_rooms_code_guess.md      # NEW endpoint for this feature
│   └── snapshot-visibility-rules.md  # Extends Scenario 2's rules with guess-text redaction
├── checklists/
│   └── requirements.md  # Already exists from /speckit-specify
└── tasks.md             # Phase 2 output (later)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts          # MODIFY — add POST /:code/guess
│   │   ├── router.ts         # (unchanged)
│   │   ├── schemas.ts        # MODIFY — new submitGuessSchema
│   │   └── schemas.test.ts   # MODIFY — submitGuessSchema cases
│   ├── models/
│   │   └── game.ts           # MODIFY — Participant.score; Guess; SnapshotGuess; Room.guesses; RoomSnapshot.guesses
│   ├── services/
│   │   ├── roomStore.ts      # MODIFY — score init/reset; submitGuess service; extend toRoomSnapshot with guess-text redaction
│   │   └── roomStore.test.ts # MODIFY — submitGuess rules + filter + score cap
│   └── seed/starterData.ts   # (unchanged)
└── package.json              # (unchanged)

frontend/
├── src/
│   ├── services/
│   │   ├── api.ts            # MODIFY — extend RoomSnapshot mirror; add api.submitGuess
│   │   └── api.test.ts       # MODIFY — submitGuess request shape + error passthrough
│   ├── state/
│   │   └── roomStore.ts      # MODIFY — submitGuess action; hydrateSession placeholder gains guesses: []
│   ├── pages/
│   │   ├── GamePage.tsx      # MODIFY — wire GuessForm onSubmit; render guess history; render Scoreboard from snapshot; conditionally render CanvasBoard for drawer
│   │   └── GamePage.test.tsx # MODIFY — guess-history rendering; scoreboard rendering; redaction visibility per viewer
│   └── components/
│       ├── CanvasBoard.tsx        # NEW — drawer-local freehand canvas + Clear button
│       ├── CanvasBoard.test.tsx   # NEW — clear empties the canvas; mouse events trigger strokes
│       ├── GuessForm.tsx          # MODIFY — accept onSubmit handler; trim + empty guard; disabled when isDrawer
│       └── Scoreboard.tsx         # MODIFY — accept participants prop; render scores from snapshot
└── package.json              # (unchanged)
```

**Structure Decision**: Same web app layout from Scenario 1/2. One new component file pair (`CanvasBoard.tsx` + test). No new directories, no new packages.

## Phase 0 — Outline & Research

See [research.md](./research.md). Summary of decisions:

- **Score placement**: `Participant.score: number`, initialized 0 at create/join, RESET TO 0 in `startRoom` (FR-010). Round-scoped scoring lives on the participant because there is only one round per room in this lab.
- **First-correct cap mechanism**: when processing a new guess, scan the existing `Room.guesses[]` for any prior entry with the same `guesserParticipantId` AND `isCorrect === true`. If found, the new guess is recorded with `isCorrect: true` (if it matches the word) but the score is NOT bumped. If not found AND the new guess is correct, the score is bumped by 100. This is O(N) per submission with N small (a few dozen guesses), acceptable at lab scale.
- **Submission order**: each `Guess` carries a `submittedAt` ISO timestamp AND an integer `order` (assigned at append time from `room.guesses.length`). The frontend sorts by `order` (deterministic) rather than by timestamp (which can collide).
- **Text redaction filter**: extend `toRoomSnapshot` to map `room.guesses` into `SnapshotGuess[]`. For each entry: if `entry.isCorrect === false`, deliver real `text` always. If `entry.isCorrect === true`, deliver real `text` only when `viewerParticipantId === entry.guesserParticipantId` OR `viewerParticipantId === room.currentRound.drawerParticipantId`; otherwise `text: null`. The placeholder string itself is decided client-side (e.g., `"<correct guess>"`); the server never emits a placeholder string, only `null`, so the placeholder cannot leak the word's length.
- **Endpoint**: `POST /rooms/:code/guess` with body `{ participantId, text }`. Returns 200 + viewer-filtered snapshot on success; 400 (empty text / payload), 403 (drawer attempting to guess), 404 (room not found), 409 (room not in `playing` state).
- **Drawer-guess block ordering**: the server checks status === "playing" first (else 409), then resolves the participant (404 if not in room), then checks the drawer rule (403 if drawer), then validates non-empty text (400). This order surfaces the most actionable error first.
- **Canvas implementation**: HTML5 `<canvas>` with a 2D context inside a new `CanvasBoard` React component. Mouse/touch events accumulate paths in component state; redraw on each `requestAnimationFrame`. Clear calls `ctx.clearRect`. No upload, no server persistence — the entire canvas dies with the component (drawer-tab refresh resets).
- **Round-end deferral**: this scenario does NOT define a round-end trigger. The room stays in `"playing"` indefinitely. Scenario 4 will own this and is expected to read `Room.guesses[]` to render results.

## Phase 1 — Design & Contracts

See [data-model.md](./data-model.md), [contracts/](./contracts/), and [quickstart.md](./quickstart.md).

Phase 1 artifacts:

- `data-model.md` — `Participant.score`; `Guess` (server) and `SnapshotGuess` (viewer-aware); `Room.guesses[]` and `RoomSnapshot.guesses[]`; client mirrors and component-local derivations.
- `contracts/POST_rooms_code_guess.md` — request/response, full error matrix, viewer filtering note.
- `contracts/snapshot-visibility-rules.md` — extends Scenario 2's snapshot-visibility contract with the per-entry guess-text redaction rule; the placeholder string is client-side only; server emits `null`.
- `quickstart.md` — two-tab acceptance walkthrough mapped to every SC; explicit Network-tab inspection for SC-010 (correct-guess text never reaches a non-privileged client).
- `CLAUDE.md` SPECKIT block updated to `specs/003-gameplay-interaction/plan.md`.

## Data Flow Summary

```text
Score init:
  createRoom / joinRoom -> participant created with score: 0
  startRoom -> resets all participants' score to 0 (FR-010)
  startRoom also initializes room.guesses = []

Guess submit (guesser):
  GuessForm: trim(text); if empty -> setError("Enter a guess"), return
  api.submitGuess(roomCode, participantId, trimmedText)
    -> POST /rooms/ABCD/guess { participantId, text }
    -> server validation:
       1. status === "playing" else 409 "Round has not started"
       2. participant exists in room else 404 "Room not found"
       3. participantId !== drawerParticipantId else 403 "Only guessers can submit guesses"
       4. text non-empty after trim (Zod) else 400 "Enter a guess"
    -> service:
       isCorrect = text.toLowerCase() === currentRound.secretWord.toLowerCase()
       hadPriorCorrect = room.guesses.some(g => g.guesserParticipantId === participantId && g.isCorrect)
       if (isCorrect && !hadPriorCorrect) {
         participant.score += 100
       }
       room.guesses.push({id, guesserParticipantId, text, isCorrect, submittedAt, order: room.guesses.length})
       return updated room
    -> 200 { room: snapshotFor(guesser) }

Guess submit (drawer):
  GuessForm not rendered for drawer (isDrawer === true).
  Server-side rule still enforces 403 if hit directly.

Polling (every connected tab):
  GET /rooms/ABCD?participantId=X
    -> snapshot per viewer:
       - guesses: each entry text is real if (viewer === guesser || viewer === drawer || entry.isCorrect === false), else null
       - participants[].score: full visibility (scores are public)
    -> GamePage renders:
       - Scoreboard: lists participants with score (drawer often labeled separately)
       - History panel: ordered by entry.order, shows guesser name + entry text or placeholder + correct/incorrect badge

Canvas (drawer only):
  CanvasBoard receives drawer-only render flag
  mousedown -> beginPath, lineTo, stroke
  mousemove (while down) -> lineTo, stroke
  mouseup -> end stroke
  Clear button -> ctx.clearRect; strokes state cleared
```

## Implementation Sequence

1. **Backend data model**: extend `Participant` with `score`; add `Guess` and `SnapshotGuess`; extend `Room` and `RoomSnapshot` with `guesses[]`. Update `startRoom` to reset scores and initialize `guesses: []`.
2. **Backend service**: implement `submitGuess(code, participantId, text)`; return discriminated union (`null` for not-found, `{error: "not-playing"}` for status guard, `{error: "is-drawer"}` for drawer block, success `{room, guessId}`).
3. **Backend filter**: extend `toRoomSnapshot` to map `room.guesses` to `SnapshotGuess[]` with per-entry text redaction.
4. **Backend schema + route**: add `submitGuessSchema`; new `POST /:code/guess` route with the error matrix from research §endpoint.
5. **Backend tests**: cover score init/reset, first-correct cap, redaction filter, all error paths.
6. **Frontend types + api**: extend `RoomSnapshot` mirror with `guesses: SnapshotGuess[]`; add `api.submitGuess(code, participantId, text)`.
7. **Frontend store**: `RoomStore.submitGuess(text)` action; ensure `hydrateSession`'s placeholder room sets `guesses: []`.
8. **Frontend GuessForm**: accept an `onSubmit(text)` handler prop; client-side trim + empty guard; render disabled when `isDrawer`.
9. **Frontend Scoreboard**: accept `participants` and `hostParticipantId` (or `drawerParticipantId`) props; render rows with name + score + role badge.
10. **Frontend GamePage**: wire GuessForm `onSubmit` to `roomStore.submitGuess`; render history panel from `room.currentRound`-scoped snapshot entries; render Scoreboard with participants/scores; conditionally render `CanvasBoard` only when `isDrawer`.
11. **Frontend CanvasBoard**: new component; ref to `<canvas>`; mouse handlers + Clear button; small Vitest+jsdom test for clear behavior.
12. **Frontend tests**: update GamePage tests for history rendering + scoreboard + redacted placeholder visibility; add `CanvasBoard.test.tsx`; add guess-flow integration test.
13. **Validation**: both `npm run build`s; both `npm test`s; quickstart walkthrough; **Network-tab inspection** for SC-010.

## Risks

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| R1 | Redaction filter regression leaks correct-guess text in `text` field | Low | Centralised in `toRoomSnapshot`; backend test asserts `text === null` for non-privileged viewers AND `text === "rocket"` for the original guesser AND the drawer |
| R2 | First-correct cap incorrectly applies cumulatively (carries across rounds) | Low | Single round per room in this lab; `startRoom` already resets `currentRound`; FR-010 also resets `Participant.score`; covered by an explicit test ("scores zero out across simulated round boundaries") |
| R3 | Race between two guessers submitting "rocket" simultaneously | Low | Node's single-threaded event loop serialises both submissions; both land with `isCorrect: true`; both score 100 because neither had a prior correct entry at their decision point |
| R4 | Drawer submits a guess via direct API call after seeing the secret word | Mitigated | Server-side 403 check; covered by an integration test |
| R5 | Canvas state lost on drawer-tab refresh | Accepted | Documented in spec assumptions; no persistence possible without violating Constitution Principle II |
| R6 | Snapshot grows unbounded (~history accumulation) | Low | Lab-scale rooms with a few dozen guesses max; no pagination needed. Scenario 4 may revisit. |
| R7 | Polling response time inflates as history grows | Low | Each `SnapshotGuess` ~120 bytes; 100 entries ≈ 12 KB. Acceptable on localhost. |

## Testing Strategy

- **Backend unit (Vitest)**:
  - `submitGuess` correct-path: appends to `guesses`, bumps score to 100, returns updated room.
  - `submitGuess` cap: a second correct guess by the same guesser appends to `guesses` (isCorrect: true) but score remains 100.
  - `submitGuess` incorrect: appends with `isCorrect: false`; score unchanged.
  - `submitGuess` whitespace-trimming + case-insensitive equality: `"  RoCkEt  "` matches `"rocket"` and records text as `"RoCkEt"`.
  - `submitGuess` drawer block: returns `{error: "is-drawer"}` (route maps to 403).
  - `submitGuess` lobby block: returns `{error: "not-playing"}` (route maps to 409).
  - `submitGuess` not-found: returns `null` (route maps to 404).
  - `startRoom` resets all `Participant.score` to 0 and initializes `guesses: []`.
  - `toRoomSnapshot` filter: guesser sees own correct text; drawer sees all correct texts; third parties see `null` for correct entries; everyone sees real text for incorrect entries.

- **Frontend unit (Vitest + jsdom)**:
  - `api.submitGuess` POSTs to `/rooms/:code/guess` with `{participantId, text}`.
  - `RoomStore.submitGuess` updates state with the returned snapshot.
  - `GuessForm` client-side trim + empty rejection; submit button disabled when `disabled` prop is true.
  - `Scoreboard` renders participant names with their scores and a "Drawer" badge for the drawer.
  - `GamePage` history panel renders entries in order; placeholder shows for redacted (`text === null`) correct entries from third-party viewer's perspective; real text shows from guesser's own perspective.
  - `CanvasBoard` Clear button empties the canvas state (the test can assert the strokes data structure becomes empty without rendering pixels).

- **Two-tab acceptance (manual)**: `quickstart.md` walkthrough — guess submission, scoring cap, drawer block, lobby block, redaction Network-tab inspection, canvas drawer-locality, polling stop on navigate.

- **Build gate**: both `npm run build`s green; both `npm test`s green.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

No violations — nothing to track.
