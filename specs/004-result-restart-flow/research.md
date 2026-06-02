# Research: Result Restart Flow

## Decision: Model Result as an Explicit Room Status

Use a result status between active gameplay and lobby. While in result, snapshots reveal the completed secret word, final scores, and complete guess history to every current participant.

**Rationale**: The specification requires all players to see result details before restart, and restart must be available only after the round has ended. A distinct status gives the backend and frontend a clear validation boundary.

**Alternatives considered**:

- Keep status as playing and infer result from a flag: rejected because gameplay mutations and secret-word visibility would be harder to validate clearly.
- Return directly to lobby after correct guess: rejected because players would not have a stable result state to review.

## Decision: Preserve a Completed Round Snapshot Until Restart

At end-of-round time, copy the revealable outcome from the active round into completed result data: secret word, final scores, guess history, drawer identity, canvas state, and timestamps.

**Rationale**: This keeps result display stable even though active gameplay should stop accepting drawing and guessing actions. It also provides one source for result snapshots while preserving the existing active-round model.

**Alternatives considered**:

- Keep using `currentRound` as both active and completed data: rejected because it blurs active mutation rules with read-only result display.
- Persist historical rounds: rejected because persistence and multiple rounds are out of scope.

## Decision: Use a Controlled End-Round Transition

Add an explicit end-round operation that changes a room from playing to result after validating the current room state.

**Rationale**: Feature Group 4 needs a deterministic way to reach result state for final validation and tests. An explicit transition avoids hidden timers or automatic multi-round behavior.

**Alternatives considered**:

- Timer-based round ending: rejected because timers are explicitly out of scope.
- Automatic next-round progression on correct guess: rejected because multiple rounds and automatic progression are out of scope.

## Decision: Restart Resets Round State and Returns to Lobby

Restart is a host-only mutation from result to lobby that preserves room code, host, and current participants while clearing all round-specific state.

**Rationale**: The business scenario requires players to remain in the room after restart while all game state is cleared. Treating restart as a lobby reset avoids score carryover and stale secret-word leakage.

**Alternatives considered**:

- Create a new room on restart: rejected because the room code must remain unchanged and the player list must be preserved.
- Retain scores as session history: rejected because scores must reset and persistence/history are out of scope.
- Start a fresh round immediately: rejected because restart must return players to the lobby.

## Decision: Reuse Existing Polling for Result and Restart Synchronization

Use the existing room polling endpoint and cadence for moving clients from gameplay to result and from result to lobby.

**Rationale**: The project constitution requires polling-only synchronization. Reusing the current room snapshot flow keeps all tabs convergent without new transport or lifecycle complexity.

**Alternatives considered**:

- WebSockets, server-sent events, or long polling: rejected by project constraints.
- A separate result polling endpoint: rejected because the existing room snapshot can represent room status and viewer-specific visibility.

## Decision: Keep Validation in Both UI and Backend

The frontend should show restart only to the host in result state, while the backend remains authoritative for room, participant, host role, and status validation.

**Rationale**: UI gating prevents confusing interactions, and backend validation protects shared in-memory state when requests are stale, forged, or duplicated.

**Alternatives considered**:

- Frontend-only authorization: rejected because shared room state can be mutated only after backend validation.
- Backend-only authorization with visible controls for all players: rejected because non-host players need a clear waiting state instead of a failing control.
