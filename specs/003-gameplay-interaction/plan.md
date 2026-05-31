# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-gameplay-interaction/spec.md`

## Summary

Implement the core gameplay interaction loop. This includes an interactive HTML5 drawing canvas for the drawer, canvas clear functionality, and a guess submission and evaluation system for guessers. Guesses are processed case-insensitively, correct guesses award 100 points once per round, and guess log history and scoreboard updates (sorted by score descending) are synchronized across all participants using the existing 2-second HTTP polling mechanism.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js 18+

**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vitest

**Storage**: In-memory backend arrays and properties on the existing `Room` data structure.

**Testing**: Vitest for unit/schema/API tests, manual browser testing with two open browser instances.

**Target Platform**: Web browsers (Chrome, Safari, Firefox, Edge).

**Performance Goals**: Updates propagate to all clients in under 2 seconds.

**Constraints**: Strictly no WebSockets or push protocols. Rely solely on HTTP polling. No databases or persistent storage.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **HTTP polling only**: Confirmed. Scoreboard and Guess History synchronization utilize the existing 2-second HTTP polling mechanism built into `GamePage.tsx`. No WebSockets, Socket.io, or SSE will be used.
- **In-memory room state only**: Confirmed. Scores are tracked on the participant entities in memory, and the guess log is an in-memory array inside the active `Room` object. State is ephemeral and cleared when the room is destroyed.
- **TypeScript and Zod contracts**: Confirmed. The API contract for guess submission is defined and will be validated using Zod at the backend boundaries. Response payloads will also be validated using Zod. TypeScript interfaces for `Participant` and `RoomSnapshot` will be updated to include `score` and `guessHistory`.
- **Scenario traceability**: Maps directly to Scenario 3 (Gameplay Interaction) of the assignment.
- **Incremental review**: Each component slice (canvas, guess submission, evaluation, log sync) will be implemented and tested incrementally. Verified using Vitest tests and the manual verification script.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file
├── research.md          # Research findings and decisions
├── data-model.md        # Detailed entity and property definitions
├── quickstart.md        # Manual validation script
└── contracts/
    └── gameplay-interaction.md # API Contract
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts     # Register /rooms/:code/guesses route
│   │   └── schemas.ts   # Update schema validations (Participant, RoomSnapshot, Guesses)
│   ├── models/
│   │   └── game.ts      # Update TypeScript models (Participant, Room, GuessEntry)
│   └── services/
│       └── roomStore.ts # Implement guess evaluation, scoring, and state update logic
└── tests/

