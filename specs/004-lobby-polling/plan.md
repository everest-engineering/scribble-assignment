# Implementation Plan: Automatic Lobby Polling

**Branch**: `sdd2/scribble-assignment` | **Date**: 2026-07-06 | **Spec**: `specs/004-lobby-polling/spec.md`

**Input**: Feature specification from `specs/004-lobby-polling/spec.md`

## Summary

Add automatic HTTP polling to the Lobby page so that the participant list refreshes every ~2 seconds without manual interaction. When polling detects the room status is no longer "lobby", auto-navigate to the game page. On 404 (room deleted), navigate to home with error. Skip overlapping polling cycles if a request is still in-flight. Purely frontend — no backend changes needed.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, modern browsers

**Primary Dependencies**: React 18 (useEffect, useRef, useCallback), React Router v6 (useNavigate), existing RoomStore (fetchRoom via useSyncExternalStore)

**Storage**: N/A — no data persistence; polls existing in-memory room state

**Testing**: Vitest — existing frontend tests at `frontend/src/services/api.test.ts`

**Target Platform**: Modern browsers via Vite dev server and production build

**Project Type**: Web application (frontend React SPA)

**Performance Goals**: Poll interval of ~2000ms; skip overlapping cycles to avoid request pile-up

**Constraints**: No WebSockets, no databases, no new dependencies. Must use existing `fetchRoom` API and RoomStore. No backend changes.

**Scale/Scope**: Single feature — Lobby page polling only. Game page polling deferred.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Deterministic Game Logic | ✅ Pass | Polling is read-only; no game state mutation |
| II. RESTful Synchronization | ✅ Pass | HTTP polling at ~2s cadence per constitution mandate; no push protocol |
| III. Validation Rigor | ✅ Pass | Uses existing validated fetchRoom endpoint; no new inputs |
| IV. Brownfield Enhancement | ✅ Pass | Extend existing LobbyPage with useEffect; no new files or dependencies |
| V. State Isolation & Immutability | ✅ Pass | Poll results applied via existing immutable roomStore.setRoomSnapshot pattern |

**No violations** — Complexity Tracking section not required.

## Project Structure

### Documentation (this feature)

```text
specs/004-lobby-polling/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── pages/
│   │   └── LobbyPage.tsx      # Add useEffect with setInterval for auto-polling
│   └── state/
│       └── roomStore.ts        # No changes needed (fetchRoom already exists)
```

**Structure Decision**: Web application layout (Option 2). Only the frontend is affected — specifically `LobbyPage.tsx`. No backend changes.

## Complexity Tracking

> Not required — all Constitution Check gates pass with no violations.
