# Implementation Plan: Game Start & Drawer Flow (US2)

**Branch**: `001-scribble-game` | **Date**: 2026-06-04

## Summary

Add `startGame` service function, `POST /:code/start` route, activate `secretWord` visibility logic in `toRoomSnapshot`, wire `handleStart` in LobbyPage, add auto-navigate on status change, and show role in GamePage.

## Files Changed

| File | Change |
|------|--------|
| `backend/src/services/roomStore.ts` | Add `startGame`; activate secretWord visibility in `toRoomSnapshot` |
| `backend/src/api/schemas.ts` | Add `startGameSchema` |
| `backend/src/api/rooms.ts` | Add `POST /:code/start` route |
| `frontend/src/services/api.ts` | Add `api.startGame` method |
| `frontend/src/state/roomStore.ts` | Add `startGame` action |
| `frontend/src/pages/LobbyPage.tsx` | Wire `handleStart`; add `useEffect` for status-based navigation |
| `frontend/src/pages/GamePage.tsx` | Derive `isDrawer`; show role label and secret word |

## Key Design Decisions

- `participants[0]` is always the drawer — deterministic, no random state needed
- Word formula `participants.length % 5` is testable without mocking
- `secretWord` filtered in `toRoomSnapshot` — single source of truth, no per-route logic
- Navigation triggered by polling — consistent with lobby auto-poll pattern

## Test Plan

- `startGame sets status to playing`
- `assigns drawer as participants[0]`
- `word is STARTER_WORDS[count % 5]`
- `throws 403 for non-host`
- `throws 400 with fewer than 2 players`
- `api.startGame POST to correct URL` — frontend unit test
