# Implementation Plan: Result, Restart & Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-result-restart-validation/spec.md`

## Summary

Implement Scenario 4: host-only **end round** (`playing` → `result`) and **restart** (`result` → `lobby`)
transitions on the existing in-memory room model. Extend `RoomStatus` with `"result"`; add
`endRoom` and `restartRoom` services plus two POST routes; update `toRoomSnapshot` to reveal
`secretWord` to all viewers in result state and omit strokes from the snapshot. On the frontend,
extend `GamePage` to poll during `playing` and `result`, render in-place result mode (word,
scores, history — no canvas), and auto-navigate to lobby on restart. Validate the full four-scenario
loop with two browsers per [quickstart.md](./quickstart.md).

## Technical Context

**Language/Version**: TypeScript (Node.js 18+, ES modules) on backend and frontend

**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vite, Vitest

**Storage**: In-memory `Map` in `backend/src/services/roomStore.ts` (no persistence)

**Testing**: Vitest for status transitions, host guards, snapshot filtering, restart clearing;
manual two-browser end-to-end validation per [quickstart.md](./quickstart.md); `npm run build` in both apps

**Target Platform**: Local dev — backend `http://localhost:3001`, frontend `http://localhost:5173`

**Project Type**: Web application (monorepo: `backend/` + `frontend/`)

**Performance Goals**: Result/restart transitions visible on all clients within ~2s polling cadence

**Constraints**: HTTP polling only; no WebSockets, databases, or auth; in-place result mode on
`/game` (no new route); host manual round end (no auto-end on correct guess)

**Scale/Scope**: Four user stories (P1–P4); two new REST endpoints; minimal UI changes to `GamePage`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with `.specify/memory/constitution.md` (Scribble v1.0.0):

- [x] **Brownfield First**: Extends Scenario 3 files; no new libraries or rewrites
- [x] **TypeScript + Zod**: New routes validated via existing `participantId` body schemas pattern
- [x] **HTTP Polling Only**: Result/restart sync via existing GET poll on `GamePage`; no push protocols
- [x] **Spec Kit Traceability**: Plan maps FR-001–FR-014 to files, data model, and contracts
- [x] **Deterministic Game Rules**: Host-only transitions; word reveal to all in result; clean lobby reset
- [x] **Out-of-Scope Clean**: No multi-round rotation, timers, auto-end, or new dependencies
- [x] **Validation Plan**: Full two-browser loop in quickstart; builds required

**Post-design re-check (Phase 1)**: All gates pass. Adding `"result"` status and two POST endpoints
fits the existing REST + polling model without constitution violations.

## Discovery Findings (Starter Gaps)

| Gap | Relevant files | Spec refs |
|-----|----------------|-----------|
| No `result` room status | `game.ts`, `api.ts` | FR-001, FR-004 |
| No end-round or restart API | `rooms.ts`, `roomStore.ts` | FR-001, FR-008 |
| `toRoomSnapshot` hides word from guessers always | `roomStore.ts` | FR-004 |
| `submitGuess`/`addStroke` only guard `playing` | `roomStore.ts` | FR-003, FR-003a |
| `GamePage` polls only during `playing` | `GamePage.tsx` | FR-007 |
| `GamePage` always shows canvas | `GamePage.tsx` | FR-004a |
| No host End Round / Restart controls | `GamePage.tsx` | FR-001, FR-008 |
| Lobby redirect ignores `result` status | `GamePage.tsx` | FR-012 |

**Clarifications applied** (see spec § Clarifications):

- In-flight guesses accepted if processed before end-round; rejected after
- Canvas hidden in result mode
- Same `/game` route transitions in-place to result mode

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-validation/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 entity design
├── quickstart.md        # Manual validation steps
├── contracts/
│   └── rooms-api.md     # REST contract deltas
└── tasks.md             # Phase 2 (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts          # POST end, restart routes
│   │   └── schemas.ts        # Reuse participantId body schemas
│   ├── models/
│   │   └── game.ts           # RoomStatus += "result"
│   └── services/
│       └── roomStore.ts      # endRoom, restartRoom, snapshot updates
└── src/services/roomStore.test.ts

