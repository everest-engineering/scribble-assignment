# Tasks: Game Start & Drawer Flow

---

## Phase 1: Name Validation

### T-011 Validate player name on join
**Story:** US-05, US-06  
**Files:** frontend/src/pages/JoinRoomPage.tsx  
**Acceptance Criteria:** 
- Empty names are rejected with error message
- Whitespace-only names are rejected
- Valid names with surrounding spaces are trimmed

---

### T-012 Add name validation to backend
**Story:** US-06  
**Files:** backend/src/api/schemas.ts  
**Dependencies:** T-011  
**Acceptance Criteria:** 
- Backend rejects empty or whitespace-only playerName
- Backend trims playerName before storage
- Clear error message returned

---

## Phase 2: Drawer Assignment and Word Selection

### T-013 Implement drawer assignment on game start
**Story:** US-07  
**Files:** backend/src/services/roomStore.ts  
**Acceptance Criteria:** 
- First participant is assigned drawer role
- Drawer role persists in room state
- Other participants assigned guesser role

---

### T-014 Implement deterministic word selection
**Story:** US-08  
**Files:** backend/src/services/roomStore.ts  
**Dependencies:** T-013  
**Acceptance Criteria:** 
- Secret word selected from STARTER_WORDS on game start
- Word is deterministically "rocket" for first round
- Word persists in room state

---

## Phase 3: Word Visibility

### T-015 Implement drawer-only word visibility in backend
**Story:** US-09, US-10  
**Files:** backend/src/services/roomStore.ts  
**Dependencies:** T-014  
**Acceptance Criteria:** 
- toRoomSnapshot returns currentWord only to drawer
- Guessers receive undefined for currentWord
- Word hidden in API responses to non-drawer viewers

---

### T-016 Display word to drawer in frontend
**Story:** US-09  
**Files:** frontend/src/pages/GamePage.tsx, frontend/src/components/  
**Dependencies:** T-015  
**Acceptance Criteria:** 
- Drawer sees secret word on game screen
- Word displayed prominently or in designated area
- Word visible only to drawer participant

---

### T-017 Hide word from guessers in frontend
**Story:** US-10  
**Files:** frontend/src/pages/GamePage.tsx  
**Dependencies:** T-015  
**Acceptance Criteria:** 
- Guessers see placeholder or empty space instead of word
- No word hints visible
- UI clearly indicates guesser role

---

## Phase 4: Game Flow Transition

### T-018 Implement role-based UI in Game Page
**Story:** US-07, US-09, US-10  
**Files:** frontend/src/pages/GamePage.tsx  
**Dependencies:** T-016, T-017  
**Acceptance Criteria:** 
- Game page recognizes viewer role
- Drawer mode: shows word, canvas enabled
- Guesser mode: shows guess form, canvas disabled

---

## Phase 5: Manual Validation

### T-019 Validate name validation manually
**Dependencies:** T-011, T-012  
**Acceptance Criteria:** 
- Join with empty name shows error
- Join with spaces-only name shows error
- Join with valid name with spaces works correctly

---

### T-020 Validate drawer assignment manually
**Dependencies:** T-013, T-014, T-015, T-016, T-017  
**Acceptance Criteria:** 
- Two tabs join same room
- Host starts game
- First player (tab 1) is drawer, sees word "rocket"
- Second player (tab 2) is guesser, doesn't see word
- Game page correctly identifies roles

---

## Dependencies Graph
```
T-011 → T-012 → T-019
T-013 → T-014 → T-015 → T-016 → T-018 → T-020
        T-014 → T-015 → T-017 → T-018 → T-020
```
