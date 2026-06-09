# Discovery Notes

## Overview

This document captures gaps, assumptions, and relevant files found during initial inspection of the Scribble starter codebase. It serves as the foundation for the spec, plan, and task artifacts.

---

## Incomplete Behaviors (Gaps)

### 1. No host tracking on the Room model

`backend/src/models/game.ts` defines `Room` with only `code`, `status`, `participants`, `createdAt`, and `updatedAt`. There is no `hostId` field. The `createRoom` function in `backend/src/services/roomStore.ts` does not mark the creator as host. The "Start Game" button in `frontend/src/pages/LobbyPage.tsx` is visible and enabled for every participant with no host guard.

**Impact:** Scenarios 1 and 2 — host-only start and 2-player minimum cannot be enforced without identifying who the host is.

### 2. No lobby polling — only manual refresh

`frontend/src/pages/LobbyPage.tsx` has a "Refresh Room" button that calls `roomStore.fetchRoom()` on click but contains no `setInterval` or periodic effect. The existing `useEffect` only redirects away if there is no room in state; it never schedules automatic fetches.

**Impact:** Scenario 1 — the lobby must auto-refresh approximately every 2 seconds so joined players appear without manual action.

### 3. No start-game endpoint or flow

There is no `POST /rooms/:code/start` (or equivalent) endpoint in `backend/src/api/rooms.ts` or `backend/src/api/router.ts`. The "Start Game" button in `LobbyPage` simply calls `navigate("/game")` with no backend call, no precondition check, and no state transition.

**Impact:** Scenario 2 — the game cannot begin properly; there is nowhere to record drawer assignment, word selection, or the `"playing"` status on the room.

### 4. `RoomStatus` is limited to `"lobby"` only

`backend/src/models/game.ts` declares `type RoomStatus = "lobby"`. The frontend mirrors this in `frontend/src/services/api.ts`. There are no `"playing"` or `"finished"` states. Without additional statuses, the backend cannot signal that a round is active or that results are ready.

**Impact:** Scenarios 2, 3, and 4 — all post-lobby behavior depends on richer room status.

### 5. No game-round fields on the Room model

The `Room` interface has no fields for `drawerId`, `currentWord`, `guesses`, `scores`, or round state. The `RoomSnapshot` similarly carries only lobby-relevant data. The `toRoomSnapshot` function in `roomStore.ts` explicitly voids `viewerParticipantId` (line 101: `void viewerParticipantId`), meaning secret word visibility logic has not been written.

**Impact:** Scenarios 2, 3, and 4 — drawer identity, word, guesses, and scores must all be added to the model before any game logic can be built.

### 6. `GuessForm` submits nothing

`frontend/src/components/GuessForm.tsx` — the `handleSubmit` handler calls only `event.preventDefault()`. No API call is made, no validation runs, and the input value is never sent anywhere.

**Impact:** Scenario 3 — guess submission is entirely absent.

### 7. `Scoreboard` and `ResultPanel` are static placeholders

`frontend/src/components/Scoreboard.tsx` renders hardcoded "Waiting for players..." text and a static 0. `frontend/src/components/ResultPanel.tsx` renders a single static string. Neither component reads from any store or prop.

**Impact:** Scenarios 3 and 4 — live scores and guess history cannot be displayed without wiring these components to real state.

### 8. Canvas is a non-interactive div placeholder

`frontend/src/pages/GamePage.tsx` renders a plain `<div>` labelled "Waiting for drawer..." in place of a canvas element. There is no `<canvas>`, no drawing event handlers, no stroke data, and no clear-canvas action.

**Impact:** Scenario 3 — the drawing interaction is entirely absent.

### 9. Player name is not validated or trimmed

`backend/src/api/schemas.ts` declares `playerName` as `z.string().optional()` with no `trim()` or `min(1)` guard. `frontend/src/pages/CreateRoomPage.tsx` and `JoinRoomPage.tsx` submit whatever the user types, including empty strings. The backend falls back to the display name `"Player"` for empty input via `displayName()` in `roomStore.ts`, but it does not reject blank input with an error message.

**Impact:** Scenario 2 — the spec requires empty/whitespace-only names to be rejected with a clear message.

### 10. No result state or restart flow

There is no endpoint to transition a room to a finished state, no mechanism to persist the correct word and final scores for all participants to read, and no restart endpoint that clears round state while preserving the player list.

**Impact:** Scenario 4 — result display and clean restart are entirely absent.

### 11. `fetchRoom` bypasses `withLoading` in the frontend store

`frontend/src/state/roomStore.ts:92` — `fetchRoom()` calls `api.fetchRoom` directly, not through `withLoading`. As a result, `isLoading` stays `false` during a fetch, so the "Refreshing players..." label and disabled button state in `LobbyPage` never fire. When polling is added, fetch errors will also be unhandled unless the polling loop explicitly catches them.

**Impact:** Scenario 1 — the loading indicator is broken and polling errors will surface as unhandled promise rejections.

### 12. No room-status guard on `joinRoom`

`backend/src/services/roomStore.ts:70` — `joinRoom` only checks whether the room exists. Once `"playing"` and `"finished"` statuses are added to the model, mid-game joins will silently succeed and insert a phantom participant into an active round.

