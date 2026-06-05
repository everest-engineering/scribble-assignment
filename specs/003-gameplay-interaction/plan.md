# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-gameplay-interaction/spec.md`

## Summary

Enable real gameplay for Scenario 3: the drawer gets a live `<canvas>` for freehand drawing
(local-only, not synced); guessers submit typed guesses via a new `POST /rooms/:code/guess`
endpoint that trims, validates, and case-insensitively compares against the secret word;
correct guesses award 100 points; all guesses and live scores are included in the existing
room snapshot and synced to every player via the existing 2-second polling mechanism.

## Technical Context

**Language/Version**: TypeScript 5.6 — Node.js 22 (backend), React 18 + Vite 5 (frontend)

**Primary Dependencies**: Express 4, Zod 3 (backend); React 18, React Router 6 (frontend);
Vitest 3 (both)

**Storage**: In-memory `rooms: Map<string, Room>` — per Principle V

**Testing**: `vitest run` in `backend/` and `frontend/`

**Target Platform**: Web browser — two tabs for manual validation

**Project Type**: Web application — `backend/` + `frontend/` monorepo

**Performance Goals**: New guesses visible to all players within 3 s (2 s polling + propagation)

**Constraints**: No WebSockets; no new top-level npm dependencies; TypeScript everywhere,
`any` forbidden; in-memory store only

**Scale/Scope**: Lab-scale — 2–5 players per room

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First | ✅ PASS | All changes extend existing files; no rewrites |
| II. TypeScript Everywhere | ✅ PASS | New `Guess` type in both `models/game.ts` and `api.ts`; `any` forbidden |
| III. Spec-Driven Development | ✅ PASS | Every task maps to a FR or acceptance scenario |
| IV. Polling-Only Sync | ✅ PASS | `setInterval` at 2 s in `GamePage`, `clearInterval` on unmount; no WebSockets |
| V. In-Memory Store Only | ✅ PASS | `guesses`/`scores` added to existing `rooms` Map; no external store |
| VI. Incremental Validation | ✅ PASS | Validate with two browser tabs after implementation |

No violations → Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts          ← extend: add Guess type; add guesses/scores to Room + RoomSnapshot
│   ├── services/
│   │   └── roomStore.ts     ← extend: init guesses/scores in startRoom; add submitGuess function
│   └── api/
│       ├── schemas.ts       ← extend: add guessSchema
│       └── rooms.ts         ← extend: add POST /:code/guess route

frontend/
├── src/
│   ├── services/
│   │   └── api.ts           ← extend: add Guess type; add guesses/scores to RoomSnapshot; add submitGuess fn
│   ├── state/
│   │   └── roomStore.ts     ← extend: add submitGuess method
│   ├── pages/
│   │   └── GamePage.tsx     ← extend: add 2 s polling with 404 redirect; replace canvas placeholder
│   └── components/
│       ├── GuessForm.tsx    ← extend: wire submit, trim+validate, error state, clear on success
│       ├── Scoreboard.tsx   ← extend: render live scores from room.scores + participants
│       └── ResultPanel.tsx  ← extend: render guess history with green/red colour-coding
```

## Implementation Notes

### Backend

**`backend/src/models/game.ts`**
- Add `Guess` interface (fields: `participantId`, `participantName`, `text`, `correct`, `submittedAt`)
- Add `guesses: Guess[]` and `scores: Record<string, number>` to `Room`
- Add `guesses: Guess[]` and `scores: Record<string, number>` to `RoomSnapshot`

**`backend/src/api/schemas.ts`**
- Add `guessSchema = z.object({ participantId: z.string(), guessText: z.string() })`

**`backend/src/services/roomStore.ts`**
- In `startRoom`: after setting `status`, add:
  ```
  room.guesses = [];
  room.scores = Object.fromEntries(room.participants.map(p => [p.id, 0]));
  ```
- In `toRoomSnapshot`: spread `guesses` and `scores` from `room` into snapshot
- Add `submitGuess(code, participantId, guessText)`:
  1. Get room; throw 404 if missing
  2. Trim guessText; throw 400 if empty
  3. Throw 403 if participantId === room.drawerId
  4. Find participant by id (for `participantName`)
  5. Compare trimmed text case-insensitively against `room.secretWord`
  6. Create `Guess` object; push to `room.guesses`
  7. If correct: `room.scores[participantId] += 100`
  8. `saveRoom(room)`; return `toRoomSnapshot`

**`backend/src/api/rooms.ts`**
- Add `router.post("/:code/guess", ...)` that calls `submitGuess` and responds with `{ room }`

### Frontend

**`frontend/src/services/api.ts`**
- Add `Guess` interface (identical shape to backend)
- Add `guesses: Guess[]` and `scores: Record<string, number>` to `RoomSnapshot`
- Add `api.submitGuess(code, participantId, guessText)` → `POST /rooms/:code/guess`
  returning `{ room: RoomSnapshot }`

**`frontend/src/state/roomStore.ts`**
- Add `submitGuess(guessText: string)` method:
  - Guards: return if no `room` or `participantId`
  - Calls `api.submitGuess`; on success calls `setRoomSnapshot(response.room)`
  - Re-throws error so `GuessForm` can display it

**`frontend/src/pages/GamePage.tsx`**
- Add `POLL_INTERVAL_MS = 2000` constant
- Add `useEffect` polling block:
  - `setInterval` calls `store.fetchRoom()`
  - On 404 (error message contains "404" or "Unable to load room"): `navigate("/", { replace: true })`
  - On other errors: set inline `pollError` state, continue polling
  - Return `clearInterval` for cleanup
- Replace canvas placeholder with conditional render:
  - `isDrawer`: `<canvas>` element with `useRef` + mousedown/mousemove/mouseup drawing logic
    plus "Clear Canvas" button
  - `!isDrawer`: styled `<div>` with label "Watch the drawer!"

**Canvas drawing implementation (drawer only)**
- `canvasRef = useRef<HTMLCanvasElement>(null)`
- `isDrawingRef = useRef(false)`
- `useEffect` attaches event listeners:
  - `mousedown`: set `isDrawing = true`, `moveTo` cursor position
  - `mousemove`: if `isDrawing`, `lineTo` + `stroke`
  - `mouseup` / `mouseleave`: set `isDrawing = false`
  - Cleanup removes all three listeners on unmount
- "Clear Canvas" button: `ctx.clearRect(0, 0, canvas.width, canvas.height)`

**`frontend/src/components/GuessForm.tsx`**
- Add `onSubmit?: (guessText: string) => Promise<void>` prop (passed from `GamePage`)
- On form submit:
  1. Trim `guessText`; if empty, set `error` state, return (no API call) — input retained
  2. Clear `error`; call `onSubmit(trimmed)`
  3. On success: `setGuessText("")`
  4. On error: set `error` state (input retained, per FR-005 clarification)
- Render `error` message below the input when set

**`frontend/src/components/Scoreboard.tsx`**
- Accept `room: RoomSnapshot | null` from `useRoomState()`
- Render `room.participants` list with score from `room.scores[p.id] ?? 0`

**`frontend/src/components/ResultPanel.tsx`**
- Accept `room: RoomSnapshot | null` from `useRoomState()`
- Render `room.guesses` in order; each row:
  - `{participantName}: {text}` as plain text (never innerHTML)
  - Row background: green (`#dcfce7`) if `correct`, red (`#fee2e2`) if not
  - Text colour: green (`#166534`) if correct, red (`#991b1b`) if not

## Complexity Tracking

> No constitution violations — table not required.
