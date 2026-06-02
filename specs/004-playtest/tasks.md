# Tasks: Drawing Canvas & Playtest Improvements (004-playtest)

**Input**: Design documents from `/specs/004-playtest/`

## Phase 1: Scoreboard Display (Quick Win)

- [ ] T001 Update Scoreboard component to display player names and scores — frontend/src/components/Scoreboard.tsx
- [ ] T002 Style scoreboard as table or list layout — frontend/src/styles/app.css
- [ ] T003 Display scoreboard in LobbyPage — frontend/src/pages/LobbyPage.tsx
- [ ] T004 Display scoreboard in GamePage — frontend/src/pages/GamePage.tsx
- [ ] T005 Display scoreboard in ResultPanel — frontend/src/components/ResultPanel.tsx
- [ ] T006 Verify scores update on each polling cycle — manual test
- [ ] T007 Test scoreboard after guess submission updates correctly — manual test

**Acceptance**: Scoreboard visible in all states; scores accurate and update in real-time via polling.

---

## Phase 2: Host Restart Button

- [ ] T008 Add "Restart Game" button to ResultPanel (visible only to host) — frontend/src/components/ResultPanel.tsx
- [ ] T009 Add "Waiting for host to restart..." message for non-host players — frontend/src/components/ResultPanel.tsx
- [ ] T010 Wire restart button to call API `restartGame()` — frontend/src/services/api.ts
- [ ] T011 Add loading state and error handling to restart button — frontend/src/components/ResultPanel.tsx
- [ ] T012 Update roomStore to handle restart response and transition to lobby — frontend/src/state/roomStore.ts
- [ ] T013 Verify scores are preserved after restart — ensure cumulative scores maintained
- [ ] T014 Manual test: host clicks restart, returns to lobby, can play another round — full flow

**Acceptance**: Host sees restart button; non-host sees waiting message; restart returns to lobby with scores preserved.

---

## Phase 3: Canvas Drawing Component (Core)

- [ ] T015 Create Canvas.tsx component with HTML5 canvas element (800x600) — frontend/src/components/Canvas.tsx
- [ ] T016 Implement mouse event handlers (mousedown, mousemove, mouseup) — frontend/src/components/Canvas.tsx
- [ ] T017 Create canvasStore.ts for local stroke state management — frontend/src/state/canvasStore.ts
- [ ] T018 Implement stroke drawing logic (line drawing, color, thickness) — frontend/src/components/Canvas.tsx
- [ ] T019 Add "Clear Canvas" button to reset strokes — frontend/src/components/Canvas.tsx
- [ ] T020 Implement touch event handling (touchstart, touchmove, touchend) — frontend/src/components/Canvas.tsx
- [ ] T021 Test canvas interactivity: draw, clear, multiple strokes — manual test

**Acceptance**: Canvas interactive; strokes appear as drawn; clear button resets canvas; touch works.

---

## Phase 4: Canvas API Integration (Core)

- [ ] T022 Add `sendCanvasStrokes(code, strokes)` to api.ts — frontend/src/services/api.ts
- [ ] T023 Implement auto-send after each stroke completion in Canvas component — frontend/src/components/Canvas.tsx
- [ ] T024 Add error handling and retry logic for failed canvas posts — frontend/src/components/Canvas.tsx
- [ ] T025 Update roomStore to merge canvas data from polling response — frontend/src/state/roomStore.ts
- [ ] T026 Create DrawingPlaceholder component to render canvas for guessers — frontend/src/components/DrawingPlaceholder.tsx
- [ ] T027 Implement stroke rendering in DrawingPlaceholder (read-only) — frontend/src/components/DrawingPlaceholder.tsx
- [ ] T028 Test drawer's strokes sync to guessers via polling (~2s) — manual test

**Acceptance**: Strokes sent to server; guessers see drawing within ~2s; no errors on sync failure.

---

## Phase 5: Canvas Display on Result Screen

- [ ] T029 Update ResultPanel to show final drawing from canvas data — frontend/src/components/ResultPanel.tsx
- [ ] T030 Verify canvas is not cleared when round ends (data persists) — backend verification
- [ ] T031 Style result drawing prominently with border/shadow — frontend/src/styles/app.css
- [ ] T032 Test result screen displays final drawing after round ends — manual test

**Acceptance**: Final drawing visible on result screen; not cleared before display.

---

## Phase 6: Integration & End-to-End Testing

- [ ] T033 E2E test: drawer draws → guessers see drawing → guess submitted → scores update — full flow
- [ ] T034 E2E test: host restarts → lobby reappears → scores preserved → new round begins
- [ ] T035 E2E test: result screen shows final drawing, restart button functional
- [ ] T036 Test multiple consecutive rounds: scores accumulate correctly
- [ ] T037 Test error scenarios: network failure during canvas post → retry/recovery
- [ ] T038 Test edge case: canvas full (many strokes) → performance acceptable

**Acceptance**: All E2E tests pass; gameplay loop complete; no regressions.

---

## Phase 7: Performance & Polish

- [ ] T039 Optimize canvas rendering performance (batch strokes if needed) — frontend/src/components/Canvas.tsx
- [ ] T040 Add keyboard shortcut to clear canvas (Ctrl+Shift+C or similar) — frontend/src/components/Canvas.tsx
- [ ] T041 Test canvas with 1000+ strokes: rendering time acceptable — performance profiling
- [ ] T042 Run linting and fix issues — `npm run lint` in frontend/
- [ ] T043 Add code comments to canvas and drawing functions — frontend/src/components/Canvas.tsx

**Acceptance**: Code passes linting; performance acceptable; drawing shortcuts work; naming clear.

---

## Phase 8: Documentation & Finalization

- [ ] T044 Create/update quickstart.md with drawing gameplay flow — specs/004-playtest/quickstart.md
- [ ] T045 Document Canvas component API (props, callbacks, state) — code comments
- [ ] T046 Verify backward compatibility (no breaking changes to 001/002/003 features)
- [ ] T047 Final acceptance test: all four user scenarios pass independently — validate specs met

---

## Dependency Graph

```
T001–T007 (Scoreboard) → quick track
T008–T014 (Restart) → parallel with scoreboard
         ↓
T015–T021 (Canvas Component) → blocking for T022
T022–T028 (API Integration) → depends on T015–T021
T029–T032 (Result Display) → depends on T022–T028
         ↓
T033–T038 (E2E Testing) → final validation
         ↓
T039–T043 (Performance) → optimization pass
         ↓
T044–T047 (Documentation) → final polish
```

---

## Notes

- Canvas size: fixed 800x600 pixels
- Strokes sent individually (not batched) after each stroke completion
- Drawer sees strokes immediately; guessers see via polling (~2s delay)
- Canvas cleared automatically when new round begins
- Scoreboard shows cumulative scores (not reset between rounds)
- All score updates are persistent for the room lifecycle
