# Implementation Plan: Result, Restart & Final Validation (US4)

**Branch**: `001-scribble-game` | **Date**: 2026-06-04

## Summary

Add `endGame` and `restartGame` service functions, their routes, a `ResultPanel` component, host controls in GamePage, and auto-navigate back to lobby on restart.

## Files Changed

| File | Change |
|------|--------|
| `backend/src/services/roomStore.ts` | Add `endGame` (host guard, set `status="result"`); add `restartGame` (host guard, clear round state) |
| `backend/src/api/schemas.ts` | Add `gameActionSchema` — reusable for end + restart |
| `backend/src/api/rooms.ts` | Add `POST /:code/end`, `POST /:code/restart` routes |
| `frontend/src/services/api.ts` | Add `api.endGame`, `api.restartGame` |
| `frontend/src/state/roomStore.ts` | Add `endGame`, `restartGame` actions |
| `frontend/src/components/ResultPanel.tsx` | Show when `status === "result"`: secret word, scores, guess history |
| `frontend/src/pages/GamePage.tsx` | Host "End Round" button (playing); "Play Again" button (result); `useEffect` for `status === "lobby"` → navigate |

## Key Design Decisions

- `restartGame` clears all round fields in a single atomic update — no partial state possible
- `scores` reset to `{}` (empty) not `{id: 0}` — participants may leave/join between rounds
- `ResultPanel` reads from `useRoomState` directly — no prop drilling needed
- Navigation on restart reuses the same `useEffect` pattern as lobby→game navigation

## Test Plan

- `endGame sets status to result`
- `endGame 403 for non-host`
- `restartGame sets status=lobby, clears round state, keeps participants+hostId`
- `restartGame 403 for non-host`
- `api.endGame` and `api.restartGame` frontend unit tests
