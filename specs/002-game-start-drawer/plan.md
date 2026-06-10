# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer` | **Date**: 2026-06-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer/spec.md`

## Summary

Extend the `startGame` endpoint (added in FG1) to assign `drawerId = hostId` and
`secretWord = STARTER_WORDS[0]` to the Room. Activate the viewer-specific snapshot logic so the
`GET /api/rooms/:code` endpoint returns `secretWord` only to the drawer. Update the game screen
to display each player's role clearly and show the secret word to the drawer only.

## Technical Context

**Language/Version**: TypeScript 5.6 — Node.js 22 (backend), Vite + React 18 (frontend)

**Primary Dependencies**: Express 4, Zod 3 (backend); React Router v6, Context API (frontend)

**Storage**: In-memory `Map<string, Room>` — no persistence

**Testing**: Vitest (both)

**Target Platform**: localhost; modern browsers

**Project Type**: Web application (frontend + minimal REST backend)

**Performance Goals**: Game screen renders within 1 second of navigation

**Constraints**: No WebSockets, no DB, no auth; secret word must be server-enforced

**Scale/Scope**: Lab demo; 2–6 players per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-Driven Architecture | ✅ Pass | GamePage updated in place; no new monolithic views |
| II. Type Safety | ✅ Pass | `drawerId` and `secretWord` added to shared types; no `any` |
| III. Test-First / 80% coverage | ✅ Pass | New store logic covered by unit tests before implementation |
| IV. Accessibility (WCAG 2.1 AA) | ✅ Pass | Role badges use semantic text; no colour-only distinction |
| V. Secure by Default | ✅ Pass | `secretWord` is server-gated per viewer — never sent to guessers |
| Bundle ≤150 KB | ✅ Pass | No new runtime dependencies |

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── checklists/
    └── requirements.md
```

### Source Code (affected files)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts          ← add drawerId, secretWord to Room + RoomSnapshot
│   └── services/
│       ├── roomStore.ts     ← startGame sets drawerId+secretWord; toRoomSnapshot gates secretWord
│       └── roomStore.test.ts ← tests for drawer assignment and viewer-specific snapshot

frontend/
├── src/
│   ├── services/
│   │   └── api.ts           ← extend RoomSnapshot type with drawerId, secretWord
│   └── pages/
│       └── GamePage.tsx     ← show role badge; show secretWord to drawer; show drawerId label
```

**Structure Decision**: Web application layout — same `backend/` + `frontend/` structure as FG1.
