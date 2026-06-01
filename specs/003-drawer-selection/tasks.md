---
description: "Tasks for Drawer Selection & Word Visibility"
---

# Tasks: Drawer Selection & Word Visibility

---

## description: "Tasks for Drawer Selection & Word Visibility"

# Tasks: Drawer Selection & Word Visibility

**Input**: Design documents from `/specs/003-drawer-selection/`

## Phase 1: Setup (Shared Infrastructure)

- [x] T1 [P] Ensure feature docs exist and reference paths in `specs/003-drawer-selection/` (FR-006)
- [x] T2 [P] Verify `vitest` configuration in `backend/vitest.config.ts` and `frontend/vitest.config.ts` (Test-First)
- [x] T3 [P] Add test helpers for integration tests: `backend/tests/helpers/setupTestServer.ts` (Test-First)
- [x] T4 [P] Consolidate starter words to `backend/seed/starterData.ts` (reuse existing file) (FR-005)

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T5 Update `Player` and `Room` types to include `displayName` (trimmed), `joinOrder`, `isHost`, `seed`, and `starterWordList` in `backend/src/models/game.ts` (FR-001, FR-004)
- [x] T6 [P] Add server-side Zod schemas and tests in `backend/src/api/schemas.ts` / `backend/src/api/schemas.test.ts` to trim and validate `displayName` (FR-001)
- [x] T7 Implement `startRound` and `assignDrawerForFirstRound` helpers in `backend/src/services/roomStore.ts` (FR-002, FR-003)
- [x] T8 [P] Implement drawer-only access control helper for `secretWord` retrieval in `backend/src/services/roomStore.ts` (FR-003)
- [x] T9 Add integration test scaffolding in `backend/src/api/rooms.test.ts` for round flow (Test-First)

---

## Phase 3: User Story 1 - Start Round Drawer Assignment (Priority: P1)

**Goal**: Assign drawer for first round to host or first joined player; only drawer sees `secretWord`.

### Tests (Test-First)

- [x] T10 [P][US1] Integration: `backend/src/api/rooms.round-start.test.ts` — host starts round, host receives `secretWord`, non-drawers do not (FR-002, FR-003)
- [x] T11 [P][US1] Unit: `backend/src/services/roomStore.test.ts` for `assignDrawerForFirstRound` (FR-002)

### Implementation

- [x] T12 [US1] Implement `assignDrawerForFirstRound` in `backend/src/services/roomStore.ts` (depends on T5, T6) (FR-002)
- [x] T13 [US1] Add `POST /rooms/:roomId/start` endpoint in `backend/src/api/rooms.ts` (FR-002, FR-003)
- [x] T14 [US1] Add `GET /rooms/:roomId/secret-word` endpoint enforcing drawer-only access in `backend/src/api/rooms.ts` (FR-003)
- [x] T15 [US1] Update frontend `GamePage` to display `Drawer: <name>` and show `secretWord` only for drawer in `frontend/src/pages/GamePage.tsx` (FR-006)
- [x] T16 [US1] Frontend test: `frontend/src/pages/GamePage.test.tsx` for drawer UI and visibility (FR-006)

---

## Phase 4: User Story 2 - Player Name Validation (Priority: P1)

**Goal**: Trim and validate `displayName` on client and server; reject whitespace-only names.

### Tests (Test-First)

### Tests (Test-First)

- [x] T17 [P][US2] Frontend unit: `frontend/src/utils/validation.test.ts` (FR-001)
- [x] T18 [P][US2] Backend unit: `backend/src/api/schemas.test.ts` (FR-001)

### Implementation

- [x] T19 [US2] Implement client trimming and inline validation in `frontend/src/pages/JoinRoomPage.tsx` and `CreateRoomPage.tsx` (FR-001)
- [x] T20 [US2] Ensure server trims and validates `displayName` in `backend/src/api/schemas.ts` and `backend/src/api/rooms.ts` (FR-001)
- [x] T21 [US2] Standardize validation error code `ERR_NAME_REQUIRED` and message mapping for UI tests (FR-001)

---

## Phase 5: User Story 3 - Deterministic Secret Word Selection (Priority: P2)

**Goal**: Select `secretWord` deterministically using `room.seed` + `round.index`.

### Tests (Test-First)

- [x] T22 [P][US3] Unit: `backend/src/services/wordSelector.test.ts` with known seed→word vectors (FR-004)

### Implementation

- [x] T23 [US3] Implement deterministic word selector util `backend/src/services/wordSelector.ts` (pure function: `(seed, roundIndex, list) => word`) and document algorithm (FR-004)
- [x] T24 [US3] Integrate selector into `startRound` flow in `backend/src/services/roomStore.ts` so `secretWord` is set server-side (FR-004)
- [x] T25 [US3] Prevent round start when `starterWordList` is empty and return clear error code `ERR_NO_WORDS` from `backend/src/api/rooms.ts` (FR-005)

---

## Phase N: Polish & Cross-Cutting Concerns

- [x] T26 [P] Surface server-side error to frontend when starter word list is empty; show user-friendly message in `frontend/src/pages/LobbyPage.tsx` (FR-005)
- [x] T27 [P] Update documentation: `specs/003-drawer-selection/quickstart.md` and update `README.md` (polish)
- [ ] T28 [P] Run lint/format and code cleanup across modified files

---

## Dependencies & Execution Order

- Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3+ (User Stories) → Polish
- Tests: add unit tests before implementation where feasible (Test-First)

---

## Requirement→Task Mapping (Coverage)

- FR-001: T6, T17–T21
- FR-002: T7, T10–T13
- FR-003: T7, T8, T10, T14, T24
- FR-004: T5, T22–T24
- FR-005: T4, T6, T25, T26
- FR-006: T1, T15, T16

---

Generated and consolidated by speckit.tasks

## Checklist Notes

- All tasks follow the required checklist format `- [ ] T### [P?] [US?] Description` and include file paths.
