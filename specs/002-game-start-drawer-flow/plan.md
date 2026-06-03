# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-06-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer-flow/spec.md`

## Summary

When the host starts a room, the system transitions it to `"playing"` status and initialises the first round: the host becomes the drawer (`currentDrawerId = hostId`), a secret word is deterministically selected (`STARTER_WORDS[0]`), and `roundNumber` is set to `1`. The word is delivered to the drawer only — the server redacts it from all other participants by checking `participantId === currentDrawerId` in `toRoomSnapshot`. The game screen displays each participant's role (Drawer / Guesser) and shows the word to the drawer while showing placeholder text to guessers.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 18+ backend, React 18 frontend)

**Primary Dependencies**: Express, Zod (backend) · React Router v6, Vite (frontend)

**Storage**: In-memory `Map<string, Room>` — no database

**Testing**: Vitest (both backend and frontend)

**Target Platform**: Local dev server — backend port 3001, frontend port 5173

**Project Type**: Full-stack web application (Express API + React SPA)

**Performance Goals**: Polling at 2-second intervals; no special throughput targets

**Constraints**: No WebSockets; no databases; no auth; no new runtime dependencies; `setInterval` MUST be cleared on component unmount

**Scale/Scope**: Small multiplayer room (2–10 players); single round per game session in this feature

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                             | Status  | Notes                                                                                                          |
| ------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| I. TypeScript-First                   | ✅ PASS | All changes in TypeScript with explicit types; no `any` introduced                                             |
| II. In-Memory State Only              | ✅ PASS | New fields added to in-memory `Room`; no persistence layer touched                                             |
| III. HTTP Polling                     | ✅ PASS | `GamePage` will poll `fetchRoom` at 2s intervals with `clearInterval` cleanup                                  |
| IV. Validate at Every System Boundary | ✅ PASS | Zod already validates all routes; no new unvalidated input surface                                             |
| V. Minimal Footprint                  | ✅ PASS | No new endpoints, no new dependencies, no new entities; `roundNumber` stored for formula but never incremented |

**Post-design re-check**: No violations introduced during Phase 1 design. Complexity tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer-flow/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── api.md           ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (files changed by this feature)

```text
backend/
└── src/
    ├── models/
    │   └── game.ts                   ← add currentDrawerId?, currentWord?, roundNumber? to Room + RoomSnapshot
    └── services/
        ├── roomStore.ts              ← startRoom sets round fields; toRoomSnapshot redacts currentWord
        └── roomStore.test.ts         ← new tests for drawer assignment and word redaction

frontend/
└── src/
    ├── services/
    │   └── api.ts                    ← add currentDrawerId?, currentWord? to RoomSnapshot interface
    └── pages/
        └── GamePage.tsx              ← replace static layout with role list + conditional word + polling
```

**Structure Decision**: Existing web application layout (Option 2). No new directories or files — all changes are in-place modifications to files established in feature 001.

## Complexity Tracking

No Constitution violations. No entry required.
