---
description: "Tasks for Drawer & Guess Sync feature"
---

# Tasks: Drawer & Guess Sync

**Input**: Design documents from `/specs/004-drawer-guess-sync/`

## Phase 1: Backend API & Validation

- [x] T001 Add Zod schema for guess payload in `backend/src/api/schemas.ts` and tests in `backend/src/api/schemas.test.ts` (trim + max length + non-empty).
- [x] T002 Implement POST `/rooms/:roomId/guesses` in `backend/src/api/rooms.ts` to validate, score, and persist guesses.
- [x] T003 Implement GET `/rooms/:roomId/guesses` to return ordered guess history.

- [x] T011 Define `Guess` model/type in `backend/src/models/game.ts` with fields `{ playerId, textTrimmed, timestamp, isCorrect }` and ensure Zod contract/JSON schema is documented in `specs/004-drawer-guess-sync/contracts`.
- [x] T012 Standardize API error codes for guesses: `ERR_GUESS_REQUIRED`, `ERR_GUESS_TOO_LONG` and ensure POST returns `400` with a machine-friendly error body. Add tests asserting error shapes.

## Phase 2: Persistence & Scoring

- [x] T004 Extend room model (`backend/src/models/game.ts`) to include `guesses: Guess[]` and simple canvas event storage for drawer.
- [x] T005 Implement scoring logic in `backend/src/services/roomStore.ts` to award +100 for correct guesses and update player scores; add unit tests.

- [x] T013 Add unit tests covering edge cases: multiple correct guesses in same polling window (multiple players each get +100), duplicate rapid submissions by same player, and very long guesses (>200 chars) being rejected.
- [x] T014 Persist drawer canvas actions as immutable events (e.g., `{ type: 'draw'|'clear', payload?, timestamp }`) and add unit tests to verify drawer rehydration after reload.

## Phase 3: Frontend Integration

- [x] T006 Add client-side trimming and validation in `frontend/src/services/api.ts` and `frontend/src/utils/validation.ts`.
- [x] T007 Implement guess submission UI and error handling in `frontend/src/components/GuessForm.tsx` (or update existing) and tests.
- [x] T008 Implement polling in `frontend/src/services/polling.ts` to poll `/rooms/:roomId/guesses` and update `roomStore` with latest history.

- [x] T015 Update frontend `GuessList` or `Scoreboard` to display ordered guess history with timestamp and correctness flag; add tests ensuring non-drawers and drawer see consistent history.
- [x] T016 Ensure client truncates long guesses to the server limit and surfaces `ERR_GUESS_TOO_LONG` as a user-facing message.
- [x] T017 Add integration test for polling behavior: when multiple guessers submit in quick succession, polling returns the full ordered history to all clients within one interval.
- [x] T020 Implement `DrawerCanvas` component in `frontend/src/components/DrawerCanvas.tsx` (or replace the canvas placeholder in `GamePage.tsx`) to present an interactive drawing surface for the drawer and a read-only view for guessers. Add component-level tests.
- [x] T021 Add client-side canvas event capture and serialization in `frontend/src/services/drawing.ts` (or in `frontend/src/services/api.ts`) to produce event objects matching the server contract (e.g., `{ type: 'draw'|'clear', payload?, timestamp }`). Add unit tests.
- [x] T022 Implement client API call to POST `/rooms/:code/canvas-events` from the drawer client, including throttling/batching strategy and error handling. Add integration tests to verify events are persisted and drawer rehydrates after reload.
- [x] T023 Add a small frontend E2E/integration test that verifies a drawer can draw, the drawer's canvas state persists across reload, and non-drawers see read-only canvas state after polling.
- [x] T025 Ensure non-drawers receive canvas updates: include `canvasEvents` in room snapshots and render a read-only canvas for guessers. Add tests validating non-drawer rehydration and polling updates.

## Phase 4: Integration Tests & Docs

- [x] T009 Add integration test simulating a drawer and two guessers: submit guesses (trimmed, mixed case, empty) and assert history, scoring, and rehydration for drawer canvas. (implemented in `backend/src/api/guesses.integration.test.ts`)
- [x] T010 Update `specs/004-drawer-guess-sync/quickstart.md` with manual testing steps and recommended polling interval.

- [x] T018 Add a performance/scale test or guideline for guess-history size and optional pagination strategy (NFR-001).
- [x] T019 Update API contracts directory `specs/004-drawer-guess-sync/contracts` with example request/response bodies for POST and GET guesses, including error shapes and max-length policy.

## Phase 5: Server/Task Sync

- [x] T024 Acknowledge/verify existing server `POST /:code/canvas-events` endpoint: add explicit backend tests (or reference existing tests) and update `tasks.md` to mark server endpoint verification as complete. If tests are missing, add `backend/src/api/canvas-events.test.ts` to cover authorization (drawer-only) and persistence semantics.

## Notes

- Keep changes minimal and well-typed; follow repository testing patterns (Vitest).
