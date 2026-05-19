# Data Model: Phase 3 Gameplay Interaction

## Entity: Participant

- `id: string`
  Room-scoped participant identifier returned after create or join.
- `name: string`
  Trimmed display name.
- `joinedAt: string`
  ISO timestamp for roster continuity.
- `role: "host" | "player"`
  Persistent lobby ownership role from Phase 1.

Validation rules:

- Participant identity remains room-scoped.
- Lobby role is backend-assigned only.

## Entity: GuessEntry

- `id: string`
  Unique room-local guess identifier.
- `participantId: string`
  Participant who submitted the guess.
- `text: string`
  Trimmed stored guess text.
- `submittedAt: string`
  ISO timestamp of submission.
- `isCorrect: boolean`
  Whether this guess ended the round.

Validation rules:

- `text` must be non-empty after trimming.
- Only guessers in a `playing` room can create new guess entries.
- The first correct guess is the only guess that can set `isCorrect: true`.

## Entity: ScoreEntry

- `participantId: string`
  Participant whose score is represented.
- `score: number`
  Round-local score for Phase 3.

Validation rules:

- Every participant starts the round at `0`.
- Only the first correct guesser can reach `100`.
- Incorrect guesses never change any score.

## Entity: Room

- `code: string`
  Exactly 4 uppercase characters from the easy-to-read alphabet.
- `status: "lobby" | "playing" | "result"`
  `lobby` before start, `playing` during the active round, `result` after the first
  correct guess.
- `hostId: string`
  Start authority from Phase 1.
- `participants: Participant[]`
  Room-local roster.
- `drawerId?: string`
  Single assigned drawer once the room starts.
- `guesserIds: string[]`
  Every non-drawer participant once the room starts.
- `secretWord?: string`
  Drawer-only active word for the round.
- `guessHistory: GuessEntry[]`
  Shared ordered list of accepted guesses.
- `scores: Record<string, number>`
  Authoritative per-participant score map.
- `winnerId?: string`
  First correct guesser, once one exists.
- `endedAt?: string`
  ISO timestamp set when the room enters `result`.
- `createdAt: string`
  ISO timestamp of room creation.
- `updatedAt: string`
  ISO timestamp updated on all room mutations.

Validation rules:

- Only `lobby` rooms accept new joins.
- Only `hostId` can start the room.
- Start requires at least 2 participants.
- Starting the room must initialize:
  - `drawerId`
  - `guesserIds`
  - `secretWord`
  - `guessHistory = []`
  - `scores` for every participant at `0`
- Guess submission is valid only when `status === "playing"`.
- First correct guess transitions `status` to `"result"`.

## Entity: RoomSnapshot

- `code: string`
- `status: "lobby" | "playing" | "result"`
- `hostId: string`
- `participants: Participant[]`
- `drawerId?: string`
- `viewerRole?: "drawer" | "guesser"`
- `secretWord?: string`
  Present only for drawer-visible `playing` or `result` snapshots.
- `guessHistory?: GuessEntry[]`
  Shared for all viewers once the room has started.
- `scores?: ScoreEntry[]`
  Shared for all viewers once the room has started.
- `winnerId?: string`
  Present once the room has ended.

Purpose:

- Returned by create, join, fetch, start, and guess-submission endpoints.
- Gives the frontend enough information to derive activity history, scores, winner
  identity, and submission permissions without exposing the secret word to guessers.

## Relationships

- One `Room` has one `hostId` referencing one `Participant.id`.
- One `Room` has many `Participant` entries.
- One started `Room` has exactly one `drawerId`.
- One started `Room` has `guesserIds` covering all non-drawer participants.
- One `Room` has many `GuessEntry` records.
- One `Room` has one score value per participant.
- One `RoomSnapshot` is a viewer-specific projection of one `Room`.

## State Transitions

### Room lifecycle

1. Create room
   `status = "lobby"`, host exists, no round metadata yet.
2. Join room
   `status = "lobby"`, roster grows.
3. Start room
   Host changes `status` to `"playing"`, assigns drawer/guessers, stores
   `secretWord`, initializes `guessHistory = []`, and sets every participant score
   to `0`.
4. Submit incorrect guess
   `status` stays `"playing"`, history grows, scores unchanged.
5. Submit first correct guess
   `status` changes to `"result"`, winner score becomes `100`, `winnerId` and
   `endedAt` are set.

### Viewer-specific snapshot lifecycle

1. Lobby viewer
   Snapshot contains lobby data only.
2. Drawer viewer in `playing`
   Snapshot contains active round data plus `viewerRole = "drawer"` and
   `secretWord`.
3. Guesser viewer in `playing`
   Snapshot contains shared active round data plus `viewerRole = "guesser"` and
   omits `secretWord`.
4. Drawer viewer in `result`
   Snapshot contains final round data, winner identity, and still includes
   `secretWord`.
5. Guesser viewer in `result`
   Snapshot contains final round data and winner identity but still omits
   `secretWord`.

## Derived Frontend State

- `isHost = room.hostId === participantId`
- `isDrawer = room.drawerId === participantId`
- `viewerRoundRole = room.viewerRole ?? null`
- `canSubmitGuess = room.status === "playing" && room.viewerRole === "guesser"`
- `drawerName = room.participants.find((participant) => participant.id === room.drawerId)?.name ?? null`
- `scoreboardRows = room.scores mapped to participant names in room order`
- `historyRows = room.guessHistory mapped to participant names`
- `winnerName = room.participants.find((participant) => participant.id === room.winnerId)?.name ?? null`

## Invariants

- Before start:
  - `status === "lobby"`
  - `drawerId` absent
  - `guessHistory` empty or absent
  - `scores` empty or absent
- While playing:
  - `status === "playing"`
  - `drawerId` present
  - `scores` include every participant at `0` until a correct guess
  - `winnerId` absent
- After first correct guess:
  - `status === "result"`
  - exactly one guess entry has `isCorrect === true`
  - `winnerId` is present
  - winner score is `100`
  - all non-winner scores remain `0`
