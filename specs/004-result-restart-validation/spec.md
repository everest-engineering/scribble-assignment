# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart-validation`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## Clarifications

### Session 2026-06-26

- Q: How should the system handle a race condition where `skip-round` is called concurrently with a correct guess submission? → A: Reject skip-round with error "Round already ended" if a correct guess exists in guessHistory for the current round.
- Q: Should the "Skip Round" button be visible to the host only when the drawer is disconnected, or always? → A: Always visible to the host.
- Q: How should the scores table resolve player names for participants who never guessed? → A: Names MUST be resolved from the `participants[]` array, not from `guessHistory`. Participants who never guessed (drawer, inactive players) must display their proper name, not their participant ID.
- Q: What UI should non-host players see when the drawer is disconnected? → A: A full popup overlay like the host-disconnected popup, with a "Notify Host" button that alerts the host to skip the round.

### Session 2026-06-26 (post-implementation)

- Q: Should the "Notify Host" popup dismiss after clicking the button? → A: Yes, the popup hides locally on the client immediately after clicking "Notify Host". It may reappear on the next poll if `drawerDisconnected` is still true.
- Q: What should happen when all other players leave the game? → A: The game ends. Set `room.status = "finished"`, create a `lastRoundResult` with current round data (same structure as normal result), and show the result overlay with only the "Exit Game" button. No Continue, no Restart.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Persistent Round Result Display (Priority: P1)

When a round ends (someone guesses the secret word correctly, or the host skips the round), all players see an overlay showing the correct word, the drawer's name, final scores for all participants, and a full guess history (who guessed what, whether it was correct, and when). The overlay persists until the player dismisses it locally via a "Continue" button.

**Why this priority**: Without the result display, players cannot learn the correct word or see how they performed. This is the core feedback mechanism that closes the gameplay loop.

**Independent Test**: Start a game with 2+ players. Have a guesser submit a correct guess. Verify all players see an overlay showing the correct word, drawer name, all participant scores, and the full guess history. Verify the overlay does not auto-dismiss after 6 seconds. Verify each player can dismiss their own overlay by clicking "Continue", revealing the next round.

**Acceptance Scenarios**:

1. **Given** a round has ended (correct guess or skip), **When** any player polls the room state, **Then** `lastRoundResult` is present in the snapshot with the correct word, round number, drawer name, full guess history, and all participant scores.
2. **Given** a round has ended, **When** a player views the result overlay, **Then** they see: the correct secret word, the drawer's name, a table of all participants with their scores (round and cumulative), and a history of every guess submitted during the round (guesser name, guess text, correct/incorrect status, and timestamp).
3. **Given** a player is viewing the result overlay, **When** they click "Continue", **Then** the overlay is dismissed locally and they see the next round's game UI (active canvas, new drawer, guess input).
4. **Given** a round's result overlay is displayed, **When** 10 seconds pass without any player action, **Then** the overlay remains visible (no auto-dismiss).
5. **Given** a round has ended, **When** a player joins the room mid-result (after a page refresh), **Then** they also see the result overlay since `lastRoundResult` is still in the room snapshot.

---

### User Story 2 — Restart Game to Lobby (Priority: P2)

The host can restart the entire game from the result screen, sending all players back to the lobby with the participant list preserved, all game state cleared, and the room code unchanged.

**Why this priority**: Restart is the mechanism to play multiple game sessions without requiring players to re-join. It provides a clean end-of-game flow controlled by the host.

**Independent Test**: Start a game with 2+ players, play one round until correct guess. Verify the host sees a "Restart Game" button on the result overlay (non-host players do not see this button). Click "Restart Game". Verify all players (on their next poll) see the room is back in "lobby" status, all participants are still present, and all game state (scores, strokes, guess history, secret word, current round) is cleared.

**Acceptance Scenarios**:

1. **Given** the result overlay is displayed, **When** the host clicks "Restart Game", **Then** the room status changes to "lobby", and all game state is cleared (`currentRound`, `drawerId`, `secretWord`, `strokes`, `guessHistory`, `scores`, `lastRoundResult`).
2. **Given** the host has clicked "Restart Game", **When** any player polls the room, **Then** they receive a room in "lobby" status with all original participants preserved.
3. **Given** a non-host player views the result overlay, **When** they look for a restart button, **Then** no restart button is visible (only the "Continue" button).

---

### User Story 3 — Exit Game Coexists (Priority: P3)

The existing "Exit Game" button remains available on the result screen alongside the new "Restart Game" button. "Exit Game" clears the exiting player's local session; "Restart Game" resets the entire room to lobby for all players.

