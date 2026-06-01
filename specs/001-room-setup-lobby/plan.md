# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-05-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

## Summary

Players need to create rooms, join existing rooms via code, view participant lists in a lobby, and have the host initiate game start once ≥2 players are present. The system uses HTTP polling (~2s) to sync lobby state across browsers. Rooms are isolated, in-memory only, and persist until backend restart. No WebSockets or authentication.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+, React 18+)

**Primary Dependencies**: 
- Backend: Express, Zod
- Frontend: React Router v6, Zustand (existing roomStore.ts)

**Storage**: In-memory (already implemented in `backend/src/services/roomStore.ts`)

**Testing**: 
- Backend: Vitest + unit tests for roomStore
- Frontend: Vitest + integration tests for lobby flow

**Target Platform**: Web (HTTP polling)

**Project Type**: Full-stack web application (brownfield enhancement)

**Performance Goals**: Lobby polling response within ~2 seconds; participant list updates visible within ~3 seconds

**Constraints**: HTTP polling only (no WebSockets); in-memory storage (restart clears rooms); case-insensitive room codes

**Scale/Scope**: Support multi-room sessions; no upper limit defined for concurrent rooms or players per room (assume modest limits per lab scope)

## Constitution Check

✅ **TypeScript First**: All new code will be fully typed. No `any` types; use `unknown` where necessary.

✅ **Test-First**: Tests will be written before implementation. TDD cycle enforced.

✅ **Immutability**: Room state mutations via pure service functions; no direct state mutation.

✅ **Error Handling**: Backend errors via centralized error handlers; frontend UI does not crash on network failures.

✅ **Strict Architecture**: Backend endpoints in `api/`, business logic in `services/`, models in `models/`. Frontend state in `state/roomStore.ts`, components remain presentation-focused.

✅ **No WebSockets**: Polling only.

✅ **No Databases**: In-memory only.

✅ **No Authentication**: Room codes are public; no auth required.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── spec.md                          # This feature specification
├── plan.md                          # This file (implementation plan)
├── checklists/
│   └── requirements.md              # Quality checklist
└── data-model.md                    # Entity models and state shape
└── contracts/                       # HTTP endpoint contracts
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── router.ts                # (existing) main router
│   │   ├── rooms.ts                 # (existing) room endpoints; ADD validation
│   │   └── schemas.ts               # (existing) Zod schemas; ADD player name, join validation
│   ├── services/
│   │   ├── roomStore.ts             # (existing) in-memory store; ADD host tracking, isolation
│   │   └── roomStore.test.ts        # (existing) tests; ADD join, list, host tests
│   ├── models/
│   │   └── game.ts                  # (existing) types; ADD Room, Player, GameState types
│   └── seed/
│       └── starterData.ts           # (no change)
└── tests/                           # (optional) integration tests

frontend/
├── src/
│   ├── components/
│   │   ├── LobbyPage.tsx            # (existing) lobby view; ADD polling, host-only start button
│   │   ├── CreateRoomPage.tsx       # (existing) create form; ADD name validation
│   │   └── JoinRoomPage.tsx         # (existing) join form; ADD code validation, error display
│   ├── pages/
│   │   └── LobbyPage.tsx            # (existing) page wrapper
│   ├── services/
│   │   ├── api.ts                   # (existing) HTTP client; ADD poll endpoint
│   │   └── api.test.ts              # (existing) tests; ADD polling, error handling tests
│   └── state/
│       ├── roomStore.ts             # (existing) Zustand store; ADD polling state, actions
│       └── roomStore.test.ts        # (new) tests for store polling logic
└── styles/
    └── app.css                      # (existing) styling; ADD host indicator, button states
```

---

## State Model

### Backend State (In-Memory roomStore)

```typescript
interface Room {
  code: string;                // lowercase, 4-6 alphanumeric, unique
  hostId: string;              // player ID of room creator
  participants: Player[];       // ordered list
  gameState: GameState;         // "lobby" | "inProgress" | "finished"
  createdAt: number;            // timestamp
}

