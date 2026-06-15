# Implementation Plan: Game Start, Drawer Assignment & Secret Word Visibility

**Branch**: `002-game-start-drawer-assignment` | **Date**: 2026-06-15 | **Spec**: `../spec.md`

**Input**: Feature specification from `/specs/002-game-start-drawer-assignment/spec.md`

## Summary

This feature implements the game start flow with deterministic drawer assignment and secret word visibility enforcement. It builds on the room lifecycle from Scenario 1 and extends the backend and frontend to assign roles, select words deterministically, and enforce role-based visibility rules.

## Technical Context

**Language/Version**: TypeScript on both frontend and backend; Node.js 22+ for the backend; React 18 on the frontend.

**Primary Dependencies**: Backend uses Express, Zod, tsx; frontend uses React, React Router v6, Vite.

**Storage**: In-memory backend state only; no database or external persistence.

**Testing**: Vitest for unit and feature tests on both frontend and backend.

**Target Platform**: Web browser client with Node.js/Express backend.

**Performance Goals**: Responsive state sync (~2 second cadence) with lightweight API payloads.

**Constraints**: No WebSockets or push-based transport; no authentication or sessions; no database; must fit within the existing repo structure and starter code.

**Scale/Scope**: Single-round gameplay per room, with 2+ players and one active drawer; in-memory sessions reset on backend restart.

## Constitution Check

This plan aligns with the constitution by preserving the in-memory backend constraint, using HTTP polling only, and remaining incremental with explicit user scenarios and deterministic word selection.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer-assignment/
├── spec.md
├── plan.md
├── tasks.md
├── data-model.md (optional)
└── checklists/
    └── requirements.md (optional)
```

### Source Code References

- `backend/src/services/roomStore.ts` – Drawer assignment, word selection, state initialization
- `backend/src/models/game.ts` – ActiveRound type with drawerId and secretWord
- `backend/src/api/rooms.ts` – POST /rooms/:code/start route
- `frontend/src/pages/GamePage.tsx` – Role indicator and secret word display
- `frontend/src/services/api.ts` – RoomSnapshot with conditional secretWord

## API Contracts

### POST /rooms/:code/start

**Request**:
```json
{ "participantId": "p123" }
```

**Response** (200):
```json
{
  "code": "ROOM1",
  "host": "p123",
  "participants": [
    { "id": "p123", "name": "Alice", "score": 0 },
    { "id": "p124", "name": "Bob", "score": 0 }
  ],
  "status": "active",
  "activeRound": {
    "drawerId": "p123",
    "secretWord": "pizza"
  },
  "guesses": []
}
```

**Response** (403):
```json
{ "error": "Only the host can start the game" }
```

## Data Model Additions

### ActiveRound (backend/src/models/game.ts)

```typescript
interface ActiveRound {
  drawerId: string;
  secretWord: string;
  isFinished?: boolean;
  finishedAt?: string;
}
```

### Room (backend/src/models/game.ts)

```typescript
interface Room {
  code: string;
  host: string;
  status: "lobby" | "active" | "finished";
  participants: Participant[];
  activeRound?: ActiveRound;
  guesses?: Guess[];
}
```

## Implementation Phases

### Phase 1: Backend Infrastructure
- Implement drawer assignment logic (first participant or random selection)
- Implement deterministic word selection (hash-based modulo)
- Extend RoomSnapshot to conditionally reveal secretWord

### Phase 2: Frontend UI
- Display role indicator on GamePage
- Conditionally render secret word (drawer only)
- Add name validation on input pages

### Phase 3: Integration Testing
- Verify start flow with two players
- Confirm word visibility rules
- Test name validation edge cases

## Success Criteria

- [ ] POST /rooms/:code/start assigns drawer correctly
- [ ] Secret word is visible to drawer only
- [ ] Secret word is deterministically selected
- [ ] Name validation prevents empty/whitespace entries
- [ ] Integration tests pass for two-player start flow
