# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-room-setup-lobby/spec.md`

## Summary

Add host identity (`hostId`) to the Room model, fix the API base-URL bug, enforce name/code
validation on both client and server, wire up automatic lobby polling every ~2 seconds, and gate
the Start button to the host with a 2-player minimum — all without WebSockets, a database, or
authentication middleware.

## Technical Context

**Language/Version**: TypeScript 5.6 — Node.js 22 (backend), Vite + React 18 (frontend)

**Primary Dependencies**: Express 4, Zod 3 (backend); React Router v6, Context API (frontend)

**Storage**: In-memory `Map<string, Room>` — no persistence

**Testing**: Vitest (both backend and frontend)

**Target Platform**: localhost development; Chrome/Firefox/Safari modern browsers

**Project Type**: Web application (frontend + minimal REST backend)

**Performance Goals**: Lobby polling round-trip under 200 ms on localhost; no perceptible UI lag

**Constraints**: No WebSockets, no database, no authentication (AGENTS.md + constitution)

**Scale/Scope**: 2–6 players per room; handful of concurrent rooms; lab/demo scale only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-Driven Architecture | ✅ Pass | Changes confined to existing component + page files; no monolithic views introduced |
| II. Type Safety | ✅ Pass | `hostId` added to shared types; strict mode maintained; no `any` introduced |
| III. Test-First (80% coverage) | ✅ Pass | New validation logic covered by unit tests written before implementation |
| IV. Accessibility (WCAG 2.1 AA) | ✅ Pass | Start button state changes use `disabled` attribute; error messages are associated via `aria-describedby` |
| V. Secure by Default | ✅ Pass | No secrets; server-side validation on all inputs; no auth bypass |
| Bundle ≤150 KB | ✅ Pass | No new runtime dependencies added |

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md          ← this file
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
│   │   └── game.ts          ← add hostId to Room + RoomSnapshot; extend RoomStatus
│   ├── services/
│   │   └── roomStore.ts     ← set hostId on createRoom; uppercase code in joinRoom
│   └── api/
│       ├── rooms.ts         ← add 422 validation for empty name; pass hostId through
│       └── schemas.ts       ← tighten playerName schema to trim + min(1)

frontend/
├── src/
│   ├── services/
│   │   └── api.ts           ← fix /bug → /api; extend RoomSnapshot type with hostId
│   ├── state/
│   │   └── roomStore.ts     ← add startPolling/stopPolling methods
│   ├── pages/
│   │   ├── CreateRoomPage.tsx  ← client-side name validation
│   │   ├── JoinRoomPage.tsx    ← client-side name + code validation; uppercase code
│   │   └── LobbyPage.tsx       ← replace manual refresh with auto-poll; host-only Start
│   └── components/
│       └── (no new components needed)
```

**Structure Decision**: Web application layout (Option 2) — `backend/` and `frontend/` at repo
root, matching the existing starter structure exactly.
