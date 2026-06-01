# Research: Host and Join Lobby Flow

## 1. Stack and execution model

- Decision: Keep the existing Express backend, React frontend, Vite tooling,
  and Vitest test setup.
- Rationale: The starter already uses this stack and the constitution forbids
  changing it for this feature.
- Alternatives considered: Adding a new state-management library, introducing
  realtime transport, or swapping the backend framework.

## 2. Room state model

- Decision: Keep room and participant state in memory on the backend and
  expose a room snapshot to the frontend.
- Rationale: The starter already stores rooms in a `Map`, and the feature
  requires disposable multiplayer sessions rather than persistent accounts.
- Alternatives considered: Database persistence, file storage, or session-based
  identity.

## 3. Input validation

- Decision: Validate names and room codes at the API boundary and present clear
  feedback for empty or invalid values.
- Rationale: The feature’s acceptance criteria depend on rejecting invalid
  input before the player enters the lobby.
- Alternatives considered: Letting the UI handle validation only, or accepting
  loosely formatted values and normalizing later.

## 4. Lobby freshness

- Decision: Use HTTP polling for lobby refresh at an interval of about 2
  seconds while the lobby screen is open.
- Rationale: The constitution explicitly forbids push transport, and polling
  is the simplest fit for a lightweight room snapshot.
- Alternatives considered: WebSockets, server-sent events, and manual refresh
  only.

## 5. Host gating

- Decision: Treat the first participant in a created room as the host and only
  allow that participant to start the game once at least two players are
  present.
- Rationale: This matches the feature spec and gives the lobby a single clear
  owner with minimal state.
- Alternatives considered: Rotating host assignment or allowing any player to
  start the game.
