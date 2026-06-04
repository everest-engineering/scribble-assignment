# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

---

## Summary

Extend the in-memory `Room` model with `strokes`, `guesses`, and per-participant `score`.
Add two new backend endpoints (`POST /rooms/:code/strokes`, `POST /rooms/:code/guess`) with
full Zod validation and business rule enforcement. Wire up `GamePage` with a working HTML5
canvas (draw/clear for drawer, view-only for guessers), activate `GuessForm` for
non-drawers, and display the live guess history and scoreboard via the existing poll cycle.

---

## Technical Context

**Language/Version**: TypeScript 5 (strict) — Node.js 18+ backend, React 18 frontend

**Primary Dependencies**: Express (backend), React + Vite (frontend), Zod (validation),
native `HTMLCanvasElement` API (no new canvas library)

**Storage**: In-memory only — `strokes` and `guesses` on `Map<string, Room>`

**Testing**: Vitest (backend unit), manual two-tab acceptance test

**Target Platform**: `http://localhost:3001` (backend), `http://localhost:5173` (frontend)

**Project Type**: Brownfield web application enhancement

**Performance Goals**: Sub-100ms response on stroke/guess POST; canvas redraw completes
within one animation frame

**Constraints**: No WebSockets, no DB, no new npm dependencies, no auth

**Scale/Scope**: Single room, 2+ players, in-memory only

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First | ✅ Pass | Extending existing files only |
| II. In-Memory Only | ✅ Pass | `strokes`/`guesses`/`score` stored on `Room` map |
| III. HTTP Polling | ✅ Pass | Canvas state synced via existing poll; strokes submitted on mouse-up |
| IV. Deterministic Rules | ✅ Pass | Guess comparison is case-insensitive string equality; score += 100 |
| V. TypeScript Strictness | ✅ Pass | Discriminated union for `Stroke`; all fields fully typed |
| Brownfield Constraints | ✅ Pass | No new dependencies, no auth, no DB, no WebSockets |

**Gate result**: All gates pass.

---

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md          ← this file
├── research.md      ← Phase 0
├── data-model.md    ← Phase 1
├── contracts/
│   └── rooms-api.md ← Phase 1
└── tasks.md         ← Phase 2 (/speckit.tasks)
```

### Source Code (files touched by this feature)

```text
backend/
└── src/
    ├── models/
    │   └── game.ts              ← add Stroke, GuessRecord, SnapshotGuessRecord types;
    │                               extend Participant (score), Room (strokes, guesses),
    │                               RoomSnapshot (strokes, guesses)
    ├── services/
    │   └── roomStore.ts         ← init score/strokes/guesses in createParticipant/createRoom;
    │                               update toRoomSnapshot to forward strokes + guesses
    ├── api/
    │   ├── schemas.ts           ← add strokeSchema, guessSchema
    │   └── rooms.ts             ← add POST /:code/strokes and POST /:code/guess routes

frontend/
└── src/
    ├── services/
    │   └── api.ts               ← add Stroke, SnapshotGuessRecord types; extend
    │                               Participant (score), RoomSnapshot; add submitStroke,
    │                               submitGuess methods
    ├── components/
    │   └── GuessForm.tsx        ← activate: add onSubmit prop, controlled input, submit
    └── pages/
        └── GamePage.tsx         ← wire canvas (draw/clear/replay); conditionally render
                                    GuessForm for non-drawers; render guess history;
                                    render scoreboard
```

---

## Data Flow

### Drawer submits a stroke

```
Drawer browser (mouse-up)
  → POST /rooms/:code/strokes { type:"draw", participantId, x0,y0,x1,y1,color,lineWidth }
  → rooms.ts handler:
      validateStroke (Zod 422)
      check room.status === "playing" (400)
      check participantId === room.drawerId (403)
      room.strokes.push(stroke)
      saveRoom(room)
      return toRoomSnapshot(room, participantId)
  ← { room: { strokes: [...], ... } }

All browsers (poll at ~2s)
  → GET /rooms/:code?participantId=...
  ← { room: { strokes: [...], ... } }
  Frontend: clearRect + replay all strokes
```

### Guesser submits a guess

```
Guesser browser (form submit)
  → POST /rooms/:code/guess { participantId, guess: "Rocket" }
  → rooms.ts handler:
      validateGuess (Zod 422)
      trim guess → "Rocket"
      check !empty (400)
      check room.status === "playing" && room.currentWord !== null (400)
      check participantId !== room.drawerId (403)
      find participant (404)
      check no existing correct guess by this participantId (400)
      compare "rocket" === "rocket" (case-insensitive) → correct: true
      participant.score += 100
      room.guesses.push({ participantId, participantName, text: "Rocket", correct: true })
      saveRoom(room)
  ← { correct: true, score: 100 }