interface Player {
  id: string;                   // unique per room, generated server-side
  name: string;                 // trimmed, non-empty
  isHost: boolean;              // true if this player created the room
}

type GameState = "lobby" | "inProgress" | "finished";

// roomStore service maintains:
// Map<code, Room> — all active rooms
// Provides methods:
//   - createRoom(playerName): { code, hostId }
//   - joinRoom(code, playerName): { room, playerId } | error
//   - getRoom(code): Room | undefined
//   - validateCode(code): boolean
```

### Frontend State (Zustand roomStore)

```typescript
interface RoomState {
  // UI state
  currentCode: string | null;
  currentPlayerId: string | null;
  participants: Player[];
  isHost: boolean;
  
  // Polling state
  isPolling: boolean;
  lastPollTime: number | null;
  pollError: string | null;
  
  // Actions
  createRoom: (playerName: string) => Promise<void>;
  joinRoom: (code: string, playerName: string) => Promise<void>;
  startPolling: (code: string) => void;
  stopPolling: () => void;
  fetchRoomState: () => Promise<void>;  // called by polling
  leaveRoom: () => void;
}
```

---

## Data Flow

### Create Room Flow

```
CreateRoomPage (user submits name)
  ↓
api.createRoom(name)  [POST /rooms]
  ↓
Backend: validate name, create room, add host as participant
  ↓
Response: { code, hostId, participants }
  ↓
roomStore.setCurrentCode(code), setParticipants(...)
  ↓
Navigate to LobbyPage
  ↓
LobbyPage mounts → startPolling()
```

### Join Room Flow

```
JoinRoomPage (user enters code + name)
  ↓
api.joinRoom(code, name)  [POST /rooms/:code/join]
  ↓
Backend: validate code exists, validate name, add player, return room
  ↓
Response: { code, playerId, participants, isHost }
  ↓
roomStore.setCurrentCode(code), setPlayerId(...), setParticipants(...)
  ↓
Navigate to LobbyPage
  ↓
LobbyPage mounts → startPolling()
```

### Polling Flow (Active in Lobby)

```
LobbyPage mounted
  ↓
useEffect: startPolling()
  ↓
Every ~2 seconds:
  fetchRoomState() [GET /rooms/:code]
    ↓
    Response: { participants, hostId, gameState }
    ↓
    roomStore.setParticipants(participants), setIsHost(...)
    ↓
    UI re-renders with updated list
    ↓
    (loop continues)
  
  If network error:
    catch(error)
    ↓
    roomStore.setPollError(error.message)
    ↓
    Retry on next interval (no UI crash)
    
  If user leaves Lobby:
    stopPolling()
    ↓
    useEffect cleanup cancels fetch
```

### Start Game Flow (Host-Only)

```
LobbyPage (host views lobby with ≥2 participants)
  ↓
Start Game button visible & enabled
  ↓
Host clicks Start Game
  ↓
Frontend validates: participants.length >= 2
  ↓
If valid:
  api.startGame(code)  [POST /rooms/:code/start] (out of scope, endpoint stub only)
  ↓
  Navigate to GamePage
  
Else:
  Show error: "At least 2 players required"
