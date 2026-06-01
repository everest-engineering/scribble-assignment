# Research: Round End and Restart

## Decision 1: Model the end of a round as an explicit round phase
- Decision: Keep the room in the game flow and add an explicit round phase for
  `active` and `ended`.
- Rationale: The existing UI already routes on room-level lobby versus game
  state. A separate phase lets the game page show the end-of-round summary
  without forcing a route change or room recreation.
- Alternatives considered: Changing the room status to a third summary state or
  storing the summary only on the client. Those were rejected because they add
  routing complexity or break the shared room snapshot model.

## Decision 2: Reveal the secret word to all viewers only after the round ends
- Decision: Keep the secret word hidden from guessers during the active round
  and expose it to everyone once the round reaches the ended phase.
- Rationale: The feature requires the final word to be visible to all players
  at the end of the round while preserving drawer-only visibility during play.
- Alternatives considered: Always revealing the word or keeping it drawer-only
  after the round ends. Those were rejected because they conflict with the
  stated summary experience.

## Decision 3: Restart through a host-only HTTP endpoint
- Decision: Add a host-only restart action that clears round state and returns
  the room to the lobby while preserving participants.
- Rationale: Restart must be shared across all viewers, and the current app
  already syncs by polling server snapshots.
- Alternatives considered: Client-only resets, creating a new room, or
  broadcasting a restart through push transport. Those were rejected because
  they would not keep all viewers aligned or would violate project rules.

## Decision 4: Reject late round actions after the round ends
- Decision: Treat guesses and drawing attempts after the round has ended as
  invalid mutations.
- Rationale: The end-of-round summary must remain stable after the first
  correct guess is accepted.
- Alternatives considered: Allowing late actions to append to history or simply
  ignoring them. Those were rejected because they would blur the finished round
  state.

## Decision 5: Keep polling as the synchronization mechanism
- Decision: Continue using HTTP polling for lobby, active round, end summary,
  and restart updates.
- Rationale: The constitution forbids WebSockets and the current application
  already uses polling for freshness.
- Alternatives considered: WebSockets or server-sent events. Those were
  rejected because they violate the repository constraints.