**Why this priority**: Provides flexibility — a player can leave independently or the host can reset for everyone.

**Independent Test**: Start a game, view the result overlay, verify both "Exit Game" and (for host) "Restart Game" buttons are visible. Click "Exit Game" and verify the session is cleared and the user is redirected to the home page.

**Acceptance Scenarios**:

1. **Given** a player views the result overlay, **When** they check the bottom button row, **Then** they see the "Exit Game" button.
2. **Given** a host views the result overlay, **When** they check the bottom button row, **Then** they see both "Exit Game" and "Restart Game" buttons.

---

### User Story 4 — Host Disconnect & Claim Host (Priority: P1)

If the host disconnects during a game, other players are blocked from restarting or skipping rounds since those actions are host-only. The system detects host disconnection via polling (participants track `lastSeenAt`) and shows a "Host disconnected" popup. Any player can claim host by clicking a "Claim Host" button, which immediately promotes them to host.

**Why this priority**: Without this, a disconnected host permanently blocks restart and skip-round, making the game unplayable. This is a critical failure mode.

**Independent Test**: Start a game with 2+ players. Close the host's browser tab. Verify non-host players see a "Host disconnected" popup within 30 seconds. Click "Claim Host" as a non-host player. Verify they become the new host (restart and skip buttons become visible). Verify the original host cannot override if they return.

**Acceptance Scenarios**:

1. **Given** the host has not polled the room for more than 30 seconds, **When** any other player polls the room, **Then** the snapshot returns `hostDisconnected: true`.
2. **Given** `hostDisconnected` is `true`, **When** a non-host player views the game page, **Then** they see a "Host disconnected" popup with a "Claim Host" button.
3. **Given** a non-host player clicks "Claim Host", **When** the request is processed, **Then** the room's `hostId` is updated to that player's ID.
4. **Given** a player has claimed host, **When** any player polls the room, **Then** `hostDisconnected` is `false` and the new host has the restart/skip buttons.
5. **Given** a player who is already the host clicks "Claim Host", **When** the request is processed, **Then** it succeeds (idempotent — no-op for existing host).

---

### User Story 5 — Skip Round When Drawer Disconnected (Priority: P2)

If the drawer disconnects mid-round, the game is soft-locked — no new drawing can happen and guessers may be unable to guess the word from existing strokes. The host (or claimed host) can skip the round, which advances to the next round, awards 0 points for the skipped round, and shows a round result overlay (with the correct word revealed) so the game can continue.

**Why this priority**: A disconnected drawer blocks gameplay for everyone. Skip round provides an escape hatch so the game isn't permanently stuck.

**Independent Test**: Start a game with 2+ players, ensure the drawer disconnects. Verify non-host players see a "Drawer disconnected" popup with a "Notify Host" button. Click "Notify Host" as a non-host; verify the host sees a skip-requested badge on their "Skip Round" button. As host, click "Skip Round". Verify the round advances, all players see the result overlay with the secret word and scores (0 for the skipped round), and a new drawer is assigned.

**Acceptance Scenarios**:

