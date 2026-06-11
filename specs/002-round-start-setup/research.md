# Research: Round Start Setup

## Decision: Validate Player Names at Backend Boundaries

**Decision**: Trim `playerName` at backend request validation boundaries and
reject empty or whitespace-only names before creating or joining a participant.

**Rationale**: The backend is the authoritative owner of room state. Validating
there guarantees all clients, including future or misbehaving clients, share the
same trimmed participant names and cannot introduce blank players into round
setup.

**Alternatives considered**:

- Frontend-only validation: rejected because direct API calls could still create
  invalid room state.
- Default blank names to "Player": rejected because the clarified spec requires
  empty or whitespace-only names to be rejected with clear feedback.

## Decision: First-Round State Lives on the Room

**Decision**: Store the current first-round state on the room when the game
begins, including round number, drawer participant id, selected secret word, and
start timestamp.

**Rationale**: Round state belongs to exactly one isolated room and must be
shared across polling clients. Keeping it on the room preserves the current
in-memory architecture and avoids global state that could leak between rooms.

**Alternatives considered**:

- Derive the first round on every fetch: rejected because repeated derivation
  risks drift and makes start-time validation harder.
- Store round state separately from rooms: rejected because there is no need for
  cross-room round lookup in this feature.

## Decision: Host-First Drawer Selection With Join-Order Fallback

**Decision**: Assign the Host as first-round drawer when the Host is eligible.
If the Host is not eligible, assign the first eligible player by stable join
order.

**Rationale**: This implements the clarified first-round rule and keeps
assignment deterministic and easy to validate in two browser sessions.

**Alternatives considered**:

- Always use the first joined player: rejected because it ignores explicit Host
  priority.
- Implement full later-round rotation now: rejected because clarification scoped
  later-round controls out of this feature.

## Decision: First Starter Word Is the First-Round Secret Word

**Decision**: Select the first-round secret word as the first entry in the
ordered starter word list.

**Rationale**: The feature requires deterministic selection and scopes only the
first round. The first list entry is simple, stable, and verifiable without
adding randomness or seed management.

**Alternatives considered**:

- Random word selection: rejected because clients need consistent deterministic
  behavior.
- Hash room code into the word list: rejected because it adds unnecessary
  complexity and makes the expected first-round word harder to test.

## Decision: Use Viewer-Specific Snapshots for Secret-Word Privacy

**Decision**: Keep room snapshots viewer-specific. When the viewer is the
assigned drawer, the current round includes `secretWord`; otherwise the field is
omitted so non-drawers receive no secret word value.

**Rationale**: The clarification requires non-drawers to receive no secret word
value, not merely hide it in the interface. The existing fetch flow already
accepts viewer identity, so this extends the established pattern.

**Alternatives considered**:

- Send the secret word to all clients and hide it in the UI: rejected because it
  leaks the answer to non-drawer clients.
- Send a masked placeholder in the same field: rejected because it weakens the
  "no secret word value" rule and complicates type handling.

## Decision: Keep Later-Round Rotation Out of Scope

**Decision**: Document that later-round drawer rotation should follow stable
join order after the Host's first turn, but do not add next-round controls,
timers, scoring, or result-driven transitions in this feature.

**Rationale**: This keeps the implementation aligned with the clarified scope
while preserving a clear future rule for later planning.

**Alternatives considered**:

- Add Host-controlled next-round actions now: rejected because the user selected
  first-round setup only.
- Add automatic next-round starts: rejected because it would require timer,
  guessing, or scoring rules that are explicitly out of scope.

## Decision: Validate With Store, Schema, API, and Two-Client Checks

**Decision**: Add backend tests for schema and room-store behavior, frontend API
or UI-focused tests where practical, and manual two-client validation for
viewer-specific secret-word visibility.

**Rationale**: Deterministic state rules are cheap to test in isolation, while
two clients are the clearest way to validate drawer-only visibility and polling
behavior from the user's perspective.

**Alternatives considered**:

- Manual validation only: rejected because name validation, drawer selection,
  and word selection are deterministic and should be covered by focused tests.
- Full end-to-end automation: deferred because this project does not currently
  establish browser automation tooling.
