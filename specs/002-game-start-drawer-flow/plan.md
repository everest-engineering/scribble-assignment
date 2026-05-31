# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-05-31 | **Spec**: [spec.md](spec.md)

## Summary

When the host starts a game, assign the host as the drawer for round 1, select a secret word deterministically from the starter list, and ensure only the drawer sees it. Player names are trimmed and whitespace-only rejected.

## Technical Context

**Language/Version**: TypeScript 5.6 (Node.js 24, React 18)

**Primary Dependencies**: Express 4.21, React 18.3, Zod 3.23

**Storage**: In-memory on Express server — add round state to Room model

**Testing**: Vitest 3.1 (backend + frontend)

**Target Platform**: Modern browsers + Node.js

**Constraints**: No WebSockets, no databases, no auth; HTTP polling only

## Constitution Check

- [x] **TypeScript First**: All new code fully typed
- [x] **HTTP Polling Only**: Round state synced via `GET /rooms/:code` polling
- [x] **In-Memory State**: Round data stored in Room object
- [x] **Immutability**: `structuredClone` copies on all endpoints
- [x] **Spec-Driven**: Implementation follows approved spec

## Project Structure

```text
specs/002-game-start-drawer-flow/
├── spec.md                # Feature specification (DONE)
├── plan.md                # This file
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── checklists/
    └── requirements.md    # Quality checklist (DONE)

backend/src/
├── models/game.ts              # Add Round, GameState types
├── services/roomStore.ts       # Add startRound, round state to toRoomSnapshot
├── api/rooms.ts                # May need updates if startGame changes
├── api/schemas.ts              # Unchanged
└── seed/starterData.ts         # Unchanged

frontend/src/
├── pages/GamePage.tsx          # Display drawer identity + secret word
├── state/roomStore.ts          # Unchanged (polling handles updates)
└── services/api.ts             # Update types if needed
```

## Complexity Tracking

No constitution violations.
