# Research: Gameplay Interaction

## Decision: Keep drawer canvas state local to the drawer

**Rationale**: Scenario 3 requires an interactive drawing surface for the drawer, but the current app architecture already supports local UI state and the project forbids WebSockets. A local drawer canvas keeps the feature meaningful without introducing backend drawing synchronization.

**Alternatives considered**:

- Persist drawing strokes in the backend: rejected because it requires additional storage and polling semantics for every stroke, which is out of scope for Scenario 3.
- Share canvas updates with guessers via polling: rejected because the requirement only mandates drawer-visible drawing and real-time stroke syncing would add unnecessary complexity.

## Decision: Add a dedicated guess submission endpoint

**Rationale**: Guesses are active round mutations separate from room lifecycle events. A dedicated endpoint keeps validation, scoring, and history updates explicit and consistent with existing REST semantics.

**Alternatives considered**:

- Reuse `POST /rooms/:code/start` or `POST /rooms/:code/join`: rejected because guesses are not room creation or start actions.
- Use `GET /rooms/:code` with query parameters to submit guesses: rejected because reads should remain idempotent and side-effect free.

## Decision: Normalize guesses by trimming and lowercasing before validation

**Rationale**: The spec requires whitespace-trimmed, case-insensitive guess comparison. Normalizing guesses at the API boundary avoids inconsistent evaluation and gives users predictable behavior.

**Alternatives considered**:

- Compare raw guess text: rejected because it would treat ` rocket` or `Rocket` differently.
- Validate only on the frontend: rejected because server-side validation is required to prevent malformed submissions.

## Decision: Score guesses deterministically as 100 for correct and 0 for incorrect

**Rationale**: Deterministic scoring is a core expectation of Scenario 3. Storing the score on each guess is straightforward and keeps round history self-contained.

**Alternatives considered**:

- Use partial or time-based scoring: rejected because the scenario explicitly calls for deterministic scoring and 100/0 outcomes.
- Defer scoring to later scenario: rejected because scoring is part of Scenario 3 acceptance criteria.

## Decision: Sync guess history through the existing polling mechanism

**Rationale**: The project constitution forbids WebSockets. Existing room polling already keeps lobby and game state in sync, so extending it to include guess history is the lowest-risk path.

**Alternatives considered**:

- Add a separate guess history polling endpoint: rejected because it duplicates room snapshot semantics.
- Require manual refresh: rejected because it would degrade user experience and contradict the existing polling model.
