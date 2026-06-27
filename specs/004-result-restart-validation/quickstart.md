# Quickstart: Result, Restart & Final Validation

## Branch

```
004-result-restart-validation
```

## Verification

### Backend

```bash
cd backend

# Run tests
npm test

# Build
npm run build

# Dev server
npm run dev
```

### Frontend

```bash
cd frontend

# Run tests
npm test

# Build  
npm run build

# Dev server
npm run dev
```

## Manual Test Plan

### US1 — Persistent Round Result

1. Create room as Alice, join as Bob. Start game.
2. Submit correct guess as Bob.
3. Verify both Alice and Bob see result overlay with: correct word, drawer name, scores, guess history.
4. Wait 10s — verify overlay does NOT auto-dismiss.
5. Click "Continue" as Alice — verify overlay hides on Alice's screen, still visible on Bob's.
6. Click "Continue" as Bob — verify overlay hides on Bob's screen.

### US2 — Restart Game

1. Start game, play a round to result screen.
2. Verify host sees "Restart Game" button in result overlay.
3. Verify non-host does NOT see "Restart Game" button.
4. Host clicks "Restart Game" — verify all players see lobby with participants preserved and all game state cleared.

### US3 — Exit Game Coexists

1. On result overlay, verify "Exit Game" button is visible to all.
2. Click "Exit Game" — verify local session is cleared and user is redirected to home.

### US4 — Host Disconnect & Claim Host

1. Start game with 3+ players. Close host's browser tab.
2. Wait >30s, poll as non-host — verify `hostDisconnected: true` in snapshot.
3. Verify non-host sees "Host disconnected" popup with "Claim Host" button.
4. Click "Claim Host" — verify room's `hostId` updates and `hostDisconnected` becomes false.
5. Verify new host sees "Skip Round" and "Restart Game" buttons.

### US5 — Skip Round & Drawer Disconnect

1. Start game. Open 3 tabs (Alice=host/drawer, Bob=guesser, Charlie=guesser).
2. Close Alice's tab (drawer disconnected).
3. Wait >30s, poll as Bob — verify `drawerDisconnected: true`.
4. Verify Bob sees "Drawer disconnected" popup with "Notify Host" button.
5. Charlie claims host via HostDisconnectedBanner.
6. Bob clicks "Notify Host" — verify Charlie sees badge on "Skip Round" button.
7. Charlie clicks "Skip Round" — verify round advances, result overlay shows with correct word.
8. Verify skip is rejected (400) if someone already guessed correctly.

### Name Validation

1. Try to create room with name >20 chars — verify Zod rejects with clear error.
2. Verify frontend input has `maxLength={20}`.

## Test Commands

```bash
# Run all tests
cd backend && npm test && cd ../frontend && npm test

# Run specific test file
cd backend && npx vitest run src/services/roomStore.test.ts

# Run with coverage
cd backend && npx vitest run --coverage
cd frontend && npx vitest run --coverage

# Type check only
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/models/game.ts` | Participant.lastSeenAt, Room.skipSuggested, RoomSnapshot hostDisconnected/drawerDisconnected/skipSuggested |
| `backend/src/services/roomStore.ts` | restartGame(), claimHost(), skipRound(), suggestSkip(), lastSeenAt updates in getRoom, disconnect computation in toRoomSnapshot |
| `backend/src/api/rooms.ts` | 4 new routes + lastSeenAt update in GET /:code |
| `backend/src/api/schemas.ts` | 4 new Zod schemas + max(20) name validation |
| `frontend/src/services/api.ts` | 4 new API methods + RoomSnapshot type updates |
| `frontend/src/state/roomStore.ts` | restartGame, claimHost, skipRound, suggestSkip, dismissLastRoundResult |
| `frontend/src/components/RoundResultCard.tsx` | Guess history table, Continue/Restart buttons, name fix |
| `frontend/src/components/HostDisconnectedBanner.tsx` | New: Host disconnected popup |
| `frontend/src/components/DrawerDisconnectedBanner.tsx` | New: Drawer disconnected popup |
| `frontend/src/pages/GamePage.tsx` | Wire all new features |
| `frontend/src/pages/LobbyPage.tsx` | HostDisconnectedBanner |

## Dependencies

No new dependencies required.
