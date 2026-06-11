# Research: Round Play and Scoring

## Decision: Store Canvas as Ordered Freehand Marks

**Decision**: Represent canvas state as an ordered list of freehand drawing marks.
Each mark records its points, color, stroke size, drawer participant id, and
sequence order.

**Rationale**: Ordered marks are compact enough for the lab feature, easy to keep
in memory, and deterministic to replay in every client after polling. They also
support the clarified color and stroke-size scope without introducing image
encoding or third-party drawing dependencies.

**Alternatives considered**:

- Store a single image snapshot: rejected because it makes testing individual
  color/stroke marks harder and creates larger payloads.
- Store every pointer event independently: rejected because it increases payload
  volume without adding user value for this feature.
- Add a drawing library: rejected because no new dependency is needed for this
  scoped freehand canvas.

## Decision: Persist Completed Marks and Clear Commands

**Decision**: The drawer sees local drawing feedback immediately, while completed
marks and clear actions are persisted through REST commands as current round
state.

**Rationale**: Immediate local feedback keeps the drawer experience usable, and
REST persistence keeps the shared state aligned with the no-push-protocol
constraint. Polling clients then converge on the latest persisted canvas state.

**Alternatives considered**:

- Persist every pointer move: rejected because it creates high request volume for
  little benefit under polling.
- Only update local drawer state until round end: rejected because guessers would
  not see current drawing state during the round.

## Decision: Freeze Active-Round Roster

**Decision**: Once a round is active, new join attempts are rejected with clear
feedback. Existing participants can continue polling or reconnecting with their
participant id.

**Rationale**: The spec requires every player to start at score 0 and clarifies
that late joiners are out of scope. A fixed roster keeps scores and eligibility
deterministic.

**Alternatives considered**:

- Let late joiners enter with score 0: rejected because it complicates active
  scoring and was explicitly not selected during clarification.
- Add spectator mode: rejected because it is out of scope for this feature.

## Decision: Award 100 Points Once Per Guesser Per Round

**Decision**: A guesser receives 100 points for their first correct guess in the
round. Later correct guesses by that same player are recorded but do not add
points. Incorrect guesses never change scores.

**Rationale**: This matches the clarified scoring rule, prevents score inflation,
and keeps history complete for all valid guesses.

**Alternatives considered**:

- Award only the first correct guess across the room: rejected because each
  guesser should be able to earn the one-time award.
- Award every correct guess: rejected because repeated submissions could inflate
  scores.

## Decision: Keep Guess History Ordered and Shared

**Decision**: Store each valid guess with participant id, display name, trimmed
text, correctness, score awarded, and submitted timestamp/order. Empty guesses
are rejected before history insertion.

**Rationale**: Ordered history makes activity feeds deterministic across clients,
while storing awarded points in the entry makes scoring changes auditable.

**Alternatives considered**:

- Store only the latest guess: rejected because the spec requires synchronized
  activity and history.
- Hide incorrect guesses: rejected because valid incorrect guesses should still
  appear in history.

## Decision: Use REST Commands Plus Polling Snapshots

**Decision**: Add REST commands for draw mark, clear canvas, and submit guess.
Continue using room polling to synchronize canvas state, scores, and guess
history to all clients.

**Rationale**: This preserves the constitution's polling-only synchronization
rule and fits the existing API/store structure.

**Alternatives considered**:

- WebSockets or server-sent events: rejected by the constitution.
- Client-to-client synchronization: rejected because the backend owns room state
  and isolation.

## Decision: Validate With Focused Tests and Two-Client Flow

**Decision**: Add backend tests for drawing authorization, clear preservation,
guess validation, scoring, and late joins; add frontend API/UI tests where
practical; manually validate two-client polling synchronization.

**Rationale**: Store and schema tests cover deterministic game rules cheaply,
while two-client validation confirms the user-facing polling behavior.

**Alternatives considered**:

- Manual validation only: rejected because scoring and authorization rules are
  deterministic and should have focused automated coverage.
- Full browser automation: deferred because this project does not currently
  include browser automation tooling.
