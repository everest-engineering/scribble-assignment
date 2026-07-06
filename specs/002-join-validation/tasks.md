# Tasks: Join Validation with Clear Error Messages

**Input**: Design documents from `specs/002-join-validation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/README.md

**Tests**: Test tasks are included — unit tests for schema validation (mandated by FR-005: validation on both sides).

**Organization**: Tasks grouped by user story. Note: US1 and US2 are tightly coupled (same files, same error message) — implement sequentially.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No project setup required — project already initialized. Feature uses only existing dependencies (Zod, Express, React).

- [x] T001 Review existing validation patterns in `backend/src/api/schemas.ts` and `backend/src/api/rooms.ts` to understand current join flow

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No blocking prerequisites — schema validation infrastructure (Zod + errorHandler middleware) already exists.

**⚠️ CRITICAL**: No user story work can begin until schema validation patterns are understood

- [x] T002 [P] Read `backend/src/api/schemas.ts` to understand existing Zod schema definitions
- [x] T003 [P] Read `backend/src/api/router.ts` to understand errorHandler middleware behavior with ZodError

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 - Reject Empty Room Code (Priority: P1) 🎯 MVP

**Goal**: Reject join requests with empty or whitespace-only room codes. Error message must be "Invalid room code. Please try again with correct one." surfaced as inline text near the Join Room form.

**Independent Test**: Leave room code field blank on Join Room page, click "Join Lobby" — must see error message and NOT be redirected.

### Implementation for User Story 1

- [x] T004 [P] [US1] Update `roomCodeParamsSchema.code` in `backend/src/api/schemas.ts` to use `.trim().min(1)` for Zod validation
- [x] T005 [P] [US1] Add client-side empty/whitespace code check in `frontend/src/pages/JoinRoomPage.tsx` — before API call, validate `roomCode.trim()` is non-empty
- [x] T006 [US1] Update join route handler in `backend/src/api/rooms.ts` — change error message from "Unable to join room" to "Invalid room code. Please try again with correct one." for empty/non-existent cases; add ZodError catch block that converts to HttpError(400) with same message
- [x] T007 [P] [US1] Add schema validation tests in `backend/src/api/schemas.test.ts` — test empty code, whitespace-only code, valid code, and trimmed code
- [x] T008 [US1] Update catch fallback message in `frontend/src/pages/JoinRoomPage.tsx` to "Invalid room code. Please try again with correct one."

**Checkpoint**: At this point, User Story 1 should be fully functional — empty/whitespace codes rejected client-side AND server-side with correct message

---

## Phase 4: User Story 2 - Reject Non-Existent Room Code (Priority: P1)

**Goal**: Reject join requests for room codes that do not match any existing room. Same error message as empty codes.

**Independent Test**: Enter a non-existent code like "ZZZZ" on Join Room page, click "Join Lobby" — must see error message and NOT be redirected.

### Implementation for User Story 2

- [x] T009 [US2] Error message already handled by T006 (same message for 404 from `joinRoom` returning null) — verify `backend/src/api/rooms.ts` returns "Invalid room code. Please try again with correct one." for non-existent codes

**Checkpoint**: User Story 1 AND 2 should both work — all invalid codes rejected with same message

---

## Phase 5: User Story 3 - Valid Room Code Still Works (Priority: P1)

**Goal**: Regression prevention — valid room codes must still successfully join.

**Independent Test**: Create a room in another tab, copy the code, join from the test tab — must succeed and redirect to lobby.

### Implementation for User Story 3

- [x] T010 [US3] Manually verify valid room code still works end-to-end (create room in tab A, join with valid code in tab B, confirm redirect to lobby)

**Checkpoint**: All user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Build validation and final verification

- [x] T011 Run `npm run build` and `npm test` in `backend/` to verify no compilation errors and all tests pass
- [x] T012 Run `npm run build` and `npm test` in `frontend/` to verify no compilation errors and all tests pass
- [x] T013 Run `specs/002-join-validation/quickstart.md` validation — manually test all verification scenarios with two browser tabs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — review only
- **Foundational (Phase 2)**: No real dependencies — reading existing code
- **User Story 1 (Phase 3)**: T006 depends on T004 (both affect validation flow); T005, T004, T007 can be parallel
- **User Story 2 (Phase 4)**: Depends on Phase 3 (shared error message string in rooms.ts)
- **User Story 3 (Phase 5)**: Depends on Phase 4 (must have valid join not broken by validation changes)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories — can be implemented standalone
- **User Story 2 (P1)**: Depends on US1 (same error message in same file)
- **User Story 3 (P1)**: Verification only — depends on US1 and US2 being complete

### Within Each User Story

- Models/validation before route handlers
- Backend before frontend (API must be ready before frontend can test against it)
- Implementation before tests

### Parallel Opportunities

- T004, T005, T007 can run in parallel (different files: schemas.ts, JoinRoomPage.tsx, schemas.test.ts)
- T006 must run after T004 (same file, adds ZodError handling that references the schema)
- Backend tests (T007 → T011) independent of frontend (T012)

---

## Parallel Example: User Story 1

```bash
# Launch schema update and client-side validation in parallel:
Task: "Update roomCodeParamsSchema in backend/src/api/schemas.ts"
Task: "Add client-side validation in frontend/src/pages/JoinRoomPage.tsx"

# After schema update:
Task: "Update route handler in backend/src/api/rooms.ts"
Task: "Add schema tests in backend/src/api/schemas.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Review
2. Complete Phase 2: Foundational read
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test empty/whitespace code rejection independently
5. Verify build and tests pass

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (empty code rejection) → Test independently → MVP!
3. Add User Story 2 (non-existent code rejection) → Test independently
4. Add User Story 3 (regression verification) → Verify independently
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each logical group
- Stop at any checkpoint to validate story independently
- Error message string "Invalid room code. Please try again with correct one." must be exact — copy-paste, don't retype
- Case-insensitive room code matching (`code.toUpperCase()`) must be preserved
