# Discovery Notes — Scribble Starter

## Overview

Read-through of the starter codebase to identify what is implemented, what is missing, and what assumptions need to be made before planning.

---

## What Is Already Working

| Area | Status |
|------|--------|
| App shell and routing (5 screens) | Done |
| `POST /rooms` — create room + first participant | Done |
| `POST /rooms/:code/join` — join by code | Done |
| `GET /rooms/:code` — fetch room snapshot | Done |
| `RoomStore` (frontend) — create/join/fetch actions | Done |
| Manual lobby refresh button | Done |
| In-memory room store (`Map<string, Room>`) | Done |
| Zod request validation schemas | Done |
| Error handler middleware | Done |

---

## Gaps — Incomplete Behaviors

### Gap 1: No host tracking in the data model

`backend/src/models/game.ts` defines `Room` with `code`, `status`, `participants`, `createdAt`, and `updatedAt` — no `hostId` field. The spec requires the room creator to be the host with exclusive start-game rights, but nothing in the model captures this. The `Participant` type (`id`, `name`, `joinedAt`) also has no `isHost` flag.

Relevant files: `backend/src/models/game.ts:1-29`, `backend/src/services/roomStore.ts:52-68`

### Gap 2: No automatic lobby polling

`frontend/src/pages/LobbyPage.tsx` exposes a manual "Refresh Room" button (`handleRefresh` at line 20). There is no `setInterval`, no `useEffect` poll loop, and no polling interval constant anywhere in the frontend. The spec requires the lobby to auto-refresh approximately every 2 seconds.

Relevant files: `frontend/src/pages/LobbyPage.tsx:14-27`

### Gap 3: Start Game button is unguarded and has no backend counterpart

The "Start Game" button in `LobbyPage.tsx` (line 72) calls `navigate("/game")` directly — no backend call, no minimum-player check, no host-only guard. There is no `POST /rooms/:code/start` endpoint anywhere in the backend. The game screen is accessible by any participant at any time via the URL.

Relevant files: `frontend/src/pages/LobbyPage.tsx:72`, `backend/src/api/rooms.ts`

### Gap 4: Game state is absent from the Room model

`RoomStatus` is typed as `"lobby"` only (`backend/src/models/game.ts:2`). There are no `"playing"` or `"result"` statuses. The `Room` interface carries no `drawerId`, `secretWord`, `guesses`, `scores`, or `roundEnded` fields. Without this, none of the gameplay scenarios (Scenarios 2–4) can be implemented.

Relevant files: `backend/src/models/game.ts:2`, `frontend/src/services/api.ts:11`

### Gap 5: Canvas is a static div — no drawing or clear functionality

`frontend/src/pages/GamePage.tsx` (line 44) renders a `<div className="canvas-placeholder">` with the text "Waiting for drawer...". There is no `<canvas>` element, no pointer-event handlers, no drawing context, and no "Clear Canvas" button. The spec requires the drawer to be able to draw and clear.

Relevant files: `frontend/src/pages/GamePage.tsx:44-47`

### Gap 6: Guess submission is a no-op

`frontend/src/components/GuessForm.tsx` handles the form submit event at line 11–12 with only `event.preventDefault()`. There is no API call, no case-insensitive comparison, no empty/whitespace rejection, and no state update. The spec requires guesses to be submitted to the backend, validated, scored, and synced to all players.

Relevant files: `frontend/src/components/GuessForm.tsx:10-12`

### Gap 7: Scoreboard and ResultPanel show only hardcoded placeholders

`Scoreboard.tsx` always renders "Waiting for players... 0" and `ResultPanel.tsx` shows a static message. Neither reads from store state. The spec requires live scores (starting at 0, +100 for correct) and a shared result display (correct word, final scores, full guess history).

Relevant files: `frontend/src/components/Scoreboard.tsx`, `frontend/src/components/ResultPanel.tsx`

### Gap 8: `toRoomSnapshot` ignores `viewerParticipantId` — word visibility not implemented

`backend/src/services/roomStore.ts:99` explicitly voids the `viewerParticipantId` parameter (`void viewerParticipantId`). This is the intended hook for filtering the secret word — showing it only to the drawer — but the logic is absent. `RoomSnapshot.availableWords` currently returns the full word list to every client.

Relevant files: `backend/src/services/roomStore.ts:99-109`

### Gap 9: Player name validation is missing on both sides

The backend `displayName()` (`roomStore.ts:33`) silently replaces a missing or empty name with `"Player"` rather than rejecting it. The frontend `CreateRoomPage` and `JoinRoomPage` send whatever string the user types (including whitespace-only). Scenario 2 requires trimmed names and explicit rejection of empty/whitespace-only names with a user-facing message.

