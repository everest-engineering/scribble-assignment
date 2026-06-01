# Data Model: Round End and Restart

## Entities

### Room
- `code: string`
- `status: "lobby" | "game"`
- `participants: Participant[]`
- `round: Round | null`
- `createdAt: string`
- `updatedAt: string`

Relationships:
- A room owns at most one round at a time.
- The participant list persists across restart cycles.

Validation rules:
- `code` remains a four-character room code.
- `status` stays `game` while a round is active or ended, and returns to
  `lobby` only after a restart.

### Round
- `drawerParticipantId: string`
- `secretWord: string`
- `phase: "active" | "ended"`
- `startedAt: string`
- `endedAt: string | null`
- `canvasEvents: CanvasEvent[]`
- `guessHistory: GuessEntry[]`
- `scores: Record<string, number>`

Relationships:
- A round belongs to exactly one room.
- The drawer is the first participant for the round.
- The round summary remains visible after the phase changes to `ended`.

Validation rules:
- `drawerParticipantId` must belong to a participant in the room.
- `secretWord` must come from the configured starter list.
- `endedAt` must be present when `phase` is `ended`.
- `scores` contains one entry per participant while the round is active or
  ended.

### CanvasEvent
Append-only canvas state used to reconstruct the visible drawing during the
active round.

Fields:
- `id: string`
- `type: "stroke" | "clear"`
- `participantId: string`
- `createdAt: string`
- `stroke?: StrokeData`

Validation rules:
- Only the drawer may create canvas events while the round is active.
- No new canvas events may be added once the round ends.

### GuessEntry
- `id: string`
- `participantId: string`
- `rawText: string`
- `normalizedText: string`
- `isCorrect: boolean`
- `pointsAwarded: 0 | 100`
- `createdAt: string`

Relationships:
- Guess entries belong to the current round.
- Guess entries remain visible in the end-of-round summary until restart.

Validation rules:
- `rawText` is rejected if it trims to an empty string.
- `normalizedText` is the trimmed, case-normalized guess string used for
  comparison.
- `pointsAwarded` is `100` only when the guess ends the round.

### RoomSnapshot
Viewer-facing room payload returned by polling.

Fields:
- `code: string`
- `status: "lobby" | "game"`
- `participants: Participant[]`
- `availableWords: string[]`
- `roles: Array<"drawer" | "guesser">`
- `drawerParticipantId: string | null`
- `roundPhase: "active" | "ended" | null`
- `canvasEvents: CanvasEvent[]`
- `guessHistory: GuessEntry[]`
- `scores: Record<string, number>`
- `secretWord?: string`

Relationships:
- `secretWord` is shown to the drawer during an active round.
- `secretWord` is shown to all viewers once `roundPhase` becomes `ended`.
- `canvasEvents`, `guessHistory`, and `scores` must remain consistent for all
  viewers polling the same room.

## State Transitions

1. `lobby` room is created with participants and no round state.
2. Host starts the round, the room enters `game`, and the round phase becomes
   `active`.
3. Drawer appends canvas events while the round is active.
4. A correct guess changes the round phase to `ended`, freezes the canvas and
   guess history, and exposes the correct word to all viewers.
5. Host restart clears round-specific data, preserves participants, and returns
   the room to `lobby`.

## Notes

- Keep round state minimal so snapshots stay small and easy to poll.
- Derive viewer permissions from the current room snapshot rather than from a
  separate auth layer.
