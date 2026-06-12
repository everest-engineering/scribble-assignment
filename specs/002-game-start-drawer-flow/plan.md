# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-06-11 | **Spec**: `specs/002-game-start-drawer-flow/spec.md`

**Input**: Feature specification from `/specs/002-game-start-drawer-flow/spec.md`

## Summary

Enable the first round start, enforce trimmed non-empty player names, assign the first drawer, and show the secret word only to that drawer. Keep the work within existing Express backend and React frontend patterns.

## Technical Context

**Language/Version**: TypeScript, ES Modules

**Primary Dependencies**:
- Backend: `express`, `zod`, `cors`
- Frontend: `react`, `react-router-dom`, `vite`

**Storage**: In-memory room and game state via existing backend services

**Testing**: `vitest` for backend and frontend unit tests

**Constraints**:
- No WebSockets or real-time push protocols
- No persistent storage or authentication
- No new state management or routing libraries

## Plan

1. Add name trimming and whitespace-only rejection in room creation and join flows.
2. Ensure backend rejects invalid player names as a safety net.
3. Define the first-round start flow in the lobby, gated by at least two players.
4. Assign the drawer role to the host or first player for the opening round.
5. Implement deterministic word selection from the starter list.
6. Reveal the secret word only to the drawer in the game state.
7. Update the game view to label the drawer clearly and keep the word hidden from others.
8. Add acceptance checks to ensure all validation and display rules are met.

## File Targets

- `backend/src/services/roomStore.ts`
- `backend/src/api/rooms.ts`
- `frontend/src/pages/CreateRoomPage.tsx`
- `frontend/src/pages/JoinRoomPage.tsx`
- `frontend/src/pages/LobbyPage.tsx`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/state/roomStore.ts`

## Risks

- Existing game flow may not yet support a full game-round transition. Keep changes focused on first-round start only.
- Drawer visibility must be strictly controlled at the frontend contract boundary.
- Deterministic word choice should not add unnecessary complexity; use a simple rule.

## Acceptance Criteria

- Player names are trimmed and whitespace-only names are rejected.
- Host or first player becomes the drawer when the first round begins.
- The first round only starts with at least two players.
- The secret word is chosen deterministically from the starter list.
- Only the drawer can see the secret word.
- Drawer identity is explicitly labeled in the game view.
