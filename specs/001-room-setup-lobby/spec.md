# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Scenario 1 — Room Setup & Lobby: Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Host Creates a Room (Priority: P1)

A player opens the app, enters a non-empty name, and creates a new room. The system generates a unique room code and records the creator as the host. The player is taken to the lobby and can see themselves listed as a participant.

**Why this priority**: All other stories depend on a room existing. Without this, no one can join or start a game. It is the entry point for the entire feature.

**Independent Test**: Open the app in one browser tab, fill in a player name, click "Create and Continue", confirm you land on the Lobby screen, see your name in the participant list, and see a 4-character room code displayed.

**Acceptance Scenarios**:

1. **Given** a player enters a non-empty, non-whitespace-only name and submits the create form, **When** the server processes the request, **Then** a room is created with a unique 4-character code, the player is recorded as a participant, and the response includes a `participantId` and the full room snapshot.
2. **Given** the room is created, **When** the creator's lobby loads, **Then** the creator is identified as the host (a `hostId` field on the room equals the creator's `participantId`).
3. **Given** a player submits the create form with an empty or whitespace-only name, **When** the form is validated, **Then** the submission is blocked with a clear inline error message and no API call is made.

---

### User Story 2 — Guest Joins a Room by Code (Priority: P1)

A second player enters their name and a valid room code shared by the host. The system adds them as a participant. Both host and guest can see each other in the participant list after the lobby refreshes.

**Why this priority**: Multi-player requires at least two participants. This story is the foundation of the room-isolation guarantee and is needed before the start-game gate (≥2 players) can be enforced.

**Independent Test**: Open two browser tabs. Create a room in tab 1 and note the code. In tab 2, enter a different name and that code, click "Join Lobby". Both tabs should eventually show both names in the participant list after a lobby refresh.

**Acceptance Scenarios**:

1. **Given** a guest enters a non-empty name and a valid, existing room code, **When** they submit the join form, **Then** the server adds them as a participant and returns a `participantId` plus the updated room snapshot.
2. **Given** a guest submits the join form with an empty or whitespace-only name, **When** the form is validated, **Then** the submission is blocked with a clear inline error message and no API call is made.
3. **Given** a guest enters a code that does not correspond to any existing room, **When** they submit the join form, **Then** the server returns a 404-equivalent error and the UI displays a clear message such as "Room not found".
4. **Given** a guest enters an empty or whitespace-only code, **When** the form is validated, **Then** the submission is blocked with a clear inline error message and no API call is made.
5. **Given** two rooms A and B exist simultaneously, **When** a player joins room A, **Then** room B is unaffected — its participant list, host, and status remain unchanged.
6. **Given** a player attempts to join a room whose status is `"playing"`, **When** they submit the join form, **Then** the server rejects the request with a clear error and the UI displays a message such as "Game already in progress".

---

### User Story 3 — Lobby Auto-Refreshes via Polling (Priority: P2)

While waiting in the lobby, a player's participant list updates automatically without any manual action. New joiners appear within approximately 2 seconds of joining.

**Why this priority**: Without polling, players cannot see when others arrive, making the "minimum 2 players" start-game gate invisible. This is what makes the lobby feel live.

**Independent Test**: Open two tabs. Create a room in tab 1. Join from tab 2. Within 2 seconds, the host's lobby in tab 1 should show the new joiner without any button click.

**Acceptance Scenarios**:

1. **Given** a player is on the Lobby page, **When** another player joins the same room, **Then** within approximately 2 seconds the first player's participant list updates to include the newcomer — without any manual refresh action.
2. **Given** the Lobby page is mounted, **When** the polling interval fires, **Then** the frontend calls `GET /api/rooms/:code` and updates the participant list if the data has changed.
3. **Given** the Lobby page is unmounted (navigated away), **When** the polling interval would have fired, **Then** no further API calls are made (interval is cleared on unmount).
4. **Given** a polling request fails (network error or server error), **When** the error occurs, **Then** the client clears the polling interval and immediately redirects the player to `/` (the start page).

---

### User Story 4 — Only the Host Can Start the Game (Priority: P2)

The "Start Game" button is visible only to the host and is enabled only when at least 2 players are present. Non-host participants see no start control. Clicking "Start Game" triggers a server-side state transition.

**Why this priority**: Prevents accidental or unauthorised game starts. Depends on US1 (host tracking) and US2 (≥2 players).

**Independent Test**: Create a room in tab 1 (host). Join from tab 2 (guest). Verify that tab 2 shows no "Start Game" button. In tab 1, confirm the button is disabled with only 1 player present, then becomes enabled once tab 2 has joined and the lobby has polled. Click start in tab 1 and confirm both tabs transition away from the lobby.

**Acceptance Scenarios**:

1. **Given** the host is on the Lobby page with only 1 participant (themselves), **When** the lobby renders, **Then** the "Start Game" button is visible but disabled, with a tooltip or helper text indicating more players are needed.
2. **Given** the host is on the Lobby page with 2 or more participants, **When** the lobby renders, **Then** the "Start Game" button is enabled and clickable.
3. **Given** a non-host participant is on the Lobby page, **When** the lobby renders, **Then** no "Start Game" button or equivalent control is visible or accessible to them.
4. **Given** the host clicks the enabled "Start Game" button, **When** the server processes the request, **Then** the room status transitions from `"lobby"` to `"playing"` and all clients polling the room eventually detect the new status and navigate to the same `/game` route, regardless of whether they are the host or a guest.

---

### Edge Cases

