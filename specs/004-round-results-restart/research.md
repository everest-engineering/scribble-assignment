# Research: Round Results & Restart

## Decision: Capture an immutable round-result snapshot when the round ends

**Rationale**: The result view must be final and consistent across clients. A
snapshot containing the correct word, final scores, and ordered guess history
prevents late drawing, clearing, or guessing attempts from changing the visible
outcome after the round ends.

**Alternatives considered**:

- Derive results from the mutable active round on every poll. Rejected because
  any late mutation bug could alter final results.
- Store only the correct word and recalculate scores/history from active state.
  Rejected because restart must clear active state and because result data should
  remain stable until restart.

## Decision: Add a distinct `results` room state

**Rationale**: The room already moves through lobby and active play concepts.
Results require different permissions from both: players can view final data,
but cannot draw, guess, clear, or join. A distinct state makes route guards,
frontend rendering, and polling behavior explicit.

**Alternatives considered**:

- Keep `playing` and add an `isEnded` flag. Rejected because it makes every
  active-round command inspect multiple flags and increases drift risk.
- Return to lobby immediately after ending. Rejected because players would lose
  the result view before reviewing the round outcome.

## Decision: Restart is a Host-only command from results to lobby

**Rationale**: The spec requires only the Host to restart, preserving membership
while resetting round-specific state. A single explicit restart action keeps the
transition deterministic and easy to test.

**Alternatives considered**:

- Allow any player to restart. Rejected because it violates Host control.
- Automatically restart after showing results. Rejected because players need
  time to review the correct word, final scores, and guess history.
- Start the next round immediately on restart. Rejected because the spec says
  players return to lobby prepared for a new game.

## Decision: Preserve players and Host identity, clear all round-specific state

**Rationale**: Restart should keep the group together while preventing previous
drawings, guesses, scores, drawer assignment, and secret word from leaking into
the next game. Returning to lobby with the same membership matches the existing
room flow.

**Alternatives considered**:

- Preserve cumulative scores after restart. Rejected because the requirement
  explicitly resets round-specific scores and prepares for a new game.
- Preserve the previous result in lobby history. Rejected because historical
  round retention is outside scope.

## Decision: Reject joins while results are displayed

**Rationale**: The result view is for current players from the ended round.
Allowing new players during results would complicate final-score visibility and
raise ambiguity about whether newcomers should see the correct word and history.
Normal join behavior resumes once the Host restarts to lobby.

**Alternatives considered**:

- Allow new players to join as lobby members during results. Rejected because
  the room is not yet in lobby state.
- Allow new players to spectate results. Rejected because spectator mode is out
  of scope.

## Decision: Continue using polling for result consistency

**Rationale**: Project constraints require HTTP polling only. Returning the
`roundResult` in normal room snapshots lets all clients converge on the same
result view within the existing polling cadence.

**Alternatives considered**:

- Push result updates with WebSockets, server-sent events, or similar protocols.
  Rejected by the project constitution.
- Require manual refresh. Rejected because previous room/game flows rely on
  automatic polling for shared state.

## Decision: Round-end trigger remains outside this feature

**Rationale**: The specification starts at "when a round ends" and does not
define timers, manual end-round controls, or completion rules. This feature
should provide the ended-round state transition and results/restart behavior for
the existing or future round lifecycle to call, without introducing new timing or
round-completion rules.

**Alternatives considered**:

- Add a Host end-round button. Rejected because that changes game-control scope.
- Add timer-based round ending. Rejected because timers are outside the previous
  active-round scope and not requested here.
