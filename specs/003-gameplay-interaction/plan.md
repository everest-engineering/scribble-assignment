# Implementation Plan: Gameplay Interaction

**Branch**: `assignment` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

## Summary

Extend the game screen to support live guess submission with scoring, synced guess
history via 2-second polling, and a local drawing canvas for the drawer.
The backend gains a new `POST /rooms/:code/guesses` endpoint that trims, validates,
and scores guesses, storing results on the `Room`. `GET /rooms/:code` snapshots now
include `guesses[]` and `scores{}`. The Game screen adds a `setInterval` poll,
activates the `GuessForm`, `Scoreboard`, and `ResultPanel` stubs, and replaces the
canvas placeholder with a real `<canvas>` element for the drawer.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 18+)
**Primary Dependencies**: Express, React + Vite, Zod — all existing
**Storage**: In-memory `Map<string, Room>` — unchanged
**Testing**: Existing unit tests; manual two-tab acceptance
**Target Platform**: Local — `localhost:3001` / `localhost:5173`
**Project Type**: Web application — brownfield extension
**Constraints**: No new npm dependencies; TypeScript throughout; extend not rewrite

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First — extend not rewrite | ✅ PASS | All changes extend existing files; stubs activated |
| II. Deterministic Game Rules — scoring 100/0, case-insensitive trim | ✅ PASS | All game logic in backend only |
| II. Dual validation — client + server for empty guess | ✅ PASS | GuessForm + submitGuess() both validate |
| III. Polling, Not Real-Time | ✅ PASS | 2s setInterval in GamePage; no WebSockets |
| IV. Incremental — Scenario 3 only | ✅ PASS | No Scenario 4 work included |
| V. Simplicity — native Canvas API, no new deps | ✅ PASS | Zero new dependencies |

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md         ← this file
├── research.md     ← Phase 0 output
├── data-model.md   ← Phase 1 output
├── contracts/
│   └── rooms.md    ← Phase 1 output
└── tasks.md        ← Phase 2 output (/speckit-tasks)
```

### Source Code (files changed)

```text
backend/
└── src/
    ├── models/
    │   └── game.ts          ← add Guess interface; add guesses + scores to Room and RoomSnapshot
    ├── api/
    │   ├── schemas.ts       ← add submitGuessSchema
    │   └── rooms.ts         ← add POST /:code/guesses route
    └── services/
        └── roomStore.ts     ← add submitGuess(); extend startRoom() + createRoom() + toRoomSnapshot()

frontend/
└── src/
    ├── services/
    │   └── api.ts           ← add Guess type; add guesses + scores to RoomSnapshot; add submitGuess()
    ├── state/
    │   └── roomStore.ts     ← add submitGuess() action
    ├── components/
    │   ├── GuessForm.tsx    ← wire submit handler, empty validation, error display, clear on success
    │   ├── Scoreboard.tsx   ← render scores from useRoomState()
    │   └── ResultPanel.tsx  ← render guess history from useRoomState()
    └── pages/
        └── GamePage.tsx     ← add 2s polling; replace canvas placeholder with <canvas> for drawer
