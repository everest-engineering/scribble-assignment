# Feature Specification: Guess Submission, Scoring & Shared History

**Feature Branch**: `003-guess-submission-scoring`

**Created**: 2026-06-15

**Status**: Implemented

**Parent Feature**: `002-game-start-drawer-assignment`

**Input**: Scenario 3 from Scribble lab business requirements – guess submission with normalization, scoring, and shared history.

## User Scenarios & Testing *(mandatory)*

### User Story 3 - Drawing interaction, guess submission, and synced history (Priority: P2)

Active gameplay must allow drawing, guessing, and shared game state updates.

**Why this priority**: Guessers and the drawer need synchronized interactions for the round to feel playable and fair.

**Independent Test**: Submit valid and invalid guesses, confirm guess history syncs, and verify correct guesses score 100 points.

**Acceptance Scenarios**:

1. **Given** a round is active and the drawer is drawing, **When** the drawer clears the canvas, **Then** the canvas resets and the cleared state is reflected in the current round.
2. **Given** a guesser submits a guess with extra spaces or different casing, **When** the guess is processed, **Then** the system trims whitespace, compares case-insensitively, and records the normalized guess.
3. **Given** a guess is empty after trimming, **When** it is submitted, **Then** the system rejects it with a validation message.
4. **Given** guesses are submitted, **When** the lobby or game state refreshes, **Then** all players see the same guess history within the polling cadence.
5. **Given** a guess matches the secret word, **When** it is recognized as correct, **Then** that guess is scored 100 points and shown as correct to all players.
6. **Given** a guess is incorrect, **When** it is processed, **Then** it is preserved in history but scores 0 points.

---

## Acceptance Criteria Mapping

| Scenario | Implementation | Validation |
|----------|---|---|
| Canvas clearing | Drawer-only action; canvasCleared flag set in room state | GuessForm disabled for non-drawer; clearCanvas() endpoint enforces drawer check |
| Guess normalization | Trim whitespace; case-insensitive comparison | submitGuess() normalizes input before comparison |
| Empty guess rejection | Client-side and server-side validation | GuessForm prevents submit; server returns 400 if empty after trim |
| Shared history | All players receive same guess array in polling response | RoomSnapshot includes guesses array with all submissions |
| Correct guess scoring | Match triggers 100 points + score increase | submitGuess() checks isCorrect and adds 100 to participant.score |
| Incorrect guess preservation | Non-matching guesses stored with isCorrect=false | Guess history includes incorrect guesses with visual ❌ indicator |

---

## Edge Cases & Error Handling

- **Guess with leading/trailing spaces**: Normalize by trimming before comparison.
- **Mixed-case guess vs lowercase secret**: Case-insensitive comparison ("Pizza" matches "pizza").
- **Multiple guesses from same player**: All stored in history; scoring applies to each correct match.
- **Drawer attempts to guess**: Reject with message "Drawer cannot submit guesses".
- **Empty guess after trim**: Reject with message "Guess cannot be empty".
- **Guess submitted after round finished**: Reject with message "Round has ended".

---

## Data Model

### Guess

```typescript
interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  createdAt: string;
}
```

### API Endpoints

- **POST /rooms/:code/guess** – Submit a guess
- **POST /rooms/:code/clear-canvas** – Clear the canvas (drawer only)
