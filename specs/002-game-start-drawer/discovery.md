# Discovery: Game Start — First Round Drawer & Secret Word

## Scaffold Analysis (What the Starter Already Had)

After completing Feature 001, the scaffold supported:

- **Backend**: `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`, `POST /rooms/:code/start`; host tracking via `hostParticipantId`; lobby auto-polling.
- **Frontend**: CreateRoom, JoinRoom, and Lobby pages with ~2s polling; `LobbyPage` can call `startGame()`.
- **Data model**: `Room` has `status: "lobby" | "playing"` (added in 001), `hostParticipantId`, `participants`.
- **Routing**: `/game` route exists but renders a placeholder page with non-functional canvas, guess input, and scoreboard.

## Gaps (Incomplete Behaviors)

1. **No drawer assignment on start**: When `POST /rooms/:code/start` succeeds, the room transitions to `playing` but no participant is designated as the drawer. The `drawerId` field does not exist yet.
2. **No secret word selection**: The starter includes a `STARTER_WORDS` array, but no logic selects a word when the game starts. `currentWord` is always `null`.
3. **No word visibility rules**: The `GET /rooms/:code` endpoint returns the same snapshot to all viewers. There is no mechanism to reveal the word only to the drawer and hide it from guessers.
4. **No guesser placeholder UI**: Guessers see `currentWord: null` with no visual indicator of how many letters the word contains (e.g., underscores).
5. **No `drawerId` on snapshot**: The `RoomSnapshot` type lacks a `drawerId` field, so clients cannot compute who the drawer is.
6. **No polling in GamePage**: The Game page does not poll the room snapshot, so clients do not synchronize state changes during gameplay (e.g., host leaving mid-round).
7. **No host-leave mid-round handling**: If the host (who is also the drawer in the first round) leaves while `status === "playing"`, the room remains in `playing` with a dangling `hostParticipantId`.

## Assumptions

- **Assumption A1**: The host is always the drawer for the first (and only) round. No rotation logic is required.
- **Assumption A2**: The word list is fixed at five words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`), and the first round deterministically uses the first word (`rocket`).
- **Assumption A3**: The `RoomSnapshot` should expose `drawerId` as a string reference rather than an `isDrawer` boolean, so each client computes drawer identity locally by comparing its stored `participantId`.
- **Assumption A4**: The secret word is revealed to guessers only after the round ends (in a future feature). During `playing`, guessers see a placeholder or `null`.
- **Assumption A5**: If the drawer leaves mid-round, the round is immediately aborted and the room returns to `lobby` with all round state cleared.

## Relevant Files

| File | Role |
|------|------|
| `backend/src/services/roomStore.ts` | Needs `drawerId`, `currentWord`, `startGame`, `removeParticipant` reset logic |
| `backend/src/models/game.ts` | Needs `drawerId`, `currentWord`, `RoomStatus` extension |
| `backend/src/api/rooms.ts` | Needs to extend `GET /rooms/:code` with viewer-aware `currentWord` |
| `backend/src/api/schemas.ts` | Needs schemas for game-start request validation |
| `frontend/src/pages/GamePage.tsx` | Needs polling, drawer banner, word reveal/hide logic |
| `frontend/src/services/api.ts` | Needs to pass `participantId` on `fetchRoom` for word visibility |
| `frontend/src/state/roomStore.ts` | Needs to store `participantId` and pass it through polling |

## Open Questions / Unknowns (Resolved)

- Q: How should the secret word be delivered to the drawer without exposing it to guessers? → A: Include `currentWord` in `RoomSnapshot` only when the requesting `participantId` matches `drawerId`; otherwise return `null`.
- Q: What UI should guessers see instead of the word? → A: Underscore placeholders matching the word length (e.g., `_ _ _ _ _`).
- Q: Should the backend add an `isDrawer` boolean field? → A: No; expose `drawerId` and let the client compare IDs.
