# Tasks: Game Start — Drawer Assignment and Word Reveal

**Input**: Design documents from `specs/003-drawer-word-reveal/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅

**Tests**: No new test files — no backend changes and spec does not request TDD. Frontend build verification in Polish phase.

**Organization**: Two P1 user stories, both implemented in a single file. Tasks are sequenced to enable independent verification of each story after its change.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (touches different files, no unresolved dependencies)
- **[Story]**: Which user story this task belongs to (US1–US2)
- File paths are relative to the repository root

---

## Phase 1: Setup

**Purpose**: Confirm the baseline builds cleanly on the current branch before any changes.

- [x] T001 Confirm baseline — run `npm run build` in `frontend/` and verify it passes on branch `003-drawer-word-reveal`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational changes needed. All required data (`hostId`, `availableWords`) is already in `RoomSnapshot` from feature 002. This phase is a no-op — proceed directly to user story phases.

*(No tasks — foundation is complete.)*

---

## Phase 3: User Story 1 — Drawer Is Assigned at Game Start (Priority: P1) 🎯 MVP

**Goal**: Every player sees exactly one participant labelled "Drawer" (the host) and all others labelled "Guesser" on the game screen.

**Independent Test**: Tab A (host) and Tab B (guest) both navigate to the game screen after starting a room. Tab A's Player Info sidebar shows "Role: Drawer". Tab B's Player Info sidebar shows "Role: Guesser". The drawer's name appears with a "Drawer" badge visible to both tabs. The guest's name appears with a "Guesser" badge visible to both tabs.

### Implementation

- [x] T002 [US1] Update `frontend/src/pages/GamePage.tsx` — compute `isDrawer = participantId === room.hostId` and `drawerParticipant = room.participants.find(p => p.id === room.hostId)`; update the Player Info card to show "Role: Drawer" when `isDrawer` is true and "Role: Guesser" otherwise; add a Participants list to the game header or sidebar that labels each player as "Drawer" or "Guesser" based on whether their `id === room.hostId`

**Checkpoint**: User Story 1 complete — open two browser tabs, start a game, verify role labels display correctly for both drawer and guesser without page reload.

---

## Phase 4: User Story 2 — Secret Word Visible Only to the Drawer (Priority: P1)

**Goal**: The drawer sees the secret word ("rocket" — `room.availableWords[0]`); guessers see a neutral placeholder instead.

**Independent Test**: Tab A (host/drawer) shows a prominently displayed word "rocket" in a "Word to Draw" section. Tab B (guest/guesser) shows the placeholder text (e.g., "Guess the drawing!") with no word visible anywhere on the screen. Refreshing Tab A shows the same word "rocket" — deterministic selection confirmed.

### Implementation

- [x] T003 [US2] Update `frontend/src/pages/GamePage.tsx` — compute `secretWord = room.availableWords[0]`; replace the static "Canvas" card header area with a conditional section: if `isDrawer`, render a "Word to Draw" card displaying `secretWord` prominently; if not `isDrawer`, render a "Guess the Drawing!" placeholder card with no word visible (depends on T002 for `isDrawer` variable)

**Checkpoint**: User Story 2 complete — Tab A (drawer) sees "rocket" clearly; Tab B (guesser) sees no word; the word is the same on every game start (deterministic).

---

## Phase 5: Polish & Validation

**Purpose**: Verify build integrity and confirm the game screen renders correctly.

- [x] T004 Run `npm run build` in `frontend/` — verify no TypeScript errors after the `GamePage.tsx` changes
- [ ] T005 Two-tab browser validation — start backend (`npm run dev` in `backend/`) and frontend (`npm run dev` in `frontend/`); create a room as Tab A, join as Tab B, start the game; confirm: Tab A sees "Drawer" role + word "rocket"; Tab B sees "Guesser" role + no word; both tabs show the same drawer name

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: No-op — skip
- **Phase 3 (US1)**: Depends on Phase 1 (baseline verified)
- **Phase 4 (US2)**: Depends on Phase 3 (T002 defines `isDrawer` used in T003)
- **Phase 5 (Polish)**: Depends on Phases 3 and 4

### Within Each Phase

- T002 and T003 are sequential — T003 reuses `isDrawer` computed in T002
- T004 and T005 are independent (build vs. browser) — can run in parallel once T003 is done

### Parallel Opportunities

- T004 and T005 can start concurrently after T003 completes

---

## Parallel Execution Example

```
After T003 completes:
  T004: frontend build check (terminal)
  T005: two-tab browser validation (browser) — run concurrently with T004
```

---

## Implementation Strategy

### MVP Scope (US1 Only — Phases 1 + 3)

1. Complete Phase 1: baseline build check
2. Complete Phase 3 (US1): role labels for drawer and guesser
3. **Stop and validate**: both tabs show correct role labels

### Full Feature (Phases 1 + 3 + 4)

1. Add Phase 4 (US2) after US1 checkpoint passes: word visible to drawer, hidden from guesser
2. Phase 5: build + browser validation
3. Feature complete — PR-ready

---

## Notes

- `[P]` tasks touch different concerns and can run concurrently
- T002 and T003 both modify `frontend/src/pages/GamePage.tsx` — must run sequentially
- `secretWord` is always `room.availableWords[0]` — never random, always "rocket" with the current seed list
- `any` is prohibited; TypeScript strict mode must pass (T004)
- Commit after T002 checkpoint and again after T003 checkpoint, referencing task IDs in the commit message
