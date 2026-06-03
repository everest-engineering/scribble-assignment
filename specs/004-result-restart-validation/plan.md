# Implementation Plan: Scribble Game Result, Restart & Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-result-restart-validation/spec.md`

## Summary

Add round results display and game restart to the Scribble application. When a round ends (timer or all-correct), a `ResultsScreen` component replaces active gameplay for all players, showing the correct word, per-round scores (including 50 pts × correct-guessers for the drawer), full guess history, and a 30-second countdown. The host can restart early via `POST /rooms/:code/restart`; if not, the server auto-advances to lobby at the `resultExpiresAt` timestamp, detected lazily at poll time. One new `Room` field (`resultExpiresAt`), one new backend endpoint, one new frontend component, and targeted extensions to `toRoomSnapshot`, `submitGuess`, and `checkRoundExpiry`.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict); Node.js 24 (backend); React 18.3 (frontend)

**Primary Dependencies**:
- Backend: Express 4.21, Zod 3.23, tsx (dev), Vitest 3.1
- Frontend: React 18, React Router DOM 6.30, Vite 5.4, Vitest 3.1 (jsdom), Zod (shared/)

**Storage**: In-memory `Map<string, Room>` in `backend/src/services/roomStore.ts` — no persistence (Constitution Principle V)

**Testing**: Vitest — backend (node env), frontend (jsdom env); ≥ 80% line/branch coverage gate; TDD Red-Green-Refactor

**Target Platform**: Browser (Chrome/Firefox/Safari) + Node.js 24 server

**Project Type**: Web application (frontend + backend monorepo with shared Zod schemas)

**Performance Goals**: Results screen visible within 2 s of round end (SC-001); lobby transition within 3 s of restart/auto-advance (SC-004)

**Constraints**: Bundle ≤ 150 KB gzipped; no persistence; `strict: true` TypeScript; no WebSocket (polling only)

**Scale/Scope**: Single-server, up to 4 players per room; ~12 modified/new source files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Gate | Status | Notes |
|---|------|--------|-------|
| 1 | TypeScript strict mode | ✅ PASS | All new types explicit; `resultExpiresAt: string \| null`; no `any` |
| 2 | Functional components & existing patterns | ✅ PASS | `ResultsScreen` is a function component; follows existing component conventions |
| 3 | TDD (Vitest ≥ 80%) | ✅ PLANNED | `restartRoom`, `checkResultExpiry`, drawer scoring, `ResultsScreen` all get failing tests first |
| 4 | Accessibility (WCAG 2.1 AA) | ✅ PLANNED | Countdown uses `aria-live="polite"`; restart button keyboard-accessible; axe-core in component tests |
| 5 | No persistence introduced | ✅ PASS | `resultExpiresAt` is an in-memory field; no storage APIs used |
| 6 | Zod contracts present | ✅ PLANNED | `resultExpiresAt` added to `roomSnapshotSchema`; `restartRoomSchema` created before implementation |
| 7 | Error boundary coverage | ✅ PASS | `PageErrorBoundary` wraps all pages; no new pages introduced |

**Post-design re-check**: No violations. `resultExpiresAt` is a non-breaking additive field. Existing `status === "in-progress"` guards are unaffected. `"lobby"` status after restart is already handled by `LobbyPage` polling.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-validation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api-contracts.md # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (modified and new files)

```text
shared/
└── schemas/
    └── room.ts                      # Add resultExpiresAt: z.string().nullable() to roomSnapshotSchema

backend/
└── src/
    ├── models/
    │   └── game.ts                  # Add resultExpiresAt: string | null to Room interface
    ├── services/
    │   ├── roomStore.ts             # Add restartRoom(), checkResultExpiry();
    │   │                            # update submitGuess() + checkRoundExpiry() for drawer scoring
    │   │                            # + resultExpiresAt; update toRoomSnapshot() for word reveal
    │   │                            # + resultExpiresAt; update startRoom() to init resultExpiresAt: null
    │   └── roomStore.test.ts        # TDD tests for all new/modified service functions
    └── api/
        ├── rooms.ts                 # Add POST /:code/restart route
        └── schemas.ts               # Add restartRoomSchema

frontend/
└── src/
    ├── services/
    │   └── api.ts                   # Add restartGame()
    ├── state/
    │   └── roomStore.ts             # Add restartGame() action
    ├── components/
    │   ├── ResultsScreen.tsx        # NEW — word reveal, score table, guess history,
    │   │                            # countdown display, restart button (host-only)
    │   └── ResultsScreen.test.tsx   # NEW — component tests with axe accessibility check
    └── pages/
        ├── GamePage.tsx             # Mount ResultsScreen when status === "finished";
        │                            # extend polling to "finished"; navigate to /lobby on "lobby"
        └── GamePage.test.tsx        # Add/update tests for results screen and lobby nav
```

**Structure Decision**: Web application (existing `backend/` + `frontend/` monorepo with `shared/` for Zod contracts). No new top-level directories. One new frontend component (`ResultsScreen.tsx`).

## Complexity Tracking

No Constitution violations. No entries required.
