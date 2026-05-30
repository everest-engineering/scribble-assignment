# Tasks: Result, Restart & Final Validation

---

## Phase 1: Result Screen Display

### T-037 Create Result Page component
**Story:** US-19, US-20, US-21, US-22  
**Files:** frontend/src/pages/ResultPage.tsx (new)  
**Acceptance Criteria:** 
- Page displays result heading
- Shows correct answer (currentWord)
- Shows final scoreboard with all participants
- Shows complete guess history

---

### T-038 Display final answer
**Story:** US-20  
**Files:** frontend/src/pages/ResultPage.tsx  
**Dependencies:** T-037  
**Acceptance Criteria:** 
- Correct word displayed prominently
- Visible to all participants

---

### T-039 Display final scores
**Story:** US-21  
**Files:** frontend/src/pages/ResultPage.tsx  
**Dependencies:** T-037  
**Acceptance Criteria:** 
- Scoreboard lists all participants
- Shows final score for each
- Sorted by score (highest first, optional)

---

### T-040 Display guess history on result screen
**Story:** US-22  
**Files:** frontend/src/pages/ResultPage.tsx  
**Dependencies:** T-037  
**Acceptance Criteria:** 
- Complete list of all guesses
- Shows player name, message, and correctness
- Sorted by submission time

---

## Phase 2: Result Navigation

### T-041 Detect round end and navigate to result
**Story:** US-19  
**Files:** frontend/src/pages/GamePage.tsx  
**Acceptance Criteria:** 
- GamePage detects when to show result
- Navigation to /result triggered
- Room state preserved

---

### T-042 Add result route
**Story:** US-19  
**Files:** frontend/src/routes/index.tsx  
**Dependencies:** T-037  
**Acceptance Criteria:** 
- /result route configured
- ResultPage component mounted on route

---

## Phase 3: Restart Functionality

### T-043 Implement restart endpoint on backend
**Story:** US-23, US-24, US-25  
**Files:** backend/src/api/rooms.ts  
**Acceptance Criteria:** 
- POST /rooms/:code/restart accepts participantId
- Only host can restart (check hostId)
- Returns updated room

---

### T-044 Implement restart logic in roomStore
**Story:** US-24, US-25, US-39  
**Files:** backend/src/services/roomStore.ts  
**Acceptance Criteria:** 
- Clears guesses array
- Clears canvasLines array
- Resets participant scores to 0
- Clears participant roles
- Sets status back to "lobby"
- Increments round number
- Preserves participant list

---

### T-045 Add restart button to Result Page
**Story:** US-23  
**Files:** frontend/src/pages/ResultPage.tsx  
**Dependencies:** T-043, T-044  
**Acceptance Criteria:** 
- Button visible only to host
- Calls roomStore.restartGame()
- Displays error if non-host attempts

---

### T-046 Implement restart handler in roomStore
**Story:** US-23  
**Files:** frontend/src/state/roomStore.ts  
**Dependencies:** T-043  
**Acceptance Criteria:** 
- Method calls POST /rooms/:code/restart
- Handles response with updated room
- Updates store state

---

## Phase 4: Post-Restart Flow

### T-047 Navigate to lobby after restart
**Story:** US-26  
**Files:** frontend/src/pages/ResultPage.tsx  
**Dependencies:** T-046  
**Acceptance Criteria:** 
- After successful restart, navigate to /lobby
- Room state updated in store
- Lobby page renders with fresh state

---

### T-048 Verify participant list preserved
**Story:** US-25  
**Files:** backend/src/services/roomStore.ts  
**Dependencies:** T-044  
**Acceptance Criteria:** 
- Same participants appear after restart
- No participants added/removed
- Participant IDs unchanged

---

### T-049 Verify scores reset
**Story:** US-24  
**Files:** backend/src/services/roomStore.ts  
**Dependencies:** T-044  
**Acceptance Criteria:** 
- All participant scores reset to 0
- Previous scores not carried forward

---

## Phase 5: Edge Cases and Validation

### T-050 Handle empty guess history
**Story:** US-22  
**Files:** frontend/src/pages/ResultPage.tsx  
**Dependencies:** T-040  
**Acceptance Criteria:** 
- If no guesses made, display "No guesses were made"
- Result page does not crash

---

### T-051 Verify round number increment
**Story:** US-39  
**Files:** backend/src/services/roomStore.ts  
**Dependencies:** T-044  
**Acceptance Criteria:** 
- room.round incremented on each restart
- Round displayed correctly in room state

---

### T-052 Prevent non-host restart
**Story:** US-23  
**Files:** backend/src/services/roomStore.ts  
**Dependencies:** T-044  
**Acceptance Criteria:** 
- Non-host restart attempt throws error
- Frontend displays error message
- Room state unchanged

---

## Phase 6: Manual Validation

### T-053 Validate result screen display
**Dependencies:** T-037, T-038, T-039, T-040  
**Acceptance Criteria:** 
- Play round to completion
- Navigate to result page
- Verify correct answer shown
- Verify scores displayed
- Verify guess history complete

---

### T-054 Validate restart flow manually
**Dependencies:** T-043, T-044, T-045, T-047, T-048, T-049  
**Acceptance Criteria:** 
- Host clicks restart on result page
- Navigate back to lobby
- Participant list preserved
- Scores reset to 0
- Can start new round

---

### T-055 Validate multi-round gameplay
**Dependencies:** T-053, T-054  
**Acceptance Criteria:** 
- Play round 1 → see results → restart → play round 2
- Round number increments
- Round 2 drawer may be different
- All state properly reset between rounds

---

### T-056 Validate non-host cannot restart
**Dependencies:** T-052  
**Acceptance Criteria:** 
- Non-host attempts restart
- Error message displayed
- Room continues in result state

---

## Dependencies Graph
```
T-037 → T-038 → T-039 → T-040 → T-041 → T-042 → T-053
         ↓
         T-050 → T-053

T-043 → T-044 → T-045 → T-046 → T-047 → T-054
                ↓
                T-048 → T-054
                ↓
                T-049 → T-054
        T-051 → T-054
        T-052 → T-056 → T-054

T-053 → T-054 → T-055
```
