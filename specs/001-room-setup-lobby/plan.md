# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

## Summary

The Scribble starter already provides create-room, join-room, and fetch-room REST
endpoints with an in-memory store, and corresponding React pages. This plan adds:

- `hostId` to the `Room` model so the creator is automatically identified as host
- `POST /rooms/:code/start` endpoint (host-only, ≥2 participants required)
- Rejection of join attempts against in-progress rooms
- Strengthened input validation (non-empty names and codes)
- Fix to the intentional `API_BASE_URL` bug in `frontend/src/services/api.ts`
- Automatic ~2s lobby polling to replace the manual refresh button
- Host indicator and host-only Start Game button in `LobbyPage`

No new npm packages are required. All changes are additive to existing files.

## Technical Context

**Language/Version**: TypeScript 5.6 — Node.js 18+ (backend), browser (frontend)

**Primary Dependencies**: Express 4 (backend), Zod 3 (validation, already installed),
React 18 + react-router-dom 6 (frontend), Vite 5 (frontend dev server)

**Storage**: In-memory `Map<string, Room>` in `backend/src/services/roomStore.ts` —
no database, no persistence across server restarts

**Testing**: Manual browser verification per quickstart.md; existing Vitest suites in
`backend/src/api/schemas.test.ts`, `backend/src/services/roomStore.test.ts`, and
`frontend/src/services/api.test.ts` for regression checks

**Target Platform**: localhost development — backend on port 3001, frontend on port 5173

**Project Type**: Web application — REST backend + React SPA frontend

**Performance Goals**: Lobby poll ≤ 2 s interval; create/join round-trip < 500 ms
on localhost

**Constraints**: REST + polling only (no WebSockets, SSE, or GraphQL); no persistence;
no new npm packages; existing API route paths must not change

**Scale/Scope**: 2–10 players per room; single Node.js process; lab scenario only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-First | ✅ Pass | `spec.md` complete with acceptance criteria |
| II. Brownfield Awareness | ✅ Pass | All affected files inspected before planning; no existing routes changed |
| III. Incremental, Story-Sliced | ✅ Pass | Tasks decomposed P1 → P4 with independent testability per slice |
| IV. Critical AI Review | ✅ Pass | Plan cites concrete file paths and line-level changes |
| V. Granular Commits | ✅ Pass | Each task maps to one logical file or concern |

**Pre-requisite fix (not a constitution violation — must be resolved in US1):**
`frontend/src/services/api.ts` line 22 contains an intentional starter bug:
`"http://localhost:3001/bug"`. This MUST be corrected to `"http://localhost:3001"`
before any user story can be end-to-end tested.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              ← this file
├── research.md          ← Phase 0 decisions
├── data-model.md        ← Phase 1 entity definitions
├── quickstart.md        ← Phase 1 manual verification guide
├── contracts/
│   └── rooms-api.md     ← Phase 1 REST API contract
└── tasks.md             ← /speckit-tasks (generated separately)
```

### Source Code (files touched by this feature)

```text
backend/src/
├── models/game.ts              ← add hostId to Room; extend RoomStatus; add hostId to RoomSnapshot
├── services/roomStore.ts       ← set hostId on createRoom; reject join of in-progress rooms; add startGame()
└── api/
    ├── schemas.ts              ← strengthen playerName to .min(1); add startGameSchema
    └── rooms.ts                ← add POST /:code/start route

frontend/src/
├── services/api.ts             ← fix API_BASE_URL bug; add hostId to RoomSnapshot type; add startGame() call
├── state/roomStore.ts          ← add hostId to RoomSnapshot type; add startGame() method
└── pages/LobbyPage.tsx         ← replace manual refresh with setInterval polling;
                                   host indicator in participant list;
                                   host-only Start Game button with ≥2 player gate
```

**Structure decision**: Web application layout (Option 2). No new directories needed.
All changes are modifications to existing files.

**No new npm packages.** Zod, Express, React, and react-router-dom already cover
all requirements.
