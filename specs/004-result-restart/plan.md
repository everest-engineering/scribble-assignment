# Implementation Plan: Result & Restart Flow

**Branch**: `004-result-restart` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-result-restart/spec.md`

## Summary

Implement Scenario 4 by providing a shared post-round result state and a host-only restart transition. When a round finishes, the room snapshot should preserve final scores, the correct secret word, and the complete ordered guess history. The host can then restart the room, returning every active player to the lobby while preserving the participant list and clearing prior round state.

## Technical Context

**Language/Version**: TypeScript 5.6; Node.js 18+ backend; React 18 frontend

**Primary Dependencies**: Express, Zod, `tsx`, React, React Router v6, Vite, Vitest

**Storage**: In-memory room state only

**Testing**: Backend and frontend unit tests, plus manual two-browser validation for shared result visibility and restart flow

**Target Platform**: Local web application with backend on `localhost:3001` and frontend on `localhost:5173`

**Project Type**: Monorepo web application with REST backend and React frontend

**Performance Goals**: Result visibility must appear consistently across clients within one polling cycle. Restart should complete without stale round state and return users to lobby immediately.

**Constraints**: TypeScript-only; ES Modules; Zod validation for request/response boundaries; HTTP polling only; no WebSockets; no databases; no authentication; minimal in-memory state.

**Scale/Scope**: Single active round per room, shared result view, host restart, participant preservation across restart; no multi-round sequencing, no persistent storage, and no authentication.

## Constitution Check

- **TypeScript First**: PASS. All new artifacts will be typed and explicit.
- **Test-First Development**: PASS. New backend and frontend tests are expected for result state and restart behavior.
- **Immutability & Pure Functions**: PASS. Room state transitions will be explicit and centralized in the backend service.
- **Error Handling**: PASS. Restart failures and invalid transitions will produce user-facing error messages without crashing the UI.
- **Strict Backend & Frontend Architecture**: PASS. Backend changes remain in `api/` and `services/`; frontend changes remain in `services/`, `state/`, and `pages/`.
- **Technology Constraints**: PASS. No WebSockets, no DB, no auth.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── http-api.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   └── rooms.ts          # add result-aware room snapshot handling and restart endpoint
│   ├── models/
│   │   └── game.ts           # extend existing round/room types with result state fields
│   └── services/
│       ├── roomStore.ts      # add restart transition and preserve participants
│       └── roomStore.test.ts # add tests for finished room snapshots and restart
frontend/
├── src/
│   ├── pages/
│   │   └── GamePage.tsx      # render result state and restart controls when round is finished
│   ├── services/
│   │   └── api.ts            # add restart API call and result-aware room snapshot handling
│   ├── state/
│   │   └── roomStore.ts      # preserve lobby state after restart and handle result transitions
│   └── components/
│       └── ResultPanel.tsx   # display final result with scores, secret word, and guess history
```

## State Model

### Room and Round State

```ts
interface Room {
  code: string;
  hostId: string;
  participants: Participant[];
  gameState: "lobby" | "inProgress" | "finished";
  currentRound?: Round;
}

interface Round {
  roundNumber: number;
  status: "active" | "finished";
  drawerId: string;
  drawerName: string;
  secretWord: string;
  guessHistory: Guess[];
  totalScore: number;
  result?: RoundResult;
}

interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  normalizedText: string;
  isCorrect: boolean;
  score: number;
  submittedAt: number;
}

interface RoundResult {
  finishedAt: number;
  correctWord: string;
  finalScores: Record<string, number>;
}
```

### Result State Behavior

- `GET /rooms/:code` returns `gameState: "finished"` and a `currentRound` object containing the completed round.
- The result state must be visible to all active players and preserved through refresh.
- Restart transitions the room back to `gameState: "lobby"` with `currentRound` cleared, while leaving `participants`, `hostId`, and `code` intact.

## Phase 0: Research

There were no unresolved technical questions for Scenario 4. The design reuses existing room snapshot polling and extends the backend room model to support a finished round and restart transition.

### Decisions

- Use the existing `GET /rooms/:code` endpoint for result synchronization instead of adding a separate result endpoint.
- Add a host-only `POST /rooms/:code/restart` endpoint to reset round state and return players to the lobby.
- Preserve participant and host identity across restart while clearing previous round-specific fields.

### Alternatives Considered

- A separate `/rooms/:code/result` endpoint for the result view: rejected to keep the room model unified and leverage existing polling.
- Client-side only restart behavior: rejected because restart must update shared server state for all active players.

## Phase 1: Design & Contracts

Design artifacts for this feature are captured in:

- `data-model.md`
- `contracts/http-api.md`
- `quickstart.md`

### Design Priorities

1. Result view must be shared and deterministic across all players.
2. Restart must preserve the participant list and room code.
3. Result state must persist through refresh until the host restarts.
4. Restart errors must not leave the room in a partially reset state.

### Endpoint Contracts

- `GET /rooms/:code` returns a result-aware room snapshot when the room is finished.
- `POST /rooms/:code/restart` is the write operation that clears round-specific state and returns the refreshed lobby snapshot.

### User Interface

- `GamePage.tsx` should render a `ResultPanel` when the room state is finished.
- `ResultPanel` should display:
  - correct secret word
  - ordered guess history with correctness markers
  - final score summary
  - host-only restart button
- Non-host players should see the result screen without restart controls.

## Implementation Sequence

1. Extend backend room/round models to include `finished` state and result metadata.
2. Update `backend/src/services/roomStore.ts` to preserve participants and implement `restartRoom(code)`.
3. Add or extend `backend/src/api/rooms.ts` to expose result snapshots and the restart endpoint.
4. Add backend tests for finished `Room` snapshots and restart behavior.
5. Update `frontend/src/services/api.ts` to request restart and interpret finished room snapshots.
6. Add `ResultPanel.tsx` and update `GamePage.tsx` to render result state.
7. Update `frontend/src/state/roomStore.ts` to handle `gameState: "finished"` and restart transitions.
8. Add frontend tests for result rendering, host-only restart visibility, and lobby preservation after restart.
9. Perform manual two-browser validation for shared result visibility and restart.

## Validation

- Backend tests for room snapshot transition and restart reset
- Frontend tests for result panel rendering and restart controls
- Manual multi-tab validation for shared result state and lobby return

## Agent Context

Updated `.github/copilot-instructions.md` to reference this plan at `specs/004-result-restart/plan.md`.
