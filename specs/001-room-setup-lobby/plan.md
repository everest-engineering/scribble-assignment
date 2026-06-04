# Implementation Plan: Room Setup & Lobby (US1)

**Branch**: `001-scribble-game` | **Date**: 2026-06-04

## Summary

Add host tracking to the room model, tighten name validation on both client and server, wire lobby auto-polling, and render a host-only Start Game button.

## Files Changed

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add `hostId` to `Room` and `RoomSnapshot`; expand `RoomStatus` |
| `backend/src/services/roomStore.ts` | Set `hostId` in `createRoom`; remove `displayName` fallback; expose `hostId` in `toRoomSnapshot` |
| `backend/src/api/schemas.ts` | `playerName: z.string().trim().min(1)` in create/join schemas |
| `frontend/src/services/api.ts` | Add `hostId` to `RoomSnapshot` type |
| `frontend/src/pages/CreateRoomPage.tsx` | Client-side name guard before API call |
| `frontend/src/pages/JoinRoomPage.tsx` | Client-side name guard before API call |
| `frontend/src/pages/LobbyPage.tsx` | Auto-poll every 2s; host-only Start button; disabled < 2 players |

## Key Design Decisions

- `hostId` is set once at room creation and never changes — deterministic, no race condition
- Polling via `setInterval` + `clearInterval` cleanup in `useEffect` — simple, no lib needed
- Name validation duplicated on client (UX) and server (safety) — Zod trims server-side

## Test Plan

- `createRoom sets hostId to creator's participantId` — unit test
- Schema tests: rejects empty name, rejects whitespace-only, trims name
- Manual: two-tab lobby scenario
