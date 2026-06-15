# Implementation Plan: Guess Submission, Scoring & Shared History

**Branch**: `003-guess-submission-scoring` | **Date**: 2026-06-15 | **Spec**: `../spec.md`

**Input**: Feature specification from `/specs/003-guess-submission-scoring/spec.md`

## Summary

This feature implements the core gameplay loop: guess submission with normalization, scoring logic, canvas clearing, and synchronized guess history. It builds on the game start flow from Scenario 2 and extends the backend and frontend to handle active round interactions.

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

This plan aligns with the constitution by preserving the in-memory backend constraint, using HTTP polling only, and maintaining deterministic scoring rules.

## Project Structure

### Documentation (this feature)

```text
specs/003-guess-submission-scoring/
├── spec.md
├── plan.md
├── tasks.md
├── data-model.md (optional)
└── checklists/
    └── requirements.md (optional)
```

### Source Code References

- `backend/src/services/roomStore.ts` – submitGuess(), clearCanvas(), guess normalization
- `backend/src/models/game.ts` – Guess interface with isCorrect and scoring
- `backend/src/api/rooms.ts` – POST /rooms/:code/guess, POST /rooms/:code/clear-canvas
- `frontend/src/components/GuessForm.tsx` – Input validation and submission
- `frontend/src/pages/GamePage.tsx` – Guess form rendering and canvas status
- `frontend/src/services/api.ts` – submitGuess and clearCanvas methods

## API Contracts

### POST /rooms/:code/guess

**Request**:
```json
{
  "participantId": "p124",
  "guessText": "  Pizza  "
}
```

**Response** (200):
```json
{
  "code": "ROOM1",
  "participants": [
    { "id": "p123", "name": "Alice", "score": 0 },
    { "id": "p124", "name": "Bob", "score": 100 }
  ],
  "activeRound": {
    "drawerId": "p123",
    "secretWord": "pizza"
  },
  "guesses": [
    { "id": "g1", "participantId": "p124", "participantName": "Bob", "text": "Pizza", "isCorrect": true, "createdAt": "..." }
  ]
}
```

### POST /rooms/:code/clear-canvas

**Request**:
```json
{ "participantId": "p123" }
```

**Response** (200):
```json
{
  "code": "ROOM1",
  "canvasCleared": true,
  "activeRound": { ... },
  "guesses": [ ... ]
}
```

## Data Model Additions

### Guess (backend/src/models/game.ts)

```typescript
interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  createdAt: string;
}
```

### Room (extends previous)

```typescript
interface Room {
  ...
  guesses?: Guess[];
  canvasCleared: boolean;
}
```

## Implementation Phases

### Phase 1: Backend Infrastructure
- Implement normalizeGuess() for whitespace trimming
- Implement createGuess() factory
- Implement submitGuess() with case-insensitive comparison and scoring
- Implement clearCanvas() with drawer-only validation

### Phase 2: Frontend UI & Validation
- Implement GuessForm component with client-side validation
- Add canvas status indicator
- Implement clearCanvas button (drawer only)
- Add result/history display component

### Phase 3: Integration Testing
- Verify guess submission with normalization
- Confirm scoring logic for correct/incorrect guesses
- Test canvas clearing
- Verify shared history sync via polling

## Success Criteria

- [ ] POST /rooms/:code/guess normalizes input and scores correctly
- [ ] Guesses are stored and synced via polling
- [ ] Canvas can be cleared by drawer only
- [ ] Empty guesses are rejected
- [ ] Integration tests pass for complete guess flow
