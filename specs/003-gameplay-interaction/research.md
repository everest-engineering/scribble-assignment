# Research: Gameplay Interaction

## Drawing State Representation

- **Decision**: Store drawing as a compact ordered list of stroke objects on the active round, where each stroke contains a generated stroke ID, color, brush size, and normalized points.
- **Rationale**: The existing project has no drawing dependency and must avoid new libraries unless necessary. Stroke data maps naturally to browser canvas pointer events, is serializable in JSON, supports clearing by replacing the list with an empty array, and can be returned in the existing polling snapshot.
- **Alternatives considered**: Storing a full image data URL was rejected because every update would move large payloads and make clearing/history less explicit. Storing only the latest point was rejected because it would not let polling clients reconstruct the current drawing.

## Canvas Synchronization

- **Decision**: Use HTTP requests for drawer drawing/clear mutations and reuse `GET /rooms/:code?participantId=...` polling to distribute the latest canvas state, guess history, and scores.
- **Rationale**: This directly satisfies the polling-only constitution and keeps synchronization inside the existing room snapshot flow. Drawer-local updates can appear immediately after successful mutation, while other players observe the next polled snapshot.
- **Alternatives considered**: WebSockets, server-sent events, and long polling were rejected because they violate project constraints. Client-only drawing was rejected because guessers and refreshed drawer views would not see shared state.

## Guess Validation and Scoring

- **Decision**: Add a backend `submitGuess` service operation that trims guesses, rejects empty values, compares case-insensitively against the active round secret word, records accepted guesses, and awards exactly 100 points once per guesser per active round.
- **Rationale**: The backend room service is already the source of game-state truth. Centralizing validation and scoring there prevents client tampering and keeps multiple room state isolated.
- **Alternatives considered**: Frontend-only validation was rejected because it cannot protect shared state. Awarding points for repeated correct guesses was rejected because it would allow a single guesser to inflate their score in one round.

## Score Storage

- **Decision**: Store scores as participant-scoped numeric values on the room, initialized when the game starts and included in every room snapshot.
- **Rationale**: Scores belong to players across the active gameplay view, while the current feature only changes them during one active round. Keeping them on the room makes snapshots simple and avoids recomputing scores from history on every poll.
- **Alternatives considered**: Deriving scores from guess history was rejected because it complicates duplicate-correct-guess handling. Storing scores only on the frontend was rejected because it would break synchronization and room isolation.

## API Shape

- **Decision**: Extend the existing rooms API with focused gameplay endpoints under the current room resource: one endpoint to append drawing strokes, one to clear the canvas, and one to submit guesses.
- **Rationale**: The project already groups room lifecycle operations under `/rooms`. Keeping gameplay mutations there avoids a new router boundary and keeps room code plus participant validation consistent.
- **Alternatives considered**: A separate `/game` API namespace was rejected as unnecessary for the current scope. Combining all gameplay mutations into one generic action endpoint was rejected because it weakens validation and makes tests less explicit.

## Frontend Drawing Implementation

- **Decision**: Implement drawing with native React pointer events and the browser canvas element, without adding a drawing library.
- **Rationale**: The requirements need basic draw and clear behavior only. Native canvas support is sufficient, avoids dependencies, and fits the assignment constraint to keep implementation simple.
- **Alternatives considered**: Installing a canvas/drawing component library was rejected because it adds dependency and review overhead for a small interaction.

## Polling Lifecycle

- **Decision**: Reuse the existing 2-second polling cadence from lobby for active gameplay, with effect cleanup when leaving the game page and stale-state feedback on recoverable polling failures.
- **Rationale**: The feature asks to keep compatibility with the existing polling architecture, and the current lobby already establishes the project polling interval and cleanup pattern.
- **Alternatives considered**: Faster sub-second polling was rejected because it would increase backend load and is not required by the success criteria. Manual refresh-only updates were rejected because the spec requires polling without page refresh.
