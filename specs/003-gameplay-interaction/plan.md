# Implementation Plan: Gameplay Interaction

**Branch**: `assignment` | **Date**: 2026-05-28 | **Spec**: [spec.md](./spec.md)

---

## Summary

Add `guesses[]` and `scores` to the Room model. New `POST /rooms/:code/guess`
endpoint validates, stores, and scores each guess. `GET /rooms/:code` returns
guesses + scores in the snapshot. Game screen polls every ~2s for synced history
and scoreboard. Drawer gets an interactive HTML5 canvas with a clear button.

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First | ✅ Pass | Extending Room model, adding one endpoint |
| II. Spec-Driven | ✅ Pass | Traces to FR-001–FR-010 |
| III. Deterministic Rules | ✅ Pass | correct=100, incorrect=0; case-insensitive compare |
| IV. Strict Scope | ✅ Pass | No canvas sync, no WebSockets, no new libraries |
| V. Incremental Validation | ✅ Pass | Gate: guess synced in 2 tabs, score updates |
| VI. AI-Assisted, Human-Reviewed | ✅ Pass | Reviewed before commit |

---

## Data Model Changes

### New type `Guess` (game.ts)
```
participantId: string
text: string          (trimmed)
correct: boolean
submittedAt: string   (ISO timestamp)
```

### Backend `Room` (game.ts)
```
Added: guesses: Guess[]                 — empty array, initialised on startGame
       scores: Record<string, number>   — participantId→score, all 0 on startGame
```

### Backend + Frontend `RoomSnapshot`
```
Added: guesses: Guess[], scores: Record<string, number>
Visible to all viewers — no role filtering
```

---

## File-Level Changes

```
backend/
├── src/models/game.ts              ← add Guess; add guesses/scores to Room + RoomSnapshot
├── src/services/roomStore.ts       ← startGame() inits guesses/scores; add submitGuess()
├── src/api/rooms.ts                ← add POST /:code/guess route
├── src/api/schemas.ts              ← add guessSchema
└── src/services/roomStore.test.ts  ← extend tests

frontend/
├── src/services/api.ts             ← add Guess type; add fields to RoomSnapshot; add submitGuess()
├── src/state/roomStore.ts          ← add submitGuess() action
├── src/components/DrawingCanvas.tsx ← new: interactive canvas + clear button (drawer only)
├── src/components/GuessForm.tsx    ← wire validation + submitGuess call
├── src/components/Scoreboard.tsx   ← render room.scores
├── src/components/ResultPanel.tsx  ← render room.guesses as history
└── src/pages/GamePage.tsx          ← add polling; wire DrawingCanvas; layout updates
```

---

## API Contract

```
POST /rooms/:code/guess
Body:    { "participantId": "<uuid>", "text": "<string>" }

200 OK:  { "room": { ...RoomSnapshot with updated guesses + scores } }
400:     { "message": "Guess cannot be empty" }
404:     { "message": "Unable to load room" }
```

---

## Data Flow

### Submit Guess
```
GuessForm validates (trim, non-empty client-side)
  → POST /rooms/:code/guess { participantId, text }
  → submitGuess():
      trim; reject empty (400)
      correct = text.trim().toLowerCase() === secretWord.toLowerCase()
      push to guesses[]; scores[participantId] += correct ? 100 : 0
  → return updated RoomSnapshot → setRoomSnapshot(room)
```

### Game Screen Polling
```
GamePage mounts → useEffect: setInterval(2000, fetchRoom)
  → setRoomSnapshot(room) each tick
  → cleanup: clearInterval on unmount
```

### Canvas (drawer only)
```
DrawingCanvas:
  mousedown → beginPath + moveTo
  mousemove (while pressed) → lineTo + stroke
  mouseup/mouseleave → end path
  Clear button → ctx.clearRect(full)
```

---

## Implementation Sequence

1. Backend models: add `Guess` type; extend `Room` + `RoomSnapshot`
2. Backend store: `startGame()` inits `guesses`/`scores`; `toRoomSnapshot()` includes them; add `submitGuess()`
3. Backend schemas + route: `guessSchema`; `POST /:code/guess`
4. Backend tests: guess stored, correct/incorrect scoring, empty rejected (400)
5. Frontend types: add `Guess` + fields to `api.ts`; add `submitGuess()` to api + roomStore
6. Frontend canvas: new `DrawingCanvas` component
7. Frontend wiring: `GuessForm`, `Scoreboard`, `ResultPanel`, `GamePage` polling
