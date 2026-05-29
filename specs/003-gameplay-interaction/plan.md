# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-gameplay-interaction/spec.md`

## Summary

Extend the current first-round playing state with drawer-controlled canvas data, guess submission, guess history, and score updates. The backend remains the source of truth in the in-memory room store, with role-validated HTTP mutations for drawing, clearing, and guessing. The frontend replaces placeholder gameplay UI with native canvas drawing, guess feedback, activity history, scoreboard rendering, and active-game polling through the existing room store.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js backend, React 18 frontend, ES Modules.

**Primary Dependencies**: Express, Zod, React, React Router, Vite, Vitest, existing Context/external-store room state. No new library is required.

**Storage**: In-memory backend room state only. Canvas, guesses, scoring tracker, and scores live on the active room/current round.

**Testing**: Backend Vitest service/API/schema tests; frontend Vitest API tests; backend/frontend TypeScript builds; manual two-room and two-tab gameplay validation.

**Target Platform**: Local browser clients plus local Node.js backend.

**Project Type**: Web app: React frontend plus Express backend.

**Performance Goals**: Drawer mutations return fast enough for visible local feedback; guess submissions update the caller's score in the submission response; other players see guess history and scores within the existing 2-second polling interval; canvas payloads remain bounded to protect in-memory state.

**Constraints**: HTTP request/response and polling only; in-memory state; no authentication, sessions, databases, WebSockets, server-sent events, long polling, multiple rounds, timers, drawer rotation, or persistent storage.

