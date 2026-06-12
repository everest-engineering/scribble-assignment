# Research: Game View Transition

## Purpose

Resolve the bug where participants in the lobby do not see the game page when the host starts the game.

## Codebase Analysis

### Root Cause

In `frontend/src/pages/LobbyPage.tsx:50-57`, the `handleStartGame` function calls `roomStore.startGame()` then `navigate("/game")`. This only navigates **the host's** browser. Other participants in the same room have no awareness that the game started — their polling (every 2s) receives the updated room snapshot but the component never checks for a status transition.

### Polling Infrastructure

- Both `LobbyPage` and `GamePage` use `setInterval(roomStore.pollRoom, 2000)` in a `useEffect` keyed on `room?.code`.
- `pollRoom()` in `roomStore.ts:104-119` calls `GET /rooms/:code?participantId=...` and updates the room snapshot via `setRoomSnapshot`.
- The component re-renders when the snapshot changes (via `useSyncExternalStore`).

### Existing Redirect Logic

- `LobbyPage` checks `if (!room) navigate("/")` — only handles missing session, not status changes.
- `GamePage` also checks `if (!room) navigate("/")` — no validation that room is actually in "playing" state.
- `JoinRoomPage` joins a room via `POST /rooms/:code/join` then navigates to `/lobby`. If the room is already playing, the backend returns "Game already in progress" (400 error) which surfaces as a server error in the form.

### Backend Behavior

- `startGame()` in `roomStore.ts:107-135` sets `room.status = "playing"`, assigns roles, picks a word.
- `GET /rooms/:code` returns the updated snapshot including `status: "playing"` to all viewers.
- `joinRoom()` rejects with `"game_in_progress"` when `status !== "lobby"`.
- `role` in `toRoomSnapshot` is only exposed when `status !== "lobby"` (line 183).

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Detection mechanism | Polling-based redirect in LobbyPage | Uses existing 2s interval; no new protocol needed |
| GamePage guards | Status check on mount + on poll | Handles refresh, direct navigation, late join |
| Late join flow | Returning participants with existing session skip lobby via mount-time status check; new joiners rejected per FR-007 | No backend changes needed; consistent with existing join rejection |
| Game ended flow | Navigating to /game when already finished → redirect to join page; transitioning to finished while on game page → stay and show "The round has ended" | Both behaviors needed for different scenarios |
| Poll failure during transition | Non-blocking error indicator on lobby while silently retrying at 2s interval | Transient errors resolved by next poll cycle |
| Missing session | Redirect to `/` | Already done; no change needed |

## Alternatives Considered

- **Separate "game started" endpoint**: Adds unnecessary complexity; polling already carries status.
- **WebSocket push**: Forbidden by constitution (Principle III).
- **Server-Sent Events**: Forbidden by constitution (Principle III).
- **Short-polling at higher frequency**: Not needed; 2s is sufficient for <3s redirect SLA.

## Risks

- Race condition: participant polls just before `startGame()` and gets `status: "lobby"`, then polls 2s later and gets `status: "playing"`. Within spec (SC-001: 3s).
- Participant joins mid-transition: handled by JoinRoomPage navigates to lobby, lobby detects playing status, redirects to game.
