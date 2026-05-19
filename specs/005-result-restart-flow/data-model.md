# Data Model: Phase 4 Result State and Restart

## Entity: Participant

- `id: string`
  Room-scoped participant identifier.
- `name: string`
  Trimmed display name.
- `joinedAt: string`
  ISO timestamp for roster continuity.
- `role: "host" | "player"`
  Persistent lobby ownership role.

Validation rules:

- Participant identity stays room-scoped.
- Lobby role remains backend-assigned.

## Entity: GuessEntry

- `id: string`
- `participantId: string`
- `text: string`
- `submittedAt: string`
- `isCorrect: boolean`

Phase 4 note:

- During `playing`, guesser snapshots may still receive redacted correct-guess text.
- During `result`, every viewer receives the real `text` values for the full round
  history.

## Entity: ScoreEntry

- `participantId: string`
- `score: number`

Validation rules:

- Score remains `0` for all players until the first correct guess.
- The first correct guesser remains the only winner at `100`.
- Restart clears all score entries from the room snapshot by returning the room to
  lobby shape.

## Entity: Room

- `code: string`
  Exactly 4 uppercase characters from the easy-to-read alphabet.
- `status: "lobby" | "playing" | "result"`
- `hostId: string`
- `participants: Participant[]`
- `drawerId?: string`
- `guesserIds: string[]`
- `secretWord?: string`
- `guessHistory: GuessEntry[]`
- `scores: Record<string, number>`
- `winnerId?: string`
- `endedAt?: string`
- `createdAt: string`
- `updatedAt: string`

Validation rules:

- Only `lobby` rooms accept joins.
- Only the host can start a room.
- Only the host can restart a room.
- Restart is valid only when `status === "result"`.
- Restart preserves:
  - `code`
  - `hostId`
  - `participants`
  - `createdAt`
- Restart clears:
  - `drawerId`
  - `guesserIds`
  - `secretWord`
  - `guessHistory`
  - `scores`
  - `winnerId`
  - `endedAt`
- Restart sets `status = "lobby"` and updates `updatedAt`.

## Entity: RoomSnapshot

- `code: string`
- `status: "lobby" | "playing" | "result"`
- `hostId: string`
- `participants: Participant[]`
- `drawerId?: string`
- `viewerRole?: "drawer" | "guesser"`
- `secretWord?: string`
- `guessHistory?: GuessEntry[]`
- `scores?: ScoreEntry[]`
- `winnerId?: string`

Snapshot rules by state:

- `lobby`
  - no round-specific fields
- `playing`
  - shared `drawerId`, `guessHistory`, `scores`
  - `secretWord` visible only to drawer
  - correct guess text may stay redacted for guessers until round ends
- `result`
  - shared `drawerId`, `guessHistory`, `scores`, `winnerId`
  - `secretWord` visible to every viewer
  - full unredacted guess history visible to every viewer

## Entity: RestartResult

- `room: RoomSnapshot`
  The cleared lobby snapshot returned after a successful restart.

Purpose:

- Lets the host transition immediately back to the lobby while other connected
  clients converge on the same lobby snapshot on the next poll.

## Relationships

- One `Room` has one `hostId` referencing one `Participant.id`.
- One `Room` has many `Participant` entries.
- One `Room` has zero or one active `drawerId`.
- One `Room` has many `GuessEntry` records for the current round only.
- One `Room` has one score value per participant during an active or ended round.
- One `RoomSnapshot` is a viewer-specific projection of one `Room`.

## State Transitions

### Room lifecycle

1. Create room
   `status = "lobby"`, host exists, no round metadata.
2. Start room
   `status = "playing"`, drawer and guessers assigned, `secretWord` and zeroed
   scores initialized.
3. First correct guess
   `status = "result"`, `winnerId` and `endedAt` set, final scores fixed.
4. Restart room
   Host changes `status` from `"result"` back to `"lobby"` and clears all
   round-specific fields while preserving room identity and participants.

### Viewer snapshot lifecycle

1. Lobby viewer
   Sees lobby snapshot only.
2. Active drawer viewer
   Sees drawer-only `secretWord` plus shared round data.
3. Active guesser viewer
   Sees shared round data without the hidden word.
4. Result viewer
   Every viewer sees the same revealed word, final scores, winner, and full history.
5. Restarted lobby viewer
   Every viewer returns to the lobby snapshot with no round-specific fields.

## Derived Frontend State

- `isHost = room.hostId === participantId`
- `isResult = room.status === "result"`
- `canRestart = room.status === "result" && room.hostId === participantId`
- `restartDisabledReason = room.status === "result" && !canRestart ? "Only the host can restart the room." : null`
- `visibleSecretWord = room.status === "result" ? room.secretWord ?? null : room.viewerRole === "drawer" ? room.secretWord ?? null : null`
- `winnerName = room.participants.find((participant) => participant.id === room.winnerId)?.name ?? null`

## Invariants

- In `result`, all viewers in the room see the same:
  - `secretWord`
  - `guessHistory`
  - `scores`
  - `winnerId`
- After restart:
  - `status === "lobby"`
  - `drawerId` absent
  - `secretWord` absent
  - `guessHistory` absent from snapshot
  - `scores` absent from snapshot
  - `winnerId` absent
  - participant roster preserved
