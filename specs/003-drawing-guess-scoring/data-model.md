# Data Model: Scenario 3 Gameplay Interaction

## Room

**Purpose**: Represents one isolated multiplayer room that can host one active
Scenario 3 round with shared drawing and guess history.

**Fields**:

- `code`: unique 4-character room identifier
- `status`: `"lobby" | "playing"`
- `hostParticipantId`: participant ID for the room host
- `participants`: ordered room members with running score totals available in
  gameplay snapshots
- `round`: current active round state, present when the room is playing
- `createdAt`: room creation timestamp
- `updatedAt`: last room mutation timestamp

**Validation Rules**:

- `hostParticipantId` should reference a participant while host state is healthy
- room mutations stay isolated by room code
- `round` remains the single source of truth for canvas, guess history, and
  secret-word evaluation

## Participant

**Purpose**: Represents a room member visible in lobby and gameplay views.

**Fields**:

- `id`: unique participant identifier
- `name`: accepted trimmed display name
- `joinedAt`: timestamp when the participant entered the room
- `score`: running total from accepted guesses during the active round

**Validation Rules**:

- accepted names are already trimmed before storage
- `score` starts at `0` and increases only through accepted correct guesses
- the drawer's score is unaffected by drawing or clearing actions

## Round State

**Purpose**: Represents the active Scenario 2 and Scenario 3 gameplay state for
one room.

**Fields**:

- `drawerParticipantId`: participant assigned as drawer
- `secretWord`: deterministic word selected in Scenario 2
- `startedAt`: timestamp for when the round began
- `canvas`: shared drawing state for the round
- `guessHistory`: ordered list of accepted guess entries

**Validation Rules**:

- `drawerParticipantId` must reference a participant in the room
- `secretWord` remains the active comparison target for guess evaluation
- `guessHistory` is append-only within this scenario

## Canvas State

**Purpose**: Represents the shared drawing surface visible to all players in the
same active room.

**Fields**:

- `strokes`: ordered list of drawing strokes
- `clearedAt`: optional timestamp for the most recent clear action

**Validation Rules**:

- only the assigned drawer may add or clear strokes
- clearing the canvas replaces `strokes` with an empty list
- canvas state is shared by all viewers in the same room

## Drawing Stroke

**Purpose**: Represents one continuous drawing action added by the drawer.

**Fields**:

- `id`: stable stroke identifier
- `points`: ordered list of normalized points
- `drawnByParticipantId`: drawer participant ID
- `createdAt`: timestamp for when the stroke was submitted

**Validation Rules**:

- `points` must contain at least one valid coordinate
- all coordinates are normalized to a stable range such as `0..1`
- `drawnByParticipantId` must match the current drawer

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
- `scoreAwarded` is `100` when `isCorrect` is true and `0` otherwise

## Viewer Gameplay Snapshot

**Purpose**: Represents the room snapshot returned to a specific participant
during Scenario 3 gameplay.

**Fields**:

- shared room fields from earlier scenarios
- `canvas`: shared current drawing state
- `guessHistory`: shared ordered guess history
- `viewerCanDraw`: whether the current participant may draw or clear
- `viewerCanGuess`: whether the current participant may submit guesses
- `secretWord`: actual word only when the viewer remains the drawer
- `wordVisibility`: viewer-facing word state from Scenario 2

**Derived Rules**:

- `viewerCanDraw = participantId === drawerParticipantId`
- `viewerCanGuess = participantId !== drawerParticipantId` while the room is
  actively playing
- all viewers share the same canvas, history, and scores
- only the drawer receives the actual `secretWord`
