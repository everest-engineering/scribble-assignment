---
title: "Tasks: Frontend Environment Configuration"
---

# Tasks: Frontend Environment Configuration

**Input**: Design documents from `/specs/001-frontend-env-config/`

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create `frontend/.env.example` with the required keys (`VITE_API_URL`, `VITE_FEATURE_DRAWING_ENABLED`) and non-secret defaults (file: frontend/.env.example)
- [x] T002 [P] Add `.gitignore` entries for local env overrides in `frontend/.gitignore` (add: .env.local, .env.\*.local)
- [x] T003 [P] Add a development runtime override sample at `frontend/public/config.json` with placeholder keys (file: frontend/public/config.json)

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Create a runtime bootstrap for config loading at `frontend/src/config/bootstrap.ts` that reads Vite envs and (in dev) `public/config.json` (file: frontend/src/config/bootstrap.ts)
- [ ] T005 [P] Update `frontend/vite.config.ts` to ensure Vite exposes `VITE_` prefixed variables (file: frontend/vite.config.ts)

---

## Phase 3: User Story 1 - Developer: Local development env (Priority: P1)

**Goal**: Allow developers to run the frontend with named presets and single-key local overrides.

**Independent Test**: Follow `specs/001-frontend-env-config/quickstart.md` and verify the app boots using values from `frontend/.env.local` or `frontend/public/config.json` in dev.

- [ ] T006 [US1] Update `specs/001-frontend-env-config/quickstart.md` to include exact commands and file paths for creating `frontend/.env.local` and using `frontend/public/config.json` (file: specs/001-frontend-env-config/quickstart.md)
- [x] T007 [P] [US1] Integrate `frontend/src/config/bootstrap.ts` into app entrypoint by importing it from `frontend/src/main.tsx` (file: frontend/src/main.tsx)

---

## Phase 4: User Story 2 - Local Validation: Required variables checked (Priority: P2)

**Goal**: Provide a validator that exits non-zero and lists missing `VITE_` keys.

**Independent Test**: Running the validator with missing keys returns a non-zero exit and lists each missing key.

- [ ] T008 [US2] Implement validator script `frontend/scripts/validate-env.ts` (TypeScript) that reads env files and checks required keys (`VITE_API_URL`, `VITE_FEATURE_DRAWING_ENABLED`) (file: frontend/scripts/validate-env.ts)
- [ ] T009 [P] [US2] Add a vitest unit test for the validator at `frontend/src/__tests__/validate-env.test.ts` (file: frontend/src/**tests**/validate-env.test.ts)
- [ ] T010 [US2] Add an npm script `validate-env` to `frontend/package.json` to run the compiled validator (file: frontend/package.json)

---

## Phase 5: User Story 3 - Documentation: Onboarding and secrets guidance (Priority: P3)

**Goal**: Document env config usage and secrets guidance for new contributors.

**Independent Test**: A new developer can follow the docs and run the app within 10 minutes.

- [ ] T011 [US3] Create `frontend/ENVIRONMENT.md` with onboarding steps, `.env.local` guidance, and warnings about committing secrets (file: frontend/ENVIRONMENT.md)
- [ ] T012 [US3] Add `.env.example` reference and secret guidance into repository `README.md` (file: README.md)

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T013 [P] Add `.env.local` patterns to repository root `.gitignore` if missing (file: .gitignore)
- [ ] T014 [P] Add vitest CI step or script example to run validator in `frontend/package.json` and CI config (files: frontend/package.json, .github/workflows/ci.yml)

---

## Dependencies & Execution Order

- Setup (Phase 1) → Foundational (Phase 2) → User Stories (Phase 3+) → Polish
- `T004` must exist before `T007` (bootstrap used in app entrypoint)
- `T008` (validator) is independent but recommended before CI integration `T014`

## Parallel Opportunities

- Tasks marked `[P]` can be worked on in parallel (T002, T003, T005, T007, T009, T013, T014)
- After Phase 2 completes, user stories (T006-T012) can progress in parallel by separate contributors

---

## Implementation Strategy (MVP First)

- MVP scope: Complete Phase 1 + Phase 2 + User Story 1 (T001-T007)
- Next: Implement validator (T008-T010) and docs (T011-T012)

---

## Notes

- All tasks include explicit file paths. Tests are included for validator (User Story 2) per Test-First rule.
