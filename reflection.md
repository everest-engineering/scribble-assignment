# Reflection: Scribble — Multiplayer Drawing Game

## What Went Well

### Incremental, Spec-Driven Development
Using the `/speckit` workflow (specify → plan → tasks → implement) for each scenario kept implementation focused and prevented scope creep. Each scenario delivered a testable, self-contained increment.

### Constitution Compliance
All four constraints were maintained throughout:
- **No WebSockets**: HTTP polling at ~2s interval handled all state sync
- **No Database**: In-memory `Map<string, Room>` served all room state
- **No Authentication**: Host authorization via `participantId` matching `room.hostId`
- **TypeScript throughout**: Zero `any` types, full type safety across backend and frontend

### Brownfield Additions
Each scenario extended existing code rather than rewriting:
- Scenario 2 added `drawerId`, `currentWord` to existing Room
- Scenario 3 added `strokes[]`, `guesses[]`, `playerScores`, `hasScored[]`
- Scenario 4 added `"results"` to `RoomStatus` union
This kept the codebase stable — existing tests never broke.

## Challenges & Lessons

### State Serialization Edge Cases
`JSON.stringify` silently drops `undefined` values. The `drawerId` field needed `room.drawerId ?? null` in `toRoomSnapshot` to survive serialization. Old in-memory rooms also lacked the field, requiring a backend restart.

### Auto-Redirect Loops
`LobbyPage` had a `useEffect` that redirected to `/game` when `status === "active"`. When trying to exit the game, navigating back to `/lobby` triggered the redirect again. Fixed by calling `roomStore.clearRoom()` before navigation.

### Guesser Canvas Visibility
Initially guessers saw a static placeholder instead of rendered strokes. Added `CanvasViewer` component that reads `room.strokes` from the snapshot and renders on a read-only canvas — identical visual output to the drawer's canvas.

### Scoreboard Not Updating Live
`GuessForm` was calling a separate `fetchRoom()` after submit, which arrived after polling had already refreshed. Switched to `roomStore.setRoomSnapshot(result.room)` to apply the API response immediately.

## What I Would Do Differently

1. **Add the redirect guards earlier**: The auto-redirect issue in LobbyPage should have been anticipated during scenario 2 design.
2. **Write frontend tests sooner**: Only backend tests were comprehensive initially; frontend tests were deferred.
3. **Consider a lightweight state machine**: The `RoomStatus` union works for 3 states, but a proper state machine would make transitions more explicit and prevent invalid states (e.g., calling `endRound` on a lobby room).

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| In-memory Map for rooms | Simple, fast, no persistence needed for lab-scale |
| HTTP polling (2s) over WebSockets | Project constraint; simpler debugging |
| Deterministic word selection | `(roundNumber - 1) % words.length` for reproducibility |
| Zod at API boundaries only | Validation where external data enters; internal code trusts types |
| Single `roomStore.ts` for all logic | Small scope makes microservices premature |

## Key Metrics

- **Backend tests**: 34 passing
- **Frontend tests**: 4 passing
- **TypeScript errors**: 0 (both projects)
- **Forbidden technologies**: 0 violations
- **Feature specs**: 4 complete (spec.md + plan.md + tasks.md each)
- **Lines of code added across all scenarios**: ~1200+
