# Research: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-04

## Discovery: What Already Exists

### Backend (`backend/src/`)

| File | What is implemented |
|------|---------------------|
| `models/game.ts` | `Participant`, `Room`, `RoomSnapshot`, `RoomSessionResponse` types — no `Guess`, no `guesses`/`scores` fields |
| `services/roomStore.ts` | `createRoom`, `joinRoom`, `startRoom`, `getRoom`, `saveRoom`, `toRoomSnapshot` — `startRoom` initialises `status:"playing"`, `drawerId`, `secretWord` only |
| `api/schemas.ts` | `createRoomSchema`, `joinRoomSchema`, `roomCodeParamsSchema`, `roomViewerQuerySchema`, `startRoomSchema`, `HttpError` — no guess schema |
| `api/rooms.ts` | `POST /`, `POST /:code/join`, `POST /:code/start`, `GET /:code` — no guess endpoint |

### Frontend (`frontend/src/`)

| File | What is implemented |
|------|---------------------|
| `services/api.ts` | Mirrors backend types; `api.createRoom`, `api.joinRoom`, `api.fetchRoom`, `api.startRoom` — no `submitGuess`, no `Guess` type, no `guesses`/`scores` on `RoomSnapshot` |
| `state/roomStore.ts` | `RoomStore` class with `createRoom`, `joinRoom`, `fetchRoom`, `startRoom` — no `submitGuess`, no game-screen polling |
| `pages/GamePage.tsx` | Renders role-aware layout; canvas area is a placeholder `<div>`; no polling; `GuessForm` rendered but not wired |
| `components/GuessForm.tsx` | Shell — captures input, `handleSubmit` is a no-op |
| `components/Scoreboard.tsx` | Placeholder — hardcoded "Waiting for players... 0" |
| `components/ResultPanel.tsx` | Placeholder — static text "Game activity and guesses will appear here." |

### Missing (everything to be built in Scenario 3)

- `Guess` type + `guesses`/`scores` on `Room`, `RoomSnapshot` (both sides)
- `guessSchema` (Zod) in `backend/src/api/schemas.ts`
- `submitGuess` function in `backend/src/services/roomStore.ts`
- `guesses`/`scores` initialisation in `startRoom`
- `POST /rooms/:code/guess` route in `backend/src/api/rooms.ts`
- `submitGuess` in `frontend/src/services/api.ts`
- `submitGuess` method in `frontend/src/state/roomStore.ts`
- Live `GuessForm` (trim, validate, call API, retain input on error, clear on success)
- Live `Scoreboard` (render `room.scores` + participant names)
- Live `ResultPanel` / guess history (colour-coded rows)
- `<canvas>` for drawer (freehand drawing + "Clear Canvas" button)
- Guesser canvas placeholder ("Watch the drawer!" styled div)
- Game-screen polling in `GamePage` (2 s interval, cleanup on unmount, 404 redirect)

## Key Decisions

### 1. Canvas drawing (drawer only)

**Decision**: `useRef<HTMLCanvasElement>` + `useEffect` to attach `mousedown`, `mousemove`,
`mouseup` listeners. A `isDrawing` ref tracks pen state. `CanvasRenderingContext2D.lineTo` /
`stroke` renders each segment.

**Rationale**: The native Canvas 2D API requires direct DOM access — a ref is the correct
React pattern. No library needed; drawing state is fully local (never sent to the server).

**Alternatives considered**:
- Fabric.js / Konva.js — rejected (new npm dependency, out of scope per constitution)
- SVG path accumulation — rejected (more complex, no benefit for this use case)

### 2. Game-screen polling

**Decision**: `useEffect` in `GamePage` with `setInterval(pollFn, POLL_INTERVAL_MS)` where
`POLL_INTERVAL_MS = 2000`. Return `() => clearInterval(id)` for cleanup. On 404 response,
call `navigate("/", { replace: true })`. On other errors, set inline error state and continue.

**Rationale**: Matches the constitution's Polling-Only Sync principle and the pattern already
used in `LobbyPage`. Cleanup prevents memory leaks on navigation.

**Alternatives considered**:
- `useRef` for interval ID — unnecessary; the effect closure captures it correctly
- React Query / SWR — rejected (new npm dependency)

### 3. Guess submission response

**Decision**: `POST /rooms/:code/guess` returns `{ room: RoomSnapshot }`. The frontend
immediately updates `roomStore` with the fresh snapshot, so the submitting player's UI
reflects their guess without waiting for the next poll.

**Rationale**: Eliminates a perceptible lag on the submitter's side with no additional
complexity; same pattern as `POST /rooms/:code/start`.

### 4. Guess comparison

**Decision**: `trimmedText.toLowerCase() === room.secretWord!.toLowerCase()`.

**Rationale**: Exactly matches FR-006. No library needed.

### 5. Score initialisation

**Decision**: `startRoom` initialises `scores` as `Object.fromEntries(room.participants.map(p => [p.id, 0]))`.

**Rationale**: All participants (drawer included) start at 0. Drawer score stays 0 because
they are blocked from submitting guesses (FR-015). Keying by `participantId` matches the
snapshot's `Record<string, number>` shape.

### 6. New npm dependencies

**Decision**: None. All required capabilities are built-in (Canvas API, `setInterval`,
TypeScript, Zod already installed).

**Rationale**: Constitution forbids new top-level dependencies without justification. None
are needed here.

## No NEEDS CLARIFICATION Items

The stack, patterns, and constraints were all determinable from the existing codebase.
No external research was required.
