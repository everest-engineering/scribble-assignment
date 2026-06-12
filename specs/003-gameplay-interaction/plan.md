# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-12 | **Spec**: `specs/003-gameplay-interaction/spec.md`

**Input**: Feature specification from `/specs/003-gameplay-interaction/spec.md`

## Summary

Extend the existing multiplayer room flow to support active-round gameplay for the drawer and guessers. This includes adding canvas state visibility for the drawer, guess submission validation, shared guess history, polling-based synchronization, and deterministic scoring for correct guesses.

## Technical Context

**Language/Version**: TypeScript 5.x with ES Modules

**Primary Dependencies**:
- Backend: `express`, `zod`, `cors`
- Frontend: `react`, `react-router-dom`, `vite`

**Storage**: In-memory room and round state managed by backend services

**Testing**: `vitest` for both backend and frontend bundles

**Target Platform**: Browser-based frontend with Node.js backend API

**Project Type**: Web application with backend API and client-side state management

**Performance Goals**: Keep polling intervals reasonable and responsive; lobby and game state refresh should remain near 2 seconds

**Constraints**:
- No WebSockets or real-time push protocols
- No persistent storage, authentication, or external databases
- No new state-management or routing frameworks

**Scale/Scope**: Single-server in-memory rooms for small multiplayer groups; target gameplay flow in the existing app structure

## Constitution Check

- The spec is already defined and contains no unresolved `[NEEDS CLARIFICATION]` markers.
- The plan follows the repository constitution by staying within existing backend/frontend structure and preserving in-memory, polling-only sync.
- No new architectural layers or state-management systems are introduced.

## Project Structure

```text
backend/
├── src/
│   ├── api/
│   │   └── rooms.ts
│   ├── models/
│   │   └── game.ts
│   └── services/
│       └── roomStore.ts
frontend/
├── src/
│   ├── components/
│   │   └── GuessForm.tsx
│   ├── pages/
│   │   └── GamePage.tsx
│   ├── services/
│   │   └── api.ts
│   └── state/
│       └── roomStore.ts
specs/003-gameplay-interaction/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
├── contracts/
│   └── api.md
└── checklists/
    └── requirements.md
```

**Structure Decision**: Use the existing web application structure with a backend API and frontend pages. The feature extends existing room/round models and does not require additional projects.

## Plan

1. Extend the backend room/round model to store canvas state, shared guess history, and per-player scores.
2. Add round state exposure to `RoomSnapshot` so the current game view returns guess history, scores, and canvas state.
3. Add backend validation and guess submission handling, including trimming input, rejecting empty guesses, and performing case-insensitive comparison to the target word.
4. Update the frontend `GuessForm` to normalize and validate guesses before submitting.
5. Add frontend polling in `GamePage` to refresh round state, guess history, and scores automatically.
6. Implement score updates in the backend: `100` points for correct guesses, `0` for incorrect guesses.
7. Ensure the drawer can clear canvas state and see that change immediately without losing round progress.
8. Keep the HTTP API contract explicit and room-isolated so no room data leaks across sessions.

## File Targets

- `backend/src/models/game.ts`
- `backend/src/services/roomStore.ts`
- `backend/src/api/rooms.ts`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/components/GuessForm.tsx`
- `frontend/src/state/roomStore.ts`
- `frontend/src/services/api.ts`

## Risks

- Shared guess history must remain isolated per room and per active round.
- Canvas state modeling should not overcomplicate the room snapshot contract.
- Score updates must be deterministic and only apply once per correct guess submission.

## Acceptance Criteria

- Guesses are trimmed and validated before comparison.
- Empty or whitespace-only guesses are rejected and do not enter shared history.
- Correct guesses score `100` points; incorrect guesses score `0`.
- Guess history and scores sync across players via polling.
- The drawer immediately sees canvas updates and clear actions locally.