**Impact:** Scenarios 2–4 — a `room.status !== "lobby"` guard must be added alongside the status model changes.

### 13. `displayName` fallback allows duplicate `"Player"` names

`backend/src/services/roomStore.ts:32` — `displayName(name)` returns `"Player"` for any falsy input. If two participants submit blank names, both are stored as `"Player"`. The scoreboard and guess history cannot reliably associate scores with the correct individual.

**Impact:** Scenario 3 — ambiguous names in scores and guess history; compounds Gap 9 (no name validation) at the data layer.

### 14. ~~No leave or remove-participant mechanism~~ — moved to Out of Scope

### 15. Room code format is not validated on join

`backend/src/api/schemas.ts:11` — `roomCodeParamsSchema` accepts any string with no length or character constraint. A blank or malformed code passes validation, reaches `getRoom`, and returns a generic `"Unable to join room"` 404 — identical to the message for a valid-format but nonexistent code.

**Impact:** Scenario 1 — the spec requires "clear feedback" for invalid codes; the current error message gives no indication of whether the format or the existence is the problem.

---

## Assumptions

### A1. Host is the first participant (index 0)

Because the `Room` model has no `hostId` field yet, I assume the host is always `room.participants[0]` — the creator — until `hostId` is added to the model. The frontend will derive "is current player the host" by comparing `participantId` from store state to `room.participants[0].id`.

### A2. Page refresh clears session state (accepted)

The frontend stores `participantId` only in the in-memory `RoomStore` singleton (React context). A hard page refresh loses it. This is acceptable because persistent sessions are out of scope. Any player who refreshes must rejoin.

### A3. Word selection is deterministic via list index

The spec says the secret word is "deterministically selected from the starter list." I assume this means using the room code or participant count as a stable index into `STARTER_WORDS` — not `Math.random()` — so the same inputs always yield the same word. Exact seeding strategy will be confirmed during clarification.

### A4. Drawing is synced through backend polling, not canvas streaming

WebSockets are explicitly out of scope. For drawings to be visible to guessers, stroke data must be stored on the room object in the backend and fetched by guessers on the same ~2 s poll interval used for guesses. This means canvas drawing by the drawer will feel local but guessers will see updates on each poll tick.

### A5. Scores are per-participant totals accumulated on the backend

Each participant will carry a `score: number` field. The backend computes whether a guess is correct (case-insensitive trim comparison against `currentWord`) and increments score by 100. The frontend treats scores as read-only values received in the room snapshot.

### A6. `toRoomSnapshot` will need viewer-aware logic for the secret word

The `viewerParticipantId` parameter is already passed through to `toRoomSnapshot` but is deliberately voided. The intent is clearly for per-viewer filtering. When game state is added, the snapshot returned to the drawer will include `currentWord`; the snapshot returned to guessers will omit it.

---

## Out of Scope (Known Limitations)

### Leave / remove-participant

`frontend/src/pages/GamePage.tsx:71` — "Exit Game" navigates to `/lobby` with no API call. A player who navigates away or closes their tab remains in `room.participants` indefinitely, which can inflate the participant count used for the 2-player minimum check.

This is a known limitation but is not being implemented. A leave endpoint would constitute a participant-removal or moderation feature, which the README explicitly excludes. No leave behavior is required by any of the four business scenarios.

---

## Relevant Files

| File | Role |
|------|------|
| `backend/src/models/game.ts` | Core data types — `Room`, `RoomSnapshot`, `Participant`, `RoomStatus` — must be extended for game state |
| `backend/src/services/roomStore.ts` | All room mutations and queries; `toRoomSnapshot` viewer-aware filtering lives here |
| `backend/src/api/rooms.ts` | Express route handlers — new endpoints (start, guess, restart) added here |
| `backend/src/api/schemas.ts` | Zod validation schemas — needs stricter player name validation and new request schemas |
| `backend/src/api/router.ts` | Mounts the rooms router and error handlers |
| `backend/src/seed/starterData.ts` | `STARTER_WORDS` and `STARTER_ROLES` — source of truth for word list |
| `frontend/src/services/api.ts` | `RoomSnapshot` type mirror and all `fetch` calls — needs new methods and extended types |
| `frontend/src/state/roomStore.ts` | Frontend state store — needs polling setup and new action methods |
| `frontend/src/pages/LobbyPage.tsx` | Lobby UI — needs polling effect, host guard on Start button, min-player check |
| `frontend/src/pages/GamePage.tsx` | Game UI — needs canvas element, drawer/guesser branching, word display |
| `frontend/src/components/GuessForm.tsx` | Guess input — needs API call, validation, disable logic for drawer role |
| `frontend/src/components/Scoreboard.tsx` | Scores display — needs real participant score data from store |
| `frontend/src/components/ResultPanel.tsx` | Activity/result — needs guess history and final result state display |
| `frontend/src/pages/CreateRoomPage.tsx` | Room creation — needs trim + reject-empty name validation |
| `frontend/src/pages/JoinRoomPage.tsx` | Room join — needs trim + reject-empty name validation |
| `backend/src/services/roomStore.test.ts` | Existing backend unit tests — must remain passing |
| `frontend/src/services/api.test.ts` | Existing frontend API tests — must remain passing |
