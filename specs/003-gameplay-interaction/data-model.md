# Data Model: Gameplay Interaction

## Room

Represents one in-memory game room.

**Fields**

- `code`: Unique room code.
- `hostId`: Player ID for the host.
- `status`: Current room phase. Values for this feature: `lobby`, `inProgress`.
- `participants`: Ordered list of players in the room.
- `currentRound`: Present only while a round is active.
- `createdAt`: Room creation timestamp.
- `updatedAt`: Last mutation timestamp.

**Relationships**

- Has many `Player` records.
- Has zero or one active `Round`.
- `hostId` should refer to one player in `participants`.

**Validation Rules**

- A room can accept guesses only when `status` is `inProgress` and `currentRound` exists.
- The drawer may only submit canvas actions locally in this scenario.
- The room snapshot should include viewer-safe round state for all participants.

## Player

Represents one participant in a room.

**Fields**

- `id`: Unique player identifier.
- `name`: Trimmed display name.
- `joinedAt`: Join timestamp.
- `isHost`: Whether this player is the room host.

**Validation Rules**

- `name` must be trimmed before storage and display.
- Empty or whitespace-only names are rejected.
- Multiple players may share the same display name.

## Round

Represents the active gameplay round.

**Fields**

- `roundNumber`: `1` for this feature.
- `status`: `active` for this feature.
- `drawerId`: Player ID assigned to draw.
- `secretWord`: Deterministically selected word for the drawer.
- `startedAt`: Start timestamp.
- `guessHistory`: Ordered list of guesses submitted during the round.

**Relationships**

- Belongs to one `Room`.
- `drawerId` refers to one `Player` in the room.
- `guessHistory` belongs to the active `Round`.

**Validation Rules**

- `drawerId` is the host if available; otherwise the first participant.
- `secretWord` is selected from the starter list and remains stable for the round.
- Each guess is validated and scored before being appended to `guessHistory`.

## Guess

Represents a single submit attempt during an active round.

**Fields**

- `id`: Unique guess identifier.
- `participantId`: ID of the player who submitted the guess.
- `playerName`: Display name of the submitting player.
- `text`: Original guess text.
- `normalizedText`: Trimmed, lowercased text used for evaluation.
- `isCorrect`: `true` when the guess matches the secret word.
- `score`: `100` for correct guesses, `0` for incorrect guesses.
- `submittedAt`: Submission timestamp.

**Validation Rules**

- `text` must be trimmed before validation.
- Guesses that are empty after trimming are rejected.
- `normalizedText` is compared to the current round's `secretWord` case-insensitively.

## RoomSnapshot

Viewer-safe room state returned to the frontend.

**Fields**

- `code`
- `hostId`
- `gameState`
- `participants`
- `availableWords`
- `roles`
- `currentRound`

**Viewer-Specific Rules**

- `currentRound.drawerId`, `drawerName`, `roundNumber`, `status`, and `guessHistory` are visible to all players.
- `currentRound.secretWord` remains visible only to the drawer through existing viewer-aware snapshot behavior.

## CanvasState (frontend-only)

Represents the drawer's local drawing surface state.

**Fields**

- `strokes`: Serialized line or point data used by the local canvas component.
- `isCleared`: Whether the canvas has been reset to blank.

**Scope Boundary**

- The canvas state is maintained locally in the frontend and is not persisted to the backend for Scenario 3.
- Clearing the canvas resets only the local drawing surface, not the current round or guess history.
