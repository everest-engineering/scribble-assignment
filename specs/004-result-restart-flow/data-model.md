# Data Model: Scenario 4 Result State and Restart

## Room

**Purpose**: Represents one isolated multiplayer room that can move from lobby,
to active play, to post-round results, and back to lobby on restart.

**Fields**:

- `code`: unique 4-character room identifier
- `status`: `"lobby" | "playing" | "results"`
- `hostParticipantId`: participant ID for the room host
- `participants`: ordered room members with score totals
- `round`: current round state, present during `playing` and `results`
- `createdAt`: room creation timestamp
- `updatedAt`: last room mutation timestamp

**Validation Rules**:

- `hostParticipantId` must reference a participant while the room is healthy
- room mutations stay isolated by room code
- `round` is absent only in `lobby`
- `status = "results"` requires a completed `round`

## Participant

**Purpose**: Represents a room member visible in lobby, gameplay, and results.

**Fields**:

- `id`: unique participant identifier
- `name`: accepted trimmed display name
- `joinedAt`: timestamp when the participant entered the room
- `score`: running total for the current or most recently completed round

**Validation Rules**:

- accepted names are already trimmed before storage
- `score` starts at `0`
- `score` increases only through accepted correct guesses during play
- `score` resets to `0` when a room restarts to lobby

## Round State

**Purpose**: Represents the active or completed round attached to a room during
Scenario 3 and Scenario 4.

**Fields**:

- `drawerParticipantId`: participant assigned as drawer
- `secretWord`: deterministic word selected at round start
- `startedAt`: timestamp for when the round began
- `endedAt`: timestamp for when the first correct accepted guess ended the
  round, absent while still playing
- `canvas`: shared drawing state for the round
- `guessHistory`: ordered list of accepted guess entries

**Validation Rules**:

- `drawerParticipantId` must reference a participant in the room
- `endedAt` is absent during `playing` and present during `results`
- once `endedAt` is set, draw and guess mutations are rejected
- `guessHistory` remains the source of truth for final result review

## Guess History Entry

**Purpose**: Represents one accepted guess and its deterministic score outcome.

**Fields**:

- `id`: stable guess identifier
- `participantId`: player who submitted the guess
- `participantName`: trimmed display name at submission time
- `guess`: trimmed accepted guess text
- `normalizedGuess`: comparison form used for case-insensitive matching
- `isCorrect`: whether the guess matched the active secret word
- `scoreAwarded`: `100` or `0`
- `submittedAt`: timestamp for when the guess was accepted

**Validation Rules**:

- whitespace-only guesses are rejected before entry creation
- drawer-submitted guesses are rejected and never create entries
- accepted entries are appended in submission order only
- the first entry with `isCorrect = true` is also the entry that triggers
  `playing -> results`

## Result Snapshot

**Purpose**: Represents the viewer-visible room payload returned while a room is
in `results`.

**Fields**:

- shared room fields from earlier scenarios
- `status = "results"`
- `participants`: final score totals for the completed round
- `drawerParticipantId`: completed round drawer
- `secretWord`: visible to every viewer
- `wordVisibility = "visible"` for every viewer
- `guessHistory`: full accepted guess history from the completed round
- `viewerCanDraw = false`
- `viewerCanGuess = false`
- `canRestartGame`: whether the viewer may restart the room
- `roundEndedAt`: timestamp carried from the completed round

**Derived Rules**:

- `canRestartGame = viewerParticipantId === hostParticipantId && status === "results"`
- `secretWord` is visible to all viewers only in `results`
- result snapshots remain stable until the room is restarted

## Restarted Lobby State

**Purpose**: Represents the room immediately after a successful Scenario 4
restart.

**Fields**:

- same `code`
- same `hostParticipantId`
- same ordered `participants`
- `status = "lobby"`
- no `round`
- participant `score = 0` for every member

**Validation Rules**:

- only the host can trigger this state
- restart is valid only from `results`
- no prior secret word, canvas, guess history, or drawer assignment may remain

## State Transitions

- `lobby -> playing`: host starts a room with at least two players
- `playing -> results`: first correct accepted guess is recorded
- `results -> lobby`: host restarts the room

## Room Snapshot Permissions

- `canStartGame = true` only for the host in `lobby` with enough players
- `viewerCanDraw = true` only for the drawer in `playing`
- `viewerCanGuess = true` only for non-drawers in `playing`
- `canRestartGame = true` only for the host in `results`
