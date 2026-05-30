# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-gameplay-interaction/spec.md`

## Summary

Implement Scenario 3 gameplay: interactive drawer-only canvas with stroke sync via polling,
clear canvas, guesser submission with trim/empty rejection and case-insensitive matching,
shared guess history, and deterministic scoring (+100 first correct per participant, +0
incorrect). Extend in-memory `Room` with `strokes`, `guesses`, participant `score`, and
`scoredParticipantIds`; add three POST endpoints; wire `DrawingCanvas`, `GuessForm`,
`Scoreboard`, and `ResultPanel` on the game screen. Brownfield — no new libraries or
WebSockets.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+, ES modules) on backend and frontend

**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vite, Vitest; HTML5 Canvas (native)

**Storage**: In-memory `Map` in `backend/src/services/roomStore.ts` (no persistence)

**Testing**: Vitest for guess normalization, scoring rules, drawer-only guards, snapshot fields;
manual two-browser validation per [quickstart.md](./quickstart.md); `npm run build` in both apps

**Target Platform**: Local dev — backend `http://localhost:3001`, frontend `http://localhost:5173`

**Project Type**: Web application (monorepo: `backend/` + `frontend/`)

**Performance Goals**: Game snapshot refresh within ~2s; stroke POST returns quickly for drawer UX

**Constraints**: HTTP polling only; no WebSockets, databases, or auth; minimal diffs; round end
and restart deferred to Scenario 4

**Scale/Scope**: Single round per session; four user stories (P1–P4); three new REST endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with `.specify/memory/constitution.md` (Scribble v1.0.0):

- [x] **Brownfield First**: Plan extends Scenario 2 files; replaces placeholders in existing components
- [x] **TypeScript + Zod**: Stroke/guess schemas in `schemas.ts`; types in `game.ts`, `api.ts`
- [x] **HTTP Polling Only**: Canvas/guesses/scores sync via extended GET snapshot; no push protocols
- [x] **Spec Kit Traceability**: Plan maps FR-001–FR-020 to files, data model, and contracts below
- [x] **Deterministic Game Rules**: Case-insensitive match, +100/+0, first-correct cap, poll sync
- [x] **Out-of-Scope Clean**: No round end/restart, timers, multi-round, or new libraries
- [x] **Validation Plan**: Two-browser steps in [quickstart.md](./quickstart.md); builds required

**Post-design re-check (Phase 1)**: All gates pass. Stroke list + POST mutations fit in-memory
REST model without constitution violations.

## Discovery Findings (Starter Gaps)

| Gap | Relevant files | Spec refs |
|-----|----------------|-----------|
| Static canvas placeholder | `GamePage.tsx` | FR-001–FR-005 |
| No stroke storage or API | `roomStore.ts`, `rooms.ts` | FR-004–FR-005 |
| GuessForm submit is no-op | `GuessForm.tsx` | FR-007–FR-011 |
| Scoreboard static zeros | `Scoreboard.tsx` | FR-006, FR-018 |
| ResultPanel static placeholder | `ResultPanel.tsx` | FR-016, FR-019 |
| No participant score field | `game.ts` | FR-006, FR-012–FR-014 |
| No guess history on Room | `roomStore.ts` | FR-015–FR-017 |
| startRoom does not init gameplay fields | `roomStore.ts` | FR-006 |

**Assumptions documented in spec**: canvas sync to all players; first correct +100 only; round
end deferred to Scenario 4.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
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
│   │   ├── rooms.ts          # POST strokes, clear, guesses routes
│   │   └── schemas.ts        # stroke, guess, clear Zod schemas
│   ├── models/
│   │   └── game.ts           # Stroke, Guess, score on Participant/Snapshot
│   └── services/
│       └── roomStore.ts      # addStroke, clearCanvas, submitGuess, snapshot fields
└── src/services/roomStore.test.ts

