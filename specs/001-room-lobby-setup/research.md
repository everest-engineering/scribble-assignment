# Research: Scenario 1 Room Setup & Lobby

## Decision: Track the host explicitly on the room model

**Rationale**: The current room model stores only a participant list. Relying on
list position for host authority would be implicit and brittle once polling and
future room mutations are added. An explicit `hostParticipantId` keeps host-only
rules stable and easy to test.

**Alternatives considered**:

- Infer the host as `participants[0]`
  Rejected because host authority becomes positional rather than declarative.
- Store a boolean `isHost` on each participant
  Rejected because it duplicates room-level authority and increases mutation
  surface.

## Decision: Add a dedicated start endpoint instead of a client-only transition

**Rationale**: Scenario 1 requires host-only start and a minimum of 2 players.
Those rules must be enforced by the backend so non-host clients cannot bypass
them by navigating directly to `/game`. A dedicated `POST /rooms/:code/start`
endpoint makes the rule explicit and keeps the backend authoritative.

**Alternatives considered**:

- Let the lobby button navigate directly to `/game`
  Rejected because it enforces nothing and does not update other players.
- Auto-start once a second player joins
  Rejected because the spec requires host-only control over game start.

## Decision: Use polling on the lobby page every 2 seconds

**Rationale**: The constitution and README require HTTP polling for
synchronization. The existing room store already supports room fetching, so the
lowest-risk design is a `LobbyPage` interval that refreshes the current room
every 2 seconds and reacts to changed room state.

**Alternatives considered**:

- Manual refresh only
  Rejected because the scenario explicitly requires automatic lobby updates.
- Push-based updates
  Rejected because realtime transports are constitutionally forbidden.

## Decision: Validate room codes at both the client and server boundary

**Rationale**: Empty or whitespace-only codes should fail immediately in the join
flow, while malformed or unknown codes must still be rejected safely on the
backend. Dual-layer validation improves feedback without weakening backend
correctness.

**Alternatives considered**:

- Frontend-only validation
  Rejected because backend endpoints must remain safe against malformed input.
- Backend-only validation
  Rejected because it delays obvious user feedback for empty input.

## Decision: Represent the Scenario 1 start transition with `status: "playing"`

**Rationale**: Scenario 1 only needs the lobby to end and the existing game
placeholder route to become active. A simple `lobby -> playing` transition
supports that requirement without introducing drawer assignment, words, guesses,
or scoring.

**Alternatives considered**:

- Keep status fixed as `lobby` and navigate only on the initiating client
  Rejected because other players would never observe the started state.
- Add multiple new round/gameplay states now
  Rejected because they belong to later scenarios and would expand scope.

## Decision: Fix the starter frontend API base URL as part of Scenario 1

**Rationale**: The current default points to `http://localhost:3001/bug`, which
prevents room creation, joining, and polling from working end to end. Scenario 1
cannot be validated without correcting that base path.

**Alternatives considered**:

- Leave the default broken and rely on manual environment overrides
  Rejected because it makes the starter flow fail by default.
- Introduce an additional proxy layer
  Rejected because it adds unnecessary surface area for a local starter app.
