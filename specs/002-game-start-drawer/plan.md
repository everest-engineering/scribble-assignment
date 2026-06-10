# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer` | **Date**: 2026-06-09 | **Spec**: ../spec.md

**Input**: Feature specification from `/specs/002-game-start-drawer/spec.md`

## Summary

Implement the game start flow for Scribble by adding backend game-state support and frontend role-aware rendering. This work wires the Start Game button in the lobby to a new `POST /rooms/:code/start` API endpoint, transitions rooms from `"lobby"` to `"playing"` status, assigns the host as drawer, selects a secret word deterministically, and ensures the word is visible only to the drawer. The frontend `GamePage` is updated to render different views for drawers and guessers.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Node.js 18+

**Primary Dependencies**: React, React Router v6, Vite, Express, Zod, Vitest

**Storage**: Server-side in-memory room store (`Map<string, Room>`)

**Testing**: Vitest for frontend and backend units

**Target Platform**: Web application (browser with local dev backend)

**Project Type**: Web application with separate `frontend/` and `backend/` packages

**Constraints**: No WebSocket or real-time push mechanisms. No persistent database. No authentication service. HTTP polling only.

## Constitution Check

- TypeScript strict mode and no silent `any` values must be maintained.
- Frontend UIs must use functional components and hooks only.
- Vitest coverage should cover new game-start logic at an 80% surface minimum.
- The implementation must not exceed the starter stack or introduce major new dependencies.
- Room status model is extended from single value to three states (`"lobby" | "playing" | "result"`).

## Project Structure

### Documentation (this feature)

```
specs/002-game-start-drawer/
├── plan.md
├── spec.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code Changes

```
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts          ← add POST /:code/start route
│   │   └── schemas.ts        ← add start-room schema
│   ├── models/
│   │   └── game.ts           ← extend RoomStatus, add Round/Guess types
│   └── services/
│       └── roomStore.ts      ← add startRoom(), update toRoomSnapshot()
frontend/
├── src/
│   ├── components/
│   │   └── ...               ← no new components needed
│   ├── pages/
│   │   ├── LobbyPage.tsx     ← call API instead of direct navigate
│   │   └── GamePage.tsx      ← role-aware rendering, word reveal/hide
│   ├── services/
│   │   └── api.ts            ← add startGame()
│   └── state/
│       └── roomStore.ts      ← update RoomSnapshot type, add startGame method
```

## Implementation Plan

### Phase 1 — Backend game state model

1. Extend `RoomStatus` in `backend/src/models/game.ts` to `"lobby" | "playing" | "result"`.
2. Add `Round` interface: `{ roundNumber, drawerParticipantId, secretWord, scores, guesses, isComplete }`.
3. Add `Guess` interface: `{ participantId, text, isCorrect, timestamp }`.
4. Add `canvasState: { strokes: Point[][] }` to Room model (stub for now, used in Scenario 3).
5. Update `RoomSnapshot` and `HostAwareRoomSnapshot` types to include `currentRound` and `canvasState`.

### Phase 2 — Backend start-game logic

1. Add `startRoom(code, hostParticipantId)` to `backend/src/services/roomStore.ts`:
   - Validate room exists.
   - Validate caller is host (matches `hostParticipantId`).
   - Validate at least 2 participants.
   - Validate room status is `"lobby"`.
   - Assign drawer = host for round 1.
   - Select word deterministically: `STARTER_WORDS[(totalParticipants + roundNumber) % STARTER_WORDS.length]`.
   - Initialise scores to 0 for all participants.
   - Set status to `"playing"`.
   - Save and return cloned room.

2. Update `toRoomSnapshot()` in `roomStore.ts`:
   - Include `currentRound` in snapshot.
   - If viewer is not the drawer and status is `"playing"`, set `secretWord` to `null`.
   - If status is `"result"`, reveal secret word to all.

3. Add `POST /rooms/:code/start` route in `backend/src/api/rooms.ts`:
   - Parse body for `participantId` (the caller's ID).
   - Validate room code format.
   - Call `startRoom()`.
   - Return updated snapshot on success.
   - Return appropriate HttpError for each failure case (403 not host, 400 not enough players, 400 already started, 404 room not found).

4. Add backend tests for:
   - Successful start with 2+ participants.
   - Rejection when caller is not host.
   - Rejection when only 1 participant.
   - Rejection when room already playing.
   - Drawer assignment and word selection.
   - Word hidden from non-drawers.

### Phase 3 — Frontend API and store

1. Add `api.startGame(code, participantId)` to `frontend/src/services/api.ts`.
2. Update `RoomSnapshot` type in `api.ts` to include `currentRound` and `canvasState`.
3. Add `startGame(code, participantId)` method to `RoomStore` in `frontend/src/state/roomStore.ts`:
   - Calls `api.startGame()`, then `setRoomSession()` to update state.

### Phase 4 — Frontend lobby-to-game transition

1. Update `LobbyPage.tsx`:
   - Start button onClick calls `roomStore.startGame(room.code, participantId)`.
   - On success, navigate to `/game`.
   - On error, display error message.
   - Keep the existing disabled/enabled logic (host-only, >=2 players).

### Phase 5 — Frontend role-aware game page

1. Update `GamePage.tsx`:
   - If `room.status === "lobby"`, redirect to `/lobby`.
   - If `room.status === "result"`, render result view (detailed in Scenario 4).
   - Detect if viewer is drawer vs guesser by comparing `participantId` with `currentRound.drawerParticipantId`.
   - Drawer sees: the secret word displayed prominently, interactive canvas (placeholder until Scenario 3).
   - Guesser sees: "The drawer is drawing..." instead of the word, read-only canvas view (placeholder until Scenario 3), guess form (placeholder until Scenario 3).

### Phase 6 — Testing and validation

1. Frontend tests:
   - `LobbyPage` start button fires API call instead of direct navigate.
   - `GamePage` renders drawer view vs guesser view based on role.
   - `GamePage` redirects to lobby if status is `"lobby"`.
2. Manual verification: two browser tabs create/join, host starts game, both see correct role and word visibility.

## Risks and Mitigations

- **Word leaks via snapshot**: Mitigated by setting `secretWord` to `null` in `toRoomSnapshot()` for non-drawers during `"playing"` status. Server-enforced, not client-enforced.
- **Race condition on start**: Mitigated by server-side status check (`is status === "lobby"?`). If two hosts (after promotion) somehow both call start, only the first succeeds.
- **Backend schema validation**: `startRoom` must validate all preconditions before mutating state.

## Next Steps

- Create `specs/002-game-start-drawer/tasks.md` with ordered implementation tasks.
- Implement backend model changes and start-game endpoint.
- Implement frontend API, store, lobby update, and role-aware game page.
- Add vitest coverage for all new behavior.
