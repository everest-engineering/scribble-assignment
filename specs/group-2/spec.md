# Feature Specification: Group 2 — Game Start & Drawer Flow

**Feature Branch**: `group-2-game-start-drawer`

**Created**: 2026-05-31

**Status**: Draft

---

## Current State (what already exists)

### Backend
- `Room.status` is typed as `"lobby"` only — no `"playing"` state exists yet
- No `POST /rooms/:code/start` endpoint exists
- `STARTER_WORDS = ["rocket", "pizza", "castle", "guitar", "sunflower"]` exists in `backend/src/seed/starterData.ts`
- `STARTER_ROLES: ParticipantRole[] = ["drawer", "guesser"]` exists but is never applied to participants
- `toRoomSnapshot()` returns `availableWords` and `roles` as static lists — not per-participant assignments
- `hostId` was added in Group 1; `Room` and `RoomSnapshot` both carry it

### Frontend
- `GamePage.tsx` renders a static canvas placeholder ("Waiting for drawer..."), a placeholder `Scoreboard`, a placeholder `ResultPanel`, and a non-functional `GuessForm`
- `GamePage` reads `room` and `participantId` from the store but does nothing with role or word info
- Start Game button in `LobbyPage` navigates directly to `/game` with no API call — no game state is set on the backend before navigation

### What is missing
- No backend concept of the game being "in progress"
- No drawer assignment (who draws is never set)
- No word selection (which word is active is never set)
- No role surfacing per-participant in the snapshot
- The frontend never shows the drawer who they are or what word to draw

---

## User Scenarios & Testing

### User Story 1 — Host Starts the Game (Priority: P1)

The host clicks Start Game. The frontend calls `POST /rooms/:code/start`. The backend transitions the room to `"playing"` status, assigns the first participant as drawer, and selects the first word from `STARTER_WORDS` deterministically. The response carries the updated room snapshot. The frontend navigates both participants to `/game`.

**Why this priority**: Nothing in Group 2 works without a started game. This is the entry point for the entire drawer flow.

**Independent Test**: Two-tab session. Tab A (host) clicks Start Game. Confirm the backend room transitions to `status: "playing"`, `drawerParticipantId` is set to Alice's id, and `currentWord` is `"rocket"`. Both tabs navigate to `/game`.

**Acceptance Scenarios**:

1. **Given** a lobby with ≥2 participants and the host's session, **When** the host clicks Start Game, **Then** `POST /rooms/:code/start` is called with the host's `participantId`.
2. **Given** `POST /rooms/:code/start`, **When** the room has ≥2 participants, **Then** the response is `200` with a `RoomSnapshot` where `status === "playing"`, `drawerParticipantId` equals the first participant's id, and `currentWord` is `"rocket"` (index 0 of `STARTER_WORDS`).
3. **Given** `POST /rooms/:code/start`, **When** the room has fewer than 2 participants, **Then** the response is `400` with a clear message.
4. **Given** `POST /rooms/:code/start`, **When** the caller's `participantId` does not match `room.hostId`, **Then** the response is `403` with a clear message.
5. **Given** `POST /rooms/:code/start`, **When** the room is already `"playing"`, **Then** the response is `409` with a clear message.
6. **Given** a successful start, **When** the frontend receives the response, **Then** it updates the room store snapshot and navigates to `/game`.

---

### User Story 2 — Drawer Sees Their Role and Secret Word (Priority: P1)

On the game screen, the drawer sees a banner identifying them as the drawer and the secret word they must draw. Other participants do not see the word.

**Why this priority**: Without this, the game is unplayable — the drawer has nothing to draw.

**Independent Test**: After start, Tab A (Alice, drawer) sees "You are the Drawer" and the word "rocket". Tab B (Bob, guesser) sees "You are a Guesser" and no word — the word field is absent from their snapshot.

**Acceptance Scenarios**:

1. **Given** a started game, **When** `GET /rooms/:code?participantId=<drawerId>` is called, **Then** `RoomSnapshot.currentWord` is `"rocket"` and `RoomSnapshot.viewerRole` is `"drawer"`.
2. **Given** a started game, **When** `GET /rooms/:code?participantId=<guesserId>` is called, **Then** `RoomSnapshot.currentWord` is `null` (word is hidden) and `RoomSnapshot.viewerRole` is `"guesser"`.
3. **Given** the game screen with `viewerRole === "drawer"`, **When** the page renders, **Then** a drawer banner is shown ("You are the Drawer — draw: rocket") and `GuessForm` is disabled.
4. **Given** the game screen with `viewerRole === "guesser"`, **When** the page renders, **Then** a guesser banner is shown ("You are a Guesser — guess the word!") and `GuessForm` is enabled.
5. **Given** the game screen, **When** any participant views it, **Then** the drawer's name is visible to all (e.g., "Alice is drawing").

---

### User Story 3 — GamePage Polls for Live State (Priority: P2)

