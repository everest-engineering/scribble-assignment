# Implementation Plan: Gameplay Interaction

**Branch**: `scribble-lab` | **Date**: 2026-06-02 | **Spec**: [spec.md](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/specs/004-gameplay-interaction/spec.md)

**Input**: Feature specification from `specs/004-gameplay-interaction/spec.md`

## Summary
Implement interactive freehand drawing synchronization, clearing capability, guess submission validation, case-insensitive secret word matching, guess history logging, and scoreboard scoring (+100 points on correct guess).

## Technical Context

**Language/Version**: Node.js v18+, TypeScript v5+

**Primary Dependencies**: Express, React, React Router, Vite, Zod

**Storage**: In-memory isolated storage (`Map<string, Room>` in roomStore)

**Testing**: Vitest for unit tests on schemas, guesses, and store updates

**Target Platform**: Web Browsers (frontend) and Node.js (backend)

**Performance Goals**:
- Canvas stroke updates synchronized within 2.5s of mouse-up
- Guess validation feedback visible in UI within 200ms

**Constraints**:
- Strictly in-memory storage (no DB)
- Pure HTTP polling (no WebSockets)
- Single-round scope

## Constitution Check

- **TypeScript Strict Mode**: ✅ Strict compilation enabled. Types are explicit. No `any` used.
- **Functional React Components**: ✅ All gameplay panels, canvas handlers, and guess forms are functional.
- **80% Test Coverage Requirement**: ✅ Business logic in store (guesses, drawing) and Zod schemas tested.
- **Pure HTTP Polling & Single-Round Scope**: ✅ State polled at 2s cadence. No WebSockets or real-time loop.
- **In-Memory Isolated Storage**: ✅ Session storage is completely in-memory, isolated by room code.

## Project Structure

### Documentation (this feature)

```text
specs/004-gameplay-interaction/
├── spec.md              # Requirements and scenarios
├── plan.md              # This file
├── research.md          # Technical analysis (in data-model)
└── tasks.md             # Ordered checklists and dependencies
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts      # Guess models, score additions, round updates
│   ├── services/
│   │   └── roomStore.ts # Guess submissions, drawing updates, scoring logic
│   └── api/
│       ├── rooms.ts     # Route endpoints for POST /canvas and POST /guesses
│       └── schemas.ts   # Zod validators for guesses and drawing
└── src/services/roomStore.test.ts

frontend/
├── src/
│   ├── components/
│   │   ├── Scoreboard.tsx  # Dynamic player score mapping
│   │   ├── ResultPanel.tsx # Guess history log
│   │   └── GuessForm.tsx   # Guess submission logic
│   ├── pages/
│   │   └── GamePage.tsx    # Interactive drawing canvas
│   └── services/
│       └── api.ts          # Guess & Drawing endpoints definition
```

**Structure Decision**: Web application layout (Option 2) matching backend/ and frontend/ directories.

---

## Technical Design

### 1. Data Model Extensions (`backend/src/models/game.ts`)
- **Participant**: Add `score: number`.
- **Guess**:
  ```typescript
  export interface Guess {
    id: string;
    playerName: string;
    text: string;
    isCorrect: boolean;
    scoreAwarded: number;
    timestamp: string;
  }
  ```
- **GameRound**: Add optional `drawingData?: string` and `guesses: Guess[]`.
- **RoomSnapshot**: Add optional `drawingData?: string` and `guesses?: Guess[]`.

### 2. State & Store Operations (`backend/src/services/roomStore.ts`)
- Initialize `score: 0` for all participants on creation.
- In `startGame`, initialize round with:
  ```typescript
  room.round = {
    secretWord: STARTER_WORDS[0],
    startedAt: now(),
    guesses: [],
    drawingData: ""
  };
  ```
- Implement `updateDrawing(code, drawingData)`: Update `room.round.drawingData` and `room.updatedAt`.
- Implement `clearDrawing(code)`: Set `room.round.drawingData = ""` and update `room.updatedAt`.
- Implement `submitGuess(code, participantId, guessText)`:
  - Trim and lowercase `guessText` and `secretWord`.
  - Validate player is not the drawer (host).
  - Check if player already has a correct guess in `guesses`.
  - If correct and first attempt: award `100` points to player, record `scoreAwarded = 100`.
  - Create `Guess` object, append to `room.round.guesses`, and update `room.updatedAt`.

### 3. API Routers & Schemas (`backend/src/api/rooms.ts` & `schemas.ts`)
- Register `POST /rooms/:code/canvas`: expects `{ drawingData: string }`.
- Register `POST /rooms/:code/canvas/clear`: resets drawing to empty.
- Register `POST /rooms/:code/guesses`: expects `{ participantId: string, guessText: string }`.
- Validate `guessText` using `z.string().trim().min(1)`.

### 4. Interactive Canvas (`frontend/src/pages/GamePage.tsx`)
- **Drawer**: Render an HTML5 `<canvas>` element. Track mouse drag events (`onMouseDown`, `onMouseMove`, `onMouseUp`) to draw lines. On `onMouseUp`, convert canvas to base64 PNG (`canvas.toDataURL()`) and call `api.updateDrawing`. Add a "Clear" button calling `api.clearDrawing`.
- **Guesser**: Render a read-only container containing an `<img>` tag with `src={room.drawingData}` which re-renders dynamically on poll.

### 5. Guess Form, Scoreboard, and Log History (`frontend/src/components`)
- **GuessForm**: Trim and validate input. On submit, trigger `api.submitGuess`. Display validation errors if empty.
- **Scoreboard**: Map `room.participants` sorted descending by `score`. Render score next to name.
- **ResultPanel**: Map `room.guesses` in order, showing correct guesses in green and incorrect in red.

---

## Verification Plan

### Automated Tests
- Unit test schemas in `schemas.test.ts` for empty guesses.
- Unit test `submitGuess` logic in `roomStore.test.ts` checking case-insensitive matching, scoring (+100), and double-score prevention.
- Verify frontend API mocks.

### Manual Verification
- Start app, open host and guest tabs.
- Join guest Bob, start game.
- Draw lines on host canvas, verify guest screen receives drawing.
- Clear canvas on host, verify guest screen clears.
- Submit empty guess on guest, verify direct error feedback.
- Submit incorrect guess, verify log updates with red item.
- Submit correct guess (`ROCKET`), verify guest score updates to 100 and log shows green item.