frontend/
├── src/
│   ├── pages/
│   │   └── GamePage.tsx        # Result mode UI, host controls, poll both statuses
│   ├── services/
│   │   └── api.ts              # endRoom, restartRoom + RoomStatus type
│   └── state/
│       └── roomStore.ts        # endRoom, restartRoom store methods
```

**Structure Decision**: Web application layout. No new components or routes; extend existing
game screen and room store pipeline.

## Data Flow

```text
Host ends round
  GamePage "End Round" → roomStore.endRoom → POST /rooms/:code/end
  → status = "result"; round data preserved (guesses, scores, secretWord)
  → toRoomSnapshot: secretWord for all viewers; guesses + scores; no strokes
  → other clients poll GET /rooms/:code → GamePage renders result mode in-place

Guesser in-flight guess (race)
  POST /rooms/:code/guesses processed before POST /rooms/:code/end → accepted
  POST /rooms/:code/guesses after end → 409 Game not in progress

Result mode (poll every ~2000ms)
  fetchRoomSilent → snapshot with status "result"
  → hide DrawingCanvas; show secret word card to all; Scoreboard + ResultPanel read-only

Host restarts
  GamePage "Restart" → roomStore.restartRoom → POST /rooms/:code/restart
  → status = "lobby"; clear strokes, guesses, secretWord, drawer, scores, scoredParticipantIds
  → participants + host preserved
  → all clients poll → GamePage effect sees status "lobby" → navigate /lobby

Second game start
  Reuses Scenario 2 startRoom → fresh playing state
```

## Implementation Sequence

1. **Backend type** — Add `"result"` to `RoomStatus` in `game.ts` and `api.ts`.
2. **Backend `endRoom`** — Host-only; requires `status === "playing"`; set `status = "result"`.
3. **Backend `restartRoom`** — Host-only; requires `status === "result"`; reset round fields; `status = "lobby"`.
4. **Backend snapshot** — In `result`: expose `secretWord` to all; include `guesses`/scores; omit `strokes`.
   Update `participantRole` to return roles during `result` for scoreboard context (optional display).
5. **Backend guards** — `addStroke`, `clearCanvas`, `submitGuess` reject when `status !== "playing"`.
6. **Backend routes** — `POST /:code/end` and `POST /:code/restart` in `rooms.ts`.
7. **Backend tests** — Vitest: end/restart auth, status transitions, snapshot word visibility, restart clearing.
8. **Frontend types + API** — `endRoom`, `restartRoom` methods; `RoomStatus` includes `"result"`.
9. **RoomStore actions** — `endRoom()`, `restartRoom()` calling API and updating snapshot.
10. **GamePage result mode** — Branch on `room.status === "result"`: hide canvas/guess form; show word to all;
    host-only End Round (playing) / Restart (result) buttons; poll when `playing` or `result`.
11. **GamePage navigation** — Redirect to `/lobby` when `status === "lobby"`; allow `playing` and `result` on `/game`.
12. **Manual validation** — Full four-scenario loop per [quickstart.md](./quickstart.md).
13. **Build check** — `npm run build` in both apps.

## Testing Strategy

| Layer | Approach |
|-------|----------|
| Unit | Vitest: `endRoom`/`restartRoom` guards, snapshot secretWord in result, restart field clearing |
| Integration | Manual two-browser end-to-end per quickstart |
| Build | `npm run build` in `backend/` and `frontend/` |
| Regression | Scenarios 1–3 lobby/start/gameplay flows unchanged |

## Risks

| Risk | Mitigation |
|------|------------|
| End-round / guess race | Single-threaded Node processes requests sequentially; document test with near-simultaneous submits |
| Poll stops at result | Extend poll effect condition to `playing \|\| result` |
| Exit Game during result | Client-only navigation; server stays in result until host restarts (documented edge case) |
| Stale strokes in snapshot | Omit `strokes` from result snapshot; frontend hides canvas regardless |

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
