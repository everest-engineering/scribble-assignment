# Feature Specification: Phase 4 Result State and Restart

**Feature Branch**: `005-result-restart-flow`

**Created**: 2026-05-19

**Status**: Draft

**Input**: User description: "I am starting Phase 4 of the Scribble lab. Phase 1 (R1–R5, G1), Phase 2 (G2–G4), and Phase 3 (G5–G9) are complete. This phase covers result state and restart — features G10 and G11.

Before writing the spec, do discovery first. Read these files and note what already exists vs what's missing now that Phases 1–3 are in place:
- backend/src/models/game.ts
- backend/src/services/roomStore.ts
- backend/src/api/rooms.ts
- frontend/src/pages/GamePage.tsx
- frontend/src/components/ResultPanel.tsx
- frontend/src/components/Scoreboard.tsx
- frontend/src/state/roomStore.ts
- frontend/src/services/api.ts

Pay special attention to:
- The Room model now has status "result", winnerId, guessHistory, scores, secretWord, drawerId, and endedAt from Phase 3
- The viewer-specific snapshot logic — guessers still don't receive secretWord even in result state
- The existing ResultPanel component which currently shows guess activity but not a dedicated result view
- The existing polling pattern running on GamePage for playing and result rooms
- The canvas is still interactive for the drawer in result state (known Phase 3 deferral — fix in this phase)

Then write a feature specification for Phase 4 covering:

G10 — Result state: After the first correct guess ends the round, all players see a shared result view showing the correct word, the final scores, and the full guess history. The secret word is now revealed to everyone (not just the drawer) because the round is over.

G11 — Restart flow: From the result state, only the host can restart the round. On restart, all connected clients return to the lobby with the same players preserved. Scores, guesses, canvas, secret word, drawer assignment, and result state are all cleared. The room status returns to "lobby".

For each feature, include:
- Acceptance criteria
- Edge cases discovered during inspection
- Discovery notes — what already works (including Phase 1–3 additions), what is missing or broken

Additional items to address in this phase:
- Canvas must stop accepting input once the room enters result state (deferred from Phase 3)
- Secret word must become visible to all players in result state (Phase 2/3 kept it drawer-only; Phase 4 reveals it)
- POST /rooms/:code/restart endpoint must be created
- Restart must clear: secretWord, drawerId, guesserIds, guessHistory, scores, winnerId, endedAt, and set status back to "lobby"
- Restart must preserve: room code, hostId, participants list

Stay strictly within these features. Do not add multiple rounds, drawer rotation, timers, or any other out-of-scope behavior.

Out of scope (do not include in this spec): WebSockets, live drawing stroke broadcast, persistent storage, authentication, multiple rounds, drawer rotation, timers, speed bonuses, custom word packs."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reveal Shared Result State (Priority: P1)

As a player in a finished round, I want a shared result view that shows the final
word, final scores, and full guess history so everyone can see the same ended-round
outcome.

**Why this priority**: The round already ends in `result`, but Phase 3 stops short
of turning that state into a dedicated shared reveal. Without this story, the
round-ending flow remains incomplete for both drawer and guessers.

**Independent Test**: Finish a round with a correct guess, keep both players on the
game screen, and confirm both players see the same result view with the revealed
word, winner, final scores, and full unredacted history for that room.

**Acceptance Scenarios**:

1. **Given** a room has just entered the result state after the first correct
   guess, **When** any player in that room views the game screen, **Then** the
   screen shows a dedicated result view with the correct word, final scores, and
   full guess history for that round.
2. **Given** a player was a guesser during the round, **When** the room is now in
   the result state, **Then** that player can see the correct word and the winning
   guess text because the round is over.
3. **Given** players in the same room stay connected after the round ends,
   **When** the normal refresh cycle runs, **Then** every player sees the same
   result-state data within about 2 seconds.

**Edge Cases Discovered During Inspection**:

- The room already transitions to `result`, but the current snapshot logic still
  hides `secretWord` from guessers even after the round ends.
- The current `ResultPanel` renders ongoing activity, not a dedicated result-state
  reveal with round-finished messaging.
- The current polling flow already continues for `playing` and `result`, so Phase 4
  must preserve that sync path while changing what data becomes visible in
  `result`.

**Discovery Notes**:

- Phase 3 already records `winnerId`, `guessHistory`, `scores`, `secretWord`,
  `drawerId`, and `endedAt` on the room.
- Phase 3 already moves all clients into a shared `result` room status and keeps
  polling active on the game screen.
- The current canvas lock is already present in the game screen, so stopping input
  in `result` now works and should be preserved.
- What is still missing is the shared reveal: guessers do not yet receive the word,
  and the UI does not yet present a dedicated result view.

---

### User Story 2 - Restart From Result as Host (Priority: P2)

As the host, I want to restart a finished round and send everyone back to the lobby
with the same players still connected so a fresh round can begin from a clean room
state.

**Why this priority**: A finished round currently has no built-in recovery path.
Restart is the smallest next-step flow that preserves the room without introducing
multiple-round logic or new matchmaking behavior.

**Independent Test**: Finish a round, restart it from the result state as the host,
and confirm all connected clients return to the lobby with the same participants
while round-specific data is cleared.

**Acceptance Scenarios**:

1. **Given** a room is in the result state and the viewer is the host, **When** the
   host chooses restart, **Then** the room returns to the lobby state with the same
   room code, host identity, and participant list preserved.
2. **Given** the room has restarted successfully, **When** any connected player
   views the room after the next refresh cycle, **Then** they are back in the lobby
   and no longer see previous round scores, guesses, drawer assignment, secret word,
   winner, or ended-round data.
3. **Given** a viewer is not the host, **When** that viewer is in the result state,
   **Then** the restart action is unavailable or rejected with clear feedback.