1. **Given** the drawer has not polled the room for more than 30 seconds, **When** any other player polls the room, **Then** the snapshot returns `drawerDisconnected: true` (computed from drawer's `lastSeenAt`).
2. **Given** `drawerDisconnected` is `true`, **When** a non-host player views the game page, **Then** they see a "Drawer disconnected" popup with a "Notify Host" button.
3. **Given** the room is in "playing" status, **When** the host views the game page, **Then** they see a "Skip Round" button at all times (non-host players do not see this button).
4. **Given** the host clicks "Skip Round", **When** the request is processed, **Then** `advanceRound()` is called: the round increments, a new drawer is picked, strokes and guess history are cleared, `lastRoundResult` is set with the correct word and current scores, and 0 points are awarded for the skipped round.
5. **Given** the host has skipped the round, **When** any player polls, **Then** the result overlay displays the secret word, the skipped round number, the drawer's name, and the scores (unchanged from before the skip).
6. **Given** the host clicks "Skip Round" when the drawer is NOT disconnected, **Then** the endpoint still succeeds (skip is always available to the host, regardless of drawer state).
7. **Given** the round already has a correct guess in the guess history, **When** the host clicks "Skip Round", **Then** the request is rejected with a "Round already ended" error.

---

### User Story 6 — Game Over When All Players Leave (Priority: P2)

When a player exits the game (clicks "Exit Game" while the game is in "playing" status), they are removed from the room. If the number of remaining participants drops to 1 (or fewer), the game cannot continue. The room enters a `"finished"` status, a final `lastRoundResult` is created with the current round's data and remaining scores, and the remaining player sees a persistent result screen with only the "Exit Game" button. The player must exit the room; there is no Continue or Restart from this state.

**Why this priority**: Without this, a player left alone in a game has no clear indication that the game is over. They would wait indefinitely for other players. This provides a clean termination path.

**Independent Test**: Start a 2-player game. As player B, click "Exit Game" on the bottom button row. Verify player A's next poll shows status `"finished"` and `lastRoundResult` with the current round's data. Verify player A sees the RoundResultCard with only the "Exit Game" button (no Continue, no Restart). Click "Exit Game" as player A — verify the room is cleaned up and player A is redirected to home.

**Acceptance Scenarios**:

1. **Given** a room is in "playing" status with 2 participants, **When** one participant calls `DELETE /:code/leave`, **Then** the remaining participant count is 1, the room status changes to `"finished"`, and `lastRoundResult` is set with the current round's data (secret word, drawer, guess history, scores — containing only remaining participants).
2. **Given** a room is in "finished" status with `lastRoundResult`, **When** the remaining player polls the room, **Then** they receive a RoomSnapshot with `status: "finished"`, `lastRoundResult`, and the RoundResultCard overlay is shown with only the "Exit Game" button.
3. **Given** a room is in "finished" status and the remaining participant calls `DELETE /:code/leave`, **When** the request is processed, **Then** the room is deleted from the store (0 participants remaining).
4. **Given** a room is in "lobby" status, **When** a participant calls `DELETE /:code/leave`, **Then** the participant is simply removed; no game-over state is created (room stays in "lobby" status).

## Edge Cases

- What happens if the host disconnects mid-game? — After 30 seconds of no polling, `hostDisconnected` becomes `true`. A popup appears on all other players' screens with a "Claim Host" button.
- What happens if a player clicks "Continue" after the host has already restarted? — The room is already in lobby; the player's local dismiss of the result overlay is harmless — they see the lobby on the next poll.
- What happens if the host clicks "Restart Game" while other players are still viewing the result? — The room state changes to lobby server-side. Other players see the lobby on their next poll cycle.
- What happens if restart is called when the room is already in lobby? — The endpoint returns an error (game is not in progress), preventing no-op restarts.
- What happens if a non-host attempts to call the restart/skip API directly? — The endpoint rejects with a 403 error.
- What happens if all players dismiss their result overlays before the host restarts? — The game continues to the next round. The host waits for the next round's result screen to restart, or uses Skip Round to trigger a result screen earlier.
- What happens if the host refreshes the page during the result screen? — The room is still in "playing" state with `lastRoundResult` set; the host sees the result overlay again after session restore.
- What happens if the drawer is also the host and disconnects? — The `hostDisconnected` flag triggers first. A player claims host, then that new host can skip the round. Both problems are resolved in sequence.
- What happens if a different player claims host, but the original host returns? — The original host is no longer host. They become a regular participant. No conflict resolution needed — last claim wins.
- What happens if `claim-host` is called and the caller is already host? — Idempotent success (no-op).
- What happens if skip round is called and there are no more words in `STARTER_WORDS`? — The `currentRound` counter wraps around via modulo: `STARTER_WORDS[(round - 1) % STARTER_WORDS.length]`. It cycles indefinitely.
- What happens if the host calls skip-round after someone already guessed correctly? — The endpoint rejects with "Round already ended" since the round ended naturally.
- What happens if a player submits a guess with a name longer than 20 characters? — The backend validation rejects it with a clear error message.
- What happens if a player never submitted any guess during the round? — Their name is still displayed correctly in the scores table, resolved from the `participants[]` list (not from guessHistory, which only contains entries for guessers).
- What happens if a non-host player clicks "Notify Host" but the host has already skipped? — The request succeeds but has no visible effect — the room is already advancing to the next round.
- What happens if the last remaining player exits a finished game? — The `DELETE /:code/leave` route removes them, the participant count drops to 0, and the room is deleted from the store. No more state exists for that room.
- What happens if a player clicks "Exit Game" in a 3-player game? — They are removed; the remaining 2 players continue the game normally (no game over).
- What happens if a player who is also the drawer exits mid-round? — They are removed from participants. If the game continues (≥2 remaining), a new drawer is assigned by `advanceRound()` on the next round. If only 1 remains, game-over triggers.
- What happens if the host exits the game mid-round? — The host is removed; the next participant in the list is assigned as the new host. If the game continues, the new host has restart/skip-round privileges.
- What happens if the "Notify Host" banner reappears after being dismissed? — The client's dismiss is local; on the next poll, if `drawerDisconnected` is still true, the banner reappears. This is expected behavior — the drawer hasn't reconnected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-034**: System MUST persist `lastRoundResult` in the room snapshot indefinitely (no auto-expiry) until explicitly cleared by a restart.
- **FR-035**: System MUST display the result overlay to all players when `lastRoundResult` is present in the room snapshot.
- **FR-036**: The result overlay MUST show: correct secret word, drawer name, table of all participants with their scores (round and cumulative), and a complete guess history (guesser name, guess text, correct/incorrect status, timestamp). All participant names in the scores table MUST be resolved from the room's `participants[]` list, not from `guessHistory`.
- **FR-037**: The result overlay MUST include a "Continue" button visible to all players.
- **FR-038**: Clicking "Continue" MUST dismiss the result overlay locally on the player's client (does not affect server state or other players).
- **FR-039**: System MUST provide a `POST /:code/restart` endpoint that resets the room to lobby status, clearing all game state (`currentRound`, `drawerId`, `secretWord`, `strokes`, `guessHistory`, `scores`, `lastRoundResult`) while preserving participants and hostId.
- **FR-040**: The restart endpoint MUST reject requests from non-host participants with a 403 error.
- **FR-041**: The restart endpoint MUST reject requests if the room is not in "playing" status (no-op prevention) with a 400 error.
- **FR-042**: The result overlay MUST show a "Restart Game" button only for the host participant.
- **FR-043**: The "Exit Game" button MUST remain visible on the game page (including during the result overlay) and function as before (clear local session, redirect to home).
- **FR-044**: The `Participant` model MUST include a `lastSeenAt` timestamp field that is updated on every `GET /:code` request from that participant (polling updates it).
- **FR-045**: The `RoomSnapshot` MUST include a computed `hostDisconnected` boolean field that is `true` when the host's `lastSeenAt` is older than 30 seconds from the current server time.
- **FR-046**: The `RoomSnapshot` MUST include a computed `drawerDisconnected` boolean field that is `true` when the room is in "playing" status and the drawer's `lastSeenAt` is older than 30 seconds from the current server time.
- **FR-047**: System MUST provide a `POST /:code/claim-host` endpoint that sets the caller's participant ID as the new `hostId`.
- **FR-048**: The claim-host endpoint MUST accept requests from any participant, including the existing host (idempotent). It MUST reject requests from non-existent participants with a 404 error.
- **FR-049**: System MUST show a "Host disconnected" popup with a "Claim Host" button on the game page and lobby page when `hostDisconnected` is `true` and the viewer is not the host.
- **FR-050**: System MUST provide a `POST /:code/skip-round` endpoint that calls `advanceRound()` to advance to the next round, setting `lastRoundResult` with the current scores and secret word.
- **FR-050a**: The skip-round endpoint MUST reject the request with a 400 error if a correct guess already exists in the current round's guess history (round already ended naturally).
- **FR-051**: The skip-round endpoint MUST reject requests from non-host participants with a 403 error.
- **FR-052**: System MUST show a "Skip Round" button on the game page whenever the viewer is the host (regardless of drawer connection state).
- **FR-053**: The participant name validation in `schemas.ts` MUST reject names longer than 20 characters with a clear error message.
- **FR-054**: The frontend name input fields MUST have `maxLength={20}` to prevent typing beyond the limit.
- **FR-055**: System MUST show a "Drawer disconnected" popup with a "Notify Host" button when `drawerDisconnected` is `true` and the viewer is not the host. After the viewer clicks "Notify Host", the popup MUST dismiss locally on the client (it may reappear on the next poll if `drawerDisconnected` is still true).
- **FR-056**: System MUST provide a `POST /:code/suggest-skip` endpoint that sets a `skipSuggested` boolean flag on the room to `true`.
- **FR-057**: The `RoomSnapshot` MUST include a `skipSuggested` boolean field that is `true` when any non-host player has requested a skip.
- **FR-058**: When `skipSuggested` is `true` and the viewer is the host, the "Skip Round" button MUST show a visual indication (e.g., badge/pulse) that a skip has been requested.
- **FR-059**: System MUST clear the `skipSuggested` flag on the room when `advanceRound()` is called (normal or skip) or when `restartGame()` is called.
- **FR-060**: System MUST provide a `DELETE /:code/leave` endpoint that removes the requesting participant from the room.
- **FR-061**: When `DELETE /:code/leave` drops the participant count to ≤ 1 during "playing" status, the system MUST set `room.status = "finished"` and create a `lastRoundResult` with the current round's data (secret word, drawer, guess history, remaining scores). The surviving participant sees the result overlay with only the "Exit Game" button.
- **FR-062**: When `DELETE /:code/leave` drops the participant count to 0, the system MUST delete the room from the store.
- **FR-063**: The `RoomSnapshot` MUST include `lastRoundResult`, `scores`, and `guessHistory` when status is `"finished"` (same as during "playing"), so the remaining client can render the game-over result screen.

### Key Entities *(include if feature involves data)*

- **RoomStatus** (updated): `"lobby" | "playing" | "finished"`. The `"finished"` status is set when participants drop to ≤ 1 during playing.
- **RoundResult** (existing): Contains `roundNumber`, `secretWord`, `drawerId`, `drawerName`, `guessHistory`, `scores`. Persisted indefinitely until restart instead of auto-expiring after 6 seconds. Also set when game ends (all other players left) with remaining participants' scores.
- **Participant** (updated): Existing model adds `lastSeenAt: string` (ISO timestamp). Updated on every `GET /:code` poll from that participant.
- **RoomSnapshot** (updated): Adds computed fields:
  - `hostDisconnected: boolean` — `true` if host's `lastSeenAt` > 30s ago
  - `drawerDisconnected: boolean` — `true` if room is playing and drawer's `lastSeenAt` > 30s ago
  - `skipSuggested: boolean` — `true` if a non-host player has requested a skip via `POST /:code/suggest-skip`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-016**: The result overlay persists beyond 6 seconds without auto-dismissing (tested with 10-second wait).
- **SC-017**: All players see identical result data (correct word, scores, guess history) within one polling cycle of the round ending.
- **SC-018**: The host can restart the game to lobby with a single click, and all players see the lobby within one polling cycle.
- **SC-019**: Non-host players cannot trigger a restart (no button visible, 403 on direct API call).
- **SC-020**: Each player can independently dismiss their result overlay without affecting other players.
- **SC-021**: When the host stops polling for >30 seconds, all other players see `hostDisconnected: true` within one polling cycle.
- **SC-022**: A non-host player can claim host with one click, and within one polling cycle all players see the new hostId.
- **SC-023**: When the drawer stops polling for >30 seconds and the viewer is host, the "Skip Round" button shows a requested-skip badge within one polling cycle.
- **SC-024**: Skipping a round advances the game, shows the correct word in the result overlay, and assigns a new drawer.
- **SC-025**: A participant name longer than 20 characters is rejected with a clear error message at both the API and UI level.
- **SC-026**: When the drawer stops polling for >30 seconds, all non-host players see a "Drawer disconnected" popup within one polling cycle, and clicking "Notify Host" triggers a visual badge on the host's "Skip Round" button within one polling cycle.
- **SC-027**: After a non-host clicks "Notify Host", the drawer-disconnected popup dismisses immediately on their client, even though `drawerDisconnected` may still be `true` on the server.
- **SC-028**: When one of two players exits during a game, the remaining player sees a "finished" status and game-over result overlay within one polling cycle, with only the "Exit Game" button visible.

## Assumptions

- The result overlay is a client-side overlay rendered when `lastRoundResult` is present in the room snapshot. The server does not track which players have dismissed their result.
- The "Continue" button is a local-only action; it clears the `lastRoundResult` state on the client. The next poll will not re-show the overlay unless `lastRoundResult` is still on the server (which it will be until restart).
- To prevent the overlay from re-appearing after Continue, the client suppresses re-display when the result is locally dismissed, even if the server still has `lastRoundResult`.
- Restart is a host-only action. The host identity is determined by `hostId` in the room snapshot.
- After restart, the host can start a new game immediately (same lobby flow as Scenario 1).
- The "Exit Game" button continues to clear `sessionStorage` and redirect to the home page.
- Host disconnection is detected via polling inactivity (30-second threshold). There is no WebSocket or real-time detection.
- The 30-second threshold is a fixed constant, not configurable.
- `lastSeenAt` is updated on every `GET /:code` call from a participant. If a participant never polls, they appear disconnected after 30 seconds.
- The drawer disconnect check only applies when the room is in "playing" status.
- Claiming host is one-way: the original host cannot reclaim host status after someone else has claimed it.
- Skip round is always available to the host regardless of whether the drawer is actually disconnected (host may also use it to fast-forward through a round they don't like).
- The participant name max length of 20 characters is a reasonable default for display names in a casual game context.
- The game-over result overlay (`status === "finished"`) is not dismissable — the player must click "Exit Game" to leave the room.
- Clicking "Notify Host" locally patches `drawerDisconnected` to `false` on the client. The server does not track this dismissal — the next poll may re-enable the popup.
- When a host exits the game, the next participant in the `participants[]` array is assigned as the new host. There is no host-election protocol; simple array-ordering suffices for a lab project.