frontend/
├── src/
│   ├── components/
│   │   ├── GuessForm.tsx         # Handle guess submission API calls and disable for drawer
│   │   ├── Scoreboard.tsx        # Render player scores from room state, sorted descending
│   │   └── GuessHistoryPanel.tsx # Render guess history from room state in submission order
│   ├── pages/
│   │   └── GamePage.tsx          # Integrate interactive canvas and clear controls
│   └── services/
│       └── api.ts                # Expose guess submission API client method
```

**Structure Decision**: Web application layout containing backend (Express) and frontend (React) projects.

## Proposed Changes

### Backend

#### [MODIFY] [game.ts](file:///Users/mamathaniyal/Documents/projects/scribble-assignment/backend/src/models/game.ts)
- Add `score: number` to the `Participant` interface (initialized to `0`).
- Define `GuessEntry` interface: `id`, `participantId`, `playerName`, `guessText`, `isCorrect`, `createdAt`.
- Add `guessHistory: GuessEntry[]` to `Room` and `RoomSnapshot` interfaces (initialized to `[]`).

#### [MODIFY] [schemas.ts](file:///Users/mamathaniyal/Documents/projects/scribble-assignment/backend/src/api/schemas.ts)
- Add `"DRAWER_CANNOT_GUESS"` and `"GAME_NOT_STARTED"` to `errorCodeSchema`.
- Add `score: z.number()` to `participantSchema`.
- Define `guessEntrySchema` Zod validator.
- Add `guessHistory: z.array(guessEntrySchema)` to `roomSnapshotSchema`.
- Define `submitGuessSchema` to validate `/guesses` request body (`participantId` and trimmed non-empty `guessText`).
- Ensure all API response schemas (`roomResponseSchema` and `roomSessionResponseSchema`) validate the new properties on `RoomSnapshot`.

#### [MODIFY] [roomStore.ts](file:///Users/mamathaniyal/Documents/projects/scribble-assignment/backend/src/services/roomStore.ts)
- Initialize `score: 0` for participants in `createParticipant`.
- Initialize `guessHistory: []` inside `createRoom` / room initialization.
- Implement `submitGuess(code, participantId, guessText)` logic:
  - Retrieve the room. If not found, throw room not found error.
  - Verify room status is `"in-game"`. If not, throw error (`GAME_NOT_STARTED`).
  - Verify participant exists in the room. If not, throw error.
  - Verify participant is not the drawer (`participantId !== room.roundState.drawerId`). If they are the drawer, throw error (`DRAWER_CANNOT_GUESS`).
  - Normalize guess: `guessText.trim()`.
  - Compare guess case-insensitively with `room.roundState.secretWord`.
  - Check if participant has already guessed correctly in this round.
  - If match is correct and it is their first correct guess:
    - Award `100` points to their score.
    - Set `isCorrect = true`.
  - Append `GuessEntry` to `room.guessHistory` in submission order.
  - Save room and return the updated room.
- Update `toRoomSnapshot` to copy `guessHistory` to the returned snapshot.

#### [MODIFY] [rooms.ts](file:///Users/mamathaniyal/Documents/projects/scribble-assignment/backend/src/api/rooms.ts)
- Add `POST /:code/guesses` route.
- Validate params and body using Zod.
- Block request if player is drawer (respond with 400 and `DRAWER_CANNOT_GUESS`).
- Block request if room is not active (respond with 400 and `GAME_NOT_STARTED`).
- Call `submitGuess` and return updated snapshot (validated through `validateRoomResponse`).

### Frontend

#### [MODIFY] [api.ts](file:///Users/mamathaniyal/Documents/projects/scribble-assignment/frontend/src/services/api.ts)
- Add `score` to `Participant` interface.
- Define `GuessEntry` interface.
- Add `guessHistory` to `RoomSnapshot` interface.
- Implement `api.submitGuess(code, participantId, guessText)` to execute POST request.

#### [MODIFY] [GuessForm.tsx](file:///Users/mamathaniyal/Documents/projects/scribble-assignment/frontend/src/components/GuessForm.tsx)
- Connect to `useRoomStore` and call `submitGuess` on form submission.
- Disable input and submit button if `disabled` prop is `true` (passed down from `GamePage` when the user is the drawer).

#### [MODIFY] [Scoreboard.tsx](file:///Users/mamathaniyal/Documents/projects/scribble-assignment/frontend/src/components/Scoreboard.tsx)
- Retrieve participants from `useRoomState()`.
- Sort players by `score` in descending order and render them.

#### [NEW] [GuessHistoryPanel.tsx](file:///Users/mamathaniyal/Documents/projects/scribble-assignment/frontend/src/components/GuessHistoryPanel.tsx)
- Create this component (renamed from `ResultPanel.tsx` to better reflect its function).
- Retrieve `guessHistory` from `useRoomState()`.
- Render logs in submission order. Color correct guesses green and incorrect guesses red/gray.

#### [DELETE] [ResultPanel.tsx](file:///Users/mamathaniyal/Documents/projects/scribble-assignment/frontend/src/components/ResultPanel.tsx)
- Delete this file (replaced by `GuessHistoryPanel.tsx`).

#### [MODIFY] [GamePage.tsx](file:///Users/mamathaniyal/Documents/projects/scribble-assignment/frontend/src/pages/GamePage.tsx)
- Import `GuessHistoryPanel` instead of `ResultPanel`.
- If drawer:
  - Render an interactive `<canvas>` element.
  - Implement canvas drawing event handlers (`onMouseDown`, `onMouseMove`, `onMouseUp`, `onMouseLeave`, `onTouchStart`, `onTouchMove`, `onTouchEnd`).
  - Add a **Clear Canvas** button.
- If guesser:
  - Render canvas placeholder showing: `"[Drawer Name] is drawing..."`.
- Pass `disabled={isDrawer}` to `GuessForm`.

## Verification Plan

### Automated Tests
- Backend Schema tests in `backend/src/api/schemas.test.ts` to verify score validation, guess submission schema validation, error serialization, and response schema checks.
- Backend Store tests in `backend/src/services/roomStore.test.ts` to verify score accumulation (correct vs. incorrect, case-insensitive comparison, points awarded only once per round).
- Frontend store tests in `frontend/src/state/roomStore.test.ts` to verify guess submission actions.
- Run tests with:
  - `cd backend && npm test`
  - `cd frontend && npm test`

### Manual Verification
- Detailed E2E steps are documented in [quickstart.md](./quickstart.md).
