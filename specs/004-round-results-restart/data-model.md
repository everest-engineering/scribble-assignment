# Data Model: Round Results & Restart

## Room

Represents one isolated drawing game room.

### Fields

- `code: string`
  - Unique normalized room code.
- `status: "lobby" | "playing" | "results"`
  - `results` means a round has ended and final results are visible until Host
    restart.
- `hostParticipantId: string`
  - Stable participant id for the room Host.
- `participants: Participant[]`
  - Current room membership preserved across restart.
- `currentRound: ActiveRound | null`
  - Active round state while playing; cleared by restart.
- `roundResult: RoundResult | null`
  - Final ended-round result visible during `results`; cleared by restart.
- `createdAt: string`
- `updatedAt: string`

### Validation Rules

- Results and restart actions affect only this room.
- New participants cannot join while `status` is `playing` or `results`.
- Restart from results keeps `code`, `hostParticipantId`, and `participants`.

### State Transitions

- `playing` -> `results`: Round lifecycle ends the active round and captures
  `roundResult`.
- `results` -> `lobby`: Host restarts and clears `currentRound` plus
  `roundResult`.
- `results` -> `results`: Non-host restart, late join, draw, clear, or guess
  attempts are rejected and leave state unchanged.

## Participant

Represents a current player in the room.

### Fields

- `id: string`
- `name: string`
- `joinedAt: string`

### Validation Rules

- Restart requests must reference a current participant.
- Only the participant matching `hostParticipantId` can restart from results.
- Current participants remain members after restart.

## Active Round

Represents round-specific state before the round ends.

### Fields

- `number: number`
- `drawerParticipantId: string`
- `secretWord: string`
- `canvas: CanvasState`
- `scores: PlayerScore[]`
- `guessHistory: Guess[]`
- `correctGuessParticipantIds: string[]`
- `startedAt: string`

### Validation Rules

- The active round is the source for `RoundResult` when the round ends.
- After transition to results, drawing, clearing, and guessing no longer mutate
  the round.
- Restart clears the active round completely.

## Round Result

Represents the final visible result for an ended round.

### Fields

- `roundNumber: number`
- `drawerParticipantId: string`
- `correctWord: string`
- `finalScores: FinalScore[]`
- `guessHistory: Guess[]`
- `endedAt: string`

### Validation Rules

- Captured once when the room enters `results`.
- Visible to every current player in the room.
- Remains unchanged until the Host restarts.
- Cleared when the room returns to lobby.

## Final Score

Represents one participant's final score for the ended round.

### Fields

- `participantId: string`
- `name: string`
- `score: number`

### Validation Rules

- Includes every participant from the ended round roster, including players with
  `0` points.
- Scores are copied from active-round score state when the round ends.

## Guess

Represents one valid guess submitted during the ended round.

### Fields

- `id: string`
- `participantId: string`
- `participantName: string`
- `text: string`
- `isCorrect: boolean`
- `pointsAwarded: number`
- `submittedAt: string`

### Validation Rules

- Guess history order is preserved from the active round.
- Empty or rejected guesses are not included.
- Guess history is cleared from playable room state on restart.

## Restart Action

Represents the Host command to return from results to lobby.

### Fields

- `participantId: string`
  - Current participant requesting restart.

### Validation Rules

- Valid only while room `status` is `results`.
- Requesting participant must be the room Host.
- On success, `status` becomes `lobby`, `currentRound` becomes `null`, and
  `roundResult` becomes `null`.
- Player membership, room code, player names, and Host identity are preserved.

## Room Snapshot

Represents the current room state sent to clients through polling.

### Fields

- `code: string`
- `status: "lobby" | "playing" | "results"`
- `participants: ParticipantSnapshot[]`
- `currentRound: ActiveRoundSnapshot | null`
- `roundResult: RoundResult | null`

### Validation Rules

- `roundResult` is present only while results are displayed.
- `currentRound` is absent after restart returns the room to lobby.
- Polling clients in the same room receive the same result data during results.
- Room snapshots remain isolated to the requested room.

## Error States

- Non-host restart attempt: clear "only the Host can restart" feedback.
- Restart without ended results: clear "round results are not available"
  feedback.
- Late join during results: clear "round results are being shown" feedback.
- Draw, clear, or guess during results: clear "round has ended" feedback.
- Unknown participant: clear "participant not found" feedback.
