# Tasks: Gameplay Interaction

---

## Phase 1: Canvas Infrastructure

### T-021 Create interactive canvas component
**Story:** US-11, US-13  
**Files:** frontend/src/components/Canvas.tsx (new)  
**Acceptance Criteria:** 
- Canvas renders and accepts mouse input
- Drawer can draw lines
- Drawing state stored locally
- Only drawer can draw (guessers see read-only)

---

### T-022 Implement canvas sync to backend
**Story:** US-11, US-13  
**Files:** frontend/src/state/roomStore.ts, frontend/src/pages/GamePage.tsx  
**Dependencies:** T-021  
**Acceptance Criteria:** 
- POST /rooms/:code/canvas sends serialized lines
- Backend validates drawer role
- Error handling if not drawer

---

### T-023 Implement clear canvas functionality
**Story:** US-12  
**Files:** frontend/src/components/Canvas.tsx  
**Dependencies:** T-021  
**Acceptance Criteria:** 
- Clear button removes all canvas content locally
- Clear state synced via POST /rooms/:code/canvas with empty lines

---

### T-024 Implement canvas polling
**Story:** US-13  
**Files:** frontend/src/pages/GamePage.tsx  
**Dependencies:** T-022  
**Acceptance Criteria:** 
- Canvas updates from canvasLines in room snapshot
- Guessers see drawer's canvas updated via polling (~2s)
- Canvas read-only for guessers

---

## Phase 2: Guess Submission

### T-025 Add guess form component
**Story:** US-14  
**Files:** frontend/src/components/GuessForm.tsx (or extend existing)  
**Acceptance Criteria:** 
- Input field for guess text
- Submit button
- Only visible/enabled for guessers
- Drawer cannot submit guesses

---

### T-026 Implement guess validation
**Story:** US-15, US-16  
**Files:** frontend/src/components/GuessForm.tsx  
**Dependencies:** T-025  
**Acceptance Criteria:** 
- Empty guesses rejected with error message
- Whitespace-only guesses rejected
- Trimming applied before validation check

---

### T-027 Implement guess submission handler
**Story:** US-14  
**Files:** frontend/src/state/roomStore.ts  
**Dependencies:** T-026  
**Acceptance Criteria:** 
- POST /rooms/:code/guess sends trimmed message
- Backend validates case-insensitive match
- Backend awards 100 points for correct guess
- Error handling on failure

---

## Phase 3: Guess History and Display

### T-028 Display guess history
**Story:** US-18  
**Files:** frontend/src/components/GuessForm.tsx or new component  
**Dependencies:** T-027  
**Acceptance Criteria:** 
- Guess history list displays all guesses
- Each guess shows player name, message, and correctness indicator
- Guesses sorted by submission time (oldest to newest)

---

### T-029 Sync guess history via polling
**Story:** US-18  
**Files:** frontend/src/pages/GamePage.tsx  
**Dependencies:** T-027, T-028  
**Acceptance Criteria:** 
- Guess history updates via polling (~2s)
- All participants see the same guesses
- New guesses appear without manual refresh

---

## Phase 4: Scoring and Feedback

### T-030 Display score updates
**Story:** US-17  
**Files:** frontend/src/components/Scoreboard.tsx  
**Dependencies:** T-027, T-029  
**Acceptance Criteria:** 
- Scoreboard shows participant scores
- Scores update via polling
- Correct guess immediately visible in scoreboard

---

### T-031 Display guess result feedback
**Story:** US-14, US-16, US-17  
**Files:** frontend/src/components/GuessForm.tsx  
**Dependencies:** T-027, T-030  
**Acceptance Criteria:** 
- After submit, show "Correct! +100 points" or "Incorrect guess"
- Feedback clears after a few seconds or on next submit
- Disabled state during submission to prevent duplicate sends

---

## Phase 5: Role-Based UI

### T-032 Implement role indicator
**Story:** US-11, US-14  
**Files:** frontend/src/pages/GamePage.tsx  
**Dependencies:** T-021, T-025  
**Acceptance Criteria:** 
- Display "You are the Drawer" or "You are a Guesser"
- Clear visual distinction between roles

---

### T-033 Verify drawer-only features
**Story:** US-11, US-12  
**Files:** frontend/src/pages/GamePage.tsx  
**Dependencies:** T-021, T-023  
**Acceptance Criteria:** 
- Drawer sees canvas and clear button
- Drawer cannot access guess form
- Guesser cannot access canvas

---

## Phase 6: Manual Validation

### T-034 Validate canvas drawing manually
**Dependencies:** T-021, T-022, T-024  
**Acceptance Criteria:** 
- Two tabs: one drawer, one guesser
- Drawer draws on canvas
- Guesser sees updated canvas via polling

---

### T-035 Validate guess submission manually
**Dependencies:** T-025, T-026, T-027, T-028, T-029  
**Acceptance Criteria:** 
- Guesser enters guess and submits
- Guess appears in history for all players
- Correct guess awards 100 points
- Incorrect guess shows in history with no points

---

### T-036 Validate edge cases
**Dependencies:** T-026, T-027, T-028  
**Acceptance Criteria:** 
- Whitespace-only guess rejected
- Case-insensitive match works ("RoCkEt" == "rocket")
- Multiple guesses display correctly
- Drawer cannot submit guess

---

## Dependencies Graph
```
T-021 → T-022 → T-024 → T-029
T-023 ↗
T-025 → T-026 → T-027 → T-028 → T-031 → T-035
                           ↓
                        T-029
T-027 → T-030 → T-031
T-021 → T-032 → T-033
```
