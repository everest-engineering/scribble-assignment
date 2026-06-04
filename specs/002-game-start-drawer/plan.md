# Implementation Plan: Game Start & Drawer Flow

**Branch**: `scribble-lab` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Parent plan**: [001-scribble-game/plan.md](../001-scribble-game/plan.md)

## Summary

Transition room from `lobby` to `playing`, assign host as drawer, select secret word deterministically, mask word for guessers in snapshots, and redirect all clients to `/game`.

## Technical Context

See shared context in [001-scribble-game/plan.md](../001-scribble-game/plan.md).

## Proposed Changes

### Backend

- `backend/src/services/roomStore.ts` — `startGame`: set `drawerId`, pick word via `sum(ASCII(code)) % words.length`, mask `secretWord` in `toRoomSnapshot` for non-drawers.
- `backend/src/api/rooms.ts` — `POST /rooms/:code/start` (host-only).

### Frontend

- `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts` — `startGame` action.
- `frontend/src/pages/LobbyPage.tsx` — redirect to `/game` when status is `playing`.
- `frontend/src/pages/GamePage.tsx` — show secret word for drawer only; guesser UI without word.

## Dependencies

- **Requires**: [001-room-setup-lobby](../001-room-setup-lobby/plan.md).
- **Blocks**: [003-gameplay-interaction](../003-gameplay-interaction/plan.md).

## Verification

Host starts game; drawer tab shows word; guesser tab shows canvas/guess form with hidden word; both on `/game`.
