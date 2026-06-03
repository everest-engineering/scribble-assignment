---
description: "Feature specification for Result, Restart & Final Validation"
---

# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `scribble-lab`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Scenario 4 — Result, Restart & Final Validation — Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing

### User Story 1 — Result Screen for All Players (Priority: P1)

When the host ends the active round, the room transitions to an "ended" state. All players are immediately redirected to a result screen that reveals the correct word, shows the final scoreboard (all participants with their scores), and displays the complete guess history for the round.

**Why this priority**: The result screen is the core payoff of a completed round — every player needs to see the outcome. It must work before any restart functionality can be meaningful.

**Independent Test**: With two tabs (Tab A = host/drawer, Tab B = guesser), Tab A clicks "End Round". Both tabs must show the correct word, each player's score, and all guesses submitted during the round within ~2 seconds.

**Acceptance Scenarios**:

1. **Given** the room is active with at least one guess submitted, **When** the host clicks "End Round", **Then** the room status changes to `"ended"` and all players (drawer and guessers) see the result screen within ~2 seconds via polling.
2. **Given** the result screen is visible, **When** a player looks at it, **Then** they see the correct word prominently displayed, a final scoreboard sorted by score descending, and the full guess history showing each submitter's name, guess text, and correct/incorrect outcome.
3. **Given** the result screen is visible, **When** a non-host player views it, **Then** they do not see a restart button — only the host sees the restart option.
4. **Given** a player refreshes their browser while on the result screen, **When** their session is restored, **Then** they are returned to the result screen (not the home page), and the result data is still visible.

---

### User Story 2 — Host Restarts to Lobby (Priority: P2)

From the result screen, the host can press a "Restart" button that resets all round state and returns the entire room to the lobby. All players are redirected automatically (via polling). The participant list is preserved; no player needs to rejoin.

**Why this priority**: Restart completes the round lifecycle and enables the host to run another round without anyone leaving and rejoining.

**Independent Test**: After Tab A clicks "Restart", both Tab A and Tab B must be redirected to the lobby screen within ~2 seconds, with the same participant list and all scores, guesses, canvas strokes, and word data cleared.

**Acceptance Scenarios**:

1. **Given** the result screen is displayed, **When** the host clicks "Restart", **Then** the room status transitions from `"ended"` back to `"lobby"` and all round state (word, drawer, strokes, guesses, scores) is cleared.
2. **Given** the host has clicked "Restart", **When** any player's next poll completes, **Then** they are redirected to the lobby screen automatically — no manual navigation is required.
3. **Given** the room has returned to the lobby, **When** any player views the lobby, **Then** all original participants are still present and their scores show as 0 (reset), ready for a new round.
4. **Given** a non-host player is on the result screen, **When** the host restarts, **Then** the non-host player is redirected to the lobby automatically without any action on their part.

---

### Edge Cases

- What happens if a player refreshes during the transition from `"active"` to `"ended"`? The poll on next load should detect the `"ended"` status and navigate them to the result screen.
- What if the host closes their tab before restarting? Non-host players remain on the result screen indefinitely until another tab with host status restarts, or the session times out naturally.
- What if the room has zero guesses when the host ends the round? The result screen should still display correctly, showing the word and zero scores — the guess history shows an empty state message.
- What if the host's session is lost and they refresh on the result screen? Session restore must re-detect host status so the restart button reappears.

## Requirements

### Functional Requirements

- **FR-001**: The host MUST be able to end an active round via a visible "End Round" button that is shown only to the host on the game screen.
- **FR-002**: The backend MUST expose a `POST /rooms/:code/end` endpoint that transitions the room from `"active"` status to `"ended"` status. Only the host may call this endpoint; non-host attempts MUST be rejected with a 403 error.
- **FR-003**: When the room status becomes `"ended"`, all players MUST be automatically redirected to a result screen within the next polling cycle (~2 seconds).
- **FR-004**: The result screen MUST display: the correct word for the round (revealed to all players, including guessers), the final scoreboard (all participants with their scores, sorted descending), and the complete guess history (submitter name, guess text, correct/incorrect label) in submission order.
- **FR-005**: The restart button on the result screen MUST be visible only to the host; non-host players MUST NOT see it.
- **FR-006**: The backend MUST expose a `POST /rooms/:code/restart` endpoint that transitions the room from `"ended"` status back to `"lobby"` status, clears all round state (`currentWord`, `drawerId`, `strokes`, `guesses`, `scores`), and preserves the participant list. Only the host may call this endpoint; non-host attempts MUST be rejected with a 403 error.
- **FR-007**: When the room status becomes `"lobby"` after a restart, all players MUST be automatically redirected to the lobby screen within the next polling cycle (~2 seconds).
- **FR-008**: Session restore MUST function on the result screen: a player who refreshes their browser while on the result screen MUST be returned to the result screen with all result data visible, not redirected to the home screen.
- **FR-009**: The `currentWord` field in the room snapshot returned to non-drawer players MUST be revealed on the result screen — once the round ends, the word privacy restriction is lifted for all players.
- **FR-010**: The `"End Round"` button MUST only be shown to the host while the room is in `"active"` status. It MUST NOT be shown on the result screen.

### Key Entities

- **Room** (extended): Gains a new status value `"ended"` alongside the existing `"lobby"` and `"active"` states. The `toRoomSnapshot` function must expose `currentWord` to all players when status is `"ended"`.
- **RoomSnapshot** (extended): The client-facing snapshot must include `currentWord` (non-null) when room status is `"ended"`, regardless of whether the requesting participant is the drawer.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of end-round actions by the host result in all connected players seeing the result screen within 2 polling cycles (~4 seconds maximum).
- **SC-002**: 100% of restart actions by the host result in all connected players landing on the lobby screen with the correct participant list and zeroed scores within 2 polling cycles (~4 seconds maximum).
- **SC-003**: The result screen correctly displays the revealed word, final scores, and full guess history for 100% of completed rounds, including rounds with zero guesses.
- **SC-004**: Non-host players are never shown the End Round or Restart buttons — 0% of non-host sessions see host-only controls.
- **SC-005**: Session restore on the result screen succeeds 100% of the time — a page refresh while on the result screen always returns the player to the result screen with data intact.

## Assumptions

- A round ends only when the host explicitly clicks "End Round"; there is no automatic end condition (no timer, no "all guessers correct" trigger), consistent with the constitution's prohibition on timers.
- The restart action always resets scores to 0 for all participants — cumulative scoring across multiple rounds is out of scope per the constitution.
- The drawer role and word are not re-assigned on restart; the host will start a new round manually from the lobby via the existing "Start Game" flow, which handles drawer assignment and word selection.
- The `"ended"` room status is a new state that sits between `"active"` and `"lobby"` (after restart). The lifecycle is: `"lobby"` → `"active"` → `"ended"` → `"lobby"` (on restart).
- Word privacy (`currentWord` hidden for non-drawers) is only enforced when the room is `"active"`. Once `"ended"`, the word is visible to all players in the snapshot.
- Only the host may end the round or restart; host identity is already tracked on the room from Feature 001.
- Session storage already persists `roomCode` and `participantId` from Feature 001; no new session fields are needed for the result screen.
