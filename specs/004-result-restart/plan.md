# Plan — Feature Group 4 (Result, Restart & Final Validation)

Adds the `ended` status, end-on-correct-guess, all-viewer word reveal, and a
host restart. Extends the existing room/snapshot; no new dependencies.

## State model changes

Backend (`backend/src/models/game.ts`)
- `RoomStatus` widens to `"lobby" | "playing" | "ended"`.

No new fields — the result is derived from existing state (`secretWord`,
participant `score`s, `guesses`) plus the `ended` status and the word-reveal rule.

Frontend (`frontend/src/services/api.ts`)
- Mirror the widened `RoomStatus`.

## Data flow

1. End: in `submitGuess`, a correct guess sets `status = "ended"` alongside
   scoring. Later guesses hit the existing `not_playing` guard.
2. Reveal: `toRoomSnapshot` returns `word = (isDrawer || status === "ended") ?
   secretWord : null`, so the word is shared once the round ends.
3. Restart: `POST /rooms/:code/restart` with `{ participantId }`. The service
   checks host, then resets `status="lobby"`, `drawerId=null`, `secretWord=null`,
   `guesses=[]`, and each participant `score=0`; participants are kept.
4. Client: `GamePage` renders the result when `status==="ended"` and offers the
   host a restart. The status effects move players: `GamePage` → `/lobby` when
   `status==="lobby"`; the existing lobby effect → `/game` on a later start.

## File-level changes

Backend
- `models/game.ts` — widen `RoomStatus`.
- `services/roomStore.ts` — set `ended` on a correct guess in `submitGuess`;
  reveal word when ended in `toRoomSnapshot`; add `restartGame(code, id)`.
- `api/rooms.ts` — `POST /:code/restart` route (reuses `startGameSchema`'s
  participant-id body) with host/not-found error mapping.
- `services/roomStore.test.ts` — correct guess ends round; word revealed to all
  when ended; restart resets state and preserves players; non-host rejected.

Frontend
- `services/api.ts` — widen `RoomStatus`; add `restartGame(code, id)`.
- `state/roomStore.ts` — `restartGame` action.
- `pages/GamePage.tsx` — result view when `ended` (word + final scores + history);
  host restart button; navigate to `/lobby` when `status==="lobby"`; gate the
  guess form to `playing`.

## Testing strategy

- Unit: end-on-correct-guess; all-viewer reveal when ended; restart reset +
  participant preservation; non-host restart rejected.
- Manual (two tabs): AC6 — correct guess shows result to both; host restart
  returns both to the lobby with scores cleared; the room can start again.

## Risks / mitigations

- Navigation loops between lobby/game → transitions are keyed on distinct
  statuses (`playing` → game, `lobby` → lobby), so they cannot ping-pong.
- Stale round state after restart → reset is explicit and covered by a test.
- Word leaking before end → reveal is strictly gated on `ended` (or drawer).
