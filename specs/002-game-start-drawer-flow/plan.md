# Implementation Plan: Game Start & Drawer Flow

**Branch**: `assignment-Anusha` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer-flow/spec.md`

## Summary

Spec 001 delivered the lobby and game-start skeleton. This plan extends the existing
in-memory store and game screen to implement:

- Player name trimming enforced at the API layer (Zod `.trim().min(1)`) and the frontend
  (send `playerName.trim()` to the API).
- Single-player game start allowed — the ≥2 player requirement is removed per spec.
- Round state embedded in `Room`: drawer assigned to `hostId`, word selected deterministically
  via `(roundNumber - 1) % STARTER_WORDS.length`.
- `RoomSnapshot` extended with `currentDrawerId` and viewer-conditional `secretWord`.
- `GamePage` updated to show drawer identity to all players and the secret word only to the drawer.

No new npm packages. All changes are additive modifications to existing files.

## Technical Context

**Language/Version**: TypeScript 5.6 — Node.js 18+ (backend), browser (frontend)

**Primary Dependencies**: Express 4 (backend), Zod 3 (validation, already installed),
React 18 + react-router-dom 6 (frontend), Vite 5 (dev server)

**Storage**: In-memory `Map<string, Room>` in `backend/src/services/roomStore.ts` —
no database, no persistence across server restarts

**Testing**: Manual browser verification per [quickstart.md](./quickstart.md); existing
Vitest suites in `backend/src/api/schemas.test.ts`, `backend/src/services/roomStore.test.ts`,
and `frontend/src/services/api.test.ts` for regression checks

**Target Platform**: localhost development — backend port 3001, frontend port 5173

**Project Type**: Web application — REST backend + React SPA frontend

**Performance Goals**: Game start response < 200 ms on localhost; secret word visible
within 1 s of game screen loading (SC-002)

**Constraints**: REST + polling only; no WebSockets, SSE, or GraphQL; no persistence;
no new npm packages; existing API route paths must not change

**Scale/Scope**: 2–10 players per room; single Node.js process; lab scenario only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-First | ✅ Pass | `spec.md` complete with acceptance criteria, functional requirements, and success criteria |
| II. Brownfield Awareness | ✅ Pass | All affected files read before planning; no existing route paths changed; `toRoomSnapshot` signature extended not replaced |
| III. Incremental, Story-Sliced | ✅ Pass | US2 (P2 name validation) and US1 (P1 game start) are independently testable; P1 first |
| IV. Critical AI Review | ✅ Pass | Plan cites concrete file paths, line-level changes, and explicit before/after field shapes |
| V. Granular Commits | ✅ Pass | Each task maps to one logical concern in one or two files |

**Post-design re-check**: All five principles still pass. No new abstractions or packages
introduced. The `≥2 player` guard is removed deliberately; documented in research.md §2.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer-flow/
├── plan.md              ← this file
├── research.md          ← Phase 0 decisions
├── data-model.md        ← Phase 1 entity definitions
├── quickstart.md        ← Phase 1 manual verification guide
├── contracts/
│   └── game-api.md      ← Phase 1 REST API delta contract
└── tasks.md             ← /speckit-tasks (generated separately)
```

### Source Code (files touched by this feature)

```text
backend/src/
├── models/game.ts
│   ├── ADD  CurrentRound interface { roundNumber, drawerId, wordIndex }
│   ├── ADD  currentRound?: CurrentRound  field to Room interface
│   └── ADD  currentDrawerId?, secretWord?  fields to RoomSnapshot interface
│
├── services/roomStore.ts
│   ├── CHANGE  startGame(): remove `participants.length < 2` guard
│   ├── CHANGE  startGame(): set room.currentRound = { roundNumber:1, drawerId:hostId,
│   │           wordIndex: 0 }  (formula: (1-1) % 5 = 0)
│   └── CHANGE  toRoomSnapshot(): populate currentDrawerId from currentRound.drawerId;
│               include secretWord only when viewerParticipantId === drawerId
│
└── api/
    ├── schemas.ts
    │   ├── CHANGE  createRoomSchema: playerName → z.string().trim().min(1)
    │   └── CHANGE  joinRoomSchema:   playerName → z.string().trim().min(1)
    │
    └── rooms.ts
        └── CHANGE  POST /:code/start handler: pass participantId to toRoomSnapshot()
                    so the host/drawer receives secretWord in the start response

frontend/src/
├── services/api.ts
│   └── CHANGE  RoomSnapshot type: add currentDrawerId?: string; secretWord?: string
│
├── state/roomStore.ts
│   └── CHANGE  RoomSnapshot type mirror: add currentDrawerId?, secretWord? (same as api.ts)
│
├── pages/CreateRoomPage.tsx
│   └── CHANGE  send playerName.trim() to roomStore.createRoom()
│
├── pages/JoinRoomPage.tsx
│   └── CHANGE  send playerName.trim() to roomStore.joinRoom()
│
├── pages/LobbyPage.tsx
│   ├── CHANGE  canStart: remove participants.length >= 2 gate
│   └── CHANGE  button label: remove "Waiting for players… (need 2+)" branch
│
└── pages/GamePage.tsx
    ├── ADD  derive isDrawer = participantId === room.currentDrawerId
    ├── ADD  Drawer identity: show who is drawing (visible to all players)
    └── ADD  Secret word: show room.secretWord to drawer; placeholder to others
```

**Structure decision**: Web application layout. No new directories needed in source.
All changes are modifications to existing files.

**No new npm packages.** Zod, Express, React, and react-router-dom already cover all requirements.

## Complexity Tracking

No constitution violations. Section left blank per template instructions.
