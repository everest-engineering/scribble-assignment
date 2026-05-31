# Feature Specification: Group 4 — Results, Restart & Final Validation

**Feature Branch**: `group-4-results-restart`

**Created**: 2026-05-31

**Status**: Draft

---

## Current State (what already exists)

### Backend
- `RoomStatus = "lobby" | "playing"` — no `"results"` state
- `Room` carries: `guesses[]`, `scores`, `currentWord`, `drawerParticipantId`, `hostId`, `participants[]`
- No `POST /rooms/:code/end` endpoint
- No `POST /rooms/:code/restart` endpoint
- `toRoomSnapshot()` already exposes all data needed for a results screen (guesses, scores, currentWord, participants)

### Frontend
- Routes: `/`, `/create-room`, `/join-room`, `/lobby`, `/game` — no `/results` route
- `GamePage.tsx` has an "Exit Game" button that navigates to `/lobby` — no "End Game" button
- `LobbyPage.tsx` polls every 2 s and navigates to `/game` when `room.status === "playing"` — needs equivalent for `"results"`
- `GamePage.tsx` polls every 2 s — needs equivalent navigation to `/results` when `room.status === "results"`
- No `ResultsPage` component exists

### What is missing
- `"results"` status in the type system
- `POST /rooms/:code/end` endpoint (host-only, transitions `"playing"` → `"results"`)
- `POST /rooms/:code/restart` endpoint (host-only, resets round state, transitions back to `"lobby"`)
- `/results` route and `ResultsPage` component
- Status-driven navigation: `"results"` triggers forward from game screen; `"lobby"` after restart triggers return

---

## User Scenarios & Testing

### User Story 1 — Host Ends the Game (Priority: P1)

The host clicks "End Game" on the game screen. The frontend calls `POST /rooms/:code/end`. The backend transitions the room to `"results"` status. All polling participants receive the updated snapshot and navigate to `/results` automatically.

**Why this priority**: Without an end trigger, the results screen is unreachable.

**Independent Test**: Two-tab session in `"playing"` state. Tab A (host) clicks End Game. Within ≤4 s, both tabs navigate to `/results`.

**Acceptance Scenarios**:

1. **Given** a room in `"playing"` status and the host's participantId, **When** `POST /rooms/:code/end` is called, **Then** `room.status` becomes `"results"` and the response is `200` with the updated snapshot.
2. **Given** `POST /rooms/:code/end`, **When** the caller is not the host, **Then** the response is `403`.
3. **Given** `POST /rooms/:code/end`, **When** the room is not in `"playing"` status, **Then** the response is `409`.
4. **Given** `POST /rooms/:code/end`, **When** the room code does not exist, **Then** the response is `404`.
5. **Given** the host clicks End Game and the call succeeds, **When** the frontend receives the response, **Then** it updates the store and navigates to `/results`.
6. **Given** a non-host participant's polling loop, **When** the snapshot's `status` becomes `"results"`, **Then** `GamePage` navigates to `/results` automatically.

---

### User Story 2 — All Players See the Results Screen (Priority: P1)

On `/results`, all participants see: the correct word, final scores (sorted descending), and the full guess history for the round.

**Why this priority**: The results screen is the payoff of the round — every player needs to see who won and what the word was.

**Independent Test**: After end, both Tab A and Tab B are on `/results`. Confirm the correct word ("rocket") is shown, Alice's score and Bob's score are displayed, and all guesses from the round appear.

**Acceptance Scenarios**:

1. **Given** a participant on `/results`, **When** the page renders, **Then** `room.currentWord` is displayed as the revealed word.
2. **Given** a participant on `/results`, **When** the page renders, **Then** all participants are shown with their final scores, sorted descending.
3. **Given** a participant on `/results`, **When** the page renders, **Then** the full `room.guesses` list is rendered (participant name, guess text, correct/incorrect, score).
4. **Given** a non-host on `/results`, **When** the page renders, **Then** no "Play Again" button is shown; a "Waiting for host to restart..." message is shown instead.
5. **Given** the host on `/results`, **When** the page renders, **Then** a "Play Again" button is shown.
6. **Given** `/results` is accessed without a room in the store, **When** the page renders, **Then** it redirects to `/`.

---

### User Story 3 — Host Restarts the Game (Priority: P1)

The host clicks "Play Again". The frontend calls `POST /rooms/:code/restart`. The backend resets all round state while preserving participants, then transitions to `"lobby"` status. All participants navigate back to `/lobby` via status-driven polling.

**Why this priority**: Without restart, the game is single-use per session.