The game screen polls `GET /rooms/:code` every 2 seconds (same pattern as the lobby) so that when state changes (future groups), all participants stay in sync without manual action.

**Why this priority**: Consistent polling is required for the guess/scoring flow in Group 3. Establishing it here means Group 3 has nothing to wire up.

**Independent Test**: Open DevTools Network tab on the game screen. Confirm a `GET /rooms/:code` request fires every ~2 seconds. Navigate away; confirm requests stop.

**Acceptance Scenarios**:

1. **Given** the game screen mounts, **When** `room` is not null, **Then** a `setInterval` polling loop starts at 2000 ms calling `roomStore.fetchRoom()`.
2. **Given** the game screen, **When** the component unmounts (e.g., Exit Game clicked), **Then** `clearInterval` is called and polling stops.

---

### Edge Cases

- **Room not found on start**: `POST /rooms/:code/start` with an unknown code returns `404`.
- **Non-host tries to start**: returns `403` — the error is shown to the user on the lobby, not silently swallowed.
- **Start called twice**: second call returns `409`; the room state does not change.
- **Word selection is deterministic**: always `STARTER_WORDS[0]` (`"rocket"`) for the first round — no randomness, no index tracking needed for this group.
- **`viewerParticipantId` not supplied on GET**: `currentWord` is `null` and `viewerRole` is `null` — safe default for unauthenticated polling.
- **Drawer's `GuessForm`**: disabled when `viewerRole === "drawer"`. The `GuessForm` component already accepts a `disabled` prop — use it.

---

## Requirements

### Functional Requirements

**Backend**

- **FR-001**: `RoomStatus` type in `backend/src/models/game.ts` MUST be extended to `"lobby" | "playing"`.
- **FR-002**: `Room` interface MUST add `drawerParticipantId: string | null` and `currentWord: string | null`.
- **FR-003**: `RoomSnapshot` interface MUST add `drawerParticipantId: string`, `currentWord: string | null`, and `viewerRole: ParticipantRole | null`.
- **FR-004**: `startRoomSchema` MUST be added to `backend/src/api/schemas.ts`: `{ participantId: z.string().trim().min(1) }` in the request body.
- **FR-005**: `POST /rooms/:code/start` route MUST be added to `backend/src/api/rooms.ts`.
- **FR-006**: `startGame(code, participantId)` function MUST be added to `backend/src/services/roomStore.ts`. It MUST:
  - Return `{ code: "NOT_FOUND" }` if the room does not exist.
  - Return `{ code: "FORBIDDEN" }` if `participantId !== room.hostId`.
  - Return `{ code: "CONFLICT" }` if `room.status === "playing"`.
  - Return `{ code: "BAD_REQUEST" }` if `room.participants.length < 2`.
  - Otherwise set `room.status = "playing"`, `room.drawerParticipantId = room.participants[0].id`, `room.currentWord = STARTER_WORDS[0]`, save, and return `{ code: "OK", room }`.
- **FR-007**: The route handler MUST translate the result codes to HTTP: `NOT_FOUND → 404`, `FORBIDDEN → 403`, `CONFLICT → 409`, `BAD_REQUEST → 400`, `OK → 200`.
- **FR-008**: `toRoomSnapshot(room, viewerParticipantId?)` MUST be updated to:
  - Always include `drawerParticipantId: room.drawerParticipantId ?? null`.
  - Include `currentWord: room.currentWord` only when `viewerParticipantId === room.drawerParticipantId`; otherwise `currentWord: null`.
  - Include `viewerRole: "drawer"` when viewer is the drawer, `"guesser"` when viewer is any other participant, `null` when `viewerParticipantId` is absent.

**Frontend**

- **FR-009**: `RoomSnapshot` in `frontend/src/services/api.ts` MUST add `drawerParticipantId: string | null`, `currentWord: string | null`, and `viewerRole: "drawer" | "guesser" | null`. The `status` field MUST be widened to `"lobby" | "playing"`.
- **FR-010**: `api.startGame(code, participantId)` MUST be added to `frontend/src/services/api.ts`: `POST /rooms/:code/start` with body `{ participantId }`, returning `RoomSessionResponse`.
- **FR-011**: `LobbyPage.tsx` Start Game `onClick` MUST call `api.startGame`, update the room store via `roomStore.setRoomSession(response)`, then navigate to `/game`. Any error MUST be displayed to the user.
- **FR-012**: `GamePage.tsx` MUST add a `setInterval` polling loop (2000 ms) with `clearInterval` cleanup on unmount, identical in structure to `LobbyPage`'s polling.
- **FR-013**: `GamePage.tsx` MUST derive `viewerRole` from `room.viewerRole` and render:
  - When `"drawer"`: a banner "You are the Drawer — draw: {room.currentWord}" and `<GuessForm disabled />`.
  - When `"guesser"`: a banner "You are a Guesser — guess the word!" and `<GuessForm />` (enabled).
  - The drawer's name MUST be shown to all: read from `room.participants.find(p => p.id === room.drawerParticipantId)?.name`.

