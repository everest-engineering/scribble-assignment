# Tasks: Room Setup and Lobby

**Input**: `specs/001-room-lobby-game-flow/spec.md`

## Phase 1: Discovery and Design

- [x] T001 Document Scenario 1 acceptance criteria in `spec.md`
- [x] T002 Document room/lobby data model in `data-model.md`
- [x] T003 Document create, join, fetch, and start endpoint contracts
- [x] T004 Document polling and memory-only decisions in `research.md`

## Phase 2: Backend

- [x] T005 Validate trimmed non-empty player names for create and join
- [x] T006 Generate unique uppercase room codes
- [x] T007 Assign creator as host
- [x] T008 Keep rooms isolated by room code
- [x] T009 Return clear errors for invalid room codes
- [x] T010 Enforce host-only start with at least two players

## Phase 3: Frontend

- [x] T011 Validate create and join forms before submission
- [x] T012 Preserve join form values on failed join
- [x] T013 Render room code, participants, and host marker in lobby
- [x] T014 Poll lobby state about every 2 seconds
- [x] T015 Disable or block start until host and two-player conditions are met

## Phase 4: Validation

- [x] T016 Verify creator is host
- [x] T017 Verify invalid/empty codes show feedback
- [x] T018 Verify multi-room isolation
- [x] T019 Verify lobby polling
- [x] T020 Verify host-only start and two-player minimum
