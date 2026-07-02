# Feature Specification: Gameplay Interaction (Slice 3)

## Overview
This specification covers interactive drawing on the canvas, guess submission with validation, synchronized guess history, and deterministic scoring during an active round.

---

## User Story
```text
As a player,
I want to draw on the canvas (if I'm the drawer) or submit guesses (if I'm a guesser),
so that gameplay is interactive and scores are updated correctly.
```

---

## Core Terminology & Data Model Updates
- **Drawing Paths**: An ordered array of strokes. Each stroke is an array of points (x, y coordinates).
- **Guess**: A guess entry containing the guesser's participant ID, their guess text, whether it was correct, and a timestamp.
- **Score**: A non-negative integer per participant, starting at 0.
- **Round State**: The collection of drawing paths, guesses, and scores that make up the current active round.

### State Schema Extensions

#### `Guess` (New type)
```typescript
interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  correct: boolean;
  timestamp: string;
}
```

#### `Point` (New type)
```typescript
interface Point {
  x: number;
  y: number;
}
```

#### `DrawingStroke` (New type)
```typescript
interface DrawingStroke {
  points: Point[];
}
```

#### `Room` (Backend) — Additions
- `guesses: Guess[]`
- `scores: Record<string, number>` (participantId → score)
- `drawing: DrawingStroke[]`

#### `RoomSnapshot` (Shared API) — Additions
- `guesses: Guess[]`
- `scores: Record<string, number>`
- `drawing: DrawingStroke[]`
- `correctGuessers: string[]` (participant IDs of those who guessed correctly, for preventing duplicate scoring)

---

## Functional Requirements

### 1. Canvas Drawing
- Only the drawer can submit drawing strokes.
- The drawer draws by moving their mouse/finger on the canvas.
- Each mouse-down → mouse-move → mouse-up sequence forms a single stroke.
- Strokes are sent to the backend and visible to all players via polling.
- Non-drawers receive the drawing data but cannot interact with the canvas.

### 2. Clear Canvas
- Only the drawer can clear the canvas.
- Clearing replaces the drawing with an empty array.
- All players see the cleared canvas on the next poll.

### 3. Guess Submission
- Only non-drawer participants (guessers) can submit guesses.
- Guesses must be trimmed (leading/trailing whitespace removed) before validation.
- Empty or whitespace-only guesses must be rejected with a 400 error and message: `"Guess cannot be empty"`.
- Guess comparison against the secret word must be case-insensitive (e.g. `"PIZZA"` matches `"pizza"`).
- Correct guesses score exactly 100 points.
- Incorrect guesses score 0 points.
- Duplicate correct guesses by the same player are accepted but do not award additional points.
- The drawer attempting to guess must be rejected with a 403 error: `"Drawer cannot submit guesses"`.

### 4. Guess History Synchronization
- All guesses (correct and incorrect) are appended to a shared `guesses` array on the server.
- The full guess history is included in every `RoomSnapshot` response.
- Clients poll the room state every ~2 seconds and update the guess history display.

### 5. Scoring
- All players start with `score = 0`.
- Only the first correct guess by each player awards 100 points.
- Subsequent correct guesses by the same player are recorded as guesses but award 0 points.
- Scores are included in every `RoomSnapshot`.

---

## Acceptance Criteria

### AC1 - Canvas Drawing
- **Given** a game is active with a designated drawer,
- **When** the drawer draws on the canvas,
- **Then** the strokes are persisted on the backend,
- **And** visible to all players when they poll for the room snapshot.

### AC2 - Clear Canvas
- **Given** an active game with drawing on the canvas,
- **When** the drawer clicks "Clear Canvas",
- **Then** the drawing is replaced with an empty array,
- **And** all players see a blank canvas on the next poll.

### AC3 - Reject Empty Guess
- **Given** a guesser submits an empty or whitespace-only guess,
- **When** the guess request reaches the backend,
- **Then** the server rejects with status `400` and message `"Guess cannot be empty"`.

### AC4 - Case-Insensitive Correct Guess
- **Given** the secret word is `"pizza"`,
- **When** a guesser submits `"PIZZA"`, `"Pizza"`, or `"pizza"`,
- **Then** the guess is marked as correct and the guesser scores 100 points.

### AC5 - Guess History Synchronization
- **Given** multiple guessers submit guesses,
- **When** any player polls the room state,
- **Then** they see the full ordered list of all guesses with correctness status.

### AC6 - Drawer Cannot Guess
- **Given** a user whose `participantId` matches `drawerId`,
- **When** they attempt to submit a guess,
- **Then** the server rejects with status `403` and message `"Drawer cannot submit guesses"`.

### AC7 - Scores Start at Zero
- **Given** a game has started,
- **When** a player fetches the room snapshot,
- **Then** all participants have a score of 0 in the scoreboard.

### AC8 - Duplicate Correct Guess Does Not Double Score
- **Given** a guesser has already guessed the secret word correctly,
- **When** they submit another correct guess,
- **Then** the guess is recorded but no additional points are awarded (score stays at previous value).

---

## Edge Cases & Handling Strategy

| Edge Case | Handling Strategy |
|-----------|-------------------|
| **Empty/whitespace guess** | Rejected with `400` and message `"Guess cannot be empty"`. |
| **Guess with leading/trailing spaces** | Trimmed before validation and storage. The trimmed value is stored. |
| **Different letter casing** | Compared case-insensitively using `.toLowerCase()`. |
| **Duplicate correct guess (same player)** | Guess recorded in history but score unchanged (idempotent scoring). |
| **Drawer submits guess** | Rejected with `403` and message `"Drawer cannot submit guesses"`. |
| **Polling request fails** | Fail silently and retry on next interval; show a non-blocking indicator if consecutive failures occur. |
| **Concurrent guess submissions** | Single-threaded Node.js processes requests sequentially; no race condition on score updates. |
| **Guess after round ends** | Future concern — out of scope for this slice. The endpoint will still accept guesses since there's no round state machine yet. |
| **Missing drawing data** | Default to empty array `[]` if no drawing strokes exist. |
