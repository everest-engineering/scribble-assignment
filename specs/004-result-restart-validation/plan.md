# Implementation Plan: Result State and Restart

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-02 | **Spec**: `/specs/004-result-restart-validation/spec.md`

## Summary

Implement result state display (correct word visible to all, final scores, full guess history), host-only restart endpoint, player preservation with score retention, and clean round-state clearing on restart.

## Technical Context

**Language/Version**: TypeScript (backend Node.js/Express, frontend React/Vite)

**Primary Dependencies**: Express, Zod (backend); React Router v6 (frontend)

**Storage**: In-memory — round state cleared, participants preserved

**Testing**: Vitest, manual two-tab validation

**Constraints**: No WebSockets, no database, no authentication; restart transitions `"result"` → `"lobby"`

## Constitution Check

- Backend as source of truth: PASS — result data and restart state transitions managed on backend.
- Deterministic/testable behavior: PASS — host-only restart, clear round state, preserve players.
- Secret word protection: PASS — in result phase, word revealed to all players (intentional by FR-024).

## Project Structure

```
specs/004-result-restart-validation/
├── spec.md
├── plan.md
└── tasks.md
```

### Source files to modify

```
backend/src/
├── services/roomStore.ts        — update toRoomSnapshot, add restartRoom
├── api/rooms.ts                 — add POST /:code/restart route
└── services/roomStore.test.ts   — add restart and result snapshot tests

frontend/src/
├── services/api.ts              — add restartGame method
├── state/roomStore.ts           — add restartGame store method
├── pages/GamePage.tsx           — result display, restart button, lobby redirect
├── components/ResultPanel.tsx   — may need word/winner display updates
└── services/api.test.ts         — add restartGame API test
```

## Implementation Steps

1. Update `toRoomSnapshot()` to reveal `secretWord` to ALL viewers when `room.status === "result"`.
2. Add `restartRoom()` service function: host-only, requires "result" status, clears round, preserves participants and scores.
3. Add `POST /:code/restart` route.
4. Add frontend `restartGame()` API method and store method.
5. Update GamePage: show result card (word, winner), host-only restart button, auto-redirect to lobby on status change via polling.
6. Add tests for restart validation and result-phase snapshot behavior.

## Risks

- Score reset ambiguity: resolved with decision to preserve scores (enables future multi-round).
- Polling race on restart: host navigates immediately after restart call; non-hosts detect "lobby" status via next poll interval and navigate.
