# Implementation Plan: Round Result, Restart & Final Validation

**Branch**: `004-round-result-restart` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-round-result-restart/spec.md`

---

## Summary

Extend the existing `RoomStatus` type (already includes `"finished"` from Scenario 2) with
behavioural changes: `toRoomSnapshot` lifts `currentWord` viewer-gating when
`status === "finished"`; the guess handler auto-sets `status = "finished"` on correct
guess; a manual `POST /rooms/:code/end` endpoint allows the host to end the round;
a `POST /rooms/:code/restart` endpoint clears all round-scoped state and returns to
lobby. The frontend `GamePage` conditionally renders three views based on `status`:
lobby (simplified), playing (existing game), and finished (result view with restart
button for host).

---

## Technical Context

**Language/Version**: TypeScript 5 (strict) — Node.js 18+ backend, React 18 frontend

**Primary Dependencies**: Express, React + Vite, Zod

**Storage**: In-memory only

**Testing**: Vitest (backend unit), manual two-tab acceptance test

**Target Platform**: `http://localhost:3001` (backend), `http://localhost:5173` (frontend)

**Project Type**: Brownfield web application enhancement

**Performance Goals**: Sub-100ms response on end/restart POST

**Constraints**: No WebSockets, no DB, no new npm dependencies, no auth

**Scale/Scope**: Single room, 2+ players, in-memory only

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First | ✅ Pass | Extending existing files only |
| II. In-Memory Only | ✅ Pass | All state changes on Room map |
| III. HTTP Polling | ✅ Pass | Result/restart synced via existing poll |
| IV. Deterministic Rules | ✅ Pass | Status transitions are unconditional |
| V. TypeScript Strictness | ✅ Pass | `"finished"` already in `RoomStatus` union |
| Brownfield Constraints | ✅ Pass | No new dependencies, no auth, no DB, no WebSockets |

**Gate result**: All gates pass.

---

## Project Structure

### Documentation (this feature)

```text
specs/004-round-result-restart/
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
    │   └── game.ts              ← NO CHANGE ("finished" already in RoomStatus)
    ├── services/
    │   └── roomStore.ts         ← add restartRoom() function; update toRoomSnapshot gating
    ├── api/
    │   ├── schemas.ts           ← add endRoundSchema, restartSchema
    │   └── rooms.ts             ← add POST /:code/end, POST /:code/restart;
    │                               extend POST /:code/guess to set status="finished" on correct

frontend/
└── src/
    ├── services/
    │   └── api.ts               ← add api.endRound(), api.restartGame()
    └── pages/
        └── GamePage.tsx         ← conditional rendering: "lobby" | "playing" | "finished"
```

---

## Data Flow

### Correct guess ends round

```
Guesser browser (form submit)
  → POST /rooms/:code/guess { participantId, guess }
  → rooms.ts handler:
      ...existing validation...
      correct = trimmedGuess.toLowerCase() === room.currentWord.toLowerCase()
      if (correct) {
        participant.score += 100
        room.status = "finished"          // NEW: auto-end on correct guess
      }
      room.guesses.push(...)
      saveRoom(room)
  ← { correct: true, score: 100 }

All browsers (poll at ~2s)
  ← { room: { status: "finished", currentWord: "rocket", ... } }
  Frontend: GamePage renders result view (word revealed, scores, history)
```

### Host restarts

```
Host browser (click "Restart Game")
  → POST /rooms/:code/restart { participantId }
  → rooms.ts handler:
      validate participantId === hostId (403)
      validate status !== "lobby" (400)
      restartRoom(code): status="lobby", drawerId=null, currentWord=null,
                         strokes=[], guesses=[], all scores=0
  ← { room: { status: "lobby", strokes: [], guesses: [], ... } }

All browsers (poll at ~2s)
  ← { room: { status: "lobby", ... } }
  Frontend: GamePage renders simplified lobby view
```

---

## Implementation Sequence

### Phase 1 — Backend model + store

1. `backend/src/services/roomStore.ts`: Update `toRoomSnapshot()` — in the `currentWord`
   ternary, add `room.status === "finished" ||` before the existing drawer check so the
   word is revealed to all when the round is over (FR-003). Add `restartRoom(code)`
   function that clears round state and resets scores.

### Phase 2 — Backend API

2. `backend/src/api/schemas.ts`: Add `endRoundSchema` and `restartSchema` (both
   `{ participantId: z.string().uuid() }`).

3. `backend/src/api/rooms.ts`: In the existing `POST /:code/guess` handler, after
   `if (correct) { participant.score += 100; }`, add `room.status = "finished";` (FR-001).
   Add `POST /:code/end` handler: host check → status already playing check →
   `room.status = "finished"` → `saveRoom()` → return snapshot. Add `POST /:code/restart`
   handler: host check → status not lobby check → call `restartRoom()` → return snapshot.

### Phase 3 — Frontend API client

4. `frontend/src/services/api.ts`: Add `api.endRound(code, participantId)` and
   `api.restartGame(code, participantId)` methods.

### Phase 4 — GamePage conditional rendering

5. `frontend/src/pages/GamePage.tsx`: Refactor the main render body into three
   conditional branches based on `room.status`:
   - `"lobby"`: Simplified lobby — participant list, host-gated "Start Game" button
     (reuse existing `api.startGame` call), waiting message for non-hosts.
   - `"playing"`: Existing game content (canvas, guess form, etc. — already implemented
     in Scenario 3). No changes needed.
   - `"finished"`: Result view — show correct word (now visible from snapshot), final
     scoreboard (already wired from Scenario 3), complete guess history (already wired),
     "Restart Game" button for host (calls `api.restartGame`), waiting message for
     non-hosts.

---

## Testing Strategy

### Manual two-tab acceptance test

1. Tab A: create room → Tab B: join → Tab A: Start Game.
2. Tab B: submit correct guess → confirm response `correct: true`; confirm next poll
   shows `status: "finished"` and `currentWord` visible in Tab B.
3. Tab A (drawer): confirm result view shows correct word, scores, guess history,
   and "Restart Game" button.
4. Tab B: confirm result view shows same content but NO restart button; instead
   shows "Waiting for host to restart...".
5. Tab A: click "Restart Game" → confirm response has `status: "lobby"`, `strokes: []`,
   `guesses: []`, all scores `0`.
6. Both tabs: confirm simplified lobby view within ~2s (participant list, Start Game
   button for host only).
7. Tab A: call `POST /:code/end` while status is `"playing"` (skip guess) → confirm
   `status: "finished"` with no score changes.
8. Tab B: attempt `POST /:code/restart` → confirm 403.

### Build verification

- `cd backend && npm run build` — zero TypeScript errors.
- `cd frontend && npm run build` — zero TypeScript errors.

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `toRoomSnapshot` gating leak in `"finished"` | Low | Single ternary condition; covered by test |
| Restart from `"playing"` skips result view | Low | Accepted per spec; host discretion |
| GamePage becomes large with 3 branches | Medium | Each branch is self-contained; no shared state between them |
| `restartRoom` mutates participants in-place | Low | `saveRoom` uses `structuredClone`; mutation is safe |

---

## Dependencies

- Scenario 3 (003-gameplay-interaction) must be complete:
  - `strokes`, `guesses`, `score` on Room ✅
  - `POST /:code/guess` handler with scoring ✅
  - `GamePage` with canvas, guess form, scoreboard, guess history ✅
  - Polling mechanism ✅
- No external service dependencies.
- No new npm packages.
