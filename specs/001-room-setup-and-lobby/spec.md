## Scenario 1 — Room Setup & Lobby

### Problem

Players need a reliable way to create and join a game room before play begins.
The current scaffold lets players create and join rooms but treats every player identically — there is no host, no start action, and the lobby only updates on manual refresh.
A player has no way to know who else is waiting, and nobody can actually begin the game.

---

### Requirements

#### Host Tracking
- The player who creates a room is automatically the host.
- Host status must be stored on the backend and included in every room snapshot.
- The frontend must visually distinguish the host from other participants in the lobby.
- Host status does not transfer if the host leaves (out of scope for this scenario).

#### Room Validation
- A player name must be non-empty after trimming whitespace. Empty or whitespace-only names are rejected with a clear error message before any API call is made.
- Joining with an unknown or missing room code returns a clear error message ("Room not found" or equivalent). The player stays on the join screen.
- Joining with an empty room code is rejected on the frontend before any API call is made.
- Each room is isolated: participants, state, and game data from one room never appear in another.

#### Lobby Polling
- While a player is on the lobby screen, the room snapshot is fetched automatically at approximately 2-second intervals.
- Polling starts when the lobby mounts and stops when the player navigates away.
- The participant list updates without any manual user action.
- Polling uses the existing `GET /rooms/:code` endpoint — no new endpoint is needed.

#### Host-Only Start
- Only the host sees the "Start Game" button in the lobby.
- The button is disabled (and shows why) when fewer than 2 players are present.
- The button is enabled when at least 2 players have joined.
- Non-host players see a waiting message instead of the button.

#### Minimum 2 Players
- The game cannot be started with fewer than 2 participants.
- This rule is enforced on the backend: a start request with only 1 participant returns an error.
- The frontend reflects this state by disabling the start button until the count is met.

---

### Acceptance Criteria

**Host tracking**
- [ ] Creating a room returns a snapshot where one participant is marked as host.
- [ ] Joining a room returns a snapshot that still correctly identifies the original creator as host.
- [ ] The host participant is visually marked in the lobby (e.g. a "Host" badge).
- [ ] A non-host participant does not have the host marker.

**Room validation**
- [ ] Submitting an empty player name on Create Room shows an inline error and does not call the API.
- [ ] Submitting an empty player name on Join Room shows an inline error and does not call the API.
- [ ] Submitting a whitespace-only player name is treated as empty and rejected with the same message.
- [ ] Joining with a code that does not match any room shows "Room not found" (or equivalent) and keeps the player on the join screen.
- [ ] Joining with an empty code shows an inline error and does not call the API.
- [ ] Two rooms created in the same session have independent participant lists — joining room A does not affect room B.

**Lobby polling**
- [ ] Opening the lobby screen starts automatic polling; the participant list updates within ~2 seconds when a second browser tab joins the same room.
- [ ] Navigating away from the lobby stops polling (no further requests fired after leaving).
- [ ] Polling does not require any manual user interaction.

**Host-only start**
- [ ] The host sees a "Start Game" button; a non-host player does not.
- [ ] The button is disabled when only 1 player is in the room.
- [ ] The button is enabled when 2 or more players are in the room.
- [ ] Clicking the enabled button by the host triggers the start game action (transitions to game screen — full game start behavior is specified in Scenario 2).

**Minimum 2 players**
- [ ] A start request sent with only 1 participant in the room returns a 4xx error from the backend.
- [ ] The frontend does not allow the host to trigger the start request when fewer than 2 players are present.