```

---

## File-Level Changes Summary

### Backend

| File | Change | Details |
|------|--------|---------|
| `src/api/schemas.ts` | Add/Update | `PlayerNameSchema` (trim, min 1 char), `JoinRoomSchema` (code, name) |
| `src/api/rooms.ts` | Update | Add input validation using Zod; normalize code to lowercase; handle duplicate joins; add error responses |
| `src/services/roomStore.ts` | Update | Add host tracking; ensure room isolation; add playerId generation; refine join logic |
| `src/services/roomStore.test.ts` | Update | Add tests for createRoom, joinRoom with host tracking, isolation, duplicate joins |
| `src/models/game.ts` | Add/Update | Define `Room`, `Player`, `GameState` types; export for use in API |

### Frontend

| File | Change | Details |
|------|--------|---------|
| `src/components/CreateRoomPage.tsx` | Update | Add name validation (trim, non-empty); call api.createRoom; handle errors |
| `src/components/JoinRoomPage.tsx` | Update | Add code & name validation; call api.joinRoom; display error messages; trim inputs |
| `src/components/LobbyPage.tsx` | Update | Add polling logic (useEffect), host-only start button, error handling |
| `src/services/api.ts` | Add/Update | Add `pollRoom(code)` method for polling; update `createRoom`, `joinRoom` signatures |
| `src/services/api.test.ts` | Update | Add tests for polling, error handling, network failures |
| `src/state/roomStore.ts` | Update | Add polling state (isPolling, lastPollTime, pollError); add startPolling, stopPolling actions |
| `src/styles/app.css` | Update | Add styles for host indicator, disabled button states, error messages |

---

## Implementation Sequence

### Phase 1: Backend Foundation (Blocking)

1. **T001**: Update `src/models/game.ts` with `Room`, `Player`, `GameState` types
2. **T002**: Update `src/api/schemas.ts` with Zod schemas for player names, join requests
3. **T003**: Refine `src/services/roomStore.ts` to track host, validate joins, generate player IDs
4. **T004**: Add tests in `src/services/roomStore.test.ts` for new roomStore behavior
5. **T005**: Update `src/api/rooms.ts` POST/GET endpoints to use new schemas and service logic
6. **T006**: Verify all backend tests pass

### Phase 2: Frontend (Can start after Phase 1, independently testable)

7. **T007**: Update `src/state/roomStore.ts` to add polling state and actions
8. **T008**: Update `src/services/api.ts` to add pollRoom and error handling
9. **T009**: Update `CreateRoomPage.tsx` with validation and error handling
10. **T010**: Update `JoinRoomPage.tsx` with validation and error handling
11. **T011**: Update `LobbyPage.tsx` with polling, host button, participant list
12. **T012**: Update `src/styles/app.css` for host indicator and button states
13. **T013**: Add tests in `src/services/api.test.ts` for polling and error handling
14. **T014**: Verify all frontend tests pass

### Phase 3: Integration Testing

15. **T015**: Manual two-browser test: create room, join, see participants, start game
16. **T016**: Manual multi-room isolation test: verify rooms don't interfere
17. **T017**: Verify polling responsiveness (new participant visible within ~3 seconds)

---

## Testing Strategy

### Unit Tests

- **Backend RoomStore**: createRoom, joinRoom, getRoom, host tracking, duplicate joins, isolation
- **Frontend Polling**: fetch success, network error, retry logic
- **Input Validation**: empty names, invalid codes, whitespace handling

### Integration Tests (Manual)

- Create room → join room → see participants → host starts game
- Multi-room isolation: two rooms created; participants remain isolated
- Polling: join from second browser; new participant visible within ~3 seconds
- Error handling: invalid code, network down, UI remains stable

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Polling latency | Players see stale data | Acceptable ~2s latency documented in spec; tests validate within 3s |
| Network failures during polling | UI freeze or crash | Try-catch and error state in store; UI gracefully handles errors |
| Code collision | Two rooms with same code | Accept low collision risk in-memory; if needed, increase code length |
| Race condition (simultaneous joins) | Duplicate participants | RoomStore uses synchronous operations; no async mutations |
| Memory leak (rooms never cleared) | Eventually runs out of memory | Out of scope for Scenario 1; addressed in Scenario 4 (restart/cleanup) |

---

## Notes for Developer

1. **Code Normalization**: Store all room codes lowercase server-side; normalize user input to lowercase before lookup.
2. **Player ID Generation**: Use `crypto.randomUUID()` or similar for unique player IDs within a room.
3. **Polling Interval**: Use `setInterval` in frontend; consider `AbortController` for cleanup to avoid memory leaks.
4. **Error Messages**: Keep messages user-friendly; differentiate between "room not found" and "network error".
5. **Host Button**: Render the Start button only to the host; show disabled state if <2 players with explanatory text.

