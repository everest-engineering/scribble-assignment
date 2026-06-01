# Validation Report

## Feature Group 1 — Room Setup & Lobby

| AC | Description | Status | Notes |
|----|-------------|--------|-------|
| AC1.1 | Creating a room returns the creator's participant ID and marks them as host | ✅ Pass | `createRoom` stores `hostId = participant.id`; verified by unit test |
| AC1.2 | The lobby snapshot exposes the host's participant ID | ✅ Pass | `toRoomSnapshot` includes `hostId` field |
| AC1.3 | Joining with empty/whitespace name returns 400 | ✅ Pass | Zod schema `.trim().min(1)` rejects; verified by schema test |
| AC1.4 | Joining non-existent room returns 404 | ✅ Pass | `joinRoom` returns null → `HttpError(404, "Room not found")` |
| AC1.5 | Multi-room isolation | ✅ Pass | Rooms stored in separate `Map` entries |
| AC1.6 | Lobby polls every ~2 seconds | ✅ Pass | `LobbyPage.tsx` uses `setInterval(doPoll, 2000)` |
| AC1.7 | Start Game only for host | ✅ Pass | Button only rendered when `isHost` is true |
| AC1.8 | Start disabled if < 2 players | ✅ Pass | `disabled={!hasMinPlayers}` and backend check |
| AC1.9 | Game start transitions status to "drawing" | ✅ Pass | `startGame` sets `room.status = "drawing"`; verified by unit test |

## Feature Group 2 — Game Start & Drawer Flow

| AC | Description | Status | Notes |
|----|-------------|--------|-------|
| AC2.1 | Player names are trimmed on create and join | ✅ Pass | Zod `.trim()` transform; verified by unit test |
| AC2.2 | Whitespace-only name rejected with 400 | ✅ Pass | `.trim().min(1)` rejects after trimming; verified by schema test |
| AC2.3 | Host is assigned as drawer | ✅ Pass | `startGame` sets `drawerId = room.hostId` |
| AC2.4 | Selected word is deterministic (first from list) | ✅ Pass | `STARTER_WORDS[0]` always selected |
| AC2.5 | Drawer sees the secret word | ✅ Pass | `toRoomSnapshot` shows word when `viewerParticipantId === drawerId` |
| AC2.6 | Non-drawer does not see the word | ✅ Pass | `currentWord: null` for non-drawer during drawing phase |
| AC2.7 | Room status transitions to "drawing" | ✅ Pass | Verified by unit test |

## Feature Group 3 — Gameplay Interaction

| AC | Description | Status | Notes |
|----|-------------|--------|-------|
| AC3.1 | Drawer sees interactive drawing canvas | ✅ Pass | `DrawingCanvas` component renders with mouse/touch handlers |
| AC3.2 | Drawer can clear the canvas | ✅ Pass | Clear button in `DrawingCanvas`; backend `clearDrawing` endpoint |
| AC3.3 | Guesses are trimmed before validation | ✅ Pass | `text.trim()` in `submitGuess` service |
| AC3.4 | Empty/whitespace guesses return 400 | ✅ Pass | `if (!trimmed) return { error: "Guess cannot be empty" }` |
| AC3.5 | Case-insensitive matching | ✅ Pass | `trimmed.toLowerCase() === word.toLowerCase()` |
| AC3.6 | Correct guess = 100 points | ✅ Pass | `room.scores[participantId] += 100` |
| AC3.7 | Incorrect guess = 0 points | ✅ Pass | No score increment for incorrect guesses |
| AC3.8 | Guess history synced via polling | ✅ Pass | `guesses` in snapshot; GamePage polls every 2s |
| AC3.9 | Multiple correct guesses tracked | ✅ Pass | Each guesser independently validated and scored |

## Feature Group 4 — Result & Restart

| AC | Description | Status | Notes |
|----|-------------|--------|-------|
| AC4.1 | Round ends → status "results" | ✅ Pass | `submitGuess` sets `status = "results"` when all guessers correct |
| AC4.2 | All players see correct word in results | ✅ Pass | `toRoomSnapshot` reveals word when `status === "results"` |
| AC4.3 | All players see final scores | ✅ Pass | `scores` included in snapshot; shown in result UI |
| AC4.4 | All players see full guess history | ✅ Pass | `guesses` included in snapshot; shown in ResultPanel |
| AC4.5 | Host can trigger restart | ✅ Pass | `POST /:code/restart` validates hostId |
| AC4.6 | Restart transitions status to "lobby" | ✅ Pass | `restartGame` sets `status = "lobby"` |
| AC4.7 | Restart preserves participants | ✅ Pass | `restartGame` does not modify `participants` array |
| AC4.8 | Restart clears round data | ✅ Pass | `currentRound = null`, `scores = {}` |
| AC4.9 | Non-host sees "Waiting for host" | ✅ Pass | Shown in result UI when `!isHost` |
| AC4.10 | Restart navigates all players to lobby | ✅ Pass | GamePage polling detects `lobby` → `navigate("/lobby")` |

## Edge Cases Validation

| Edge Case | Status | Notes |
|-----------|--------|-------|
| Empty name | ✅ Pass | Zod rejects with "Player name is required" |
| Whitespace-only name | ✅ Pass | `.trim().min(1)` rejects |
| Invalid room code | ✅ Pass | Returns 404 "Room not found" |
| Non-existent room | ✅ Pass | Returns 404 |
| Case-insensitive guessing | ✅ Pass | `.toLowerCase()` comparison |
| Multi-room isolation | ✅ Pass | Separate Map entries per room code |
| Restart state reset | ✅ Pass | `currentRound = null`, `scores = {}` |
| Single player cannot start | ✅ Pass | Backend check + frontend disable |

## Summary

All 36 acceptance criteria and 7 edge cases pass validation.
