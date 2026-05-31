# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-game-start-drawer/spec.md`

## Summary

Implement player name trimming/validation and the core game start mechanics. This includes assigning the host as the drawer, deterministically selecting a secret word, and exposing the secret word selectively only to the drawer.

## Traceability to Scenario 2 Requirements

- **Name trimming**: Validated at the API boundary in `backend/src/api/schemas.ts` using `z.string().trim()`, ensuring leading/trailing spaces are removed before storing. Handled similarly on the frontend before sending.
- **Empty-name rejection**: Validated at the API boundary using `z.string().min(1)`, ensuring empty or whitespace-only names return a 400 error which is handled by the frontend.
- **Drawer assignment**: Upon entering `in-game` status, exactly one drawer is designated (the host). Guessers are derived dynamically as any participant whose `id` does not match the `drawerId`.
- **Deterministic word selection**: Upon entering `in-game` status, the very first word in the starter word list is deterministically chosen as the secret word.
- **Drawer-only word visibility**: The backend's `toRoomSnapshot` function selectively populates `secretWord` inside `roundState` only if the requesting participant is the drawer.
- **Hidden word for guessers**: For guessers, the `toRoomSnapshot` function completely omits `secretWord` from the `roundState` payload.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js 18+ backend, React 18 frontend

**Primary Dependencies**: Express, Zod, React Router v6

**Storage**: In-memory backend `Map` only.

**Testing**: Vitest for backend schemas and services, manual two-browser testing for multiplayer flows.

**Target Platform**: Web application (Frontend + Backend)

**Performance Goals**: N/A

**Constraints**: No WebSockets or real-time push. Rely on the existing 2-second HTTP polling. No new top-level dependencies.

**Scale/Scope**: Handling the transition to the game screen and initializing the first round state. When transitioning to `in-game`, the system initializes the round by:
1. Assigning the drawer (host) and deriving guesser roles.
2. Deterministically selecting the secret word (the first word from the starter list).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- HTTP polling only: confirmed. We are adding fields to the existing polled `RoomSnapshot` response.
- In-memory room state only: confirmed. The `RoundState` will reside within the existing in-memory `Room` map.
- TypeScript and Zod contracts: confirmed. `Zod` schemas for `createRoom` and `joinRoom` will be updated to enforce trimming and minimum length.
- Scenario traceability: maps directly to README Scenario 2. The traceability section above verifies all requirements are met.
- Incremental review: building backend state first, followed by API validations, and finally frontend mapping.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── game-start-drawer.md # Phase 1 output
└── tasks.md             # To be created by /speckit-tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts
│   │   └── schemas.ts
│   ├── models/
│   │   └── game.ts
│   └── services/
│       └── roomStore.ts
└── tests/

frontend/
├── src/
│   ├── pages/
│   │   ├── StartPage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   └── GamePage.tsx
│   └── state/
│       └── roomStore.ts
└── tests/
```

**Structure Decision**: Web application (frontend + backend) matching the existing monorepo design.

## Complexity Tracking

No violations or unjustified complexities.
