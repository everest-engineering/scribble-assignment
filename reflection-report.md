# Scribble Assignment Reflection

## 1. What the Starter App Already Had

The starter app provided a TypeScript monorepo with an Express backend and React frontend, basic room creation and join flow scaffolding, polling-based room fetching, shared room state wiring on the client, and the core project structure for routes, services, models, pages, and tests.

## 2. What Was Added Across Scenarios 1-4

- **Scenario 1**: Room setup and lobby flow, including host tracking, room validation, lobby polling, host-only game start, and minimum-player enforcement.
- **Scenario 2**: Deterministic game start behavior, trimmed player names, whitespace rejection, deterministic drawer assignment, deterministic secret word selection, and drawer-only word visibility.
- **Scenario 3**: Shared drawing surface, clear canvas action, trimmed guess submission, empty-guess rejection, case-insensitive guess matching, synced guess history, and deterministic `100`/`0` scoring.
- **Scenario 4**: Result-state transition on the first correct accepted guess, shared result review for all players, host-only restart, and full room reset back to lobby with roster preserved and round state cleared.

## 3. How Spec Kit Guided the Work

Spec Kit imposed a clear flow: specify the scenario, plan the implementation, generate tasks, and then implement against that task list. That kept scope bounded per scenario, made acceptance criteria explicit before coding, and provided traceability from requirements to plan to concrete file-level tasks.

## 4. How AI Was Used

AI was used throughout the workflow:
- **Discovery**: to inspect the starter app structure and existing code paths before changes.
- **Specification**: to turn scenario prompts into scoped feature specs with assumptions, edge cases, and measurable outcomes.
- **Planning**: to produce design artifacts such as research notes, data model updates, contracts, and validation strategy.
- **Tasks**: to generate dependency-ordered, file-aware task lists grouped by user story.
- **Implementation**: to apply incremental code changes, extend tests, run builds and tests, and keep task bookkeeping aligned with completed work.

## 5. Tradeoffs and Constraints

The main constraints shaped the design: no WebSockets, no database, no authentication, and polling-only synchronization with in-memory state. That led to deliberately simple room-scoped backend state, deterministic gameplay rules, and viewer-specific room snapshots instead of introducing extra infrastructure. The main tradeoff was accepting polling latency and a single-runtime memory model in exchange for simpler architecture and clearer traceability.

## 6. Validation Status

During implementation, the affected backend and frontend automated checks were run and passed, including:
- backend tests
- backend build
- frontend tests
- frontend build
