# Implementation Plan: Drawing Canvas & Playtest Improvements

**Branch**: `004-playtest` | **Date**: 2026-06-01 | **Spec**: [../spec.md](../spec.md)  
**Input**: Feature specification from `/specs/004-playtest/spec.md`

## Summary

This plan implements the drawing canvas UI for the drawer, ensures the scoreboard displays accurate scores in real-time, and adds the host-only restart button on the result screen. All three changes complete core gameplay loops.

## Technical Context

**Language/Version**: TypeScript on Node.js with React 18  
**Primary Dependencies**: React, HTML5 Canvas API, Zustand (roomStore)  
**Storage**: In-memory canvas strokes  
**Testing**: Vitest for components, manual browser validation for drawing interactions  
**Target Platform**: Web browser frontend  
**Performance Goals**: Canvas strokes sync within 2s (polling); scoreboard updates within 2s  
**Constraints**: No WebSockets; polling-based updates only; in-memory only  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- This feature extends frontend UI without backend breaking changes.
- Canvas strokes are stored in-memory only (no database).
- Polling architecture is maintained (no WebSockets).
- No authentication or session state added.

## Project Structure

### Files Modified/Created

```text
frontend/src/
├── components/
│   ├── Canvas.tsx (new)              - Drawing canvas component
│   ├── Scoreboard.tsx (modify)       - Display cumulative scores
│   ├── ResultPanel.tsx (modify)      - Show restart button (host only)
│   ├── DrawingPlaceholder.tsx (new)  - Show canvas to guessers
├── pages/
│   ├── GamePage.tsx (modify)         - Render canvas for drawer
│   ├── ResultPanel.tsx (modify)      - Display final drawing and restart button
├── state/
│   ├── canvasStore.ts (new)          - Canvas drawing state (strokes, current stroke)
│   ├── roomStore.ts (modify)         - Integrate canvas snapshot from API
└── styles/
    └── app.css (modify)              - Canvas styling, scoreboard layout
```

## Implementation Phases

### Phase 1: Scoreboard Display (Quick Win)

Goal: Show scores on scoreboard component.

- [ ] T001 Update Scoreboard component to display scores from room snapshot — frontend/src/components/Scoreboard.tsx
- [ ] T002 Style scoreboard as table or list (player name, score) — frontend/src/styles/app.css
- [ ] T003 Display scoreboard in LobbyPage, GamePage, and ResultPanel — frontend/src/pages/LobbyPage.tsx, GamePage.tsx
- [ ] T004 Ensure scores update on each polling cycle — verify via roomStore integration
- [ ] T005 Test scoreboard displays correct scores after guess submission — manual browser test

**Acceptance**: Scoreboard visible in all game states; scores accurate and update in real-time.

---

### Phase 2: Host Restart Button

Goal: Add visible restart button for host only.

- [ ] T006 Update ResultPanel to show "Restart Game" button (host only) — frontend/src/components/ResultPanel.tsx
- [ ] T007 For non-host players, show "Waiting for host to restart..." message instead — frontend/src/components/ResultPanel.tsx
- [ ] T008 Wire restart button to call `restartGame()` API function — frontend/src/components/ResultPanel.tsx, api.ts
- [ ] T009 Add loading state to restart button during request — frontend/src/components/ResultPanel.tsx
- [ ] T010 On restart success, transition back to lobby with scores preserved — frontend/src/state/roomStore.ts
- [ ] T011 Test restart flow: host clicks, lobby reappears, players preserved — manual browser test

**Acceptance**: Host sees restart button; non-host sees waiting message; restart works and returns to lobby.

---

### Phase 3: Canvas Drawing Component (Core)

Goal: Implement HTML5 canvas drawing.

- [ ] T012 Create Canvas component with HTML5 canvas element — frontend/src/components/Canvas.tsx
- [ ] T013 Implement mouse event handlers (mousedown, mousemove, mouseup) for drawing — frontend/src/components/Canvas.tsx
- [ ] T014 Create canvasStore for local stroke state (current stroke, all strokes) — frontend/src/state/canvasStore.ts
- [ ] T015 Implement stroke drawing logic (line drawing, color, thickness) — frontend/src/components/Canvas.tsx
- [ ] T016 Add "Clear Canvas" button to canvas component — frontend/src/components/Canvas.tsx
- [ ] T017 Implement touch event handling for mobile drawing support — frontend/src/components/Canvas.tsx