- What happens when the room code is entered in lowercase? → The backend normalises to uppercase; the frontend should also uppercase input before submitting.
- What happens when a player navigates directly to `/lobby` without creating or joining a room? → They are redirected to `/` (already implemented in the starter).
- What happens if the host closes their tab while guests are in the lobby? → The host's participant record remains; no automatic host reassignment is in scope for this scenario.
- What happens if two players create rooms simultaneously and receive the same code? → The code generator retries on collision; simultaneous creation should still yield distinct codes.
- What happens when the server is restarted? → All rooms are lost; all players should be gracefully redirected to the start page on their next poll failure.
- What happens if many players join the same room? → There is no participant cap; any number of players may join a room.
- What happens if a player tries to join a room that has already started? → The server rejects the join with a clear error ("Game already in progress"); the UI displays the message without crashing.

## Functional Requirements

1. **FR-1 Player name validation**: Player name must be trimmed before use; a name that is empty or whitespace-only after trimming MUST be rejected with an inline error message before any API call is made.
2. **FR-2 Host assignment**: The participant who creates a room is the host. The room MUST store a `hostId` equal to the creator's `participantId`. This field MUST be included in the room snapshot returned by the API.
3. **FR-3 Unique room codes**: Room codes are 4 characters drawn from an unambiguous alphabet. The backend MUST retry on collision to guarantee uniqueness within the active set of rooms.
4. **FR-4 Room isolation**: Creating, joining, and modifying one room MUST have no side effects on any other room.
5. **FR-5 Join validation**: The join endpoint MUST return a 404-equivalent error for unknown codes. The UI MUST display a clear human-readable message.
6. **FR-6 Lobby polling**: The Lobby page MUST start polling `GET /api/rooms/:code` at approximately 2-second intervals on mount and MUST clear the interval on unmount. If any single poll request fails (network error or non-OK HTTP response), the client MUST clear the interval and redirect to `/`.
7. **FR-7 Host-only start gate**: The "Start Game" button MUST only be rendered for the host (determined by comparing `participantId` from store state to `room.hostId`). It MUST be disabled when `room.participants.length < 2`.
8. **FR-8 Room status transition**: Clicking "Start Game" MUST trigger a server-side status change from `"lobby"` to `"playing"`. The backend MUST expose an endpoint for this action. The backend does NOT validate that the caller is the host; host-only enforcement is handled exclusively by the frontend (FR-7).
9. **FR-9 Client-side status routing**: When a lobby-polling response returns `status: "playing"`, the client MUST automatically navigate to `/game`. This applies to all participants — host and guests use the same route.
10. **FR-10 Late-join rejection**: The join endpoint MUST reject requests for rooms whose status is not `"lobby"`. The server MUST return an error response and the UI MUST display a human-readable message such as "Game already in progress".

## Success Criteria

1. A player can create a room and land in the lobby within 5 seconds of submitting the form.
2. A second player can join using only the room code and see the lobby within 5 seconds.
3. A new joiner appears in the host's participant list within 3 seconds — without any manual action — when the lobby is open.
4. Attempting to join with a blank name or invalid code produces a clear, human-readable error; no blank or crash screens are shown.
5. The host's "Start Game" button transitions from disabled to enabled the moment a second player joins and the lobby polls.
6. Non-host participants have no visible or accessible way to start the game.
7. Two independently created rooms share no data: joining one room has no effect on the other's participant list or status.
8. When the lobby is navigated away from, no further polling requests appear in the network inspector.

## Assumptions

1. Player names are stored as provided (after trimming) — no uniqueness constraint within a room is required for this scenario.
2. There is no maximum participant limit per room; any number of players may join.
3. A participant's host status never changes during a session — no host-reassignment or host-transfer flow is in scope.
4. Room codes are treated as case-insensitive. The backend uppercases on lookup; the UI uppercases on input.
5. The polling interval of ~2 seconds is a fixed constant for now; no user-configurable or dynamic back-off is needed.
6. "Start Game" triggers a status transition only — drawer assignment and word selection are deferred to Scenario 2.
7. The existing `GET /api/rooms/:code` endpoint is sufficient for polling; no separate "delta" or "events" endpoint is needed.
8. The `RoomStatus` type must be extended to include `"playing"` (and eventually `"finished"`) as part of implementing FR-8.

## Key Entities

| Entity              | New / Modified | Key Changes                                 |
| ------------------- | -------------- | ------------------------------------------- |
| `Room`              | Modified       | Add `hostId: string` field                  |
| `RoomStatus`        | Modified       | Add `"playing"` value                       |
| `RoomSnapshot`      | Modified       | Expose `hostId` in snapshot                 |
| Lobby polling       | New            | `setInterval` in `LobbyPage` or `RoomStore` |
| Start game endpoint | New            | `POST /api/rooms/:code/start`               |

## Clarifications

### Session 2026-06-03

- Q: When a lobby polling request fails, should the client redirect immediately or only after N consecutive failures? → A: Any single failure immediately redirects to `/` (the start page); no retry tolerance.
- Q: Should the backend validate that the caller is the host before processing `POST /api/rooms/:code/start`? → A: No — frontend-only enforcement; the backend transitions the room for any caller.
- Q: Is there a maximum number of players allowed to join a single room? → A: No cap — unlimited players may join.
- Q: When polling detects `status: "playing"`, do all players navigate to the same route? → A: Yes — all players (host and guests) navigate to the same `/game` route.
- Q: What happens when a player tries to join a room that is already in `"playing"` status? → A: Reject with a clear error ("Game already in progress"); joining mid-game is not allowed.
