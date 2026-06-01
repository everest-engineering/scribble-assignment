# Data Model: Drawing Canvas and Guess Scoring

## Entities

### Room
- `code: string`
- `status: "lobby" | "game"`
- `participants: Participant[]`
- `round: Round | null`
- `createdAt: string`
- `updatedAt: string`

Relationships:
- A room owns at most one active round.
- A room contains zero or more participants.

Validation rules:
- `code` remains a four-character room code.
- `status` switches to `game` only when a round is active.

### Round
- `drawerParticipantId: string`
- `secretWord: string`
- `startedAt: string`
- `canvasEvents: CanvasEvent[]`
- `guessHistory: GuessEntry[]`
- `scores: Record<string, number>`

Relationships:
- A round belongs to exactly one room.
- A round points to the active drawer by participant id.
- A round tracks one score entry per participant id.

Validation rules:
- `drawerParticipantId` must belong to a participant in the room.
- `secretWord` must come from the configured starter list.
- `scores` defaults to `0` for participants who have not earned points yet.

### CanvasEvent
Append-only canvas state used to reconstruct the visible drawing.

Fields:
- `id: string`
- `type: "stroke" | "clear"`
- `participantId: string`
- `createdAt: string`
- `stroke?: StrokeData`

`StrokeData`:
- `points: Array<{ x: number; y: number }>`
- `color: string`
- `lineWidth: number`

Validation rules:
- Only the drawer may create canvas events during an active round.
- A clear event resets the visible canvas history for the round.

### GuessEntry
- `id: string`
- `participantId: string`
- `rawText: string`
- `normalizedText: string`
- `isCorrect: boolean`
- `pointsAwarded: 0 | 100`
- `createdAt: string`

Relationships:
- Guess entries belong to a round.
- Guess entries are visible to all viewers through the room snapshot.

Validation rules:
- `rawText` is rejected if it trims to an empty string.
- `normalizedText` is the trimmed, case-normalized guess string used for
  comparison.
- `pointsAwarded` is `100` only when the guess matches the secret word.

### RoomSnapshot
Viewer-facing room payload returned by polling.

Fields:
- `code: string`
- `status: "lobby" | "game"`
- `participants: Participant[]`
- `availableWords: string[]`
- `roles: Array<"drawer" | "guesser">`
- `drawerParticipantId: string | null`
- `canvasEvents: CanvasEvent[]`
- `guessHistory: GuessEntry[]`
- `scores: Record<string, number>`
- `secretWord?: string`

Relationships:
- `secretWord` is only present for the drawer viewer.
- `canvasEvents`, `guessHistory`, and `scores` must be identical for all
  viewers polling the same room.

## State Transitions

1. `lobby` room is created with participants and no round state.
2. `game` round starts with the host as drawer and an initial empty canvas,
   empty guess history, and zeroed scores.
3. Drawer appends canvas events while the round is active.
4. Guessers submit guesses, which create guess entries and may update scores.
5. Polling returns the latest round snapshot to every viewer.

## Notes

- Keep round state minimal so snapshots stay small and easy to poll.
- Derive viewer permissions from the current room snapshot rather than from a
  separate auth layer.