Relevant files: `backend/src/services/roomStore.ts:33-35`, `frontend/src/pages/CreateRoomPage.tsx:17`, `frontend/src/pages/JoinRoomPage.tsx:16`

### Gap 10: No guess history API endpoints, no restart endpoint

There is no `POST /rooms/:code/guess` endpoint and no `POST /rooms/:code/restart` endpoint. The backend `rooms.ts` only handles create, join, and fetch. Guess submission, result exposure, and lobby restart require new routes and business logic.

Relevant files: `backend/src/api/rooms.ts`, `backend/src/api/router.ts`

---

## Assumptions

### Assumption 1: `participants[0]` is the host

The room creator is the first entry in `room.participants`. Since the model has no explicit `hostId`, the implementation will add a `hostId: string` field to `Room` (set to `participant.id` at creation time) and include it in `RoomSnapshot`. The frontend will derive host status by comparing `participantId` from the store against `room.hostId`.

### Assumption 2: Drawer assignment and word selection are deterministic, not random

The spec says the secret word is "deterministically selected." I assume:
- **Drawer**: always `participants[0]` (the host) for the first and only round.
- **Word**: always `STARTER_WORDS[0]` (`"rocket"`) — the first word in the seed list.

This makes the behaviour predictable for manual testing and reviewable without randomness.

### Assumption 3: Drawing is local to the drawer's screen only

WebSockets are explicitly out of scope. The spec for Scenario 3 says "the drawing is visible on the drawer's screen" — it does not say drawing is synced to guessers. I assume the canvas is drawer-local. Only guess history and game state (scores, status, word reveal) are polled by all players.

### Assumption 4: Polling is done via `setInterval` in page-level `useEffect` hooks

The `RoomStore` currently has no polling logic. Consistent with the existing `fetchRoom()` action already in the store, polling will be added as `setInterval` in `LobbyPage` (for participant list) and `GamePage` (for guesses/scores/status), cleaned up on unmount. Interval constant: 2000 ms.

### Assumption 5: Participant identity is in-memory only — browser refresh loses session

`participantId` is stored only in the `RoomStore` class instance (React context). There is no localStorage, cookie, or URL parameter persistence. A browser refresh navigates the player back to `/` and they cannot rejoin as the same participant. This is accepted behaviour within the lab scope.

### Assumption 6: `RoomStatus` will expand to `"lobby" | "playing" | "result"`

The frontend `api.ts` hardcodes `status: "lobby"` in the `RoomSnapshot` type. Both backend model and frontend type definitions will need to be updated to `"lobby" | "playing" | "result"` before game-state transitions can be implemented.

---

## Relevant Files

### Backend

| File | Purpose |
|------|---------|
| `backend/src/models/game.ts` | Core types: `Room`, `Participant`, `RoomSnapshot`, `RoomStatus` — needs expansion |
| `backend/src/services/roomStore.ts` | In-memory store; `createRoom`, `joinRoom`, `getRoom`, `saveRoom`, `toRoomSnapshot` |
| `backend/src/api/rooms.ts` | Route handlers for create, join, fetch — new endpoints go here |
| `backend/src/api/schemas.ts` | Zod schemas for request validation — new schemas needed for start/guess/restart |
| `backend/src/api/router.ts` | Mounts `/rooms` router; houses error and 404 handlers |
| `backend/src/seed/starterData.ts` | `STARTER_WORDS` and `STARTER_ROLES` — used for word selection and role seeding |

### Frontend

| File | Purpose |
|------|---------|
| `frontend/src/services/api.ts` | HTTP client + shared types; `RoomSnapshot` type needs `status` expansion |
| `frontend/src/state/roomStore.ts` | Client store (`RoomStore` class, `useRoomState`, `useRoomStore`); polling goes here or in pages |
| `frontend/src/pages/LobbyPage.tsx` | Lobby UI — needs polling, host guard on Start button, 2-player minimum |
| `frontend/src/pages/GamePage.tsx` | Game UI — needs real canvas, drawer/guesser branching, status-aware rendering |
| `frontend/src/components/GuessForm.tsx` | Guess input — needs API call, validation, disabled state for drawer |
| `frontend/src/components/Scoreboard.tsx` | Score display — needs live data from `RoomSnapshot` |
| `frontend/src/components/ResultPanel.tsx` | Guess history + result reveal — needs live data and result state |
| `frontend/src/pages/CreateRoomPage.tsx` | Room creation — needs name trim and empty rejection |
| `frontend/src/pages/JoinRoomPage.tsx` | Room join — needs name trim, empty rejection, and code format validation |
