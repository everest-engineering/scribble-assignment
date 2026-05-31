## Scenario 1 — Room Setup & Lobby

### Findings
- Host tracking missing: no `hostId` on Room model
- RoomStatus is only `"lobby"` — needs `"playing"` and `"finished"`
- No start-game endpoint exists
- Player name validation missing (empty names silently become "Player")
- No auto-polling in lobby (manual refresh only)

### State Model Changes

**Backend — Room type additions:**
```
hostId: string          // participantId of the creator
status: "lobby" | "playing" | "finished"
```

**Backend — RoomSnapshot additions:**
```
hostId: string
```

**Frontend — RoomSnapshot type additions:**
```
status: "lobby" | "playing" | "finished"
hostId: string
```

### Data Flow

1. **Create Room** → POST /rooms with `{ playerName }` → backend stores hostId = participantId → returns RoomSnapshot with hostId
2. **Join Room** → POST /rooms/:code/join with `{ playerName }` → validates name → returns RoomSnapshot
3. **Poll Lobby** → GET /rooms/:code?participantId=... every 2s → returns updated participant list
4. **Start Game** → POST /rooms/:code/start with `{ participantId }` → validates host + min 2 players → updates status to "playing" → returns updated RoomSnapshot

### File-Level Changes

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add `hostId` to Room and RoomSnapshot; expand RoomStatus union |
| `backend/src/services/roomStore.ts` | Store hostId on create; validate name not empty; add `startGame()`; add `isHost` check |
| `backend/src/api/schemas.ts` | Add validation that playerName is non-empty string |
| `backend/src/api/rooms.ts` | Add POST /rooms/:code/start route |
| `frontend/src/services/api.ts` | Update RoomSnapshot type; add `startGame()` method; add `submitGuess()` and `fetchCanvas()` stubs |
| `frontend/src/state/roomStore.ts` | Add `startGame()` method; auto-poll room state |
| `frontend/src/pages/LobbyPage.tsx` | Auto-poll every 2s; gate start button to host only; disable until 2+ players; show host badge |
| `frontend/src/pages/CreateRoomPage.tsx` | Validate name before submission |
| `frontend/src/pages/JoinRoomPage.tsx` | Validate name and code before submission |
| `frontend/src/components/Scoreboard.tsx` | No change in Scenario 1 |
| `frontend/src/components/ResultPanel.tsx` | No change in Scenario 1 |

### Testing Strategy
- Manual two-tab validation: create room, join room, verify host badge, verify auto-polling, verify host-only start button.
- Backend tests: verify hostId on create, verify startGame rejects non-host, verify startGame rejects <2 players.

### Risks
- Polling interval choice: 2s may cause noticeable lag on poor connections, but per spec.
- Race condition on rapid join + start: handled by server-side validation (atomicity in single-threaded Node).
