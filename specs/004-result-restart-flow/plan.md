# Implementation Plan: Result Restart Flow

**Branch**: `004-result-restart-flow` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-result-restart-flow/spec.md`

## Summary

Extend the single-round game lifecycle with an ended/result state and host-only restart. The backend remains the source of truth in the in-memory room store, preserving room code, host, and participants while moving completed gameplay state into a result snapshot until restart. Restart returns the same room to the lobby and clears all round-specific state, while the frontend uses existing room polling to move every player from gameplay to result and then back to lobby without a page refresh.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js backend, React 18 frontend, ES Modules.

**Primary Dependencies**: Express, Zod, React, React Router, Vite, Vitest, existing Context/external-store room state. No new library is required.

**Storage**: In-memory backend room state only. Result state and restart reset are stored on the existing room object and discarded on restart.

**Testing**: Backend Vitest service/API/schema tests; frontend Vitest API/store/component-adjacent tests where existing patterns support them; backend/frontend TypeScript builds; manual multi-tab result and restart validation.

**Target Platform**: Local browser clients plus local Node.js backend.

**Project Type**: Web app: React frontend plus Express backend.

**Performance Goals**: Result and restart mutations return fast enough for the initiating player to see the state change in one submission flow; other players see ended result and restarted lobby state within the existing 2-second polling interval; reset removes stale round payloads from in-memory state.

**Constraints**: HTTP request/response and polling only; in-memory state; no authentication, sessions, databases, WebSockets, server-sent events, long polling, timers, multiple-round progression, score carryover, or persistent result history.

**Scale/Scope**: Feature Group 4 only: one played round can transition to result, all current players can view revealed result details, the host can restart to the same room's lobby, and round-specific state is cleared while participants remain.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Brownfield Extension**: PASS. Extend existing backend model/service/router/schema files and frontend API/store/game components; no rewrite, new app structure, or unrelated refactor.
- **Full-Stack Input Validation**: PASS. Frontend hides or disables restart for non-hosts and backend validates room code, participant ID, host role, and result-state precondition before mutation.
- **Polling-Only Synchronization**: PASS. Result and restart synchronization use HTTP mutations plus the existing room fetch polling cadence; no push protocol is introduced.
- **Simple Implementation**: PASS. Keep state in the existing in-memory room model and clear it directly on restart; no database, auth, timer, or extra state framework.
- **Specification Traceability**: PASS. Planned changes map to US1-US3 and FR-001 through FR-020 from `spec.md`.
- **Human Review of AI Output**: PASS. Quickstart includes focused human review for scope, validation, polling, TypeScript correctness, state reset, and room isolation.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-flow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rooms-api.md
└── tasks.md              # Created by /speckit-tasks, not by this plan
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/game.ts
│   ├── services/roomStore.ts
│   ├── services/roomStore.test.ts
│   ├── api/schemas.ts
│   ├── api/schemas.test.ts
│   ├── api/rooms.ts
│   └── api/rooms.test.ts

frontend/
├── src/
│   ├── components/ResultPanel.tsx
│   ├── components/Scoreboard.tsx
│   ├── components/CanvasBoard.tsx
│   ├── pages/GamePage.tsx
│   ├── services/api.ts
│   ├── services/api.test.ts
│   ├── state/roomStore.ts
│   └── styles/app.css
```

**Structure Decision**: Keep the existing web application split. Lifecycle rules and state reset stay in the backend room service; API routes remain under the rooms router; frontend consumes snapshots through the existing room store and renders result or lobby based on room status.

## Complexity Tracking

No constitution violations.

## Phase 0: Research Summary

Detailed decisions are captured in [research.md](./research.md).

- Represent ended rounds as a first-class result status with an immutable result snapshot until restart.
- Use an explicit end-round service operation to move from active gameplay to result.
- Use a host-only restart service operation that preserves room identity and participants while clearing all round-specific fields.
- Reuse `GET /rooms/:code?participantId=...` polling for result and restarted lobby synchronization.
- Keep restart as a lobby reset only; it does not automatically start another round or retain score history.

## Phase 1: Design Summary

### Backend State Model Changes

- Extend room status to include a result/ended state after playing.
- Add `completedRound` or equivalent result-state data derived from the active round at end-of-round time.
- Include revealed secret word, final scores, complete guess history, drawer identity, and canvas state in the result snapshot while the room is ended.
- Clear `currentRound`, `completedRound`, scores, canvas, guesses, correct-guess tracking, secret word, and drawer assignment on restart.
- Preserve room code, room ID, host participant ID, participants, and room timestamps through restart.

### End-of-Round Transition Flow