frontend/
├── src/
│   ├── components/
│   │   ├── DrawingCanvas.tsx   # NEW — HTML5 canvas, drawer draw / guesser read-only
│   │   ├── GuessForm.tsx       # Wire submit + validation + API call
│   │   ├── Scoreboard.tsx      # Live scores from snapshot
│   │   └── ResultPanel.tsx     # Guess history from snapshot
│   ├── pages/
│   │   └── GamePage.tsx        # Integrate canvas, pass props to child components
│   ├── services/
│   │   └── api.ts              # submitGuess, addStroke, clearCanvas + types
│   └── state/
│       └── roomStore.ts        # submitGuess, addStroke, clearCanvas methods
```

**Structure Decision**: Web application layout. One new component (`DrawingCanvas`); three
new backend routes; extend existing store and snapshot pipeline.

## Data Flow

```text
Drawer draws (pointer up)
  DrawingCanvas → roomStore.addStroke → POST /rooms/:code/strokes
  → roomStore.addStroke appends stroke, returns snapshot
  → local canvas already rendered; poll confirms for other clients

Drawer clears
  DrawingCanvas Clear button → roomStore.clearCanvas → POST /rooms/:code/canvas/clear
  → strokes = []

Game poll (every ~2000ms — existing GamePage effect)
  fetchRoomSilent → GET /rooms/:code?participantId=
  → snapshot with strokes, guesses, participants[].score
  → DrawingCanvas / Scoreboard / ResultPanel re-render

Guesser submits guess
  GuessForm (trim + reject empty client-side)
  → roomStore.submitGuess → POST /rooms/:code/guesses
  → server trim, compare, score, append history
  → response snapshot updates store; other clients see via poll

Start game (extended side effects)
  startRoom → strokes=[], guesses=[], scores=0, scoredParticipantIds=[]
```

## Implementation Sequence

1. **Backend types** — Add `Stroke`, `Guess` interfaces; extend `Participant`, `Room`,
   `RoomSnapshot`, `ParticipantSnapshot` in `game.ts`.
2. **Backend gameplay init** — In `startRoom()`, init strokes/guesses/scored ids; zero scores.
3. **Backend services** — `addStroke`, `clearCanvas`, `submitGuess` with role guards and scoring.
4. **Backend snapshot** — Include `strokes`, `guesses`, `participants[].score` in `toRoomSnapshot`.
5. **Zod schemas** — Stroke, clear, guess request bodies in `schemas.ts`.
6. **Backend routes** — Wire three POST handlers in `rooms.ts` with error mapping.
7. **Backend tests** — Vitest: guess trim/score, drawer-only stroke, guesser-only guess, cap.
8. **Frontend types + API** — Extend `api.ts` with new methods and snapshot fields.
9. **RoomStore actions** — `addStroke`, `clearCanvas`, `submitGuess` calling API and updating snapshot.
10. **DrawingCanvas component** — Drawer pointer capture + local render; guesser read-only replay.
11. **GuessForm** — Client trim/reject; call `submitGuess`; show errors.
12. **Scoreboard / ResultPanel** — Bind to `room.participants` scores and `room.guesses`.
13. **GamePage integration** — Replace placeholder; wire Clear button; pass role props.
14. **Manual validation** — Follow [quickstart.md](./quickstart.md) with two browser tabs.

## Testing Strategy

| Layer | Approach |
|-------|----------|
| Unit | Vitest: `submitGuess` scoring, empty guess reject, drawer cannot guess, stroke append/clear |
| Integration | Manual two-browser flows per quickstart |
| Build | `npm run build` in `backend/` and `frontend/` |
| Regression | Scenario 1–2 lobby/start/drawer-word tests continue to pass |

## Risks

| Risk | Mitigation |
|------|------------|
| Large stroke payloads on busy canvas | Single-round lab scope; stroke count typically small |
| Drawer local canvas out of sync with poll | Merge poll strokes by id; drawer keeps in-flight stroke local until POST completes |
| Guess double-submit race | Server idempotent scoring via `scoredParticipantIds`; history may show duplicates (acceptable) |
| Coordinate mismatch across tabs | Fixed canvas width/height constants shared frontend + validation bounds backend |

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
