# Implementation Plan: Result, Restart & Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-12 | **Spec**: `specs/004-result-restart-validation/spec.md`

**Input**: Feature specification from `/specs/004-result-restart-validation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Extend the room lifecycle to support a post-round result state where all players
see the correct word, final scores, and full guess history. Add a host-only
restart action that resets round-specific data while preserving the participant
list and returning everyone to the lobby.

## Technical Context

**Language/Version**: TypeScript 5.x with ES Modules

**Primary Dependencies**:
- Backend: `express`, `zod`, `cors`
- Frontend: `react`, `react-router-dom`, `vite`

**Storage**: In-memory room state managed by backend services

**Testing**: `vitest` for both backend and frontend

**Target Platform**: Browser-based frontend with Node.js backend API

**Project Type**: Web application with backend API and client-side state management

**Performance Goals**: Result state and restart actions propagate to all players
within one polling cycle (~2s)

**Constraints**:
- No WebSockets or real-time push protocols
- No persistent storage, authentication, or external databases
- No new state-management or routing frameworks

**Scale/Scope**: Single-server in-memory rooms for small multiplayer groups;
feature completes the round lifecycle (lobby → playing → result → lobby)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec is complete with no unresolved [NEEDS CLARIFICATION] markers.
- Feature aligns with Constitution Principle III by defining explicit state
  transitions (playing → result → lobby).
- Feature aligns with Constitution Principle IV by using existing HTTP polling
  for result state sync.
- Feature aligns with Constitution Principle V by staying in-memory only.
- No new architectural layers, state-management systems, or dependencies.
- Complexity is minimal — feature extends existing room model with no new
  infrastructure.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-validation/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # API contract documentation
├── tasks.md             # Phase 2 output (/speckit.tasks command)
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   └── rooms.ts
│   ├── models/
│   │   └── game.ts
│   └── services/
│       └── roomStore.ts

frontend/
├── src/
│   ├── components/
│   │   └── ResultScreen.tsx
│   ├── pages/
│   │   └── GamePage.tsx
│   ├── services/
│   │   └── api.ts
│   └── state/
│       └── roomStore.ts
```

**Structure Decision**: Use the existing web application structure (backend API
+ frontend pages). The feature extends existing room/round models and does not
require additional projects.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — complexity tracking not needed.

## Plan

1. Extend the room state model with a `status: "finished"` value alongside
   existing statuses, and add fields for `secretWord`, `guessHistory`, and
   `scores` to the room snapshot when in finished state.
2. Add a restart endpoint (`POST /rooms/:code/restart`) that validates the
   requester is the host, clears round state, and transitions the room back
   to lobby.
3. Update the room snapshot to expose result fields when `status === "finished"`,
   ensuring all players receive the correct word, scores, and guess history.
4. Add frontend polling for the result state in `GamePage` or a dedicated
   result view.
5. Implement the restart button UI (host-only visibility) and wire it to the
   restart API endpoint.
6. Handle the state transition on restart: clear secret word, canvas data,
   guess history, scores, drawer assignment while preserving participants.
7. Ensure non-host restart attempts return a clear error response.

## File Targets

- `backend/src/models/game.ts` — add `finished` room status and result fields
- `backend/src/services/roomStore.ts` — restart logic, result state exposure
- `backend/src/api/rooms.ts` — restart endpoint
- `frontend/src/pages/GamePage.tsx` — result view and restart integration
- `frontend/src/components/ResultScreen.tsx` — result display component
- `frontend/src/state/roomStore.ts` — restart action and result polling
- `frontend/src/services/api.ts` — restart API call

## Risks

- Result state must be read-only and shared consistently across all players.
- Restart must be atomic — all round state cleared without partial cleanup.
- Host-left scenario requires the game to remain in result state with no
  restart possible until host rejoins.
- Polling must reflect the correct state transition timing (result → lobby)
  without stale data races.
