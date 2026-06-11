# Research: Room Setup and Lobby

## Decision: Host Ownership Lives on the Room

**Decision**: Add `hostParticipantId` to each room and derive Host/non-host
display state from that field.

**Rationale**: The creator is the Host for the lifetime of this feature's lobby
flow. Storing host ownership on the room keeps participant records simple and
makes start-game authorization deterministic.

**Alternatives considered**:

- Store a role on each participant: rejected because only one Host is needed and
  duplicating role state across participants increases drift risk.
- Infer Host from the first participant every time: rejected because explicit
  ownership is clearer and survives future participant-list operations.

## Decision: Room Status Expands to Lobby and Playing

**Decision**: Change room status from only `lobby` to `lobby | playing`.

**Rationale**: The feature requires all players to transition into the game
state after the Host starts. A room-level status is the smallest shared state
needed to represent that transition across polling clients.

**Alternatives considered**:

- Navigate the Host directly without shared status: rejected because non-host
  players would not know the game started.
- Add detailed round state now: rejected because drawing, guessing, scoring, and
  results belong to later features.

## Decision: Use a Host-Only Start Endpoint

**Decision**: Add `POST /rooms/{code}/start` with the requesting participant id.
The operation succeeds only when the participant is Host, the room exists, the
room is still in the lobby, and at least two players are present.

**Rationale**: Start Game is a state-changing action and must be validated on
the backend, not only by hiding a frontend button.

**Alternatives considered**:

- Let clients set room status through a generic update endpoint: rejected because
  it allows broad mutation and weaker rules.
- Use query parameters for the participant id: rejected for state-changing
  requests because the body is clearer for command-style input.

## Decision: Poll Lobby State Every 2 Seconds

**Decision**: The lobby page starts a 2-second interval that calls the existing
room fetch flow, clears the interval on unmount, and navigates to `/game` when
the fetched room status is `playing`.

**Rationale**: Polling satisfies the no-push-protocol constraint and keeps the
UI synchronized closely enough to meet the 3-second success criteria.

**Alternatives considered**:

- Manual refresh only: rejected because the spec requires automatic refresh.
- WebSockets or server-sent events: rejected by the constitution and assignment
  scope.

## Decision: Normalize and Validate Room Codes at Boundaries

**Decision**: Trim room codes, uppercase them for matching, require the existing
4-character code format, reject empty values with a required-code message, reject
invalid formats with a format message, and reject missing rooms with a not-found
message.

**Rationale**: Clear validation separates user input mistakes from non-existent
rooms and makes acceptance scenarios directly testable.

**Alternatives considered**:

- Treat every failed join as "Unable to join room": rejected because the spec
  requires clear messages for empty, invalid, and non-existent codes.
- Accept any string and try lookup: rejected because invalid format feedback
  would be impossible.

## Decision: Keep Room Isolation in the Existing In-Memory Store

**Decision**: Continue to store rooms in a `Map` keyed by room code. Every join,
fetch, and start operation looks up exactly one normalized code and mutates or
returns only that room.

**Rationale**: This preserves the current architecture, keeps memory-only state,
and makes cross-room isolation simple to validate.

**Alternatives considered**:

- Add persistent storage: rejected by the constitution.
- Add a global game state object shared across rooms: rejected because it would
  increase accidental cross-room coupling.

## Decision: Validate With Focused Tests and Two-Browser Manual Flow

**Decision**: Add backend tests for room-store behavior and schemas, frontend
tests for API contracts where practical, and manual two-browser validation for
polling and navigation.

**Rationale**: Unit tests cover deterministic state rules, while two-browser
checks verify the user-facing synchronization behavior.

**Alternatives considered**:

- Manual validation only: rejected because host/start and validation rules are
  deterministic and low-cost to test.
- Full end-to-end automation: deferred because the current project does not have
  an established browser automation setup.
