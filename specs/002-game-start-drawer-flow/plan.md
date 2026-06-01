# Implementation Plan: Game Start and Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-game-start-drawer-flow/spec.md`

## Summary

Extend the existing room lobby infrastructure with game-start logic: deterministic drawer assignment (first joined), deterministic secret word selection from an expanded word pool, name validation (trim, reject empty, max 20, case-sensitive duplicate rejection), and role-based word visibility (drawer sees the word, guessers do not) via HTTP polling.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js (ES2022)

**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vite

**Storage**: N/A — all in-memory (per constitution)

**Testing**: Vitest (existing pattern, co-located `.test.ts` files)

**Target Platform**: Web browser (Chrome/Firefox/Safari) + Node.js server

**Project Type**: Full-stack web application (Express backend + React frontend)

**Performance Goals**: Room snapshot delivered within 2 seconds of polling request; no additional latency targets beyond existing spec

**Constraints**: No WebSockets, no databases, no auth, no new dependencies, in-memory only, HTTP polling for all sync

**Scale/Scope**: <10 concurrent rooms, <50 players per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**II. TypeScript & Type Safety**: All new code fully typed; Zod for all request/response validation. — **PASS**

**III. Architecture Constraints (NON-NEGOTIABLE)**:
- No WebSockets — polling only. — **PASS**
- No databases — in-memory only. — **PASS**
- No auth — no sessions, JWT, or OAuth. — **PASS**
- No new state-management or routing libraries. — **PASS**

**IV. Test-First & Validation**: Tests written before implementation; edge cases handled (empty/whitespace names, case-insensitive comparisons flagged). — **PASS**

**V. Deterministic Game Logic**: Drawer assignment and word selection are deterministic. — **PASS**

**No violations found. Complexity Tracking section not required.**

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer-flow/
├── plan.md              # This file
├── research.md          # Phase 0 output — technical decisions
├── data-model.md        # Phase 1 output — extended data model
├── quickstart.md        # Phase 1 output — manual test steps
├── contracts/           # Phase 1 output — API contracts
│   └── api.md
├── tasks.md             # Phase 2 output (/speckit.tasks command)
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              # UPDATE: Room, Participant, RoomSnapshot types
│   ├── services/
│   │   └── roomStore.ts         # UPDATE: startGame logic, joinRoom duplicate check,
│   │                            #   toRoomSnapshot role-awareness, leaveRoom, pickWord
│   ├── seed/
│   │   └── starterData.ts       # UPDATE: expand word pool to 20+ words
│   ├── api/
│   │   ├── schemas.ts           # UPDATE: name validation rules (max length, dupes)
│   │   └── rooms.ts             # UPDATE: leave endpoint, enhanced start response
│   └── app.ts                   # likely no changes

frontend/
├── src/
│   ├── services/
│   │   └── api.ts               # UPDATE: RoomSnapshot types (status, roles, word)
│   ├── state/
│   │   └── roomStore.ts         # UPDATE: role/word tracking, polling behavior
│   ├── pages/
│   │   ├── LobbyPage.tsx        # minor: start button already works
│   │   └── GamePage.tsx         # BUILD: role-based rendering, word display
│   ├── components/
│   │   └── GuessForm.tsx        # UPDATE: connect to API
│   └── styles/
│       └── app.css              # MINOR: game page styling additions (word display)

specs/002-game-start-drawer-flow/
├── spec.md                      # Already finalized
├── plan.md                      # This file
├── research.md                  # Phase 0 complete
├── data-model.md                # Phase 1 — data model
├── contracts/
│   └── api.md                   # Phase 1 — API contracts
└── quickstart.md                # Phase 1 — manual test steps
```

**Structure Decision**: Web application (frontend + backend), consistent with existing layout. No new top-level directories.

## Complexity Tracking

N/A — no constitution violations.