**Scale/Scope**: Feature Group 3 only: one active round with existing drawer/secret word, drawer canvas, clear action, guess validation/history, 100-point scoring, room isolation, and gameplay polling.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Brownfield Extension**: PASS. Extend existing backend model/service/router/schema files and frontend API/store/game components; no rewrite or new app structure.
- **Full-Stack Input Validation**: PASS. Frontend trims/rejects empty guesses for immediate feedback; backend Zod schemas and service checks validate room code, participant ID, role, active round, stroke bounds, and guess text before mutation.
- **Polling-Only Synchronization**: PASS. Gameplay synchronization uses HTTP mutations plus the existing room fetch polling cadence; no push protocol is introduced.
- **Simple Implementation**: PASS. Use native browser canvas and existing React/store patterns. State remains directly on the in-memory room/current round.
- **Specification Traceability**: PASS. Planned changes map to US1-US3 and FR-001 through FR-019 from `spec.md`.
- **Human Review of AI Output**: PASS. Quickstart includes focused human review for scope, validation, polling, TypeScript correctness, and room isolation.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
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
│   ├── components/CanvasBoard.tsx
│   ├── components/GuessForm.tsx
│   ├── components/ResultPanel.tsx
│   ├── components/Scoreboard.tsx
│   ├── pages/GamePage.tsx
│   ├── services/api.ts
│   ├── services/api.test.ts
│   ├── state/roomStore.ts
│   └── styles/app.css
```

**Structure Decision**: Keep the existing web application split. Gameplay rules and mutations stay in the backend room service; API routes remain under the rooms router; frontend consumes snapshots through the existing room store and renders the active game page.

## Complexity Tracking

No constitution violations.

## Phase 0: Research Summary

Detailed decisions are captured in [research.md](./research.md).

- Store drawing as bounded JSON stroke data on the active round rather than image blobs or client-only state.
- Use HTTP drawing/clear/guess mutations and existing `GET /rooms/:code` polling for synchronization.
- Centralize guess trimming, case-insensitive comparison, duplicate-correct handling, and scoring in the backend room service.
- Store scores on the room for simple snapshot generation, initialized to 0 at game start.
- Implement the drawing UI with native canvas pointer events and no new dependencies.
- Reuse the existing 2-second polling cadence and cleanup pattern from the lobby.

## Phase 1: Design Summary

### Backend State Model Changes

- Extend `CurrentRound` with `canvas`, `guesses`, and `correctGuessParticipantIds`.
- Add room-level `scores` keyed by participant ID, initialized when `startRoom` transitions to playing.
- Extend `RoundSnapshot` with public `canvas` and `guesses`.
- Extend `RoomSnapshot` with `scores` while preserving drawer-only `secretWord`.
- Use generated IDs and ISO timestamps for strokes and guesses through existing Node utilities and `now()` pattern.

### Drawing Data Structure

- `CanvasState` contains `strokes` and `updatedAt`.
- `DrawingStroke` contains `id`, `color`, `size`, and ordered normalized `points`.
- `DrawingPoint` contains normalized `x` and `y` coordinates.
- Backend bounds validate practical maximums for stroke count and points per stroke to prevent oversized in-memory payloads.
- Clear action replaces `strokes` with an empty array rather than deleting the whole round state.

### Guess History Structure

- `Guess` contains `id`, `participantId`, `participantName`, trimmed `text`, `isCorrect`, `pointsAwarded`, and `createdAt`.
- Accepted non-empty guesses are appended in submission order.
- Empty guesses are rejected and do not appear in history.
- Duplicate correct guesses by the same participant are handled with `pointsAwarded: 0` after the first award.

### Score Management

- Initialize every current participant to score `0` during `startRoom`.
- Incorrect guesses do not change scores.
- First correct guess by a guesser increments that guesser's score by exactly `100`.
- Maintain `correctGuessParticipantIds` to prevent repeated awards in the active round.
- Include score snapshots for every participant in polling responses.

### Polling Data Flow

1. Drawer or guesser performs a gameplay action through the frontend store.
2. Frontend sends an HTTP mutation with room code, participant ID, and validated payload.
3. Backend validates and mutates only the addressed room.
4. Backend returns the caller's viewer-specific room snapshot.
5. Other clients continue polling the existing room fetch endpoint every 2 seconds.
6. Polled snapshots refresh canvas, guess history, and scores without page reload.
7. `GamePage` clears its interval when unmounted or when the room is no longer playing.

### API Endpoints Required

- `GET /rooms/:code?participantId=...`: extend existing polling response with canvas, guess history, and scores.
- `POST /rooms/:code/drawing`: drawer-only stroke append; returns updated room snapshot.
- `POST /rooms/:code/drawing/clear`: drawer-only canvas clear; returns updated room snapshot.
- `POST /rooms/:code/guesses`: guesser-only guess submission; returns updated room snapshot.

### Frontend Component Changes

- Add `CanvasBoard` for native canvas drawing and rendering snapshot strokes.
- Update `GamePage` to poll while playing, render `CanvasBoard`, pass role-specific controls, and display refresh/submit errors.
- Update `GuessForm` to trim input, reject empty guesses with inline feedback, disable for drawers, and call the room store on submit.
- Update `Scoreboard` to render score snapshots instead of placeholder rows.
- Update `ResultPanel` to render guess history with correctness and points awarded.
- Update `app.css` for canvas, guess feedback, activity rows, and score layout.

### File-Level Implementation Plan

- `backend/src/models/game.ts`: Add canvas, stroke, point, guess, score, and extended snapshot types.
- `backend/src/services/roomStore.ts`: Initialize gameplay state in `startRoom`; add `appendDrawingStroke`, `clearDrawing`, and `submitGuess`; extend `toRoomSnapshot`.
- `backend/src/api/schemas.ts`: Add Zod schemas for drawing strokes, clear action, and guesses.
- `backend/src/api/rooms.ts`: Add three gameplay routes under the existing rooms router.
- `backend/src/services/roomStore.test.ts`: Cover state initialization, drawer authorization, clear behavior, guess trimming, case-insensitive correctness, duplicate scoring, and room isolation.
- `backend/src/api/rooms.test.ts`: Cover endpoint status codes, response shapes, secret-word privacy, mutation validation, and polling snapshots.
- `backend/src/api/schemas.test.ts`: Cover gameplay payload validation, trimming, empty guesses, and bounded drawing data.
- `frontend/src/services/api.ts`: Add gameplay types and API methods for drawing, clear, and guess submission; extend snapshot type.
- `frontend/src/services/api.test.ts`: Verify new request paths/bodies and extended snapshot handling.
- `frontend/src/state/roomStore.ts`: Add store methods for gameplay mutations and preserve latest state on recoverable polling failure.
- `frontend/src/components/CanvasBoard.tsx`: New native canvas component for rendering strokes, collecting pointer strokes for drawer, and clear action.
- `frontend/src/components/GuessForm.tsx`: Wire submit behavior and validation to room store.
- `frontend/src/components/Scoreboard.tsx`: Render snapshot scores.
- `frontend/src/components/ResultPanel.tsx`: Render ordered guess history.
- `frontend/src/pages/GamePage.tsx`: Wire gameplay polling, errors, and role-aware component composition.
- `frontend/src/styles/app.css`: Add styles for canvas and gameplay panels.

### Validation Strategy

- Frontend validates guess trimming and empty-guess feedback before sending.
- Frontend disables drawer-only controls for guessers and guess controls for drawers.
- Backend validates every mutation using Zod at the API boundary.
- Backend service revalidates room existence, participant membership, role, active round, stroke shape/bounds, and scoring eligibility before mutation.
- Backend snapshot generation remains the privacy boundary for `secretWord`.

### Testing Approach

- Backend unit tests target room service game rules and room isolation.
- Backend API tests target route contracts, validation errors, and viewer-specific snapshots.
- Backend schema tests target malformed drawing and guess payloads.
- Frontend API tests target new client methods and snapshot typing.
- Frontend build/type checks verify role-specific optional fields are handled safely.
- Manual quickstart validates two-tab synchronization, duplicate scoring, polling continuity, and two-room isolation.

### Generated Design Artifacts

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/rooms-api.md](./contracts/rooms-api.md)
- [quickstart.md](./quickstart.md)

## Post-Design Constitution Check

- **Brownfield Extension**: PASS. Design extends existing room/game files and adds one focused canvas component.
- **Full-Stack Input Validation**: PASS. Frontend and backend validation are specified for guesses and drawing payloads before mutation.
- **Polling-Only Synchronization**: PASS. All synchronization is via HTTP mutation plus existing 2-second polling.
- **Simple Implementation**: PASS. Native canvas and in-memory structures avoid new dependencies and infrastructure.
- **Specification Traceability**: PASS. Model, API, UI, validation, and tests map to FR-001 through FR-019 and US1-US3.
- **Human Review of AI Output**: PASS. Quickstart includes manual review and validation steps before acceptance.
