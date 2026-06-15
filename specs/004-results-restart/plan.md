# Implementation Plan: Round Results, Final Scores & Restart Flow

**Branch**: `004-results-restart` | **Date**: 2026-06-15 | **Spec**: `../spec.md`

**Input**: Feature specification from `/specs/004-results-restart/spec.md`

## Summary

This feature implements round completion, result display, and restart mechanics. It builds on the guess submission flow from Scenario 3 and extends the backend and frontend to detect round endings, display consolidated results, and enable host-controlled restarts while preserving the room and player list.

## Technical Context

**Language/Version**: TypeScript on both frontend and backend; Node.js 22+ for the backend; React 18 on the frontend.

**Primary Dependencies**: Backend uses Express, Zod, tsx; frontend uses React, React Router v6, Vite.

**Storage**: In-memory backend state only; no database or external persistence.

**Testing**: Vitest for unit and feature tests on both frontend and backend.

**Target Platform**: Web browser client with Node.js/Express backend.

**Performance Goals**: Responsive polling-based state sync (~2 second cadence) with lightweight API payloads.

**Constraints**: No WebSockets or push-based transport; no authentication or sessions; no database; must fit within the existing repo structure and starter code.

**Scale/Scope**: Single-round gameplay per room, with 2+ players and one active drawer; in-memory sessions reset on backend restart.

## Constitution Check

This plan aligns with the constitution by preserving the in-memory backend constraint, using HTTP polling only, and maintaining clean state transitions for multi-round gameplay.

## Project Structure

### Documentation (this feature)

```text
specs/004-results-restart/
├── spec.md
├── plan.md
├── tasks.md
├── data-model.md (optional)
└── checklists/
    └── requirements.md (optional)
```

### Source Code References

- `backend/src/services/roomStore.ts` – Round completion detection, restartRoom() method
- `backend/src/models/game.ts` – isFinished, finishedAt fields in ActiveRound
- `backend/src/api/rooms.ts` – POST /rooms/:code/restart endpoint
- `frontend/src/components/ResultPanel.tsx` – Result display with scores and guess history
- `frontend/src/pages/GamePage.tsx` – Result state rendering and restart button
- `frontend/src/state/roomStore.ts` – restartRoom() action and state transition handling
- `frontend/src/services/api.ts` – restartRoom() method

## API Contracts

### POST /rooms/:code/restart

**Request**:
```json
{ "participantId": "p123" }
```

**Response** (200):
```json
{
  "code": "ROOM1",
  "status": "lobby",
  "host": "p123",
  "participants": [
    { "id": "p123", "name": "Alice", "score": 0 },
    { "id": "p124", "name": "Bob", "score": 0 }
  ],
  "activeRound": null,
  "guesses": []
}
```

**Response** (403):
```json
{ "error": "Only the host can restart the game" }
```

## Data Model Additions

### ActiveRound (extended)

```typescript
interface ActiveRound {
  drawerId: string;
  secretWord: string;
  isFinished: boolean;
  finishedAt?: string;
}
```

### RoomSnapshot (extended)

```typescript
interface RoomSnapshot {
  code: string;
  host: string;
  status: "lobby" | "active" | "finished";
  participants: Participant[];
  activeRound?: ActiveRound;
  guesses: Guess[];
  canvasCleared: boolean;
  canRestartGame: boolean;
}
```

## Implementation Phases

### Phase 1: Backend Infrastructure
- Extend ActiveRound with isFinished and finishedAt
- Implement round completion detection in submitGuess()
- Implement restartRoom() with host-only validation and state reset
- Update toRoomSnapshot() to compute canRestartGame flag

### Phase 2: Frontend UI
- Create ResultPanel component to display results and guess history
- Add result state rendering in GamePage
- Add "Restart Round" button (host only)
- Implement auto-navigation back to lobby on restart

### Phase 3: Integration Testing
- Verify round completion on correct guess
- Confirm result display shows correct word and final scores
- Test restart flow returns to lobby
- Verify participants preserved after restart
- Test multi-round restart sequence

## Success Criteria

- [ ] Round completes when correct guess submitted
- [ ] All players see final word, scores, and guess history
- [ ] POST /rooms/:code/restart returns room to lobby state
- [ ] Participants preserved across restart
- [ ] Round state fully cleared for next round
- [ ] Integration tests pass for complete result/restart flow
