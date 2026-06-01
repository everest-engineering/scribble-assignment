# Research: Game Start & Drawer Flow

## Decision: Backend owns the game-start transition

**Rationale**: The current lobby button only navigates the host to `/game`, which does not update room state for other players. Scenario 2 requires every player to see the same drawer and active round, so starting must mutate the shared in-memory room state.

**Alternatives considered**:

- Frontend-only navigation: rejected because other players would not observe a shared active round through polling.
- Client-derived drawer and word: rejected because every client could drift or reveal the wrong information.

## Decision: Add a dedicated start-room action

**Rationale**: Starting a game is a room state transition distinct from joining or reading a room. A dedicated action keeps validation and error handling explicit: room exists, requester is host, there are at least two valid players, and the room is still in the lobby.

**Alternatives considered**:

- Reuse `GET /rooms/:code`: rejected because reads should not mutate room state.
- Start implicitly when navigating to the game page: rejected because navigation is local to one browser.

## Decision: Assign host as first drawer, fallback to first participant

**Rationale**: The Scenario 2 requirement says "host (or first player)" and Scenario 1 establishes host tracking. Using the host as primary drawer preserves the intended rule while the first-player fallback makes the state transition deterministic if host data is missing.

**Alternatives considered**:

- Random drawer: rejected because the scenario asks for deterministic behavior.
- First participant always: rejected because the host rule is more specific when host data exists.

## Decision: Select the first starter word for the first round

**Rationale**: The README says words come from the starter list and the spec asks for deterministic selection. The first list item, `rocket`, is the simplest stable choice for first-round validation.

**Alternatives considered**:

- Random word: rejected because it makes acceptance testing inconsistent.
- Hash room code to select a word: rejected as unnecessary for Scenario 2 and less transparent for reviewers.

## Decision: Enforce drawer-only word visibility in snapshots

**Rationale**: The frontend already fetches room snapshots with an optional `participantId` query. The backend can use that viewer identity to include `secretWord` only for the drawer and omit it for guessers. This keeps the fairness rule centralized.

**Alternatives considered**:

- Send the word to all clients and hide it in UI: rejected because non-drawers would still receive the secret.
- Create a separate drawer-only endpoint: rejected because the current snapshot pattern already supports viewer-specific data with less surface area.

## Decision: Continue using HTTP polling

**Rationale**: The project constitution and README forbid WebSockets and real-time push. Existing lobby polling already refreshes room state about every 2 seconds, which is enough for start transition visibility.

**Alternatives considered**:

- WebSockets or Socket.io: rejected by project constraints.
- Manual refresh only: rejected because Scenario 1 established polling and players should naturally move into active game state.
