# Implementation Plan: Room UI Polish

**Branch**: `002-room-polish` | **Date**: 2026-06-01 | **Spec**: [../spec.md](../spec.md)  
**Input**: Feature specification from `/specs/002-room-polish/spec.md`

## Summary

Following the 001-gameplay-flow feature, this plan focuses on improving the user experience through visual feedback, error recovery, and game state clarity. Changes are UI/UX only; no backend modifications or new game rules.

## Technical Context

**Language/Version**: TypeScript on Node.js with React 18  
**Primary Dependencies**: React, React Router v6, Vite, Zustand (roomStore)  
**Storage**: In-memory (no changes)  
**Testing**: Vitest for component tests, manual browser validation  
**Target Platform**: Web browser frontend  
**Performance Goals**: All loading/transition states complete within 500ms  
**Constraints**: No backend API changes; preserve in-memory architecture  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- This feature maintains the existing backend and does not add any new API endpoints.
- All changes are client-side UI/UX enhancements using standard React patterns.
- No database, WebSocket, or authentication changes.
- Preserves the in-memory polling architecture from 001-gameplay-flow.

## Project Structure

### Files Modified

```text
frontend/src/
├── components/
│   ├── LoadingSpinner.tsx (new)      - Shared loading indicator component
│   ├── ErrorMessage.tsx (new)        - Error toast/inline display
│   ├── RoomCodeBadge.tsx (modify)    - Add copy-to-clipboard
│   ├── GuessForm.tsx (modify)        - Add inline validation feedback
│   ├── Scoreboard.tsx (modify)       - Format for result view
├── pages/
│   ├── CreateRoomPage.tsx (modify)   - Add loading state
│   ├── JoinRoomPage.tsx (modify)     - Add loading + error handling
│   ├── GamePage.tsx (modify)         - Add role clarity header, hide guess form for drawer
│   ├── LobbyPage.tsx (modify)        - Add polling status indicator
├── state/
│   ├── roomStore.ts (modify)         - Add retry logic and error state to store
│   ├── uiStore.ts (new)              - New store for UI state (loading flags, errors)
├── services/
│   ├── api.ts (modify)               - Add retry wrapper for polling requests
└── styles/
    └── app.css (modify)              - Add animations for loading/transitions
```

## Implementation Phases

### Phase 1: Loading & Async State Management (Blocking)

Goal: Show loading indicators during all async operations.

- [ ] T001 Create `LoadingSpinner` component (frontend/src/components/LoadingSpinner.tsx)
- [ ] T002 Create `ErrorMessage` component (frontend/src/components/ErrorMessage.tsx)
- [ ] T003 Create `uiStore.ts` with loading flags (frontend/src/state/uiStore.ts)
- [ ] T004 Wire loading state to CreateRoomPage button (frontend/src/pages/CreateRoomPage.tsx)
- [ ] T005 Wire loading state to JoinRoomPage button (frontend/src/pages/JoinRoomPage.tsx)
- [ ] T006 Wire loading state to Start Game button (frontend/src/pages/LobbyPage.tsx)

**Acceptance**: Buttons are disabled with spinner visible during requests; spinner disappears on success/error.

---

### Phase 2: Error Recovery & Retry Logic

Goal: Handle network failures gracefully with automatic retry.

- [ ] T007 Add retry wrapper to api.ts for polling requests (frontend/src/services/api.ts)
- [ ] T008 Implement retry state in roomStore (max 5 retries @ 3s intervals)
- [ ] T009 Add error handling to LobbyPage for polling failures (frontend/src/pages/LobbyPage.tsx)
- [ ] T010 Display "Connection lost. Retrying..." message when polling fails (frontend/src/pages/LobbyPage.tsx)
- [ ] T011 Add "Room connection lost. Return to start?" link after retry threshold exceeded
- [ ] T012 Wire specific error messages for 404, network timeout, etc. (frontend/src/pages/JoinRoomPage.tsx)

**Acceptance**: Network failure shows error message; auto-retry occurs; manual exit link appears after 15s.

---

### Phase 3: Game State Clarity

Goal: Make player role clear during gameplay.

- [ ] T013 Add role header to GamePage (frontend/src/pages/GamePage.tsx) — "You are Drawing" vs. "Guess the Word"
- [ ] T014 Conditionally render "Secret Word: [WORD]" box (visible only to drawer)
- [ ] T015 Hide GuessForm if player is drawer (frontend/src/components/GuessForm.tsx)
- [ ] T016 Style role header with distinct color/icon (frontend/src/styles/app.css)
- [ ] T017 Update result display to show "X was drawing Y" (frontend/src/components/ResultPanel.tsx or GamePage.tsx)

**Acceptance**: Drawer sees word in highlighted box; guesser sees guess form; result view shows drawer name and word.

---

### Phase 4: Form Validation & Copy-to-Clipboard (Nice-to-Have)

Goal: Improve form UX and code sharing.

- [ ] T018 Add client-side validation feedback to GuessForm (frontend/src/components/GuessForm.tsx)
- [ ] T019 Show inline error "Guess cannot be empty" for empty submissions
- [ ] T020 Add copy-to-clipboard to RoomCodeBadge (frontend/src/components/RoomCodeBadge.tsx)
- [ ] T021 Show "Copied!" tooltip on successful copy (frontend/src/components/RoomCodeBadge.tsx)
- [ ] T022 Add CSS transitions for animations (frontend/src/styles/app.css) — fade-in/out, slide animations

**Acceptance**: Empty guesses rejected with inline error; room code copied to clipboard with toast confirmation.

---

### Phase 5: Tests & Verification

- [ ] T023 Add component tests for LoadingSpinner, ErrorMessage (frontend/src/components/*.test.tsx)
- [ ] T024 Add store tests for uiStore and retry logic (frontend/src/state/uiStore.test.ts)
- [ ] T025 Manual browser tests for loading states, error recovery, role clarity
- [ ] T026 Test copy-to-clipboard on multiple browsers (Chrome, Firefox, Safari)

---

### Phase 6: Polish & Documentation

- [ ] T027 Update quickstart.md with new UX flows (frontend focus)
- [ ] T028 Code cleanup and linting (frontend/src)
- [ ] T029 Document copy-to-clipboard fallback for older browsers

---

## Dependencies & Execution Order

- Phase 1 (Loading) is blocking; all other phases depend on it
- Phase 2 (Error Recovery) should follow Phase 1 (uses uiStore)
- Phase 3 (Role Clarity) is independent; can run in parallel with Phase 2
- Phase 4 (Form UX) is nice-to-have; low priority
- Phase 5 (Tests) should follow Phase 3 (role clarity is complex logic)

---

## Notes

- No backend changes required; 001-gameplay-flow endpoints are sufficient.
- Frontend state is added to roomStore and new uiStore; no new data models.
- Loading states should be visible to user within 100ms of action (optimistic UI not required).
- All animations should respect `prefers-reduced-motion` for accessibility.
