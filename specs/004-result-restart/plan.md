# Implementation Plan: Result, Restart & Final Validation

**Branch**: `004-result-restart` | **Date**: 2026-06-09 | **Spec**: ../spec.md

**Input**: Feature specification from `/specs/004-result-restart/spec.md`

## Summary

Implement the result view and restart flow for Scribble. When a round ends (all guessers guessed correctly), all participants see the revealed secret word, final scores, and full guess history. The host can restart the game, returning everyone to the lobby with participants preserved and all round state cleared. This completes the full game lifecycle: lobby → playing → result → restart → lobby.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Node.js 18+

**Primary Dependencies**: React, React Router v6, Vite, Express, Zod, Vitest

**Storage**: Server-side in-memory room store

**Testing**: Vitest for frontend and backend units

**Target Platform**: Web application (browser with local dev backend)

**Constraints**: No WebSocket or real-time push. No persistent database. No authentication service.

## Constitution Check

- TypeScript strict mode throughout.
- Frontend UIs use functional components and hooks only.
- Vitest coverage at 80% surface minimum.
- No new major dependencies.
- `"result"` status view rendered inside GamePage — not a separate route.

## Project Structure

### Documentation (this feature)

```
specs/004-result-restart/
├── plan.md
├── spec.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code Changes

```
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts          ← add POST /:code/restart route
│   │   └── schemas.ts        ← add restart schema
│   └── services/
│       └── roomStore.ts      ← add restartRoom(), update toRoomSnapshot() for result
frontend/
├── src/
│   ├── pages/
│   │   ├── GamePage.tsx      ← add result view, restart button
│   │   └── LobbyPage.tsx     ← ensure restart → lobby works
│   ├── services/
│   │   └── api.ts            ← add restartGame()
│   └── state/
│       └── roomStore.ts      ← add restartGame() method
```

## Implementation Plan

### Phase 1 — Backend restart logic

1. Add `restartRoom(code, hostParticipantId)` to `roomStore.ts`:
   - Validate caller is host.
   - Validate room status is `"result"` or `"playing"`.
   - Set status to `"lobby"`.
   - Clear `currentRound` (scores, guesses, secret word, drawer).
   - Clear `canvasState`.
   - Preserve all participants and `hostParticipantId`.
   - Save and return clone.

2. Add `POST /rooms/:code/restart` route in `rooms.ts`:
   - Body: `{ participantId }`.
   - 403 if not host, 400 if not in result/playing status.

3. Update `toRoomSnapshot()`:
   - When `status === "result"`: reveal `secretWord` to ALL viewers (not just drawer).
   - Include complete `guesses[]` array and `scores` map.

### Phase 2 — Frontend result view

1. Update `GamePage.tsx`:
   - When `room.status === "result"`:
     - Render result view instead of game view.
     - Show the revealed secret word prominently.
     - Show Scoreboard with final scores.
     - Show ResultPanel with full guess history.
     - Host sees "Restart Game" button.
     - Non-hosts see "Waiting for the host to restart..." message.

2. The result view replaces the canvas/guess area. The layout should still show the scoreboard and activity panel.

### Phase 3 — Frontend restart

1. Add `api.restartGame(code, participantId)` to `frontend/src/services/api.ts`.
2. Add `restartGame()` method to `RoomStore` in `frontend/src/state/roomStore.ts`:
   - Calls `api.restartGame()`, then `setRoomSession()` to update state.
3. Wire restart button in GamePage to call `roomStore.restartGame()`:
   - On success, navigate to `/lobby`.
   - On error, display error message.

### Phase 4 — Full lifecycle verification

1. Ensure the LobbyPage correctly restores after restart:
   - Participants preserved.
   - Room status is `"lobby"`.
   - Start button disabled until 2+ players.
2. Ensure host can start a new game after restart:
   - New round with fresh canvas, scores, guesses.
   - New secret word (deterministically different if totalParticipants is unchanged but roundNumber increments to 2).

### Phase 5 — Testing and validation

1. Backend tests:
   - Successful restart by host.
   - Rejection when caller is not host.
   - Rejection when room is in "lobby" status.
   - Round state cleared after restart.
   - Participants preserved after restart.
2. Frontend tests:
   - GamePage renders result view when status is "result".
   - Restart button visible only for host.
   - Restart navigates to lobby.
3. Manual verification: two browser tabs complete lobby → start → draw → guess correct → see result → restart → see lobby → start again.

## Risks and Mitigations

- **Result data consistency**: The result view reads from the same `currentRound` object that was active during gameplay. No data migration needed — the round is simply marked as `isComplete` and status is `"result"`.
- **Late joiners during result**: A participant joining during `"result"` should see the result data. The snapshot includes the completed round data, so this works without special handling.
- **Restart while someone is in game**: All participants' next poll will show `status: "lobby"`, and GamePage will redirect to `/lobby` automatically.

## Next Steps

- Create `specs/004-result-restart/tasks.md` with ordered implementation tasks.
- Implement backend restart endpoint.
- Implement frontend result view and restart flow.
- Add vitest coverage.
- Run full lifecycle verification across two browser tabs.
