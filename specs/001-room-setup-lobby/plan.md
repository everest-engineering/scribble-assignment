# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-05-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

## Summary

Implement room creation with host tracking, code-based room joining with validation, automatic lobby polling (~2s), and host-only game start with a 2-player minimum. This covers the foundational multiplayer entry flow for the Scribble drawing game.

## Technical Context

**Language/Version**: TypeScript 5.6 (Node.js 24, React 18)

**Primary Dependencies**: Express 4.21 (backend), React 18.3 + React Router 6.30 (frontend), Zod 3.23 (validation)

**Storage**: In-memory `Map<string, Room>` on the Express server

**Testing**: Vitest 3.1 (both backend and frontend)

**Target Platform**: Modern browsers (Chrome, Firefox, Safari) via Vite dev server; Node.js for backend

**Project Type**: Web application (Express backend + React SPA frontend)

**Performance Goals**: Room operations (create/join/poll) complete in under 500ms; polling at ~2s intervals

**Constraints**: No WebSockets or real-time push; no databases; no authentication; all HTTP polling

**Scale/Scope**: Up to ~8 players per room; rooms cleaned up after inactivity

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **TypeScript First**: All new code will be fully typed — no `any`, use `unknown` where needed
- [x] **HTTP Polling Only**: Lobby refresh uses `setInterval` with `GET /rooms/:code` — no WebSockets
- [x] **In-Memory State**: Room data stored in `Map<string, Room>` — no database
- [x] **No Authentication**: Players identified by participant ID — no sessions/JWT
- [x] **Immutability**: Backend returns `structuredClone` copies from all endpoints
- [x] **Spec-Driven**: Implementation follows this plan derived from the approved spec

All checks pass. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── spec.md               # Feature specification (DONE)
├── plan.md               # This file
├── research.md           # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/
│   └── api.md            # API contract documentation
└── checklists/
    └── requirements.md   # Quality checklist (DONE)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts           # Add hostId, scores, RoomStatus values
│   ├── services/
│   │   └── roomStore.ts      # Add host tracking, validation, startGame
│   ├── api/
│   │   ├── router.ts         # Add start-game route
│   │   ├── rooms.ts          # Update create/join, add start-game handler
│   │   └── schemas.ts        # Add playerName validation, start-game schema
│   └── seed/
│       └── starterData.ts    # Unchanged

frontend/
├── src/
│   ├── pages/
│   │   ├── CreateRoomPage.tsx  # Add name validation
│   │   ├── JoinRoomPage.tsx    # Add code + name validation
│   │   └── LobbyPage.tsx       # Add polling, host controls, start game
│   ├── components/
│   │   └── GuessForm.tsx       # Unchanged
│   ├── state/
│   │   └── roomStore.ts        # Add polling method, startGame
│   ├── services/
│   │   └── api.ts              # Add startGame API call
│   └── routes/
│       └── index.tsx           # Possibly unchanged
```

**Structure Decision**: Web application (backend + frontend). Each change maps to existing file patterns.

## Complexity Tracking

No constitution violations. Standard feature implementation.
