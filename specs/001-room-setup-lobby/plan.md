# Implementation Plan: Room Setup & Lobby

**Branch**: `scribble-lab` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Parent plan**: [001-scribble-game/plan.md](../001-scribble-game/plan.md)

## Summary

Implement room creation and joining with name validation, host assignment, case-insensitive room codes, and lobby UI with 2-second HTTP polling. Host-only "Start Game" control (enabled at 2+ players) is surfaced here; start logic is implemented in [002-game-start-drawer](../002-game-start-drawer/plan.md).

## Technical Context

See shared context in [001-scribble-game/plan.md](../001-scribble-game/plan.md).

## Proposed Changes

### Backend

- `backend/src/api/schemas.ts` — trim and validate non-empty `playerName`.
- `backend/src/services/roomStore.ts` — set `hostId` on create; trim names and init scores on join.
- `backend/src/api/rooms.ts` — normalize room codes; 404 for missing rooms.

### Frontend

- `frontend/src/pages/LobbyPage.tsx` — 2s polling, host badge, host-only Start Game (disabled if < 2 players).

## Dependencies

- **Requires**: Foundational model sync ([001-scribble-game/tasks.md](../001-scribble-game/tasks.md) Phase 2).
- **Blocks**: [002-game-start-drawer](../002-game-start-drawer/plan.md).

## Verification

Create room in one tab, join in second tab; participant list updates via polling without reload.
