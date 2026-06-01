# Feature Specification: Drawer & Guess Sync

**Feature Branch**: `004-drawer-guess-sync`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Guess Submission + Sync (Priority: P1)

The drawer draws on a shared canvas while guessers submit textual guesses. The system validates, scores, and synchronizes guess history across clients using polling.

**Why this priority**: This is the core gameplay loop — guesses must be validated, scored, and visible to all players to continue the round.

**Independent Test**: Start a room with one drawer and two guessers (all scores at 0). Drawer draws then clears the canvas. Guessers submit guesses including whitespace, mixed case, and empty input. Verify trimming, case-insensitive comparison, empty rejection, scoring, and that guess history is visible to all players via the polling API.

**Acceptance Scenarios**:

1. **Given** a round is active with a drawer and at least one guesser and all players have score 0, **When** the drawer draws or clears the canvas and guessers submit guesses, **Then** the drawing is visible on the drawer's screen; guesses are trimmed and empty submissions are rejected.

2. **Given** a non-empty guess submission, **When** the server compares it to the secret word, **Then** comparison is case-insensitive and trimmed; if the guess matches the secret word exactly after trimming/case normalization, the guess is marked correct and the guesser receives +100 score; otherwise the guesser receives +0.

3. **Given** guesses are submitted by multiple players, **When** any player polls the guess-history endpoint, **Then** they receive the complete, chronologically ordered history of guesses (including who guessed, the trimmed text, timestamp, and correctness flag).

4. **Given** an empty or whitespace-only submission, **When** the guess is sent, **Then** the server rejects the submission with a 400 and a clear validation message; the guess is not recorded.

5. **Given** a drawer action (draw or clear), **When** it occurs, **Then** the drawer's canvas state is stored in the room state and remains visible to the drawer; (note: live broadcast is out-of-scope — clients may poll for canvas state updates).

### Edge Cases

- Multiple players guess the correct word in the same polling window (tie): each correct guesser receives 100 points; the system must record multiple correct guesses.
- Duplicate guesses by the same player in quick succession should be recorded as separate attempts but may be deduplicated by clients if desired.
- Partial-match, trimmed-but-not-equal, and synonyms are treated as incorrect (no fuzzy matching).
- Ensure very long guesses are truncated by schema limits (e.g., 200 characters) and rejected if they exceed limits.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST accept guess submissions via POST `/rooms/:roomId/guesses` with payload `{ playerId, text }`.
- **FR-002**: System MUST trim leading/trailing whitespace from guesses and reject empty results (HTTP 400).
- **FR-003**: System MUST compare guesses to the secret word in a case-insensitive manner after trimming.
- **FR-004**: System MUST persist guess history per room with fields `{ playerId, textTrimmed, timestamp, isCorrect }`.
- **FR-005**: System MUST expose a polling endpoint GET `/rooms/:roomId/guesses` returning the ordered guess history.
- **FR-006**: System MUST award exactly 100 points for a correct guess and 0 points for incorrect guesses and persist player scores.
- **FR-007**: System MUST store drawer canvas state (draw/clear) in the room state so the drawer's client can rehydrate their canvas.
- **FR-008**: System MUST validate guess text length (e.g., max 200 chars) and reject overly long submissions with 400.

### Non-Functional Requirements

- **NFR-001**: Polling endpoints MUST be efficient for short histories (pagination optional for long histories).
- **NFR-002**: All server-side validations must be covered by unit tests.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In an integration test, trimmed mixed-case guesses that match the secret word must be scored as correct and add 100 points.
- **SC-002**: Empty/whitespace-only guesses are rejected with HTTP 400 and do not appear in guess history.
- **SC-003**: Polling GET `/rooms/:roomId/guesses` returns the same history for all players within one polling interval.
- **SC-004**: Drawer canvas state persists across page reload for the drawer's client.

## Assumptions

- Real-time push (WebSockets/Sockets) is out of scope; synchronization uses polling via the existing `polling.ts` service.
- Scores begin at 0 when a player joins a room (handled elsewhere by room creation logic).
- Secret-word selection and drawer assignment are implemented by prior specs (see `specs/003-drawer-selection`).
- Canvas actions are stored as immutable events (e.g., `clear` with timestamp) rather than full-image blobs.