**Independent Test**: Host clicks Play Again. Backend room has: `status: "lobby"`, `guesses: []`, `scores: {}`, `currentWord: null`, `drawerParticipantId: null`. Both tabs navigate to `/lobby` within ≤4 s. Participant list is unchanged.

**Acceptance Scenarios**:

1. **Given** a room in `"results"` status and the host's participantId, **When** `POST /rooms/:code/restart` is called, **Then** `room.status` becomes `"lobby"`, `guesses` is `[]`, `scores` is `{}`, `currentWord` is `null`, `drawerParticipantId` is `null`.
2. **Given** `POST /rooms/:code/restart`, **When** the caller is not the host, **Then** the response is `403`.
3. **Given** `POST /rooms/:code/restart`, **When** the room is not in `"results"` status, **Then** the response is `409`.
4. **Given** `POST /rooms/:code/restart`, **When** the room code does not exist, **Then** the response is `404`.
5. **Given** the host clicks Play Again and the call succeeds, **When** the frontend receives the response, **Then** it updates the store and navigates to `/lobby`.
6. **Given** a non-host participant on `/results` polling, **When** the snapshot's `status` becomes `"lobby"`, **Then** the page navigates to `/lobby` automatically.
7. **Given** the lobby after a restart, **When** any participant views it, **Then** participant names are unchanged and the Start Game button works for a new round.

---

### Edge Cases

- **End called on non-playing room**: `409` — cannot end a lobby or already-ended room.
- **Restart called on non-results room**: `409` — cannot restart a playing or lobby room.
- **Non-host calls end or restart**: `403` in both cases.
- **`/results` without room state**: redirects to `/` (same guard as `/lobby` and `/game`).
- **Polling on `/results`**: results page must poll every 2 s so the host's restart propagates to other participants via status change to `"lobby"`.
- **`currentWord` on results screen**: always shown to all — there is no word-gating in `"results"` status; `toRoomSnapshot` should return `currentWord` unconditionally when `status === "results"`.

---

## Requirements

### Functional Requirements

**Backend — Data Model**

- **FR-001**: Widen `RoomStatus` in `backend/src/models/game.ts` to `"lobby" | "playing" | "results"`.

**Backend — Service**

- **FR-002**: Add `endGame(code, participantId)` to `roomStore.ts`:
  - `NOT_FOUND` if room absent.
  - `FORBIDDEN` if `participantId !== room.hostId`.
  - `CONFLICT` if `room.status !== "playing"`.
  - Otherwise set `room.status = "results"`, `saveRoom(room)`, return `{ code: "OK", room }`.
- **FR-003**: Add `restartGame(code, participantId)` to `roomStore.ts`:
  - `NOT_FOUND` if room absent.
  - `FORBIDDEN` if `participantId !== room.hostId`.
  - `CONFLICT` if `room.status !== "results"`.
  - Otherwise reset: `status = "lobby"`, `drawerParticipantId = null`, `currentWord = null`, `guesses = []`, `scores = {}`. Preserve `participants`, `hostId`, `code`. `saveRoom(room)`, return `{ code: "OK", room }`.
- **FR-004**: Update `toRoomSnapshot()` to return `currentWord: room.currentWord` unconditionally when `room.status === "results"` (all players see the word on the results screen). Existing gating for `"playing"` is unchanged.

**Backend — Routes & Schemas**

- **FR-005**: Add `endRoomSchema` and `restartRoomSchema` to `schemas.ts` — both are `{ participantId: z.string().trim().min(1) }` (same shape as `startRoomSchema`; add as distinct named exports).
- **FR-006**: Add `POST /rooms/:code/end` to `rooms.ts`. Translates: `NOT_FOUND → 404`, `FORBIDDEN → 403`, `CONFLICT → 409`, `OK → 200` with `{ participantId, room: toRoomSnapshot(result.room, participantId) }`.
- **FR-007**: Add `POST /rooms/:code/restart` to `rooms.ts`. Same translation table.

**Frontend — Types**

- **FR-008**: Widen `status` in the local `RoomSnapshot` in `api.ts` to `"lobby" | "playing" | "results"`.
- **FR-009**: Add `api.endGame(code, participantId)` returning `Promise<RoomSessionResponse>`.
- **FR-010**: Add `api.restartGame(code, participantId)` returning `Promise<RoomSessionResponse>`.

**Frontend — Routing**

- **FR-011**: Add `/results` route to `frontend/src/routes/index.tsx` pointing to a new `ResultsPage` component.
- **FR-012**: Create `frontend/src/pages/ResultsPage.tsx` (new file — plan explicitly requires it).

**Frontend — Navigation (status-driven)**

