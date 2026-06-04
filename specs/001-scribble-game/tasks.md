# Tasks: Scribble Multiplayer Drawing Game

**Input**: Design documents from `/specs/001-scribble-game/` and per-scenario folders below.

**Prerequisites**: plan.md, spec.md (index), research.md, contracts/

## Scenario Task Lists

Implementation tasks are split by user story. Execute in priority order after foundational work:

| Scenario | Tasks file |
|----------|------------|
| P1 — Room Setup & Lobby | [../001-room-setup-lobby/tasks.md](../001-room-setup-lobby/tasks.md) |
| P2 — Game Start & Drawer | [../002-game-start-drawer/tasks.md](../002-game-start-drawer/tasks.md) |
| P3 — Gameplay Interaction | [../003-gameplay-interaction/tasks.md](../003-gameplay-interaction/tasks.md) |
| P4 — Result & Restart | [../004-result-restart/tasks.md](../004-result-restart/tasks.md) |

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1–US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Specify integration and active plan references in AGENTS.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure before ANY scenario

- [x] T002 [P] Fix VITE_API_URL default value in frontend/src/services/api.ts
- [x] T003 [P] Add hostId, drawerId, secretWord, canvasData, guesses, and scores to Room and RoomSnapshot interfaces in backend/src/models/game.ts
- [x] T004 [P] Sync RoomSnapshot and Guess interfaces in frontend/src/services/api.ts with backend models

**Checkpoint**: Foundation ready — begin scenario tasks at P1.

---

## Phases 3–6: Scenarios

See linked scenario `tasks.md` files above (T005–T032).

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final project cleanup and compilation checks

- [x] T033 Run build validation in backend/ and frontend/
- [x] T034 Update project documentation and compile a reflection report in reflection.md

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — blocks all scenarios.
- **Scenarios (Phases 3–6)**: Sequential P1 → P2 → P3 → P4 (see scenario folders).
- **Polish (Phase 7)**: After all scenarios complete.
