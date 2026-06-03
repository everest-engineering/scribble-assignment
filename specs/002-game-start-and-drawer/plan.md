# Plan — Feature Group 2 (Game Start & Drawer Flow)

Extends the Group 1 room/snapshot with round state. No new dependencies.

## State model changes

Backend (`backend/src/models/game.ts`)
- `RoomStatus` widens to `"lobby" | "playing"`.
- `Room` gains round state: `drawerId: string | null`, `secretWord: string | null`
  (both `null` while in `lobby`).
- `RoomSnapshot` gains `drawerId: string | null` and `word: string | null`,
  where `word` is the secret word **only** for the drawer-viewer, else `null`.

Frontend (`frontend/src/services/api.ts`)
- Mirror the widened `status`, plus `drawerId` and `word` on `RoomSnapshot`.

## Data flow

1. Create/join validate and trim `playerName` (Zod) → reject empty with a message.
2. Start: `POST /rooms/:code/start` with `{ participantId }`. The service checks
   host + `lobby` + ≥2 players, sets `status="playing"`, `drawerId=hostId`,
   `secretWord=selectWord(code)`, and returns the snapshot for the requester.
3. Snapshot: `toRoomSnapshot(room, viewer)` sets `word = viewer === drawerId ?
   secretWord : null` (finally using the previously-ignored viewer argument).
4. Client: the host's start updates the store and navigates to `/game`. Guessers'
   lobby poll observes `status==="playing"` and navigates to `/game`. `GamePage`
   reads `drawerId`/`word` from the snapshot to render drawer identity and the
   word (drawer only).

## File-level changes

Backend
- `models/game.ts` — widen `RoomStatus`; add `drawerId`/`secretWord` to `Room`;
  add `drawerId`/`word` to `RoomSnapshot`.
- `services/wordSelection.ts` (new) — `selectWord(code, words)` pure deterministic
  picker; `wordSelection.test.ts` (new) — determinism + in-range.
- `services/roomStore.ts` — initialize new fields to `null` on create; add
  `startGame(code, participantId)`; set `word` per viewer in `toRoomSnapshot`.
- `api/schemas.ts` — `playerName` trimmed + non-empty; `startGameSchema` with
  `participantId`.
- `api/rooms.ts` — `POST /:code/start` route with host/precondition checks and
  specific error codes.
- `services/roomStore.test.ts` — start assigns drawer + word; word hidden from
  guessers; preconditions enforced.

Frontend
- `services/api.ts` — update `RoomSnapshot` types; add `startGame(code, id)`.
- `state/roomStore.ts` — `startGame` action updating the snapshot.
- `pages/CreateRoomPage.tsx`, `pages/JoinRoomPage.tsx` — client-side name trim +
  "Enter a player name." message.
- `pages/LobbyPage.tsx` — "Start Game" calls `startGame` then navigates; poll
  navigates guessers to `/game` when `status==="playing"`.
- `pages/GamePage.tsx` — show drawer name; show word only to the drawer.

## Testing strategy

- Unit: `selectWord` determinism/in-range; `startGame` preconditions, drawer/word
  assignment, and per-viewer word visibility; name schema rejects empty/whitespace.
- Manual (two tabs): AC6 host starts → guesser transitions, sees drawer not word.

## Risks / mitigations

- Word leaking to guessers → visibility decided solely in `toRoomSnapshot` by
  viewer id; covered by a unit test.
- Guessers not transitioning → lobby poll checks `status` and navigates.
- Snapshot shape churn for later groups → add only Group 2 fields now; Groups 3–4
  extend the same `Room`/snapshot.
