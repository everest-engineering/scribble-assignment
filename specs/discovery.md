# Discovery Notes — Scribble Starter

## Overview

Analysis of the Scribble starter codebase before implementation began.
Documents gaps, assumptions, and relevant files to guide feature work.

## Incomplete Behaviors (Gaps)

1. **No host-only permissions**: The starter treats all participants equally.
   The creator has no special host role — any player could theoretically start
   the game or control lobby state. There is no `hostParticipantId` in the
   room model.

2. **No automatic polling**: The lobby relies on a manual "Refresh Room"
   button with no automatic refresh mechanism. Multi-player state sync
   requires manual intervention.

3. **No game lifecycle**: There is no start-game endpoint, drawer assignment,
   secret word selection, drawing interaction, guess submission, scoring,
   or result/restart state. The canvas, guess form, scoreboard, and result
   panel are all static placeholders with no real functionality.

4. **No canvas implementation**: The game page shows a styled `<div>` with
   placeholder text. No HTML5 Canvas API usage, no drawing interaction,
   no stroke serialization or sync mechanism.

## Assumptions

1. **localStorage-based identity**: Since there is no auth system, host
   identity will be preserved via a participant token stored in
   `localStorage`. On page refresh, the token re-identifies the participant
   and restores their role. This is inferred from the starter's lack of
   any server-side session mechanism.

2. **2-second polling interval**: The lobby refresh is manual in the
   starter. To sync multi-player state without WebSockets, automatic
   polling every ~2 seconds will be added. This cadence keeps the UI
   responsive without excessive server load.

3. **Canvas as point arrays**: Drawing data will use lightweight JSON
   point arrays rather than base64 images, keeping payloads small for
   HTTP polling.

## Relevant Files

- `backend/src/models/game.ts` — Room, Participant, RoomSnapshot types
- `backend/src/services/roomStore.ts` — In-memory room CRUD operations
- `backend/src/api/rooms.ts` — Express route handlers
- `backend/src/api/schemas.ts` — Zod validation schemas
- `frontend/src/services/api.ts` — HTTP client for backend endpoints
- `frontend/src/state/roomStore.ts` — Client-side room state and persistence
- `frontend/src/pages/LobbyPage.tsx` — Lobby UI and polling target
- `frontend/src/pages/GamePage.tsx` — Game screen (placeholder target)
- `frontend/src/pages/CreateRoomPage.tsx` — Room creation form
- `frontend/src/pages/JoinRoomPage.tsx` — Room join form
- `frontend/src/components/GuessForm.tsx` — Guess input (placeholder)
- `frontend/src/components/Scoreboard.tsx` — Score display (placeholder)
- `frontend/src/components/ResultPanel.tsx` — Activity log (placeholder)