All browsers (poll at ~2s)
  ← { room: { guesses: [{ participantName:"Alice", text:"Rocket", correct:true }],
               participants: [{ ..., score: 100 }, ...] } }
```

---

## Implementation Sequence

### Phase 1 — Backend model (foundational, no breaking changes)

1. `backend/src/models/game.ts`: Add `Stroke` discriminated union, `GuessRecord`,
   `SnapshotGuessRecord` types. Extend `Participant` with `score: number`. Extend `Room`
   with `strokes: Stroke[]` and `guesses: GuessRecord[]`. Extend `RoomSnapshot` with
   `strokes: Stroke[]` and `guesses: SnapshotGuessRecord[]`.

2. `backend/src/services/roomStore.ts`: Add `score: 0` to `createParticipant()`. Add
   `strokes: []` and `guesses: []` to `createRoom()`. Update `toRoomSnapshot()` to forward
   `strokes` (shallow copy) and `guesses` (strip `participantId` via map).

### Phase 2 — Backend API

3. `backend/src/api/schemas.ts`: Add `strokeSchema` (discriminated union) and `guessSchema`.

4. `backend/src/api/rooms.ts`: Import new schemas. Add `POST /:code/strokes` handler.
   Add `POST /:code/guess` handler with all validation gates in order.

### Phase 3 — Frontend types + API client

5. `frontend/src/services/api.ts`: Add `Stroke`, `DrawStroke`, `ClearStroke`,
   `SnapshotGuessRecord` types. Add `score: number` to `Participant`. Add `strokes` and
   `guesses` to `RoomSnapshot`. Add `api.submitStroke()` and `api.submitGuess()` methods.

### Phase 4 — GuessForm activation

6. `frontend/src/components/GuessForm.tsx`: Add `onSubmit: (guess: string) => void` prop.
   Wire controlled `<input>` + `<button>` inside the component. Clear input on submit.

### Phase 5 — GamePage canvas + guess integration

7. `frontend/src/pages/GamePage.tsx`:
   - Replace canvas placeholder with `<canvas ref={canvasRef}>`.
   - Add `useEffect` keyed on `room.strokes`: clear + replay all strokes on every change.
   - Drawer only: wire `mousedown`/`mousemove`/`mouseup` to track current stroke; on
     `mouseup` call `api.submitStroke()` then `roomStore.fetchRoom()` to get latest state.
   - Add "Clear" button (drawer only): calls `api.submitStroke({ type:"clear", ... })`.
   - Non-drawers: `pointerEvents: "none"` on canvas element.
   - Render `<GuessForm>` only when `!isDrawer`; on submit call `api.submitGuess()` and
     show result (correct/incorrect) inline.
   - Render guess history from `room.guesses` (already polled).
   - Render scoreboard from `room.participants` sorted by score descending.

---

## Testing Strategy

### Manual two-tab acceptance test

1. Tab A: create room → Tab B: join → Tab A: Start Game.
2. Tab A (drawer): draw on canvas; confirm Tab B shows same strokes within ~2s.
3. Tab A: click Clear; confirm Tab B canvas clears within ~2s.
4. Tab B (non-drawer): submit correct guess; confirm `correct: true` response, score
   increases to 100 in Tab B participant list within ~2s.
5. Tab B: submit same correct word again; confirm 400 error (cap enforced).
6. Tab B: submit empty guess; confirm 400 error; guess does NOT appear in history.
7. Tab A (drawer): attempt to submit guess; confirm GuessForm is hidden.
8. Both tabs: confirm guess history is identical and in submission order.

### Build verification

- `cd backend && npm run build` — zero TypeScript errors.
- `cd frontend && npm run build` — zero TypeScript errors.

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Canvas `getContext` returns null (SSR or test env) | Low | Guard `if (!ctx) return` before all canvas ops |
| `room.strokes` replay flicker on full redraw | Low | `clearRect` + sync replay is imperceptible at 2s poll interval |
| `GuessForm` re-renders on every poll clearing input mid-type | Medium | `GuessForm` uses local controlled state; parent re-render does not reset it unless key changes |
| Race: drawer submits stroke while poll is in-flight | Low | Both resolve to server state; last write wins; no data loss |
| `participantId` accidentally exposed in guess snapshot | Low | `toRoomSnapshot` explicitly destructures only `participantName`, `text`, `correct` |

---

## Dependencies

- Scenario 2 (002-game-start-drawer-flow) must be complete:
  - `drawerId`, `currentWord` on `Room` ✅
  - `isDrawer` computed in `GamePage` ✅
  - Polling (`startPolling`/`stopPolling`) in `RoomStore` ✅
  - `POST /rooms/:code/start` handler ✅
- No external service dependencies.
- No new npm packages.
