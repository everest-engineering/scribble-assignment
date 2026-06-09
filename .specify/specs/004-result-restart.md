# Feature Specification: Result, Restart & Final Validation

**Feature Group**: 004 — Result, Restart & Final Validation
**Created**: 2026-06-09
**Status**: Draft
**Input**: Business Scenario 4 — Result, Restart & Final Validation

---

## Problem Statement

Feature Group 3 (Gameplay Interaction) implemented canvas drawing, guess submission, scoring, and guess history synchronization via polling. When a round is active, the drawer draws, guessers submit guesses, and scores are tracked. However, there is no mechanism to transition out of the playing state, no result view where participants can see the revealed secret word and final scores, and no way to reset the round state and return to the lobby for another game.

This feature group implements the round-end transition to a result state, the display of final round information to all participants, and a host-triggered restart that preserves the player roster while clearing all round-specific state.

---

## User Story

### User Story — Result, Restart & Final Validation (Priority: P1)

When a round ends, participants see the result: the secret word is revealed to everyone, final scores are displayed, and the full guess history is visible. From the result view, the host can restart the game. Restarting returns all participants to the lobby with their identities preserved, and all round-specific data (secret word, guesses, scores, drawer assignment) is cleared in preparation for a new game.

**Why this priority**: P1 — Without a result state, participants cannot see the outcome of a completed round. Without restart, the game cannot be replayed without creating a new room. Both are essential for a complete game lifecycle.

**Independent Test**: Two browser tabs complete a round. Both tabs show the secret word, final scores, and guess history. The host clicks restart. Both tabs navigate to the lobby showing all participants with no round data visible.

---

## Functional Requirements

### FR-001: Result State
The system MUST support a room status representing the result state. When the round has ended, the system MUST transition the room to this result state.

### FR-002: Secret Word Reveal
When the room is in the result state, the system MUST reveal the secret word to ALL participants. The secret word shall be included in the room snapshot returned by all room-scoped API calls, regardless of the viewer's identity.

### FR-003: Final Scores Display
When the room is in the result state, the system MUST include each participant's final score in the room snapshot. Scores reflect all points earned during the completed round.

### FR-004: Full Guess History
When the room is in the result state, the system MUST include the full ordered history of all guesses submitted during the completed round in the room snapshot.

### FR-005: Host Restart
The system MUST allow the host to trigger a restart from the result state. The restart action MUST transition the room back to the lobby state.

### FR-006: Player Preservation
When the host triggers a restart, all participants currently in the room MUST be preserved. No participant shall be removed or disconnected as a result of the restart.

### FR-007: Round State Clear
When the host triggers a restart, the system MUST clear all round-specific state, including:
- The secret word
- The guess history
- All participant scores
- The drawer assignment

The following MUST be preserved across restart:
- The room code
- The participant roster (identities and IDs)
- The host designation

---

## Acceptance Criteria

The following criteria use the EARS (Easy Approach to Requirements Syntax) notation where applicable.

### Result State

- **AC-001 (State)**: When the room is in the result state, the room snapshot shall include a status value that is distinct from both `"lobby"` and `"playing"`.

### Secret Word Reveal

- **AC-002 (State)**: When the room is in the result state, every room snapshot returned to any participant shall include the secret word used during the completed round.
- **AC-003 (State)**: When the room is in the result state, an API request that does not specify a viewer identity shall also receive the secret word.

### Final Scores

- **AC-004 (State)**: When the room is in the result state, each participant in the room snapshot shall have a `score` field reflecting their total points from the completed round.

### Guess History

- **AC-005 (State)**: When the room is in the result state, the room snapshot shall include the full ordered list of guesses submitted during the completed round.

### Host Restart

- **AC-006 (Response)**: When the host requests a restart from the result state, the system shall transition the room to the lobby state and return the updated room snapshot.
- **AC-007 (Response)**: When a non-host participant requests a restart, the system shall reject the action with a clear error message stating that only the host can restart.

### Player Preservation

- **AC-008 (State)**: After a restart, the room snapshot shall contain the same set of participants (by ID) that were present before the restart.
- **AC-009 (State)**: After a restart, each participant's identity and ID shall be unchanged from before the restart.

### Round State Clear

- **AC-010 (State)**: After a restart, the room snapshot shall NOT contain a secret word.
- **AC-011 (State)**: After a restart, the room snapshot shall contain an empty guess history.
- **AC-012 (State)**: After a restart, every participant in the room snapshot shall have a score of 0.
- **AC-013 (State)**: After a restart, the room snapshot shall have an empty or null drawer identifier.

