# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-11 | **Spec**: `specs/001-room-setup-lobby/spec.md`

**Input**: Feature specification from `/specs/001-room-setup-lobby/spec.md`

**Note**: This plan is authored by `/speckit.plan` and will be used to drive implementation and task definition.

## Summary

Add room creation, join-by-code validation, host assignment, lobby isolation, polling-based lobby refresh, and host-only game start gating. Use the existing Express backend and React frontend to extend room state and the lobby page without introducing new top-level projects.

## Technical Context

**Language/Version**: TypeScript, ES Modules

**Primary Dependencies**:
- Backend: `express`, `zod`, `cors`
- Frontend: `react`, `react-router-dom`, `vite`

**Storage**: In-memory room state via `backend/src/services/roomStore.ts`

**Testing**: `vitest` for backend and frontend unit tests

**Target Platform**: Browser frontend with Node.js backend

**Project Type**: Web application with separate frontend and backend services

**Performance Goals**: Poll lobby state every ~2 seconds and keep backend response times low for local development

**Constraints**: No WebSockets or push protocols, no database persistence, strict TypeScript typing, and room state isolated by code.

**Scale/Scope**: Local multiplayer lobby and room setup for a small in-memory game session.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

All required flows remain within the existing backend/frontend repository structure.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── backend-room-api.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── router.ts
│   │   ├── rooms.ts
│   │   ├── schemas.ts
│   │   └── schemas.test.ts
│   ├── models/
│   │   └── game.ts
│   ├── services/
│   │   ├── roomStore.ts
│   │   └── roomStore.test.ts
│   ├── app.ts
│   └── server.ts
frontend/
├── src/
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── Card.tsx
│   │   ├── GuessForm.tsx
│   │   ├── PageHeader.tsx
│   │   ├── ResultPanel.tsx
│   │   ├── RoomCodeBadge.tsx
│   │   └── Scoreboard.tsx
│   ├── pages/
│   │   ├── CreateRoomPage.tsx
│   │   ├── GamePage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   ├── LobbyPage.tsx
│   │   └── StartPage.tsx
│   ├── routes/
│   │   └── index.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── api.test.ts
│   └── state/
│       └── roomStore.ts
└── index.html
```

**Structure Decision**: The repo is a web application with separate backend and frontend folders. The implementation will extend existing room and lobby routes without adding new frameworks.

## Complexity Tracking

No constitution violations or extra complexity justifications are required for this feature.
