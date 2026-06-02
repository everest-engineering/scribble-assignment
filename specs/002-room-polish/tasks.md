# Tasks: Room UI Polish (002-room-polish)

**Input**: Design documents from `/specs/002-room-polish/`

## Phase 1: Loading & Async State Management (Blocking)

- [ ] T001 Create `LoadingSpinner` component — frontend/src/components/LoadingSpinner.tsx
- [ ] T002 Create `ErrorMessage` component — frontend/src/components/ErrorMessage.tsx
- [ ] T003 Create `uiStore.ts` with loading flags and error state — frontend/src/state/uiStore.ts
- [ ] T004 Wire loading state to CreateRoomPage "Create" button — frontend/src/pages/CreateRoomPage.tsx
- [ ] T005 Wire loading state to JoinRoomPage "Join" button — frontend/src/pages/JoinRoomPage.tsx
- [ ] T006 Wire loading state to LobbyPage "Start Game" button — frontend/src/pages/LobbyPage.tsx

**Acceptance**: All buttons show spinner and are disabled during async requests; spinner disappears on success/error.

---

## Phase 2: Error Recovery & Retry Logic

- [ ] T007 Add retry wrapper to api.ts for polling requests with exponential backoff — frontend/src/services/api.ts
- [ ] T008 Implement max 5 retries with 3s interval in roomStore polling logic — frontend/src/state/roomStore.ts
- [ ] T009 Add polling error state to roomStore and uiStore — frontend/src/state/roomStore.ts, frontend/src/state/uiStore.ts
- [ ] T010 Display "Connection lost. Retrying..." message in LobbyPage when polling fails — frontend/src/pages/LobbyPage.tsx
- [ ] T011 After 15s of failed retries, show "Room connection lost. Return to start?" exit link — frontend/src/pages/LobbyPage.tsx
- [ ] T012 Wire specific error messages for different failure types (404 vs. network timeout) — frontend/src/pages/JoinRoomPage.tsx, api.ts

**Acceptance**: Network failure triggers automatic retry; manual exit link after threshold; specific error messages shown.

---

## Phase 3: Game State Clarity

- [ ] T013 Add role header to GamePage: "You are Drawing" or "Guess the Word" — frontend/src/pages/GamePage.tsx
- [ ] T014 Conditionally render secret word box: "Secret Word: [WORD]" (drawer only) — frontend/src/pages/GamePage.tsx
- [ ] T015 Hide GuessForm from drawer (visible only to guessers) — frontend/src/components/GuessForm.tsx
- [ ] T016 Style role header with distinct color and icon (drawer: blue, guesser: green) — frontend/src/styles/app.css
- [ ] T017 Update result display to show "[DrawerName] was drawing [WORD]" — frontend/src/components/ResultPanel.tsx
- [ ] T018 Test role clarity across drawer and guesser tabs — manual validation

**Acceptance**: Drawer sees word in highlighted box; guesser sees active guess form; result shows correct drawer and word.

---

## Phase 4: Form Validation & Copy-to-Clipboard (Nice-to-Have)

- [ ] T019 Add client-side validation to GuessForm: reject empty/whitespace guesses — frontend/src/components/GuessForm.tsx
- [ ] T020 Show inline error message "Guess cannot be empty" without sending to server — frontend/src/components/GuessForm.tsx
- [ ] T021 Add copy-to-clipboard button to RoomCodeBadge — frontend/src/components/RoomCodeBadge.tsx
- [ ] T022 Show "Copied!" toast notification on successful copy — frontend/src/components/RoomCodeBadge.tsx
- [ ] T023 Add CSS animations for fade-in/out and slide transitions — frontend/src/styles/app.css
- [ ] T024 Add fallback for copy-to-clipboard in older browsers (ExecCommand) — frontend/src/components/RoomCodeBadge.tsx

**Acceptance**: Empty guesses rejected with inline error; room code copied to clipboard with confirmation toast; animations smooth.

---

## Phase 5: Tests & Verification

- [ ] T025 Write component tests for LoadingSpinner — frontend/src/components/LoadingSpinner.test.tsx
- [ ] T026 Write component tests for ErrorMessage — frontend/src/components/ErrorMessage.test.tsx
- [ ] T027 Write store tests for uiStore loading/error states — frontend/src/state/uiStore.test.ts
- [ ] T028 Write store tests for roomStore retry logic — frontend/src/state/roomStore.test.ts
- [ ] T029 Manual browser smoke test: Create room → observe loading states
- [ ] T030 Manual browser smoke test: Disconnect network during polling → observe error recovery
- [ ] T031 Manual browser smoke test: Role clarity (drawer sees word, guesser sees form)
- [ ] T032 Manual browser smoke test: Copy room code and verify clipboard content

**Acceptance**: All component tests pass; store tests cover retry logic and state transitions; manual tests validate UX.

---

## Phase 6: Polish & Documentation

- [ ] T033 Update specs/002-room-polish/quickstart.md with new UX flows — frontend focus
- [ ] T034 Run linting and fix issues — `npm run lint` in frontend/
- [ ] T035 Code cleanup: remove unused imports, check naming conventions — frontend/src
- [ ] T036 Document copy-to-clipboard browser support and fallback — code comments

**Acceptance**: Code passes linting; quickstart describes new flows; naming is clear and consistent.

---

## Dependency Graph

```
T001–T006 (Loading) → blocking
          ↓
T007–T012 (Retry) → depends on T001–T006
T013–T018 (Role Clarity) → independent, can run in parallel
          ↓
T019–T024 (Form UX) → nice-to-have
          ↓
T025–T032 (Tests) → depends on all prior phases
          ↓
T033–T036 (Polish) → final pass
```

---

## Notes

- All tasks reference specific files; no ambiguity in scope.
- Loading states must be visible within 100ms of user action (no artificial delays).
- Animations should respect `prefers-reduced-motion` CSS media query for accessibility.
- Copy-to-clipboard should work offline (no network dependency).