- **FR-013**: In `GamePage.tsx`, add a `useEffect` watching `room?.status` that navigates to `/results` when it becomes `"results"`. Pattern is identical to `LobbyPage`'s `"playing"` watcher.
- **FR-014**: In `GamePage.tsx`, replace the "Exit Game" button with an "End Game" button visible only to the host (`isHost = participantId === room.hostId`). Clicking it calls `api.endGame`, updates store, navigates to `/results`. Non-host sees no button (or a disabled placeholder).
- **FR-015**: In `ResultsPage.tsx`, add a `useEffect` watching `room?.status` that navigates to `/lobby` when it becomes `"lobby"` (for non-host participants after host restarts) and to `/` when `room` is null.
- **FR-016**: `ResultsPage` polls every 2 s (same `setInterval`/`clearInterval` pattern).

**Frontend — ResultsPage UI**

- **FR-017**: `ResultsPage` displays the revealed word: `"The word was: {room.currentWord}"`.
- **FR-018**: `ResultsPage` renders `<Scoreboard>` with `room.scores` and `room.participants`.
- **FR-019**: `ResultsPage` renders `<ResultPanel>` with `room.guesses`.
- **FR-020**: Host sees a "Play Again" button that calls `api.restartGame`, updates store via `roomStore.setRoomSession`, navigates to `/lobby`.
- **FR-021**: Non-host sees "Waiting for host to restart..." text instead of the button.

### Key Entities

- **`RoomStatus`** (extended): `"lobby" | "playing" | "results"`
- **`endGame()`** (new service function): transitions `"playing"` → `"results"`
- **`restartGame()`** (new service function): resets round state, transitions `"results"` → `"lobby"`
- **`ResultsPage`** (new component): the only new file in this group

---

## Implementation Notes (per file)

### `backend/src/models/game.ts`
```typescript
export type RoomStatus = "lobby" | "playing" | "results";
```

### `backend/src/services/roomStore.ts`
- Add `endGame()` and `restartGame()` per FR-002 and FR-003.
- Update `toRoomSnapshot()`: add a `status === "results"` branch that returns `currentWord: room.currentWord` regardless of `viewerParticipantId`.

### `backend/src/api/schemas.ts`
```typescript
export const endRoomSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID is required")
});
export const restartRoomSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID is required")
});
```

### `backend/src/api/rooms.ts`
Add two routes after `POST /:code/start`. Import `endGame`, `restartGame`, `endRoomSchema`, `restartRoomSchema`.

### `frontend/src/services/api.ts`
Widen `status`; add `endGame()` and `restartGame()`.

### `frontend/src/routes/index.tsx`
Add `<Route path="/results" element={<ResultsPage />} />` before the wildcard.

### `frontend/src/pages/ResultsPage.tsx` (new file)
- Guard: redirect to `/` if no room.
- Poll every 2 s.
- Watch `room.status`: navigate to `/lobby` when `"lobby"`, to `/results` when already there (no-op).
- Render: word reveal, `<Scoreboard>`, `<ResultPanel>`, host/non-host button.

### `frontend/src/pages/GamePage.tsx`
- Add `useEffect` watching `room?.status === "results"` → navigate to `/results`.
- Replace "Exit Game" with "End Game" (host only); add `endError` state.

---

## Success Criteria

- **SC-001**: Host clicks End Game → `POST /rooms/:code/end` → `room.status === "results"`.
- **SC-002**: Within ≤4 s both tabs navigate to `/results`.
- **SC-003**: Results screen shows correct word, final scores, full guess history for all participants.
- **SC-004**: Non-host sees "Waiting for host to restart..." — no Play Again button.
- **SC-005**: Host clicks Play Again → `POST /rooms/:code/restart` → room resets to `"lobby"` with players preserved and all round state cleared.
- **SC-006**: Within ≤4 s both tabs navigate to `/lobby`. Start Game button is available for a new round.
- **SC-007**: End called by non-host → `403`. Restart called on non-results room → `409`.
- **SC-008**: `npm run build` passes with zero TypeScript errors on both packages.
- **SC-009**: `npm test` passes with no regressions.

---

## Assumptions

- `currentWord` is shown unconditionally on the results screen — no gating by viewer identity. The round is over; the word is revealed to all.
- `participants` list is fully preserved through restart — no re-join required.
- `hostId` is preserved through restart — same player remains host.
- The `"results"` status is a terminal state per round; the only exit is `restartGame()`.
- `ResultsPage` is the only new file — `Scoreboard` and `ResultPanel` are reused as-is (they already accept the right props).

---

## Out of Scope

- Automatic round end on correct guess
- Multiple rounds with automatic drawer rotation
- Timers or auto-end
- Persistent leaderboard across sessions
