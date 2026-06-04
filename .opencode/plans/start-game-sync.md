# Start Game Sync Plan

## Problem
- Host clicks Start Game, navigates to /game
- Second player remains in /lobby — no sync
- No backend endpoint to start the game

## Solution

### Backend (3 changes)

#### 1. `backend/src/api/schemas.ts` — Add startGameSchema
After `guessSchema`, add:
```typescript
export const startGameSchema = z.object({
  participantId: z.string()
});
```

#### 2. `backend/src/services/roomStore.ts` — Add startGame function
Before `submitGuess`:
```typescript
export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room) return null;
  if (room.hostId !== participantId) return null;
  if (room.participants.length < 2) return null;
  room.status = "playing";
  room.updatedAt = now();
  rooms.set(room.code, room);
  return cloneRoom(room);
}
```

#### 3. `backend/src/api/rooms.ts` — Add route + import
- Add `startGame` to the import from `../services/roomStore.js`
- Add `startGameSchema` to the import from `./schemas.js`
- Add route before `GET /:code`:
```typescript
router.post("/:code/start", (request, response, next) => {
  try {
    const { code } = roomCodeParamsSchema.parse(request.params);
    const { participantId } = startGameSchema.parse(request.body);
    const room = startGame(code.toUpperCase(), participantId);
    if (!room) throw new HttpError(400, "Unable to start game");
    response.json({ room: toRoomSnapshot(room, participantId) });
  } catch (error) { next(error); }
});
```

### Frontend (3 changes)

#### 4. `frontend/src/services/api.ts` — Add startGame method
After `submitGuess`:
```typescript
startGame(code: string, participantId: string) {
  return request<{ room: RoomSnapshot }>(
    `/rooms/${encodeURIComponent(code)}/start`,
    { method: "POST", body: JSON.stringify({ participantId }) }
  );
}
```

#### 5. `frontend/src/state/roomStore.ts` — Add startGame method
After `submitGuess`:
```typescript
async startGame() {
  const { room, participantId } = this.state;
  if (!room || !participantId) return;
  await this.withLoading(async () => {
    const response = await api.startGame(room.code, participantId);
    this.setRoomSnapshot(response.room);
  });
}
```

#### 6. `frontend/src/pages/LobbyPage.tsx` — Two changes
- Import `useCallback` from React
- Replace host button onClick:
  `onClick={() => navigate("/game")}` → `onClick={() => roomStore.startGame()}`
- Add effect after the polling effect:
```typescript
useEffect(() => {
  if (room?.status === "playing") {
    navigate("/game");
  }
}, [room?.status, navigate]);
```

## How non-host reaches GamePage
1. Non-host polls every 2s via existing `fetchRoom()` interval
2. Poll returns room with `status: "playing"` (host started it)
3. Store updates `room` → re-render → effect fires → `navigate("/game")`

## Files NOT changed
- `GamePage.tsx` — already handles game rendering and polling
- No new pages, libraries, or WebSockets
- No US3 (guessing/scoring) logic touched
