# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-04 | **Spec**: [spec.md](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/specs/001-room-setup-lobby/spec.md)

**Input**: Feature specification from `/specs/001-room-setup-lobby/spec.md`

## Summary

This feature implements the core room creation and joining lobby flows:
- **Backend**: Extend the game models and `roomStore` to support host identity (the player who creates the room is designated as host).
- **Frontend**: Update pages to handle room creation/joining error feedback, run an automatic 2-second polling interval in `LobbyPage` to keep participants synchronized, show Host controls/Start Game button only to the Host player once >= 2 players join, and show a waiting indicator to other players.
- **Rules**: Fully compliant with the Project Constitution (Strict types, ES modules, no WebSockets, in-memory Map storage, and no database or authentication).

## Technical Context

**Language/Version**: TypeScript / Node.js (ES Modules)

**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vite

**Storage**: In-memory Map (`rooms`) inside backend `roomStore.ts`

**Testing**: Vitest (for both frontend and backend)

**Target Platform**: Web Browsers (Chrome, Safari, Firefox) and Node.js backend

**Project Type**: Monorepo Web Application (Express backend + React frontend)

**Performance Goals**: Frontend lobby updates within 2.5 seconds of backend state changes (via 2-second polling).

**Constraints**:
- No WebSockets or Socket.io. Only HTTP GET/POST polling.
- In-memory data only (resets on server restart).
- No databases.
- No authentication or sessions.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **TypeScript-First and Strict Type Safety**: [x] YES
- **Standard ES Module Imports**: [x] YES
- **In-Memory Ephemeral Data Only**: [x] YES
- **HTTP Polling Sync Only**: [x] YES
- **Fail Fast and Zod Validations**: [x] YES
- **Frontend Constraints (React 18, React Router v6, Vanilla CSS)**: [x] YES
- **No Databases, WebSockets, or Authentication**: [x] YES

*Result: Pass. No deviations or violations.*

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Spec quality checklist
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
│   ├── components/
│   ├── pages/
│   │   ├── CreateRoomPage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   ├── LobbyPage.tsx
│   │   └── StartPage.tsx
│   ├── services/
│   │   └── api.ts
│   └── state/
│       └── roomStore.ts
```

**Structure Decision**: Standard Web application setup with `backend/` and `frontend/` directories as recognized in the repository root.

## Verification Plan

### Automated Tests
- Run backend unit/schema tests: `npm --prefix backend run test`
- Run frontend unit/component tests: `npm --prefix frontend run test`

### Manual Verification
- Start backend and frontend local servers.
- **Scenario A**: Open browser, create a room as "Alice". Verify room code is generated, Alice is marked as Host, and the "Start Game" button is visible but disabled.
- **Scenario B**: Open a second browser window (incognito or distinct session), join using the room code as "Bob".
- Verify Bob joins, Alice's screen polls and updates automatically to show Bob within 2 seconds.
- Verify Alice's "Start Game" button becomes active.
- Verify Bob sees "Waiting for Host to start..." and no active start controls.
- **Scenario C**: Attempt to join with a non-existent code. Verify error toast/label is rendered on the landing/join page.
