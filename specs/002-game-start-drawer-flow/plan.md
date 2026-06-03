# Plan 002 — Game Start & Drawer Flow

## State model

The `Round` shape (declared in group 1) is now populated on start:
```
Round {
  drawerId: string      // = room.hostId for the single round
  word: string          // deterministic from room code
  strokes: Stroke[]     // [] for now; drawing lands in group 3
  guesses: Guess[]      // [] for now; guessing lands in group 3
  winnerId: string|null // null; set in group 3/4
}
```
No new fields are introduced — only filled in.

## Data flow

```
Create/Join → schema trims + validates name → store stores trimmed name
Start (host) → startRound():
  guard (host, >=2, lobby)               // group 1
  drawerId = room.hostId                 // NEW
  word     = pickWord(room.code)         // NEW, deterministic
  round    = { drawerId, word, [], [], null }
  status   = "playing"
Poll → toRoomSnapshot():
  word = (viewer is drawer && playing) ? round.word : null   // already in place
  drawerId / isDrawer / viewer.role populated from round
```

## File-level plan

Backend:
- `api/schemas.ts` — add a shared `playerName` field schema: trim → reject empty →
  length cap; use it in `createRoomSchema` and `joinRoomSchema`.
- `services/roomStore.ts` — add `pickWord(code)` pure helper; in `startRound`,
  build and attach the `Round` (drawer = host, deterministic word).
- (`toRoomSnapshot` word-visibility logic already added in group 1 — no change.)

Frontend:
- `pages/CreateRoomPage.tsx` / `pages/JoinRoomPage.tsx` — trim name, block empty
  submit, show server error.
- `pages/GamePage.tsx` — poll the room; show the viewer's role; render the secret
  word for the drawer and a "guess the word" prompt for guessers; redirect to `/`
  if there is no room.

## Testing strategy

- Backend unit tests:
  - name validation: whitespace-only rejected; surrounding spaces trimmed.
  - `pickWord` is deterministic and always returns a starter word.
  - after `startRound`, `round.drawerId === hostId` and `round.word` is set.
  - snapshot: drawer sees `word`; guesser sees `word === null`.
- Manual: two tabs — host sees the word, guesser does not; host is labelled drawer.

## Risks / mitigations

- **Word leakage via polling:** visibility is computed per-viewer in
  `toRoomSnapshot`; a backend test asserts a guesser's polled snapshot has
  `word === null`.
- **Validation drift between client and server:** the server is authoritative;
  the client checks are a convenience and reuse the same messages.
- **Determinism mistaken for "always the same word":** `pickWord` varies by code
  across rooms but is stable per code; documented and tested.