```

**Structure Decision**: 10 files changed — all extensions of existing starter files.
No new files or directories required.

## Backend Changes

### 1. `backend/src/models/game.ts`
- Add `Guess` interface with `id`, `participantId`, `participantName`, `text`, `isCorrect`, `submittedAt`
- Add `guesses: Guess[]` and `scores: Record<string, number>` to `Room`
- Add `guesses: Guess[]` and `scores: Record<string, number>` to `RoomSnapshot`

### 2. `backend/src/api/schemas.ts`
- Add `submitGuessSchema`: `{ participantId: z.string().trim().min(1), text: z.string() }`
- Note: `text` trimming is intentionally deferred to `submitGuess()` for accurate error messaging

### 3. `backend/src/services/roomStore.ts`
- `createRoom()`: initialise `guesses: [], scores: {}`
- `startRoom()`: add `guesses: [], scores: Object.fromEntries(room.participants.map(p => [p.id, 0]))`
- `submitGuess(code, participantId, text)` — new export:
  - Return `null` if room not found
  - Throw `"Game is not active"` if `room.status !== "game"`
  - Throw `"Drawer cannot submit guesses"` if `participantId === room.drawerId`
  - Trim `text`; throw `"Guess cannot be empty"` if empty after trim
  - Throw `"Participant not found"` if `participantId` not in room
  - Compare `trimmed.toLowerCase() === room.secretWord.toLowerCase()` for `isCorrect`
  - Award 100 pts if correct, 0 if not; append guess to `room.guesses`; update `room.scores`
  - Return `saveRoom(updatedRoom)`
- `toRoomSnapshot()`: include `guesses: room.guesses.map(g => ({ ...g }))` and `scores: { ...room.scores }`

### 4. `backend/src/api/rooms.ts`
- Import `submitGuess` and `submitGuessSchema`
- Add `router.post("/:code/guesses", ...)`:
  - Parse `code` from params, `{ participantId, text }` from body
  - Call `submitGuess()`; map errors to 400/403/404 `HttpError`
  - Respond with `{ room: toRoomSnapshot(room, participantId) }`

## Frontend Changes

### 5. `frontend/src/services/api.ts`
- Add `Guess` interface (mirrors backend)
- Add `guesses: Guess[]` and `scores: Record<string, number>` to `RoomSnapshot`
- Add `submitGuess(code, participantId, text)` method: `POST /rooms/:code/guesses`

### 6. `frontend/src/state/roomStore.ts`
- Add `submitGuess(text)` action: validates non-empty, calls `api.submitGuess()`, calls `setRoomSnapshot()`

### 7. `frontend/src/components/GuessForm.tsx`
- Use `useRoomStore()` and `useRoomState()` to access `participantId` and `isDrawer`
- On submit: trim + empty check → show inline error if blank; otherwise call `roomStore.submitGuess(text)`
- Clear input on successful submission; show API error message on failure
- Pass `disabled={isDrawer}` internally (drawer cannot submit)

### 8. `frontend/src/components/Scoreboard.tsx`
- Use `useRoomState()` to read `room.participants` and `room.scores`
- Render each participant's name and their score from `scores[participant.id] ?? 0`

### 9. `frontend/src/components/ResultPanel.tsx`
- Use `useRoomState()` to read `room.guesses`
- Render each guess: participant name, guessed text, correct/incorrect indicator
- Most recent guess at top (reverse chronological order)

### 10. `frontend/src/pages/GamePage.tsx`
- Add `useRoomStore()` call and `setInterval` polling every 2s calling `roomStore.fetchRoom()`
  with `clearInterval` cleanup — mirrors `LobbyPage` pattern exactly
- Replace canvas placeholder `<div>` with:
  - `<canvas>` element + `useRef<HTMLCanvasElement>` when `isDrawer`
  - Mouse event handlers: `onMouseDown` (begin stroke), `onMouseMove` (draw if pressing),
    `onMouseUp` / `onMouseLeave` (end stroke)
  - "Clear Canvas" button calling `ctx.clearRect(0, 0, canvas.width, canvas.height)`
  - Existing placeholder `<div>` ("Waiting for drawer…") shown when not drawer

## Data Flow

```
POST /rooms/:code/guesses (guesser):
  → backend: trim, compare, append guess, update score
  → response: full snapshot with updated guesses[] + scores{}
  → frontend: setRoomSnapshot(response.room) — immediate UI update

GET /rooms/:code?participantId=<id> (polling every 2s):
  → all clients receive current guesses[] and scores{}
  → Scoreboard and ResultPanel re-render automatically

Canvas (drawer only):
  → mousedown: begin path, move to cursor
  → mousemove + pressing: lineTo + stroke
  → mouseup/mouseleave: end stroke
  → Clear button: clearRect entire canvas
  → No backend involvement — purely local
```

## Testing Strategy

- Manual two-tab verification (primary gate)
- Backend TypeScript build confirms model/service/schema correctness
- Existing 4 unit tests confirm no regressions
- Browser DevTools: verify `POST /rooms/:code/guesses` response body
- Two-tab test: guesser submits correct guess → both tabs show history and score within 2s

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `createRoom` TypeScript error — `Room` now requires `guesses`/`scores` | Initialise both in `createRoom()` |
| Canvas `ctx` null if ref not yet attached | Guard: `if (!canvasRef.current) return` before `getContext()` |
| Polling fires after component unmount | `clearInterval` in `useEffect` cleanup function |
| Guesser submitting before game starts | Guard: `room.status !== "game"` throws in `submitGuess()` |