### Polling Continuity

- **AC-014 (State)**: While the result or lobby page is displayed, the system shall continue to poll the room state at approximately 2-second intervals to reflect state changes (including restart).

---

## Edge Cases

- **Host restarts while a non-host is on the game page**: The non-host's next poll returns the lobby state. Their frontend should navigate to the lobby view automatically. Non-host participants do not need to take action.
- **Non-host attempts restart**: The system rejects the request with a clear error. Only the host can restart.
- **Participant joins during result state**: A participant joining mid-session sees the result state: the revealed secret word, final scores of existing participants, and the full guess history. Their own score starts at 0.
- **Restart with a single participant remaining**: If other participants have left (closed their browser), the host restart still succeeds. The minimum-player requirement applies only to starting a game, not to restarting.
- **Multiple restart requests**: If the host clicks restart multiple times rapidly, the first request succeeds and subsequent requests fail (room is no longer in result state). The frontend should disable the restart button after the first click.
- **Polling during result state**: The same polling mechanism continues during the result state so that participants see the restart transition without manual refresh.
- **Drawer ID after restart**: After restart, the `drawerId` field should be empty/null since no round is active. The next game will assign a drawer when the host starts again.

---

## Non-Goals

The following are explicitly NOT in scope for this feature group:

- Defining how a round ends (trigger mechanism, winner detection, timer expiry)
- Multiple rounds or round progression
- Next round functionality (the only action from result is restart to lobby)
- Drawer rotation (the host remains host; drawer assignment reoccurs on next game start)
- Winner determination or podium display
- Leaderboards or high-score tracking
- Round timers or countdowns
- Speed bonuses or partial scoring
- Drawer bonuses
- Spectator mode
- Disconnect detection or reconnection logic
- Room deletion or expiry after restart
- Custom word packs or word list editing
- Persistent score history across restarts
- Chat or messaging

---

## Success Criteria

| ID | Criterion | Verification Method |
|---|---|---|
| SC-001 | Two browser tabs complete a round and transition to result; both tabs show the same secret word, final scores, and full guess history | Manual test with two browser tabs |
| SC-002 | The host clicks restart from the result view; both tabs navigate to the lobby within approximately 3 seconds | Manual test with two browser tabs |
| SC-003 | After restart, the lobby shows the same participants (by name) as before, with no round data visible (no secret word, no guesses, all scores at 0) | Manual test with two browser tabs |
| SC-004 | A non-host participant clicking restart sees an error message; the room does not transition | Manual test: non-host attempts restart |
| SC-005 | All participants in the lobby after restart can start a new game (host clicks start, game begins normally) | Manual test: start a second game from the same room |
| SC-006 | Polling continues during the result and lobby states; no manual refresh is needed to see the restart transition | Manual test: observe automatic navigation after restart |
| SC-007 | Existing unit tests for Feature Groups 1, 2, and 3 continue to pass | Run `npm test` in backend and frontend directories |
| SC-008 | Room isolation is maintained: result state from one room is not visible in another room | Manual test with two separate rooms |

---

## Key Entities

- **Result State**: A room status indicating that the round has ended. All participants can see the secret word, final scores, and full guess history. No gameplay actions (drawing, guessing) are available.
- **Restart**: A host-only action that transitions the room from the result state back to the lobby state. Preserves participants and the room code. Clears all round-specific state.
- **Preserved State**: Data that survives a restart: room code, participant list (with IDs), and host designation.
- **Cleared State**: Data that is removed on restart: secret word, guess history, participant scores, and drawer assignment.

---

## Assumptions

1. **Round end trigger is external to this feature group.** The mechanism by which the room transitions from `"playing"` to the result state is not defined in this specification. It may be a manual host action, an automatic detection, or any other mechanism. This spec defines only the behavior once the result state is entered.
2. **Polling continues unchanged.** The same 2-second polling mechanism from Feature Groups 1–3 continues during the result state and the lobby state after restart. No changes to polling behavior are required.
3. **Restart is not "next round".** Restart returns participants to the lobby. It does not start a new round. The host must explicitly start a new game from the lobby to begin another round.
4. **Scores are round-scoped.** Scores are part of the round state and are cleared on restart. There is no cross-round score accumulation or leaderboard.
5. **Participants are never removed by restart.** Restart only clears round data. Participant identity and presence in the room are never affected.
6. **Result state is read-only.** No gameplay actions (drawing, guessing) are permitted in the result state. The only action available is host restart.