1. Active gameplay reaches an explicit end condition or a controlled end-round action.
2. Backend validates the room exists, participant belongs to the room when required, and room status is currently playing.
3. Backend copies the active round's revealable outcome into result state: secret word, scores, guess history, drawer identity, and final timestamps.
4. Backend changes room status from playing to result and stops accepting gameplay mutations for drawing and guessing.
5. The caller receives the result snapshot immediately.
6. Other players continue polling the room endpoint and render the result state on the next successful poll.

### Restart Flow

1. Host clicks restart from the result view.
2. Frontend sends room code and host participant ID to the restart mutation.
3. Backend validates room existence, participant membership, host role, and result status.
4. Backend transitions the room to lobby in one state update.
5. Backend preserves room code, host, and current participants.
6. Backend clears all active/completed round fields, scores, canvas, guesses, word assignment, drawer assignment, and correctness tracking.
7. Host receives the lobby snapshot immediately.
8. Other players poll and move from result view to lobby with the same room code and participant list.

### Data Reset Strategy

- Treat restart as a destructive reset of round-specific data, not a historical archive.
- Reset scores by removing the score map/list from active room state or reinitializing to the lobby baseline used before game start.
- Remove result data entirely so late joiners after restart cannot see previous secret word, guesses, canvas, drawer, or scores.
- Ensure reset is atomic within the room store operation so snapshots never expose a partially reset room.
- Keep room isolation by mutating only the room addressed by the restart request.

### API Endpoints Required

- `GET /rooms/:code?participantId=...`: extend existing polling response to support result snapshots with revealed word, final scores, complete guess history, and status.
- `POST /rooms/:code/round/end`: controlled end-round transition from playing to result; returns updated result snapshot.
- `POST /rooms/:code/restart`: host-only restart from result to lobby; returns updated lobby snapshot.
- Existing gameplay endpoints reject drawing, clearing, and guessing once status is result.

### Frontend Navigation Changes

- Update `GamePage` to branch on room status: lobby/start view for lobby, gameplay view for playing, result view for result.
- Update `ResultPanel` to render revealed word, final scores, complete guess history, empty-history messaging, and host-only restart control.
- Keep non-host result UI in a waiting state that explains the host can restart.
- After restart, the same route renders the lobby because the polled room status changes to lobby; no new route or page reload is required.
- Clear local canvas drawing affordances when leaving playing/result so stale strokes do not remain visible in the lobby.

### Polling Behavior During Restart

1. Players keep polling the room while on the room page across lobby, playing, and result states.
2. The host restart response updates the host's state immediately.
3. Non-host clients receive the lobby snapshot through the next successful poll.
4. Polling errors keep the latest successful result or lobby snapshot visible with recoverable feedback.
5. Polling intervals are cleaned up on page unmount and are not duplicated during status transitions.

### Validation Strategy

- Frontend displays restart only for host viewers in result state and disables repeat submissions while a restart is in flight.
- Backend schemas validate room code and participant ID on end-round/restart mutations.
- Backend service validates room exists, participant exists when required, host role for restart, status is playing for end-round, and status is result for restart.
- Backend rejects gameplay mutations after end-round and restart mutations outside result state.
- Snapshot generation reveals the secret word only in result state or to the drawer during playing.

### Testing Approach

- Backend service tests cover end-round result snapshot, restart preservation/reset rules, host-only authorization, invalid status rejection, and room isolation.
- Backend API tests cover end-round and restart status codes, response shapes, and gameplay mutation rejection after result.
- Backend schema tests cover restart/end-round payload validation.
- Frontend API tests cover new client methods and request/response handling.
- Frontend store/page tests or focused manual checks cover status-based rendering, host-only restart action, polling convergence, and stale-state clearing.
- Manual quickstart validates two-tab result display, restart to lobby, unchanged room code, preserved player list, cleared game state, and two-room isolation.

### Generated Design Artifacts

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/rooms-api.md](./contracts/rooms-api.md)
- [quickstart.md](./quickstart.md)

## Post-Design Constitution Check

- **Brownfield Extension**: PASS. Design extends existing room lifecycle and current frontend room page/components.
- **Full-Stack Input Validation**: PASS. Design specifies frontend host gating and backend schema/service validation before state changes.
- **Polling-Only Synchronization**: PASS. Result and restart propagation rely on HTTP polling and existing cleanup patterns only.
- **Simple Implementation**: PASS. Design uses in-memory state and direct room-store transitions without new infrastructure or dependencies.
- **Specification Traceability**: PASS. Model, API, UI, validation, and tests map to FR-001 through FR-020 and US1-US3.
- **Human Review of AI Output**: PASS. Quickstart includes manual review for prohibited scope, reset correctness, isolation, and validation.
