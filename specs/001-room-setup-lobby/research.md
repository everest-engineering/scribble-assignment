# Research: Room Setup & Lobby

## Decision: Store Host Identity as Participant ID

**Rationale**: The creator already receives a generated participant id when a room is
created. Storing that id on the room keeps host ownership stable even if display names
repeat and avoids adding authentication or sessions.

**Alternatives considered**: Marking the first array position as host was rejected because
future participant-list operations could accidentally change permissions. Using a user
account or session was rejected because authentication is out of scope.

## Decision: Represent Start With a Minimal Room Status Transition

**Rationale**: Feature 1 only needs to leave the lobby and allow all players to proceed to
the game screen. Extending room status from `lobby` to `in-game` satisfies this feature
without introducing drawer assignment, words, scoring, or round state.

**Alternatives considered**: Adding a full round model was rejected because drawer flow,
drawing, scoring, and results belong to later feature groups.

## Decision: Validate Room Codes Before Room Lookup

**Rationale**: Empty and whitespace-only codes should produce a specific "room code is
required" style message, while unknown codes should produce a separate "room not found or
unable to join" style message. Zod is already used for route validation and matches the
constitution.

**Alternatives considered**: Allowing lookup to handle all failures was rejected because it
would blur empty-code errors with invalid-code errors.

## Decision: Keep Lobby Polling in the Lobby View Lifecycle

**Rationale**: The current frontend room store already has `fetchRoom()`, and polling is
only required while the user is in the lobby. Starting and stopping a two-second interval
from the lobby view keeps network activity scoped to the visible workflow.

**Alternatives considered**: Global polling in the room store was rejected because it would
continue outside the lobby unless extra lifecycle controls were added. WebSockets and
other push protocols are prohibited.

## Decision: Reuse Existing Test Stack

**Rationale**: Both apps already use Vitest. Backend service and schema tests can cover
host assignment, room isolation, and start preconditions; frontend tests can cover API
client behavior and store methods where practical.

**Alternatives considered**: Adding browser automation or new testing libraries was
rejected for this slice because the assignment already requires manual two-browser
validation and no new dependency is necessary.
