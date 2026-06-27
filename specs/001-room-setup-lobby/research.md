# Research: Room Setup & Lobby

**Phase**: 0 (Pre-design research)
**Date**: 2026-06-26

## Unknowns Resolution

No [NEEDS CLARIFICATION] markers remained in the spec after the `/speckit.clarify`
session. All technical context is known from the starter codebase.

## Existing Code Patterns

### Backend (Express + TypeScript)

- **Room store** (`roomStore.ts`): In-memory `Map<string, Room>`, 4-char room codes
  from custom alphabet (A-Z excluding I/O/U to avoid confusion), default name "Player".
- **Room endpoints** (`rooms.ts`): `POST /rooms`, `POST /rooms/:code/join`,
  `GET /rooms/:code`. Use Zod schemas for validation.
- **Error handling** (`router.ts`): Centralized error handler catches `ZodError` → 400,
  other errors → status code or 500.
- **Models** (`game.ts`): `Participant`, `Room`, `RoomSnapshot`, `RoomSessionResponse`,
  `ParticipantRole` (drawer|guesser), `RoomStatus` (only `"lobby"`).
- **Seed data** (`starterData.ts`): 5 words, 2 roles.

### Frontend (React 18 + Vite)

- **State** (`roomStore.ts`): Context-based state with `createRoom`, `joinRoom`,
  `fetchRoom`, `clearRoom` actions. Manual refresh pattern.
- **Pages**: StartPage (landing), CreateRoomPage (form), JoinRoomPage (form),
  LobbyPage (participant list + manual refresh + start button), GamePage (placeholder).
- **Routing** (`routes/index.tsx`): React Router v6 with 5 routes + catch-all.

## Key Design Decisions (from Clarifications)

1. **Host departure**: Host transfers to next-earliest player in room.
2. **Polling error recovery**: Exponential back-off (2s → 4s → 8s), error after 3 failures.

## Technology Confirmation

All dependencies are already present in the starter:
- Backend: `express`, `cors`, `zod`, `tsx`, `typescript`, `vitest`
- Frontend: `react`, `react-dom`, `react-router-dom`, `vite`, `vitest`, `jsdom`

No new dependencies needed for this feature.
