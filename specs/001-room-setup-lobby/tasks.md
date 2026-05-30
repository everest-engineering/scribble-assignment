# Tasks: Room Setup and Lobby

---

## Phase 1: Validation and Host Tracking

### T-001 Add player name validation
**Story:** US-01, US-02  
**Files:** frontend/src/pages  
**Acceptance Criteria:** Empty or whitespace-only names are rejected with clear error messages.

---

### T-002 Add room code validation
**Story:** US-02  
**Files:** frontend/src/pages  
**Dependencies:** T-001  
**Acceptance Criteria:** Invalid or empty room codes are rejected.

---

### T-003 Add host tracking to room state
**Story:** US-01  
**Files:** backend/src/server.ts  
**Acceptance Criteria:** First room creator becomes host automatically.

---

## Phase 2: Lobby Synchronization

### T-004 Implement automatic lobby polling
**Story:** US-03  
**Files:** frontend/src/pages/Lobby  
**Dependencies:** T-003  
**Acceptance Criteria:** Lobby refreshes automatically every 2 seconds.

---

### T-005 Handle polling failures gracefully
**Story:** US-03  
**Files:** frontend/src/pages/Lobby  
**Dependencies:** T-004  
**Acceptance Criteria:** Polling errors do not crash the UI.

---

## Phase 3: Start Game Flow

### T-006 Add start game endpoint
**Story:** US-04  
**Files:** backend/src/server.ts  
**Dependencies:** T-003  
**Acceptance Criteria:** Backend supports POST /rooms/:code/start.

---

### T-007 Restrict start game to host only
**Story:** US-04  
**Files:** frontend/src/pages/Lobby  
**Dependencies:** T-006  
**Acceptance Criteria:** Only host can see and use start game button.

---

### T-008 Validate minimum player count before game start
**Story:** US-04  
**Files:** backend/src/server.ts  
**Dependencies:** T-006  
**Acceptance Criteria:** Game start blocked if fewer than 2 players.

---

## Phase 4: Multi-Room Isolation

### T-009 Verify room isolation behavior
**Story:** US-01, US-02  
**Files:** backend/src/server.ts  
**Acceptance Criteria:** Players and state remain isolated per room.

---

## Phase 5: Manual Validation

### T-010 Manual multiplayer testing
**Dependencies:** T-001 to T-009  
**Acceptance Criteria:** 
- Two browser tabs can join same room
- Lobby auto-refresh works
- Host-only start works
- Invalid inputs show errors
- Multi-room isolation verified