# Discovery Notes

## Gaps Found

1. **API base URL broken** — `api.ts:22` appends `/bug`; all requests 404
2. **No host tracking** — `Room` model has no `hostId`; anyone can press Start
3. **No lobby polling** — only manual Refresh button; spec requires ~2s auto-poll
4. **No start-game endpoint** — `POST /rooms/:code/start` missing entirely
5. **Empty name silently accepted** — `displayName()` converts `""` → `"Player"`; spec requires rejection
6. **`toRoomSnapshot` ignores viewer** — `viewerParticipantId` is `void`'d; drawer can't get secret word
7. **Room status frozen at "lobby"** — `RoomStatus = "lobby"` only; playing/result states missing
8. **No canvas** — `<div>` placeholder, no `<canvas>` element or draw events
9. **GuessForm submits nothing** — `handleSubmit` only calls `preventDefault`

## Assumptions

1. Deterministic word selection = `STARTER_WORDS[participantCount % STARTER_WORDS.length]`
2. Drawer = first participant (`room.participants[0]`); single round, no rotation
3. Polling via `setInterval` in `useEffect`; cleanup on unmount
4. Drawing sync via base64 `<canvas>.toDataURL()` stored in room state, polled like guesses
5. "Restart" = clear game state on backend, keep participants, return to lobby status

## Relevant Files

Backend:
- `backend/src/models/game.ts` — Room/Participant types (needs expansion)
- `backend/src/services/roomStore.ts` — in-memory store + business logic
- `backend/src/api/rooms.ts` — route handlers
- `backend/src/api/schemas.ts` — Zod validators
- `backend/src/seed/starterData.ts` — word list + roles

Frontend:
- `frontend/src/services/api.ts` — HTTP client (has the /bug URL)
- `frontend/src/state/roomStore.ts` — external store (useSyncExternalStore)
- `frontend/src/pages/LobbyPage.tsx` — manual refresh, needs polling + Start button logic
- `frontend/src/pages/GamePage.tsx` — placeholder canvas, guess form, scoreboard
- `frontend/src/components/GuessForm.tsx` — renders but does not submit
- `frontend/src/components/Scoreboard.tsx` — placeholder
- `frontend/src/components/ResultPanel.tsx` — placeholder
