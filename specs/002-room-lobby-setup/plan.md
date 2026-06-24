# Implementation Plan: Room Setup & Lobby

**Branch**: `add-specs` | **Date**: 2026-05-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-room-lobby-setup/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement room setup and lobby flow: host designation on room creation, room joining with validation (empty/invalid codes rejected, duplicate name discrimination), auto-polling lobby refresh (~2s), rate limiting on create/join (5/min, 10/min), and host-only game start gated on 2+ participants. Backend additions include host tracking, start-game endpoint, and rate-limit state. Frontend additions include auto-polling interval, host badge in participant list, disabled start button when <2 players, and inline validation on create/join forms.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+

**Primary Dependencies**: Express 4.x (backend), React 18 (frontend), Vite 5.x (frontend build), Zod 3.x (validation)

**Storage**: In-memory only (backend `Map<string, Room>`)

**Testing**: Vitest (backend + frontend), manual two-browser-tab testing per spec acceptance scenarios

**Target Platform**: Modern web browser (Chrome, Firefox, Edge)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Lobby refresh completes in under 3 seconds; polling interval of ~2s; error feedback within 1 second

**Constraints**: No WebSockets, no databases, no authentication; all sync via HTTP polling

**Scale/Scope**: Up to 8 players per room, soft rate limits (5 creates/min, 10 joins/min per session)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (TypeScript-First & Type Safety)**: All new code MUST be fully typed. No `any`. All new validation logic MUST use typed Zod schemas. ✅ No violation.
- **Principle II (Brownfield Enhancement Discipline)**: MUST read existing code before writing. New code MUST conform to established patterns (functional components, Observer-pattern store, Zod schemas in `schemas.ts`, service pattern in `roomStore.ts`). ✅ No violation — codebase already explored.
- **Principle III (Deterministic Game Logic)**: Not applicable — lobby flow has no game mechanics (scoring, word selection, turn assignment). ✅ N/A.
- **Principle IV (HTTP Polling & In-Memory State)**: Auto-polling uses HTTP GET on existing polling endpoint. All state remains in-memory. No databases. **Tension note**: Constitution says "Inactive rooms MUST be cleaned up." Spec clarification resolved that rooms persist until host leaves or server restart. Resolution applied: "inactive" means no connected players and no game started — a room with the host present is "active." ✅ No violation after resolution.
- **Principle V (Validation & Edge Case Rigor)**: This feature directly enforces this principle: inline validation for empty/whitespace names and codes, rate limiting, duplicate name handling with discriminators, error feedback for all failure modes. ✅ Enforced by design.

**Gate status**: ✅ PASS — All constitution principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/002-room-lobby-setup/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts           # Add start-game endpoint + rate-limit middleware
│   │   ├── schemas.ts         # Add startGameSchema, rate-limit tracking types
│   │   └── router.ts          # Unchanged
│   ├── models/
│   │   └── game.ts            # Add isHost to Participant, "playing" to RoomStatus
│   ├── services/
│   │   └── roomStore.ts       # Add host tracking, startGame, rate-limit state, duplicate-name handling
│   └── seed/
│       └── starterData.ts     # Unchanged

frontend/
├── src/
│   ├── pages/
│   │   ├── CreateRoomPage.tsx # Add inline name validation
│   │   ├── JoinRoomPage.tsx   # Add inline name+code validation
│   │   └── LobbyPage.tsx      # Add auto-poll, host badge, start-game button logic
│   ├── services/
│   │   └── api.ts             # Add startGame endpoint
│   └── state/
│       └── roomStore.ts       # Add auto-poll interval, startGame action, host-awareness
```

**Structure Decision**: Web application — two-project layout (`backend/` + `frontend/`). No new projects or top-level dependencies. All changes follow existing patterns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations identified. Complexity tracking not required.
