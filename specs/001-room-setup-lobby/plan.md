# Implementation Plan: Room Setup and Lobby Readiness

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-02 | **Spec**: `/specs/001-room-setup-lobby/spec.md`

## Summary

Extend the Scribble starter to add host-aware room creation, input validation (trimmed names, room code normalization), lobby polling at 2-second intervals, host-only start gating with a 2-player minimum, and room isolation.

## Technical Context

**Language/Version**: TypeScript (backend Node.js/Express, frontend React/Vite)

**Primary Dependencies**: Express, Zod (backend); React Router v6 (frontend)

**Storage**: In-memory Map only

**Testing**: Vitest (both projects), manual two-tab validation

**Target Platform**: Local development in modern browsers

**Project Type**: Web application with frontend + REST backend

**Constraints**: No WebSockets, no database, no authentication, no new routing/state libraries

## Constitution Check

- Brownfield-first: PASS — extends existing room model, handlers, and pages.
- Out-of-scope discipline: PASS — no WebSockets, persistence, or auth.
- Backend as source of truth: PASS — host status, scores, and room state live on backend.
- Clear user-facing validation: PASS — trimmed-name rejection, invalid-code rejection, start gating all return explicit feedback.

## Project Structure

```
specs/001-room-setup-lobby/
├── spec.md
├── plan.md
└── tasks.md
```

### Source files to modify

```
backend/src/
├── models/game.ts         — add isHost, score to Participant
├── api/schemas.ts          — add trim+min validation schemas
├── api/rooms.ts            — add start endpoint skeleton
└── services/roomStore.ts   — add host tracking, validation, start gating

frontend/src/
├── services/api.ts         — add startGame method
├── state/roomStore.ts      — add polling, session persistence, startGame
├── pages/CreateRoomPage.tsx — client-side trim+validation
├── pages/JoinRoomPage.tsx  — client-side trim+validation
└── pages/LobbyPage.tsx     — polling, host badge, start button gating
```

## Implementation Steps

1. Extend Participant model with `isHost` and `score`.
2. Add Zod validation schemas for trimmed names and room codes.
3. Update create/join handlers to validate input and return participant identity.
4. Add `POST /:code/start` skeleton with host-only and 2-player checks.
5. Add frontend API method for startGame.
6. Add polling loop (2s interval, cleanup on unmount) to room store.
7. Add sessionStorage persistence for roomCode, participantId, playerName.
8. Update LobbyPage with host badge, drawer badge, start button gating.
9. Add client-side validation to CreateRoomPage and JoinRoomPage.

## Risks

- Polling race conditions: mitigate by treating backend snapshot as authoritative.
- Over-refactoring: edit existing handlers/pages instead of replacing routing or state libraries.
