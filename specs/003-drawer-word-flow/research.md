# Research: Phase 2 Drawer Word Flow

## Decision: Store started-round state directly on the room

Rationale: Phase 2 only needs one active round and one secret word per room. Adding
explicit round fields to `Room` keeps the service-layer state inspectable and
deterministic, which matches the constitution and avoids a second in-memory store.

Alternatives considered:

- Separate round store keyed by room code: more moving parts without Phase 2 value.
- Frontend-only derived round state: not authoritative and unsafe for secrecy.

## Decision: Keep the host as the deterministic drawer

Rationale: Phase 1 already established the host as the only user allowed to start
the game. Reusing that participant as the drawer makes the start transition easy to
reason about and keeps validation deterministic across runs.

Alternatives considered:

- First participant by `joinedAt`: possible, but duplicates host authority with a
  second rule.
- Random drawer selection: conflicts with deterministic validation goals.

## Decision: Select the first starter word (`rocket`) for every fresh Phase 2 round

Rationale: The approved spec calls for deterministic selection, and the current
starter list already begins with `rocket`. This gives stable manual validation and
avoids introducing random behavior before later phases.

Alternatives considered:

- Random word selection: not deterministic.
- Host-selected word: outside scope.
- Rotating by room or time: premature and harder to validate.

## Decision: Enforce secrecy at snapshot-construction time

Rationale: `toRoomSnapshot(room, viewerParticipantId)` is already the single place
where room responses are projected for clients. Making it viewer-aware prevents
secret-word leakage consistently across create, fetch, and start flows.

Alternatives considered:

- Hide the word only in the UI: guessers could still inspect API responses.
- Add per-route secrecy logic: duplicates behavior and increases drift risk.

## Decision: Omit the secret-word field entirely for guessers

Rationale: The clarification resolved this explicitly. A missing field is safer and
clearer than a nullable or masked field because it avoids accidental assumptions
that the value exists for everyone.

Alternatives considered:

- `secretWord: null`: still exposes the field shape to guessers.
- Masked placeholder: adds ambiguity and is not needed until later gameplay UI.

## Decision: Keep Phase 1 lobby roles and Phase 2 round roles separate

Rationale: `host | player` still expresses lobby ownership and start authority,
while `drawer | guesser` expresses the started round. Keeping them distinct avoids
overloading one field with two different lifecycles.

Alternatives considered:

- Reuse one role field for both states: simpler on paper, but muddles meaning
  across the lobby-to-game transition.
