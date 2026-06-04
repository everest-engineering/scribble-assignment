# Implementation Plan: Room Setup & Lobby

**Branch**: `scribble-lab` | **Date**: 2026-06-04

## Summary
Add host tracking, input validation, lobby polling, and host-only game start.

## Technical Context
- **Language**: TypeScript (backend Node.js/Express, frontend React/Vite)
- **Validation**: Zod (backend), manual (frontend)
- **Storage**: In-memory Map
- **Testing**: Vitest

## State Model Changes

### Backend — Room (game.ts)
- Add `hostId: string`
- Expand `status: "lobby" | "playing" | "result"`
- Add `score: number` (default 0) to Participant

### Frontend — RoomSnapshot (api.ts)
- Add `hostId: string`
- Expand `status: "lobby" | "playing" | "result"`
- Add `scores: Record<string, number>`

## File-Level Changes

### Backend
1. `backend/src/models/game.ts` — Add hostId to Room, score to Participant, expand RoomStatus
2. `backend/src/services/roomStore.ts` — Set hostId on createRoom, add startGame(), trim names, reject empty names
3. `backend/src/api/schemas.ts` — Validate name non-empty
4. `backend/src/api/rooms.ts` — Add POST /:code/start route with host/permission checks

### Frontend
5. `frontend/src/services/api.ts` — Add startGame() API call, update types
6. `frontend/src/state/roomStore.ts` — Add startGame method, add polling interval ref
7. `frontend/src/pages/LobbyPage.tsx` — Add auto-polling via useEffect/setInterval, show host-only Start button, disable until ≥2
8. `frontend/src/pages/CreateRoomPage.tsx` — Validate name non-empty before submit
9. `frontend/src/pages/JoinRoomPage.tsx` — Validate name and code non-empty before submit

## Data Flow
Player creates room → POST /rooms → backend sets hostId → returns RoomSnapshot → frontend stores → lobby polls GET /rooms/:code every 2s → host clicks Start → POST /rooms/:code/start → backend validates host+count → sets status=playing → returns updated snapshot → all clients navigate to /game

## Implementation Sequence
1. Update models (backend)
2. Add host tracking + validation (backend services)
3. Add start endpoint + schemas (backend routes)
4. Update API client + store (frontend)
5. Add polling + host UI (frontend pages)
6. Validate with two browser tabs
