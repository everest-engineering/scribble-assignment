# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Create a specification for Scenario 4: Result, Restart & Final Validation. Requirements: when a round has ended, all players see the correct secret word, final scores, and full guess history; the host can restart the game; on restart everyone returns to the lobby with players preserved and all round-specific state cleared; non-host players cannot restart; room isolation and cross-tab sync remain intact."

**Depends on**: Groups 1–3 — room lifecycle, lobby polling, host-only start, drawer/word visibility during play, interactive drawing, guessing, scoring, guess history, game-screen polling, and `round.ended` set on the first correct guess.

## Clarifications

### Session 2026-06-05

- Q: What API shape should host restart use? → A: `POST /rooms/:code/restart` with `{ participantId }` in the body; host-only; returns the updated room snapshot (mirrors `POST /rooms/:code/start`).
- Q: How is the secret word revealed to everyone after the round ends? → A: Extend the server snapshot projection to include `secretWord` for every viewer when `round.ended` is true (drawer-only while the round is active).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Everyone sees the round result (Priority: P1)

When the round ends (a correct guess has been recorded), every participant on the game screen sees a
clear result view: the secret word is revealed to all players, final scores are shown, and the
complete guess history from that round is visible. Drawing and guessing controls remain disabled.

**Why this priority**: Without a shared result, players cannot confirm who won or what the word was;
this is the payoff of the single-round lab flow.

**Independent Test**: In two tabs after a correct guess, both show the same secret word, the same
scores, and the same ordered guess history; the drawer tab no longer has exclusive word visibility.

**Acceptance Scenarios**:

1. **Given** a round has ended (`round.ended` is true), **When** any participant fetches the room,
   **Then** the snapshot includes `secretWord` for that viewer (server projection, not UI-only);
   the game screen shows the word to everyone.
2. **Given** a round has ended, **When** any participant views the game screen,
   **Then** final per-participant scores match the authoritative room state from the ended round.
3. **Given** a round has ended with multiple guesses recorded, **When** any participant views the game screen,
   **Then** the full guess history from that round is displayed in submission order.
4. **Given** a round has ended, **When** a participant views the game screen,
   **Then** drawing, clear-canvas, and guess submission remain unavailable.
5. **Given** two rooms where only room A's round has ended, **When** participants fetch room B,
   **Then** room B does not show room A's word, scores, or history.

---

### User Story 2 - Host restarts to a clean lobby (Priority: P1)

The host can restart after the round ends. Restart returns the room to lobby status, clears all
round-specific state (roles, word, strokes, guesses, scores, ended flag), and keeps the same
participants and host. Non-hosts cannot restart.

**Why this priority**: Restart completes the game loop and lets the same group play again without
re-creating the room.

**Independent Test**: Host clicks Restart in one tab; within about one poll interval all tabs show
lobby status, preserved participant list, no secret word, scores at zero context, and the host can
start a new round when at least 2 players are present.

**Acceptance Scenarios**:

1. **Given** a round has ended and the actor is the host, **When** they call restart
   (`POST /rooms/:code/restart` with their `participantId`),
   **Then** the room status becomes lobby, round state is cleared, and participants (including host
   identity) are unchanged.
2. **Given** a successful restart, **When** any client fetches the room,
   **Then** no secret word, strokes, guesses, or round-ended flag from the previous round remain.
3. **Given** a round has ended and the actor is not the host, **When** they attempt to restart,
   **Then** the action is rejected with a clear message and the room state is unchanged.
4. **Given** a round has not ended, **When** the host attempts to restart,
   **Then** the action is rejected with a clear message and the room state is unchanged.
5. **Given** restart succeeds in room A, **When** room B is inspected,
   **Then** room B is unaffected.

---

### User Story 3 - All clients return to the lobby after restart (Priority: P2)

After the host restarts, every tab that was on the game screen automatically navigates back to the
lobby without manual action, using the same polling-based sync pattern as lobby-to-game navigation.

**Why this priority**: Matches Group 1's auto-navigation expectation and avoids stranded players on
an empty game screen.

**Independent Test**: Three tabs (host + two guessers) on `/game` after round end; host restarts;
within ~2s all tabs land on `/lobby` with the same participant list.

**Acceptance Scenarios**:

1. **Given** clients on the game screen with an active session, **When** the room status becomes
   lobby after restart, **Then** each client navigates to the lobby automatically within about one
   poll interval.
2. **Given** polling on the game screen, **When** the user navigates away manually,
   **Then** polling stops and no background requests continue.
3. **Given** a transient fetch failure during game-screen polling, **When** the next poll succeeds,
   **Then** the UI reflects the latest status (lobby or result) without crashing.

