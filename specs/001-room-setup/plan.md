# Plan — Room Setup & Lobby

## State Model Changes

### Backend — Extended Types (`backend/src/models/game.ts`)

```
RoomStatus = "lobby" | "playing" | "finished"

Room {
  code: string
  status: RoomStatus
  hostId: string                    // NEW — participant ID of creator
  participants: Participant[]
  drawerId: string | null
  secretWord: string | null
  guesses: Guess[]
  scores: Record<string, number>
  strokes: Stroke[]
  createdAt: string
  updatedAt: string
}

RoomSnapshot {
  code: string
  status: RoomStatus
  hostId: string                    // NEW — always visible
  participants: Participant[]
  drawerId: string | null
  secretWord: string | null
  availableWords: string[]
  roles: ParticipantRole[]
  guesses: Guess[]
  scores: Record<string, number>
  strokes: Stroke[]
}
```

### Frontend — Extended Types (`frontend/src/services/api.ts`)

Mirror the backend types exactly.

---

## Data Flow

```
[Create Room Form]
  → POST /rooms { playerName }
  ← { participantId, room: RoomSnapshot { hostId, status: "lobby", ... } }
  → Navigate to /lobby

[Lobby Page — Polling]
  → setInterval(2000ms) → GET /rooms/:code?participantId=X
  ← { room: RoomSnapshot }
  → Update RoomStore state → re-render participant list

[Host clicks Start Game]
  → POST /rooms/:code/start { participantId }
  ← 200 { room: RoomSnapshot { status: "playing", drawerId, secretWord, ... } }
  → Navigate to /game
```

---

## File-Level Plan

| Step | File | Change |
|------|------|--------|
| 1.1 | `backend/src/models/game.ts` | Add `hostId` to `Room`; extend `RoomStatus` with `"playing"` and `"finished"` |
| 1.2 | `backend/src/services/roomStore.ts` | Set `hostId = participant.id` in `createRoom()`; pass `hostId` in `toRoomSnapshot()`; validate name non-empty |
| 1.3 | `backend/src/api/schemas.ts` | Validate `playerName` is non-empty after trim in both `createRoomSchema` and `joinRoomSchema` |
| 1.4 | `backend/src/api/rooms.ts` | Add `POST /rooms/:code/start` endpoint with host + min-players guard |
| 1.5 | `frontend/src/services/api.ts` | Add `api.startGame()`, extend `RoomSnapshot` with `hostId` |
| 1.6 | `frontend/src/state/roomStore.ts` | Add `startGame()` method |
| 1.7 | `frontend/src/pages/LobbyPage.tsx` | Auto-poll `useEffect` with `setInterval` 2000ms + cleanup; disable Start for non-host / <2 players |
| 1.8 | `frontend/src/pages/CreateRoomPage.tsx` | Add client-side name trimming before submit |
| 1.9 | `frontend/src/pages/JoinRoomPage.tsx` | Add client-side name + code validation |
