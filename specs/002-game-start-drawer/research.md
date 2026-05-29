# Research: Scenario 2 Game Start & Drawer Flow

## Decision: Trim and validate player names at the API boundary

**Rationale**: Scenario 2 requires whitespace-only name rejection for both room
creation and joining. Enforcing this at the API boundary keeps invalid names out
of the room store entirely and guarantees the rest of the system only receives
trimmed, accepted values.

**Alternatives considered**:

- Validate only in frontend forms
  Rejected because backend correctness cannot depend on client behavior.
- Accept whitespace-only names and replace them with a default
  Rejected because the spec requires rejection, not silent substitution.

## Decision: Store round state on the room model

**Rationale**: The current game flow already centers on one in-memory room
object. Adding round state directly to that room keeps the state transition
atomic and avoids introducing a new top-level store for a single-round feature.

**Alternatives considered**:

- Separate round map keyed by room code
  Rejected because it adds coordination overhead without new value.
- Derive drawer and word on every fetch without persisting them
  Rejected because round identity must remain stable once the game starts.

## Decision: Use host-first drawer assignment with first-player fallback

**Rationale**: The user requested deterministic assignment to the host or first
player. Using the room host as the primary rule keeps Scenario 2 aligned with
Scenario 1 authority, while first participant fallback covers degraded host
state without ambiguity.

**Alternatives considered**:

- Always choose the first participant
  Rejected because it ignores the Scenario 1 host model.
- Random assignment
  Rejected because Scenario 2 requires deterministic behavior.

## Decision: Select the secret word deterministically from the starter list

**Rationale**: Scenario 2 needs a stable, repeatable word source without adding
new packs or randomization complexity. A deterministic room-derived selection
from the starter list satisfies repeatability and keeps the feature in scope.

**Alternatives considered**:

- Random word selection
  Rejected because the scenario requires deterministic behavior.
- User-provided word source
  Rejected because custom packs are out of scope.

## Decision: Build viewer-specific room snapshots

**Rationale**: Drawer-only word visibility is easiest to preserve when the
backend emits different room snapshots for different participants. This keeps
secret word enforcement in one place and avoids relying on the frontend to hide
sensitive state it should never receive.

**Alternatives considered**:

- Send the real word to every client and hide it in the UI
  Rejected because non-drawers would still receive the secret value.
- Create a separate `/rooms/:code/secret-word` endpoint for the drawer
  Rejected because it complicates polling and splits one round state across two
  contracts.

## Decision: Keep Scenario 2 on the existing start-room endpoint

**Rationale**: Starting the room already marks the transition from lobby to
game. Extending `POST /rooms/:code/start` to initialize the round state keeps
the transition atomic and avoids a second command that would duplicate state
checks.

**Alternatives considered**:

- Add a second endpoint to initialize the round after start
  Rejected because it adds unnecessary sequencing risk.
- Initialize round state lazily on first game fetch
  Rejected because different clients could observe inconsistent first-load
  behavior.