---

### Edge Cases

- **Host restarts twice in quick succession** → second call is idempotent (room stays lobby, round
  stays cleared).
- **Round ended with zero guesses besides the winning guess** → result still shows word and scores.
- **Drawer had score 0, guesser had 100** → result reflects that; restart clears scores for the next round.
- **Non-host sees Restart control** → control hidden or disabled; server rejects if forced.
- **Joiner opens game URL after restart but before navigation** → next fetch shows lobby state;
  client routes to lobby.
- **Backend restart** → all state lost (in scope assumption: in-memory only).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-049**: When `round.ended` is true, the server-side room snapshot MUST include `secretWord` for
  **every** participant (extend the Group 2 projection: drawer-only while active, all viewers once
  ended); word reveal MUST NOT rely on client-only UI tricks.
- **FR-050**: When `round.ended` is true, the game screen MUST present a dedicated result experience
  showing the revealed word, final scores, and full guess history from the ended round.
- **FR-051**: While `round.ended` is true, drawing, clear-canvas, and guess submission MUST remain
  disabled (consistent with Group 3 end-of-round lock).
- **FR-052**: The system MUST accept host restart via `POST /rooms/:code/restart` with
  `{ participantId }`; only the host may call it, and only when `round.ended` is true; the response
  MUST return the updated room snapshot.
- **FR-053**: On successful restart, the system MUST set room status to lobby, clear round state
  entirely (`round` absent or null), and preserve the participant list and host identity.
- **FR-054**: On successful restart, the room view MUST omit secret word, strokes, guesses, roles,
  drawer assignment, and round-ended indicators associated with the previous round.
- **FR-055**: Non-host restart attempts MUST be rejected with a clear message and MUST NOT mutate
  room state.
- **FR-056**: Restart attempts while the round is still active (`round.ended` is false) MUST be
  rejected with a clear message and MUST NOT mutate room state.
- **FR-057**: Restart MUST be idempotent when the room is already in lobby with no active round.
- **FR-058**: After restart, the lobby MUST allow the host to start a new game when at least 2
  players are present (reusing Group 1 start rules); a new round MUST initialize fresh gameplay state.
- **FR-059**: The game screen MUST continue polling about every 2 seconds while active so result and
  restart status converge across tabs; polling MUST stop on unmount.
- **FR-060**: When polling detects room status lobby while the client is on the game screen, the
  client MUST navigate to the lobby automatically (mirror Group 1 lobby→game auto-navigation).
- **FR-061**: Restart in one room MUST NOT change participants, status, or round state in any other
  room.
- **FR-062**: This group completes the four-scenario lab flow; it MUST NOT add multiple rounds per
  session, drawer rotation, timers, persistence, or new sync mechanisms beyond HTTP polling.

### Key Entities

- **Result view**: A game-screen mode driven by `round.ended` — shows revealed word, final scores,
  and guess history to all participants; play controls disabled.
- **Restart action**: Host-initiated `POST /rooms/:code/restart` transition from ended round back to
  lobby; clears round while keeping room code, host, and participants.
- **Room (post-restart)**: Status `lobby`, `round` cleared, participants unchanged — ready for a new
  start per Groups 1–2.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of participants in an ended round see the same secret word, scores, and guess
  history within about 2 seconds without manual refresh.
- **SC-002**: 100% of non-host restart attempts are rejected with a user-visible message and leave
  room state unchanged.
- **SC-003**: After a host restart, 100% of game-screen tabs in that room navigate to the lobby
  within about 2 seconds.
- **SC-004**: After restart, a new start produces a fresh round with all scores at 0 and no strokes,
  guesses, or word leakage from the prior round.
- **SC-005**: Zero cross-room leakage: restart or result data in room A never appears in room B.

## Assumptions

- Groups 1–3 are complete: host, start gate, drawer/word during play, drawing, guessing, scoring,
  history, `round.ended`, and game-screen polling.
- During active play, the secret word remains drawer-only in the snapshot (Group 2); when
  `round.ended` is true, `toRoomSnapshot` includes `secretWord` for all viewers (same field, widened
  projection rule).
- `Room.status` transitions `lobby` → `started` on start (Groups 1–2) and `started` → `lobby` on
  restart (this group); there is no separate `"ended"` room status.
- Restart clears `round` entirely; the next start re-initializes roles, word, strokes, guesses,
  scores, and `ended` per Groups 2–3.
- Polling interval remains about 2 seconds (constitution).
- Only the host may restart, analogous to only the host may start.
- In-memory storage only; backend restart loses all rooms (out of scope).