### Key Entities

- **Room** (extended): adds `drawerParticipantId: string | null`, `currentWord: string | null`. `status` widens to `"lobby" | "playing"`.
- **RoomSnapshot** (extended): adds `drawerParticipantId: string | null`, `currentWord: string | null`, `viewerRole: ParticipantRole | null`.
- **`startRoomSchema`** (new): Zod schema for `POST /rooms/:code/start` body.

---

## Implementation Notes (per file)

### `backend/src/models/game.ts`
```typescript
// Widen RoomStatus:
export type RoomStatus = "lobby" | "playing";

// Add to Room:
drawerParticipantId: string | null;
currentWord: string | null;

// Add to RoomSnapshot:
drawerParticipantId: string | null;
currentWord: string | null;
viewerRole: ParticipantRole | null;
```

### `backend/src/services/roomStore.ts`
- In `createRoom()`: set `drawerParticipantId: null, currentWord: null` in the room literal (required by the updated interface — TypeScript will enforce this).
- Add `startGame()` function as described in FR-006. Use a discriminated result object (`{ code: "OK" | "NOT_FOUND" | ... }`) rather than throwing — lets the route handler control HTTP status cleanly.
- In `toRoomSnapshot()`: map `drawerParticipantId`, `currentWord` (gated by viewer), and `viewerRole` as described in FR-008.

### `backend/src/api/schemas.ts`
```typescript
export const startRoomSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID is required")
});
```

### `backend/src/api/rooms.ts`
Add route after the existing `POST /:code/join`:
```typescript
router.post("/:code/start", (request, response, next) => {
  try {
    const { code } = roomCodeParamsSchema.parse(request.params);
    const { participantId } = startRoomSchema.parse(request.body);
    const result = startGame(code.toUpperCase(), participantId);
    // translate result.code → HTTP status
  } catch (error) {
    next(error);
  }
});
```

### `frontend/src/services/api.ts`
- Add `drawerParticipantId: string | null`, `currentWord: string | null`, `viewerRole: "drawer" | "guesser" | null` to local `RoomSnapshot`.
- Widen `status` to `"lobby" | "playing"`.
- Add `startGame(code: string, participantId: string)` returning `Promise<RoomSessionResponse>`.

### `frontend/src/pages/LobbyPage.tsx`
Replace the Start Game `onClick` (currently `() => navigate("/game")`) with an async handler:
```typescript
async function handleStartGame() {
  try {
    const response = await api.startGame(room.code, participantId);
    roomStore.setRoomSession(response);
    navigate("/game");
  } catch (err) {
    // surface error to user
  }
}
```

### `frontend/src/pages/GamePage.tsx`
- Add `setInterval` polling (same pattern as `LobbyPage`).
- Derive role UI from `room.viewerRole` and `room.drawerParticipantId`.
- Pass `disabled={room.viewerRole === "drawer"}` to `<GuessForm />`.

---

## Success Criteria

- **SC-001**: `POST /rooms/:code/start` with a valid host session and ≥2 participants returns `200` with `room.status === "playing"`, `room.drawerParticipantId === participants[0].id`, `room.currentWord === "rocket"`.
- **SC-002**: The drawer's `GET /rooms/:code?participantId=<drawerId>` returns `currentWord: "rocket"` and `viewerRole: "drawer"`.
- **SC-003**: A guesser's `GET /rooms/:code?participantId=<guesserId>` returns `currentWord: null` and `viewerRole: "guesser"`.
- **SC-004**: Non-host calling start returns `403`; fewer-than-2-participant room returns `400`; already-playing room returns `409`.
- **SC-005**: Game screen shows drawer banner with word to the drawer; guesser banner (no word) to others. Drawer's `GuessForm` is disabled.
- **SC-006**: All participants' names visible on the game screen; drawer's name highlighted as the active drawer.
- **SC-007**: `npm run build` passes with zero TypeScript errors on both frontend and backend.
- **SC-008**: `npm test` passes with no regressions on both.

---

## Assumptions

- Word selection is `STARTER_WORDS[0]` (`"rocket"`) always — no randomness, no index progression between rounds. This is intentional for Group 2; multi-round rotation is out of scope.
- Drawer is always `participants[0]` (the room creator / host) — no rotation.
- `RoomSnapshot.status` is widened to `"lobby" | "playing"` on the frontend. The `LobbyPage` guard (`room.status === "lobby"`) does not need updating for this group since the lobby is only visible before start.
- The `void viewerParticipantId` placeholder removed in Group 1 — `toRoomSnapshot` now needs to actively use `viewerParticipantId` to gate `currentWord`.

---

## Out of Scope for This Group

- Canvas drawing interaction (Group 3)
- Guess submission, guess history, scoring (Group 3–4)
- Results panel, round end, restart flow (Group 4)
- Drawer rotation across multiple rounds
- Timer or time-limited rounds