**Acceptance**: Canvas is interactive; strokes appear as drawer draws; clear button works.

---

### Phase 4: Canvas API Integration (Core)

Goal: Send strokes to server and receive updates via polling.

- [ ] T018 Add `sendCanvasStrokes()` function to api.ts that calls `/rooms/:code/rounds/current/canvas` — frontend/src/services/api.ts
- [ ] T019 Implement auto-sending of strokes after each stroke completion (not per pixel) — frontend/src/components/Canvas.tsx
- [ ] T020 Add error handling for failed canvas post (retry or user notification) — frontend/src/components/Canvas.tsx
- [ ] T021 Update roomStore to merge canvas data from polling response — frontend/src/state/roomStore.ts
- [ ] T022 Implement DrawingPlaceholder component to show canvas to guessers (read-only rendering) — frontend/src/components/DrawingPlaceholder.tsx
- [ ] T023 Render drawer's canvas strokes in DrawingPlaceholder for guessers — frontend/src/components/DrawingPlaceholder.tsx

**Acceptance**: Drawer's strokes sync to server; guessers see drawing via polling within ~2s.

---

### Phase 5: Canvas Display on Result Screen

Goal: Show final drawing on result screen (not cleared).

- [ ] T024 Update ResultPanel to display the final drawing (from canvas data) — frontend/src/components/ResultPanel.tsx
- [ ] T025 Ensure canvas data is not cleared when round ends (available for result display) — backend/services/roomStore.ts (verify)
- [ ] T026 Style result drawing display prominently — frontend/src/styles/app.css
- [ ] T027 Test result screen shows final drawing after round ends — manual browser test

**Acceptance**: Final drawing visible on result screen; not cleared before display.

---

### Phase 6: Integration & End-to-End Testing

- [ ] T028 Manual test: drawer draws, guessers see drawing, submit guess, scoreboard updates — full gameplay flow
- [ ] T029 Manual test: host restarts, returns to lobby, scores preserved, can play another round
- [ ] T030 Manual test: result screen shows final drawing, restart button functional
- [ ] T031 Test multiple rounds: scores accumulate correctly across rounds
- [ ] T032 Test error scenarios: network failure during canvas post, retry logic

**Acceptance**: All manual tests pass; no regressions; gameplay loop complete.

---

### Phase 7: Performance & Polish

- [ ] T033 Optimize canvas rendering (batch strokes if needed for performance) — frontend/src/components/Canvas.tsx
- [ ] T034 Add keyboard shortcut to clear canvas (e.g., Ctrl+Z or "C") — frontend/src/components/Canvas.tsx
- [ ] T035 Test canvas performance with many strokes (1000+) — measure rendering time
- [ ] T036 Code cleanup and linting — `npm run lint` in frontend/
- [ ] T037 Add code comments to canvas and drawing-related functions

---

### Phase 8: Documentation & Finalization

- [ ] T038 Update quickstart.md with drawing gameplay instructions — specs/004-playtest/quickstart.md
- [ ] T039 Document canvas component API (props, callbacks) — frontend/src/components/Canvas.tsx comments
- [ ] T040 Verify no breaking changes to existing features — backward compatibility check
- [ ] T041 Final acceptance test: all four user scenarios pass independently

---

## Dependencies & Execution Order

```
T001–T005 (Scoreboard) → fast track
T006–T011 (Restart Button) → parallel with scoreboard
         ↓
T012–T017 (Canvas Component) → blocking for T018
T018–T023 (API Integration) → depends on T012–T017
T024–T027 (Result Display) → depends on T018–T023
         ↓
T028–T032 (E2E Testing) → final validation
         ↓
T033–T037 (Performance) → optimization pass
         ↓
T038–T041 (Documentation) → final polish
```

---

## Notes

- Canvas size is fixed at 800x600 pixels (enforced in component).
- Strokes sent individually (not batched) to keep API contract simple.
- Drawer sees canvas immediately; guessers see via polling (~2s delay).
- Canvas is cleared automatically when a new round begins (not persisted).
- Scoreboard visible in all game states (lobby, active game, results).
- All score updates are cumulative and persist until room is closed.
