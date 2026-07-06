# Feature Specification: Automatic Lobby Polling

**Feature Branch**: `004-lobby-polling`

**Created**: 2026-07-06

**Status**: Ready

**Input**: User description: "F004: automatic lobby polling — when players are in the lobby waiting for the host to start the game, the player list should automatically refresh every ~2 seconds so they can see when other players join"

## Clarifications

### Session 2026-07-06

- Q: What should happen when polling detects the room status is no longer "lobby" (e.g., game started)? → A: The Lobby page should auto-navigate to the game page immediately when the poll response shows a non-lobby status. No intermediate prompt or countdown.
- Q: Should polling prevent overlapping requests if a previous poll is still in-flight? → A: Yes, skip the scheduled tick if a request is pending and let the next interval fire. Do not queue or abort requests.
- Q: What should happen when a poll returns 404 (room was deleted)? → A: Navigate to the home/join page and show the error message there. Do not leave the user stranded on a broken lobby.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Auto-refresh lobby player list (Priority: P1)

As a player waiting in the lobby, I want the player list to automatically update so that I can see when new players join without clicking a refresh button.

**Why this priority**: Core UX improvement — eliminates the need for manual refreshing, which is the primary purpose of this feature.

**Independent Test**: Open two browser tabs. In Tab 1, create a room and stay on the lobby. In Tab 2, join the same room. Within ~2 seconds, Tab 1's player list should update to show the new participant without any manual interaction.

**Acceptance Scenarios**:

1. **Given** a player is on the Lobby page, **When** another player joins the room, **Then** the participant list updates automatically within ~2 seconds without manual refresh.
2. **Given** a player is on the Lobby page, **When** they navigate to another page (e.g., back to home), **Then** polling stops and no further requests are made.
3. **Given** a player is on the Lobby page and the room status transitions from "lobby" to "playing", **When** the poll fires, **Then** the page auto-navigates to the game page immediately without user interaction.

---

### User Story 2 - Graceful polling error handling (Priority: P2)

As a player, if a poll request fails, I want the lobby to continue trying so that I don't get stuck on a stale view due to a transient network issue.

**Why this priority**: Resilience — ensures a single failed request doesn't break the auto-refresh experience.

**Independent Test**: Simulate a network error (e.g., disconnect/reconnect) while on the lobby. The player list should continue polling after the network recovers.

**Acceptance Scenarios**:

1. **Given** a player is on the Lobby page with active polling, **When** a single poll request fails (network error), **Then** polling continues with the next scheduled interval and the previously loaded data remains visible.
2. **Given** a player is on the Lobby page, **When** a poll request returns 404 (room deleted), **Then** polling stops and the player is navigated to the home page with the error message displayed.

---

### User Story 3 - Manual refresh still works (Priority: P3)

As a player, I want the manual "Refresh" button to still work so that I can force an immediate refresh if I want.

**Why this priority**: Backward compatibility — existing behavior should not be removed.

**Independent Test**: Click the "Refresh Room" button while auto-polling is active. The player list should update immediately.

**Acceptance Scenarios**:

1. **Given** a player is on the Lobby page with auto-polling active, **When** they click the "Refresh Room" button, **Then** the room data is fetched immediately (resetting the poll timer).

---

### Edge Cases

- **Rapid page navigation**: Entering and leaving the lobby page quickly should not cause multiple polling intervals to stack (useEffect cleanup prevents leaks).
- **Tab visibility**: Polling continues even if the tab is backgrounded (acceptable for MVP; no need for Page Visibility API).
- **Room deleted while polling**: If the room is deleted (e.g., host closes browser), the next poll returns 404 — polling should stop and navigate the user to the home page with the error message displayed.
- **Component unmount**: Poll interval must be cleaned up on component unmount to prevent state updates on unmounted component.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Lobby page MUST automatically poll the room state every ~2000ms (2 seconds) while the component is mounted and the room status is "lobby".
- **FR-002**: The polling interval MUST be cleaned up when the component unmounts (navigating away, room status changes).
- **FR-003**: A failed poll request MUST NOT stop the polling interval — the next scheduled poll should still fire.
- **FR-004**: If a poll returns a 404 (room not found), polling MUST stop and the player MUST be navigated to the home page with the error message displayed.
- **FR-005**: The manual "Refresh Room" button MUST remain functional and usable alongside auto-polling.
- **FR-006**: The `isLoading` state from the RoomStore MUST reflect poll requests (same as manual refresh) so the UI shows appropriate loading feedback.
- **FR-007**: Polling MUST use the existing `fetchRoom` API method — no new endpoints needed.
- **FR-008**: The polling interval should be stored as a constant (e.g., `POLL_INTERVAL = 2000`) for easy configuration.
- **FR-009**: If a poll request is still in-flight when the next interval fires, the overlapping tick MUST be skipped. Requests MUST NOT queue or stack.

### Key Entities *(include if feature involves data)*

- **Room**: Existing entity with `code`, `status`, `participants`. No data model changes. Polling reads current room state.
- **RoomStore**: Existing frontend store. No new methods needed — `fetchRoom()` already exists.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: New participants appear in the lobby player list within ~2 seconds without manual refresh.
- **SC-002**: No memory leaks from polling intervals — verified by navigating away and back multiple times.
- **SC-003**: A transient network error does not permanently break auto-refresh.
- **SC-004**: The "Refresh Room" button continues to work.
- **SC-005**: When the host starts the game, all non-host players are auto-navigated to the game page within ~2 seconds (next poll cycle) without manual interaction.
- **SC-006**: When a room is deleted, players are navigated to the home page with a clear error message.
- **SC-007**: All existing tests continue to pass.

## Assumptions

- The existing `fetchRoom` method on the RoomStore is sufficient — no new backend or API changes needed.
- The lobby page already has the correct structure to display updated participant lists (the `room.participants` list re-renders when state changes).
- No changes needed to backend — this is purely a frontend enhancement.
- The manual refresh button is retained for user preference and debugging.
- `setInterval` is sufficient; `setTimeout` with recursive scheduling is not required for this use case.