**Edge Cases Discovered During Inspection**:

- There is no restart endpoint yet, so the current room model cannot return from
  `result` to `lobby`.
- The game store already restores sessions and polls active rooms, so restart must
  work for already-connected clients without forcing them to rejoin manually.
- Restart must clear round-owned state without deleting the participant list or
  changing `hostId`.

**Discovery Notes**:

- Phase 1 already proved the lobby flow, host-only gating pattern, and room-session
  restoration logic.
- Phase 3 already preserves room sessions across refreshes and navigates back to the
  lobby whenever a fetched room snapshot returns to `lobby`.
- The missing piece is the room-side reset behavior plus host-only restart controls
  in the result UI.

### Edge Cases

- A non-host attempts to restart the room and must be blocked with clear feedback.
- A restart request arrives for a room that is not in the result state and must be
  rejected.
- Two clients refresh near the same time as restart and must converge on the same
  cleared lobby state without stale round data lingering on screen.
- The participant list must stay intact after restart even though `drawerId`,
  `guesserIds`, `secretWord`, `guessHistory`, `scores`, `winnerId`, and `endedAt`
  are cleared.
- The revealed word and winning guess must remain visible to all players only while
  the room is in the result state; after restart that reveal must disappear.
- Restart in one room must never reset result data or participants in another room.

## Constitution Alignment *(mandatory)*

- **Typed Contract Impact**: Room snapshots will change so `result` viewers receive
  the revealed secret word and full guess history. Restart introduces a new
  room-scoped action and response shape for moving a room from `result` back to
  `lobby`.
- **Validation Boundaries**: The system must validate result-state visibility,
  host-only restart permission, restart eligibility only from `result`, and room
  reset rules that clear round data while preserving room identity and
  participants.
- **State & Storage Impact**: Room state remains in-memory. Phase 4 reuses the
  existing single-room model, clearing round-owned fields on restart instead of
  creating a new room or a multi-round history.
- **Scope Guardrail**: This specification is limited to shared result-state reveal,
  host-only restart, lobby return, and preserving the Phase 3 result-state canvas
  lock. Multiple rounds, rotation, timers, persistence, authentication, and live
  drawing sync remain out of scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (G10)**: When a room enters the `result` state, the system MUST present a
  shared result view to all players in that room.
- **FR-002 (G10)**: The shared result view MUST show the correct word, final scores,
  and full guess history from the finished round.
- **FR-003 (G10)**: The secret word MUST become visible to every player in the room
  while the room is in the `result` state.
- **FR-004 (G10)**: The winning correct guess text MUST be visible to every player
  in the room while the room is in the `result` state.
- **FR-005 (G10)**: Result-state data for a room MUST remain synchronized for all
  connected players through the existing refresh cycle within about 2 seconds.
- **FR-006 (G10)**: Once a room is in the `result` state, the drawer canvas MUST
  stop accepting further drawing input.
- **FR-007 (G11)**: Only the host MUST be allowed to restart a room from the
  `result` state.
- **FR-008 (G11)**: The system MUST provide a room-scoped restart action for rooms
  in the `result` state.
- **FR-009 (G11)**: Restarting a room MUST return the room status to `lobby`.
- **FR-010 (G11)**: Restarting a room MUST preserve the room code, host identity,
  and participant list.
- **FR-011 (G11)**: Restarting a room MUST clear the previous round's `secretWord`,
  `drawerId`, `guesserIds`, `guessHistory`, `scores`, `winnerId`, and `endedAt`
  data.
- **FR-012 (G11)**: After restart, all connected clients for that room MUST return
  to the lobby view through the normal refresh/navigation flow without rejoining.
- **FR-013 (G11)**: A restart attempt from a non-host or from a room that is not in
  the `result` state MUST be rejected with clear feedback.
- **FR-014 (G11)**: Restarting one room MUST NOT affect result data, participants,
  or lobby state in any other room.

### Key Entities *(include if feature involves data)*

- **Result Snapshot**: The ended-round room view shown to every player. It carries
  the room code, participant roster, final scores, winner, revealed word, and full
  guess history for the finished round.
- **Restarted Lobby State**: The cleared room state produced by a successful
  restart. It preserves room identity and participants while removing all
  round-specific fields from the last finished round.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After the first correct guess ends a round, 100% of connected players
  in that room can see the same correct word, winner, final scores, and full guess
  history without manual rejoin steps.
- **SC-002**: Result-state updates become visible to other connected players in the
  same room within about 2 seconds of the round ending.
- **SC-003**: After a host restarts a finished room, 100% of connected players in
  that room return to the lobby with the same participant list and no previous
  round data visible.
- **SC-004**: In manual multi-room validation, restarting or revealing results in
  one room causes 0 cross-room leaks of result data, players, or lobby state.

## Assumptions

- The first correct guess continues to be the only event that moves a room from
  `playing` to `result`.
- Phase 4 uses the same room and same players for restart rather than creating a new
  room or tracking multiple completed rounds.
- Clients that remain connected after a round ends continue to rely on the existing
  polling-based refresh pattern rather than a push channel.
- A restarted room begins as a clean lobby and does not automatically start a new
  round.

## Verification Plan *(mandatory)*

- **Build Validation**: `backend npm run build`, `backend npm test`, `frontend npm
  run build`
- **Story Validation**: Verify User Story 1 by ending a round and confirming both
  drawer and guesser see the same result view with revealed word and full history.
  Verify User Story 2 by restarting from the result state as host and confirming
  both clients return to the lobby with preserved participants and cleared
  round-specific state.
- **Manual Multiplayer Checks**: Confirm non-host restart rejection, refresh during
  result and after restart, no stale score/history remnants after restart, and no
  cross-room reset or result leakage.
